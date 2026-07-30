/**
 * Fotos reais de exercício via `free-exercise-db` (github.com/yuhonas/free-exercise-db,
 * Unlicense/domínio público — ADR-004). Cada exercício do dataset tem 2 fotos JPG
 * (posição inicial/final) em URL determinística no raw do GitHub.
 *
 * O plano fala PT-BR ("Puxada frontal") e o dataset EN ("Wide-Grip Lat Pulldown"),
 * então o casamento é por **dicionário curado** sobre o nome normalizado (sem acento,
 * caixa ou pontuação). Sem match → `null` e a UI mantém o placeholder — mostrar a foto
 * de um movimento ERRADO é pior do que não mostrar nenhuma.
 *
 * Módulo puro (sem React/rede aqui); a imagem em si é melhoria progressiva na UI.
 */

import { EXERCISE_INDEX } from "./exerciseIndex.generated";

const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export type ExerciseMedia = {
  /** Id do exercício no free-exercise-db. */
  sourceId: string;
  /** Fotos (posição inicial e final). */
  imageUrls: [string, string];
};

/** Normaliza para chave de dicionário: minúsculas, sem acentos, sem pontuação, espaços únicos. */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Dicionário curado: nome BR normalizado → id no free-exercise-db.
 * Vários apelidos podem apontar para o mesmo id. Manutenção: adicionar a variação
 * nova aqui (e cobrir com teste) quando um plano usar um nome que não casa.
 */
