/**
 * Gera `src/lib/plan/exerciseIndex.generated.ts` a partir do catálogo do
 * free-exercise-db (Unlicense — ADR-004).
 *
 * POR QUE ISTO EXISTE
 * O casamento nome→foto era um dicionário de string EXATA (134 chaves). Medido numa
 * amostra de 60 nomes realistas de plano, **72% não casavam** — e quase toda falha era
 * "movimento conhecido + um modificador": `agachamento livre` casava, `agachamento livre
 * com barra` não. Dicionário de nome inteiro é o formato errado: a superfície de falha é
 * do tamanho das combinações possíveis, e cada plano novo pede mais uma chave.
 *
 * O índice aqui é por MOVIMENTO (o núcleo: supino, agachamento, remada…) com TAGS
 * derivadas do próprio catálogo (equipamento + palavras do nome em inglês). O resolvedor
 * escolhe, dentro do movimento, a variação cujas tags mais combinam com o nome PT-BR.
 * Modificador desconhecido deixa de quebrar o match; ele só deixa de pontuar.
 *
 * Uso:
 *   node scripts/build-exercise-index.mjs [caminho-do-exercises.json]
 * Sem argumento, baixa o catálogo do GitHub.
 */

import { writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";

const CATALOG_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const OUT = "src/lib/plan/exerciseIndex.generated.ts";

/**
 * Núcleos de movimento: tokens PT-BR → padrão no nome EN do catálogo.
 * `not` remove homônimos (ex.: "crucifixo inverso" não é "crucifixo").
 * A ORDEM importa: o resolvedor testa de cima pra baixo e o primeiro núcleo cujo token
 * aparece no nome vence, então o mais específico vem antes ("elevacao lateral" antes de
 * "elevacao", "remada alta" antes de "remada").
 */
const HEADS = [
  { head: "supino", en: /(bench press|chest press)/i },
  { head: "crucifixo_inverso", en: /(reverse fly|rear delt|reverse machine fly)/i },
  { head: "crucifixo", en: /\bfly(e)?s?\b/i, not: /(reverse|rear)/i },
  { head: "crossover", en: /crossover/i },
  { head: "voador", en: /(butterfly|pec deck)/i },
  { head: "flexao", en: /(push[- ]?up)/i },
  { head: "paralelas", en: /\bdips?\b/i },
  { head: "puxada", en: /pulldown/i },
  { head: "barra_fixa", en: /(pull[- ]?up|chin[- ]?up)/i },
  { head: "remada_alta", en: /upright row/i },
  // `rows?`: sem o plural, `Seated_Cable_Rows` — a remada baixa, das mais comuns em
  // plano — nunca entrava no índice, e nomes fora do dicionário caíam em `Shotgun_Row`
  // (achado [P1] do review Codex).
  { head: "remada", en: /\brows?\b/i, not: /upright/i },
  { head: "stiff", en: /(stiff[- ]?leg|romanian)/i },
  { head: "terra", en: /deadlift/i, not: /(stiff|romanian)/i },
  { head: "pullover", en: /pullover/i },
  { head: "encolhimento", en: /shrug/i },
  { head: "desenvolvimento", en: /(shoulder press|military press|overhead press|arnold press)/i },
  { head: "elevacao_lateral", en: /(lateral raise|side lateral)/i },
  { head: "elevacao_frontal", en: /front (dumbbell |plate |cable |barbell )?raise/i },
  { head: "face_pull", en: /face pull/i },
  { head: "rosca", en: /curl/i, not: /(leg curl|thigh curl)/i },
  { head: "triceps", en: /(tricep|pushdown|skullcrusher)/i },
  { head: "agachamento", en: /squat/i },
  { head: "leg_press", en: /leg press/i, not: /calf/i },
  { head: "extensora", en: /leg extension/i },
  { head: "flexora", en: /leg curl/i },
  { head: "afundo", en: /(lunge|step[- ]?up)/i },
  { head: "hip_thrust", en: /hip thrust/i },
  { head: "ponte_gluteo", en: /glute bridge/i },
  { head: "abdutora", en: /abductor/i },
  { head: "adutora", en: /adductor/i },
  { head: "panturrilha", en: /calf (raise|press)/i },
  { head: "abdominal", en: /(crunch|sit[- ]?up)/i },
  { head: "prancha", en: /plank/i },
  { head: "elevacao_pernas", en: /(leg raise|hip raise|knee raise|leg[- ]?lift)/i },
  { head: "rotacao_russa", en: /russian twist/i },
  { head: "good_morning", en: /good morning/i },
  { head: "extensao_quadril", en: /hip extension/i },
];

/** Equipamento do catálogo → tag PT. */
const EQUIP_TAG = {
  barbell: "barra",
  dumbbell: "halteres",
  machine: "maquina",
  cable: "cabo",
  "body only": "livre",
  "e-z curl bar": "barraw",
  kettlebells: "kettlebell",
  bands: "elastico",
  "exercise ball": "bola",
  "medicine ball": "bola",
  // Trenó, bandas assistidas, anilha solta... O dataset joga tudo em "other". Sem uma tag
  // própria, essas entradas PARECIAM genéricas (zero tags) e ganhavam o desempate de
  // campeões legítimos — `Band_Assisted_Pull-Up` vencia `Pullups`. Com a tag, o
  // resolvedor pode penalizá-las quando o nome não pediu nada exótico, sem perder as
  // legítimas (a anilha da elevação frontal também mora aqui).
  other: "outro",
};

/** Palavra no nome EN → tag PT (modificadores que o usuário costuma escrever). */
const NAME_TAGS = [
  [/incline/i, "inclinado"],
  [/decline/i, "declinado"],
  [/seated/i, "sentado"],
  [/standing/i, "empe"],
  [/lying/i, "deitado"],
  [/(one[- ]?arm|single[- ]?leg|one[- ]?leg|alternat)/i, "unilateral"],
  [/bent[- ]?over/i, "curvado"],
  [/close[- ]?grip/i, "fechada"],
  [/wide[- ]?grip/i, "aberta"],
  // `\b` antes de "chin" é obrigatório: sem ele, o padrão casa dentro de ma-CHIN-e e
  // TODA variação de máquina ganhava uma tag `supinada` falsa — "Supino reto supinado"
  // ia parar em `Machine_Bench_Press` (achado [P1] do review Codex).
  [/(reverse grip|underhand|supinated|\bchin)/i, "supinada"],
  [/(overhand|pronated)/i, "pronada"],
  [/smith/i, "smith"],
  [/rope/i, "corda"],
  [/preacher/i, "scott"],
  [/concentration/i, "concentrada"],
  [/hammer/i, "martelo"],
  [/(skullcrusher|lying tricep)/i, "testa"],
  [/kickback/i, "coice"],
  [/\bfrench\b/i, "frances"],
  [/sumo/i, "sumo"],
  [/bulgarian/i, "bulgaro"],
  [/front squat/i, "frontal"],
  [/goblet/i, "goblet"],
  [/\bt[- ]?bar\b/i, "cavalinho"],
  [/machine/i, "maquina"],
  [/cable/i, "cabo"],
  [/barbell/i, "barra"],
  [/dumbbell/i, "halteres"],
  [/(hanging|suspended)/i, "suspenso"],
  [/side plank/i, "lateral"],
  [/\bside\b/i, "lateral"],
  [/arnold/i, "arnold"],
  [/split squat/i, "bulgaro"],
  [/plate/i, "anilha"],
];

/**
 * Musculatura esperada por núcleo — a GUARDA que fecha a classe de erro de bucketing.
 *
 * As regras de núcleo são regex sobre o nome em inglês, e regex sobre nome erra de um
 * jeito específico e recorrente: `chin` casava dentro de ma-CHIN-e; `kickback` puxava
 * `Glute_Kickback` para o núcleo de tríceps; `row` deixava `Seated_Cable_Rows` de
 * fora. Foram três achados de review em duas rodadas, todos da MESMA forma.
 *
 * Corrigir regex a regex não converge — a próxima palavra ambígua produz o próximo
 * achado. Esta guarda é ortogonal ao nome: o catálogo diz qual músculo o exercício
 * trabalha, e um exercício de glúteo não pode morar no núcleo de tríceps, escreva-se o
 * nome como se escrever. Entrada cujo músculo primário não bate com o núcleo é
 * descartada, e o script REPORTA o descarte — é assim que um erro de bucketing novo
 * aparece na hora de gerar, não meses depois na tela do usuário.
 */
const HEAD_MUSCLES = {
  supino: ["chest"],
  crucifixo: ["chest"],
  crucifixo_inverso: ["shoulders"],
  crossover: ["chest"],
  voador: ["chest"],
  flexao: ["chest", "triceps"],
  paralelas: ["triceps", "chest"],
  puxada: ["lats", "middle back"],
  barra_fixa: ["lats", "biceps", "middle back"],
  remada_alta: ["shoulders", "traps"],
  remada: ["middle back", "lats"],
  stiff: ["hamstrings", "glutes", "lower back"],
  terra: ["lower back", "hamstrings", "quadriceps", "glutes", "traps"],
  pullover: ["lats", "chest"],
  encolhimento: ["traps"],
  desenvolvimento: ["shoulders"],
  elevacao_lateral: ["shoulders"],
  elevacao_frontal: ["shoulders"],
  face_pull: ["shoulders"],
  rosca: ["biceps", "forearms"],
  triceps: ["triceps"],
  agachamento: ["quadriceps", "glutes", "hamstrings"],
  leg_press: ["quadriceps", "glutes"],
  extensora: ["quadriceps"],
  flexora: ["hamstrings"],
  afundo: ["quadriceps", "glutes", "hamstrings"],
  hip_thrust: ["glutes"],
  ponte_gluteo: ["glutes"],
  abdutora: ["abductors", "glutes"],
  adutora: ["adductors"],
  panturrilha: ["calves"],
  abdominal: ["abdominals"],
  prancha: ["abdominals"],
  elevacao_pernas: ["abdominals", "hip flexors"],
  rotacao_russa: ["abdominals"],
  good_morning: ["hamstrings", "lower back", "glutes"],
  extensao_quadril: ["glutes", "hamstrings"],
};

function tagsFor(entry) {
  const tags = new Set();
  const eq = EQUIP_TAG[entry.equipment] ?? "outro";
  tags.add(eq);
  for (const [re, tag] of NAME_TAGS) if (re.test(entry.name)) tags.add(tag);
  return [...tags].sort();
}

function headFor(entry) {
  for (const h of HEADS) {
    if (!h.en.test(entry.name)) continue;
    if (h.not && h.not.test(entry.name)) continue;
    return h.head;
  }
  return null;
}

const src = process.argv[2];
const catalog = src
  ? JSON.parse(readFileSync(src, "utf8"))
  : await fetch(CATALOG_URL).then((r) => r.json());

/**
 * Categorias que representam TREINO DE FORÇA. `stretching`, `cardio` e `plyometrics`
 * ficam de fora: sem esse filtro, "Tríceps francês" casava com `Tricep_Side_Stretch` e
 * "Agachamento búlgaro" com `Sit_Squats` — que é um alongamento. Um plano de musculação
 * pedindo foto de alongamento é foto errada, e foto errada é o que este módulo não pode
 * fazer.
 */
const CATEGORIES = new Set(["strength", "powerlifting", "strongman", "olympic weightlifting"]);

const rows = [];
const skipped = { category: 0, muscle: [] };
for (const entry of catalog) {
  if (!entry.images || entry.images.length < 2) continue;
  const head = headFor(entry);
  if (!head) continue;
  if (!CATEGORIES.has(entry.category)) {
    skipped.category += 1;
    continue;
  }
  /*
   * Primário OU secundário. Só primário era estrito demais: o catálogo classifica
   * `Close-Grip_Barbell_Bench_Press` e `Bench_Press_-_Powerlifting` como TRÍCEPS
   * primário (peito é secundário), e descartá-los tirava o "supino fechado" do índice.
   * Aceitar o secundário mantém esses e continua barrando o que interessa —
   * `Cable_Incline_Pushdown` é lats sem secundário nenhum, e os coices de glúteo não
   * têm tríceps em lugar algum.
   */
  const esperados = HEAD_MUSCLES[head] ?? [];
  const musculos = [...entry.primaryMuscles, ...(entry.secondaryMuscles ?? [])];
  if (!musculos.some((m) => esperados.includes(m))) {
    skipped.muscle.push(`${head} <- ${entry.id} (${musculos.join("/") || "sem músculo"})`);
    continue;
  }
  rows.push({ head, id: entry.id, tags: tagsFor(entry) });
}
rows.sort((a, b) => a.head.localeCompare(b.head) || a.id.localeCompare(b.id));

const byHead = {};
for (const r of rows) (byHead[r.head] ??= []).push([r.id, r.tags]);

const body = Object.entries(byHead)
  .map(
    ([head, list]) =>
      `  ${head}: [\n${list
        .map(([id, tags]) => `    ["${id}", [${tags.map((t) => `"${t}"`).join(", ")}]],`)
        .join("\n")}\n  ],`,
  )
  .join("\n");

writeFileSync(
  OUT,
  `/**
 * GERADO POR \`scripts/build-exercise-index.mjs\` — NÃO EDITAR À MÃO.
 * Fonte: free-exercise-db (Unlicense, ADR-004). Regenerar com:
 *   node scripts/build-exercise-index.mjs [exercises.json]
 *
 * Cada núcleo de movimento lista as variações do catálogo que têm foto, com as tags
 * derivadas do equipamento e do nome em inglês. O resolvedor (\`exerciseMedia.ts\`)
 * escolhe dentro do núcleo pela sobreposição de tags com o nome PT-BR do plano.
 */

/** [id no free-exercise-db, tags PT-BR da variação] */
export type IndexedVariant = readonly [string, readonly string[]];

export const EXERCISE_INDEX: Record<string, readonly IndexedVariant[]> = {
${body}
};
`,
  "utf8",
);

console.log(`${OUT}: ${rows.length} variações em ${Object.keys(byHead).length} núcleos`);
console.log(`  descartadas: ${skipped.category} por categoria, ${skipped.muscle.length} por musculatura`);
for (const linha of skipped.muscle) console.log(`    x ${linha}`);
for (const [head, list] of Object.entries(byHead)) console.log(`  ${head}: ${list.length}`);