const PT_TO_ID: Record<string, string> = {
  // ---- Peito ----
  "supino reto": "Barbell_Bench_Press_-_Medium_Grip",
  "supino reto com barra": "Barbell_Bench_Press_-_Medium_Grip",
  "supino inclinado": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "supino inclinado com barra": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "supino com halteres": "Dumbbell_Bench_Press",
  "supino reto com halteres": "Dumbbell_Bench_Press",
  "supino inclinado com halteres": "Hammer_Grip_Incline_DB_Bench_Press",
  "supino maquina": "Machine_Bench_Press",
  "supino no smith": "Smith_Machine_Bench_Press",
  crucifixo: "Dumbbell_Flyes",
  "crucifixo reto": "Dumbbell_Flyes",
  "crucifixo com halteres": "Dumbbell_Flyes",
  "crucifixo maquina": "Butterfly",
  "peck deck": "Butterfly",
  "voador": "Butterfly",
  "crossover": "Cable_Crossover",
  "cross over": "Cable_Crossover",
  "crucifixo no cabo": "Cable_Crossover",
  flexao: "Pushups",
  "flexao de braco": "Pushups",
  "mergulho no banco": "Bench_Dips",
  paralelas: "Dips_-_Triceps_Version",

  // ---- Costas ----
  "puxada frontal": "Wide-Grip_Lat_Pulldown",
  "puxada alta": "Wide-Grip_Lat_Pulldown",
  "puxada aberta": "Wide-Grip_Lat_Pulldown",
  "pulldown": "Full_Range-Of-Motion_Lat_Pulldown",
  "puxada fechada": "Close-Grip_Front_Lat_Pulldown",
  "puxada triangulo": "Close-Grip_Front_Lat_Pulldown",
  "barra fixa": "Pullups",
  "barra fixa supinada": "Chin-Up",
  "remada curvada": "Bent_Over_Barbell_Row",
  "remada curvada com barra": "Bent_Over_Barbell_Row",
  "remada baixa": "Seated_Cable_Rows",
  "remada sentada": "Seated_Cable_Rows",
  "remada no cabo": "Seated_Cable_Rows",
  "remada unilateral": "One-Arm_Dumbbell_Row",
  "remada serrote": "One-Arm_Dumbbell_Row",
  "serrote": "One-Arm_Dumbbell_Row",
  "remada cavalinho": "T-Bar_Row_with_Handle",
  "remada t": "T-Bar_Row_with_Handle",
  "face pull": "Face_Pull",
  "hiperextensao": "Hyperextensions_Back_Extensions",
  "extensao lombar": "Hyperextensions_Back_Extensions",
  "levantamento terra": "Barbell_Deadlift",
  terra: "Barbell_Deadlift",
  "terra romeno": "Romanian_Deadlift",
  "levantamento terra romeno": "Romanian_Deadlift",
  "stiff": "Stiff-Legged_Barbell_Deadlift",
  "bom dia": "Band_Good_Morning",
  "encolhimento": "Barbell_Shrug",
  "encolhimento com barra": "Barbell_Shrug",

  // ---- Ombros ----
  "desenvolvimento ombro": "Barbell_Shoulder_Press",
  "desenvolvimento de ombro": "Dumbbell_Shoulder_Press",
  "desenvolvimento de ombros": "Dumbbell_Shoulder_Press",
  "desenvolvimento": "Barbell_Shoulder_Press",
  "desenvolvimento com barra": "Barbell_Shoulder_Press",
  "desenvolvimento militar": "Standing_Military_Press",
  "desenvolvimento com halteres": "Dumbbell_Shoulder_Press",
  "desenvolvimento sentado": "Seated_Dumbbell_Press",
  "desenvolvimento arnold": "Arnold_Dumbbell_Press",
  "arnold press": "Arnold_Dumbbell_Press",
  "desenvolvimento maquina": "Machine_Shoulder_Military_Press",
  "desenvolvimento na maquina": "Machine_Shoulder_Military_Press",
  "elevacao lateral": "Side_Lateral_Raise",
  "elevacao lateral com halteres": "Side_Lateral_Raise",
  "elevacao frontal": "Front_Dumbbell_Raise",
  "elevacao frontal com halteres": "Front_Dumbbell_Raise",
  "elevacao frontal no cabo": "Front_Cable_Raise",
  "crucifixo inverso": "Reverse_Flyes",
  "crucifixo invertido": "Reverse_Flyes",
  "voador invertido": "Reverse_Machine_Flyes",
  "remada alta": "Dumbbell_One-Arm_Upright_Row",

  // ---- Bíceps ----
  "rosca direta": "Barbell_Curl",
  "rosca direta com barra": "Barbell_Curl",
  "rosca alternada": "Dumbbell_Alternate_Bicep_Curl",
  "rosca alternada com halteres": "Dumbbell_Alternate_Bicep_Curl",
  "rosca martelo": "Alternate_Hammer_Curl",
  "rosca martelo no cabo": "Cable_Hammer_Curls_-_Rope_Attachment",
  "rosca scott": "Preacher_Curl",
  "rosca scott maquina": "Machine_Preacher_Curls",
  "rosca concentrada": "Concentration_Curls",
  "rosca inclinada": "Alternate_Incline_Dumbbell_Curl",

  // ---- Tríceps ----
  "triceps pulley": "Triceps_Pushdown",
  "triceps polia": "Triceps_Pushdown",
  "triceps pushdown": "Triceps_Pushdown",
  "triceps corda": "Triceps_Pushdown_-_Rope_Attachment",
  "triceps na corda": "Triceps_Pushdown_-_Rope_Attachment",
  "triceps testa": "Cable_Lying_Triceps_Extension",
  "triceps frances": "Standing_Dumbbell_Triceps_Extension",
  "triceps frances com halter": "Standing_Dumbbell_Triceps_Extension",
  "triceps overhead": "Cable_Rope_Overhead_Triceps_Extension",
  "extensao de triceps acima da cabeca": "Cable_Rope_Overhead_Triceps_Extension",
  "supino fechado": "Close-Grip_Barbell_Bench_Press",
  "mergulho": "Dips_-_Triceps_Version",

  // ---- Pernas / Glúteos ----
  agachamento: "Barbell_Squat",
  "agachamento livre": "Barbell_Squat",
  "agachamento com barra": "Barbell_Squat",
  "agachamento frontal": "Front_Barbell_Squat",
  "agachamento goblet": "Goblet_Squat",
  "goblet squat": "Goblet_Squat",
  "agachamento com halteres": "Dumbbell_Squat",
  "leg press": "Leg_Press",
  "leg press 45": "Leg_Press",
  "cadeira extensora": "Leg_Extensions",
  extensora: "Leg_Extensions",
  "mesa flexora": "Lying_Leg_Curls",
  "flexora deitada": "Lying_Leg_Curls",
  "cadeira flexora": "Seated_Leg_Curl",
  flexora: "Lying_Leg_Curls",
  afundo: "Barbell_Lunge",
  "afundo com barra": "Barbell_Lunge",
  "avanco": "Dumbbell_Lunges",
  "afundo com halteres": "Dumbbell_Lunges",
  "passada": "Dumbbell_Lunges",
  "elevacao pelvica": "Barbell_Hip_Thrust",
  "hip thrust": "Barbell_Hip_Thrust",
  "ponte de gluteo": "Barbell_Glute_Bridge",
  "cadeira abdutora": "Thigh_Abductor",
  abdutora: "Thigh_Abductor",
  "cadeira adutora": "Thigh_Adductor",
  adutora: "Thigh_Adductor",
  "panturrilha em pe": "Standing_Calf_Raises",
  "panturrilha no smith": "Standing_Calf_Raises",
  "panturrilha sentado": "Seated_Calf_Raise",
  "panturrilha no leg press": "Calf_Press_On_The_Leg_Press_Machine",

  // ---- Core ----
  abdominal: "Crunches",
  "abdominal reto": "Crunches",
  "abdominal supra": "Crunches",
  prancha: "Plank",
  "prancha frontal": "Plank",
  "russian twist": "Russian_Twist",
  "torcao russa": "Russian_Twist",
  "elevacao de pernas": "Bent-Knee_Hip_Raise",
  "abdominal bicicleta": "Air_Bike",

  /*
   * Idiomatismos: nomes em que a palavra NÃO descreve a mecânica, então o casamento
   * estrutural não tem como acertar sozinho. "Baixa" não é um ângulo, é o nome da
   * máquina; "infra" quer dizer abdômen inferior; "banco" aqui é o apoio, não o
   * equipamento. Depois do casamento estrutural, esta seção deixou de ser uma tentativa
   * de enumerar combinações e virou o que devia ser: uma lista curta de exceções.
   */
  // (`remada baixa` já está mapeada acima — era justamente o caso que mostrava o
  // problema: a chave existia, mas "remada baixa NO CABO" não casava com ela.)
  "remada baixa no cabo": "Seated_Cable_Rows",
  "remada sentada no cabo": "Seated_Cable_Rows",
  "mergulho nas paralelas": "Dips_-_Triceps_Version",
  "triceps banco": "Bench_Dips",
  "triceps no banco": "Bench_Dips",
  "abdominal infra": "Flat_Bench_Lying_Leg_Raise",
  "abdominal infra na paralela": "Hanging_Leg_Raise",
};

/**
 * Núcleos de movimento em PT-BR → chave do `EXERCISE_INDEX`.
 *
 * A ORDEM É SIGNIFICATIVA: vence o primeiro token encontrado no nome, então o mais
 * específico vem antes ("elevacao lateral" antes de "elevacao de pernas"; "remada alta"
 * antes de "remada"). Sem isso, "elevação lateral" cairia no núcleo errado.
 */
const PT_HEADS: [token: string, head: string][] = [
  ["elevacao lateral", "elevacao_lateral"],
  ["elevacao frontal", "elevacao_frontal"],
  ["elevacao pelvica", "hip_thrust"],
  ["elevacao de pernas", "elevacao_pernas"],
  ["elevacao de perna", "elevacao_pernas"],
  ["elevacao de joelhos", "elevacao_pernas"],
  ["remada alta", "remada_alta"],
  ["crucifixo inverso", "crucifixo_inverso"],
  ["voador inverso", "crucifixo_inverso"],
  ["face pull", "face_pull"],
  ["facepull", "face_pull"],
  ["hip thrust", "hip_thrust"],
  ["ponte de gluteo", "ponte_gluteo"],
  ["ponte gluteo", "ponte_gluteo"],
  ["good morning", "good_morning"],
  ["extensao de quadril", "extensao_quadril"],
  ["barra fixa", "barra_fixa"],
  ["leg press", "leg_press"],
  ["legpress", "leg_press"],
  ["extensora", "extensora"],
  ["extensao de joelhos", "extensora"],
  ["flexora", "flexora"],
  ["abdutora", "abdutora"],
  ["abducao", "abdutora"],
  ["adutora", "adutora"],
  ["aducao", "adutora"],
  ["levantamento terra", "terra"],
  ["stiff", "stiff"],
  ["terra", "terra"],
  ["supino", "supino"],
  ["crucifixo", "crucifixo"],
  ["crossover", "crossover"],
  ["cross over", "crossover"],
  ["peck deck", "voador"],
  ["peckdeck", "voador"],
  ["voador", "voador"],
  ["flexao", "flexao"],
  ["paralelas", "paralelas"],
  ["mergulho", "paralelas"],
  ["puxada", "puxada"],
  ["pulldown", "puxada"],
  ["pull down", "puxada"],
  ["remada", "remada"],
  ["pullover", "pullover"],
  ["pull over", "pullover"],
  ["encolhimento", "encolhimento"],
  ["desenvolvimento", "desenvolvimento"],
  ["rosca", "rosca"],
  ["triceps", "triceps"],
  ["agachamento", "agachamento"],
  ["afundo", "afundo"],
  ["avanco", "afundo"],
  ["passada", "afundo"],
  ["panturrilha", "panturrilha"],
  ["abdominal", "abdominal"],
  ["prancha", "prancha"],
  ["rotacao russa", "rotacao_russa"],
  ["torcao russa", "rotacao_russa"],
  ["russian twist", "rotacao_russa"],
];

/**
 * Modificadores em PT-BR → tag do índice. São os adjetivos que o plano acrescenta ao
 * movimento e que faziam o dicionário de string exata errar ("… com barra", "… sentado").
 */
const PT_MODIFIERS: [token: string, tag: string][] = [
  ["barra w", "barraw"],
  ["barra ez", "barraw"],
  ["halteres", "halteres"],
  ["halter", "halteres"],
  ["maquina", "maquina"],
  ["polia", "cabo"],
  ["cabo", "cabo"],
  ["smith", "smith"],
  ["corda", "corda"],
  ["barra", "barra"],
  ["peso do corpo", "livre"],
  ["peso corporal", "livre"],
  ["livre", "livre"],
  ["kettlebell", "kettlebell"],
  ["elastico", "elastico"],
  ["inclinad", "inclinado"],
  ["declinad", "declinado"],
  ["sentad", "sentado"],
  ["em pe", "empe"],
  ["de pe", "empe"],
  ["deitad", "deitado"],
  ["unilateral", "unilateral"],
  ["alternad", "unilateral"],
  ["curvad", "curvado"],
  ["fechad", "fechada"],
  ["abert", "aberta"],
  ["supinad", "supinada"],
  ["pronad", "pronada"],
  ["scott", "scott"],
  ["concentrad", "concentrada"],
  ["martelo", "martelo"],
  ["testa", "testa"],
  ["coice", "coice"],
  ["frances", "frances"],
  ["sumo", "sumo"],
  ["bulgar", "bulgaro"],
  ["frontal", "frontal"],
  ["goblet", "goblet"],
  ["cavalinho", "cavalinho"],
  ["suspens", "suspenso"],
  ["lateral", "lateral"],
  ["arnold", "arnold"],
  ["anilha", "anilha"],
  ["bulgar", "bulgaro"],
  // Token de DUAS palavras de propósito: "remada baixa" é o nome brasileiro da remada
  // sentada no cabo, e "baixa" sozinha não quer dizer "sentado" em lugar nenhum. Sem
  // isto, "remada baixa no cabo aberta" perdia `Seated_Cable_Rows` (penalizada por ter
  // a tag `sentado` que o nome não pediu) para `Shotgun_Row`, que é obscura mas não
  // tinha tag alguma sobrando.
  ["remada baixa", "sentado"],
];

/** Ids já curados à mão — usados como desempate: onde houve escolha humana, ela vale. */
const CURATED_IDS = new Set(Object.values(PT_TO_ID));

/**
 * Ordem de "quão básico é o equipamento". Quando o plano não diz com o quê, a versão
 * canônica de um movimento é a de peso livre, não a da máquina: sem este critério,
 * "supino reto supinado" caía em `Machine_Bench_Press` só porque o id é mais curto.
 */
const EQUIPMENT_RANK = ["barra", "halteres", "livre", "barraw", "cabo", "kettlebell", "maquina", "smith", "elastico", "bola", "outro"];

function equipmentRank(tags: readonly string[]): number {
  let rank = EQUIPMENT_RANK.length;
  for (const tag of tags) {
    const i = EQUIPMENT_RANK.indexOf(tag);
    if (i >= 0 && i < rank) rank = i;
  }
  return rank;
}

/**
 * Casamento ESTRUTURAL: identifica o núcleo do movimento e, dentro dele, escolhe a
 * variação cujas tags mais combinam com os modificadores do nome.
 *
 * Por que isto e não mais chaves no dicionário: medido numa amostra de 60 nomes realistas
 * de plano, o dicionário de string exata errava **72%**, e quase toda falha era "movimento
 * conhecido + um modificador" (`agachamento livre` casava, `agachamento livre com barra`
 * não). Enumerar combinações não converge — cada plano novo pede outra chave. Aqui um
 * modificador desconhecido deixa de quebrar o match: ele apenas não pontua.
 *
 * **A garantia que sobrevive:** nunca atravessamos movimentos. Sem núcleo reconhecido,
 * devolve `null` — "supino" jamais devolve um agachamento. Dentro do núcleo, cair numa
 * variação próxima (supino declinado → supino com barra) é honesto: é o mesmo movimento,
 * e o nome exibido continua sendo o do plano, não o da foto.
 */
function matchStructural(normalized: string): string | null {
  const head = PT_HEADS.find(([token]) => normalized.includes(token))?.[1];
  if (!head) return null;
  const candidates = EXERCISE_INDEX[head];
  if (!candidates || candidates.length === 0) return null;

  const nameTags = new Set(
    PT_MODIFIERS.filter(([token]) => normalized.includes(token)).map(([, tag]) => tag),
  );
  // "barra w" contém "barra": sem isto o nome pedia os DOIS equipamentos e toda variação
  // de barra reta ganhava um acerto de graça ("rosca direta com barra W" casava com
  // `Reverse_Barbell_Preacher_Curls`). O qualificador mais específico vence.
  if (nameTags.has("barraw")) nameTags.delete("barra");

  let best: { id: string; score: number; curated: boolean; tags: number; rank: number } | null =
    null;
  for (const [id, tags] of candidates) {
    let hits = 0;
    let cost = 0;
    for (const tag of tags) {
      if (nameTags.has(tag)) {
        hits += 1;
        continue;
      }
      // Tag que a variação tem e o nome não pediu é especificidade não solicitada: pesa
      // contra, para o genérico vencer quando o plano não disse nada. `outro` (trenó,
      // banda assistida) pesa mais: é equipamento exótico para um plano de academia e
      // não pode ganhar de um campeão óbvio só por ter poucas tags.
      cost += tag === "outro" ? 3 : 1;
    }
    const score = hits * 3 - cost;
    const curated = CURATED_IDS.has(id);
    const rank = equipmentRank(tags);
    /*
     * Desempate, em ordem: escolha humana (dicionário curado) > menos especificidade
     * (menos tags) > equipamento mais básico > nome mais curto.
     *
     * Nenhum destes é estética. Sem o último, o empate caía na ORDEM DO ARQUIVO e a
     * variação exótica vencia a básica ("agachamento no smith" →
     * `Smith_Machine_Pistol_Squat`). Sem o penúltimo, o id mais curto vencia e um nome
     * genérico caía na máquina ("supino reto supinado" → `Machine_Bench_Press`), quando
     * a versão canônica de um movimento é a de peso livre.
     */
    const better =
      best === null ||
      score > best.score ||
      (score === best.score &&
        (curated !== best.curated
          ? curated
          : tags.length !== best.tags
            ? tags.length < best.tags
            : rank !== best.rank
              ? rank < best.rank
              : id.length < best.id.length));
    if (better) best = { id, score, curated, tags: tags.length, rank };
  }
  return best?.id ?? null;
}

/**
 * Resolve as fotos de um exercício. Ordem de precedência:
 * 1. `mediaId` explícito do plano (`howTo.mediaId`, schema 1.1 — id EXATO do
 *    free-exercise-db; o gerador é a autoridade quando ele afirma a mídia);
 * 2. dicionário curado pelo nome PT-BR normalizado (escolha humana, confiança máxima);
 * 3. casamento estrutural por núcleo de movimento + modificadores;
 * 4. null → a UI mantém o placeholder com o link de vídeo.
 * Se as imagens de um mediaId inválido não carregarem, o onError da UI já cai no
 * placeholder — nunca mostramos foto de outro MOVIMENTO por chute.
 */
export function resolveExerciseMedia(name: string, mediaId?: string): ExerciseMedia | null {
  const normalized = normalizeExerciseName(name);
  const id = mediaId?.trim() || PT_TO_ID[normalized] || matchStructural(normalized);
  if (!id) return null;
  return { sourceId: id, imageUrls: [`${BASE}${id}/0.jpg`, `${BASE}${id}/1.jpg`] };
}
