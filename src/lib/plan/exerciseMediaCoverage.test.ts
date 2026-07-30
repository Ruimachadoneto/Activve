import { describe, it, expect } from "vitest";
import { resolveExerciseMedia } from "./exerciseMedia";
import { EXERCISE_INDEX } from "./exerciseIndex.generated";

/**
 * Cobertura de mídia sobre nomes REALISTAS de plano.
 *
 * Este arquivo existe porque a métrica importa: antes do casamento estrutural, o
 * dicionário de string exata resolvia **17 de 60** destes nomes (28%). O usuário viu o
 * buraco na prática — "existem treinos sem imagens" — e foto do exercício é core do app,
 * não enfeite.
 *
 * A lista é propositalmente escrita como um coach escreveria, com os modificadores que
 * quebravam o casamento exato ("… com barra", "… sentado na máquina", "… unilateral").
 */
const NOMES_REALISTAS = [
  "Supino reto com barra",
  "Supino inclinado com halteres",
  "Supino declinado",
  "Crucifixo inclinado com halteres",
  "Crossover na polia alta",
  "Flexão de braço",
  "Puxada frontal pegada aberta",
  "Puxada frontal na barra guiada",
  "Puxada supinada",
  "Remada curvada com barra",
  "Remada baixa no cabo",
  "Remada unilateral com halter",
  "Remada cavalinho",
  "Barra fixa pronada",
  "Levantamento terra",
  "Levantamento terra romeno",
  "Stiff com halteres",
  "Desenvolvimento militar com barra",
  "Desenvolvimento Arnold",
  "Elevação lateral com halteres",
  "Elevação lateral sentado",
  "Elevação frontal com anilha",
  "Crucifixo inverso na máquina",
  "Face pull na polia",
  "Encolhimento com halteres",
  "Rosca direta com barra W",
  "Rosca alternada com halteres",
  "Rosca martelo",
  "Rosca scott",
  "Rosca concentrada",
  "Tríceps testa com barra W",
  "Tríceps corda na polia",
  "Tríceps francês unilateral",
  "Tríceps banco",
  "Mergulho nas paralelas",
  "Agachamento livre com barra",
  "Agachamento frontal",
  "Agachamento búlgaro",
  "Agachamento sumô com halter",
  "Leg press 45 graus",
  "Cadeira extensora unilateral",
  "Mesa flexora",
  "Cadeira flexora sentado",
  "Afundo com halteres",
  "Passada com barra",
  "Elevação pélvica com barra",
  "Abdução de quadril na máquina",
  "Panturrilha em pé no smith",
  "Panturrilha sentado na máquina",
  "Abdominal supra no solo",
  "Abdominal infra na paralela",
  "Prancha isométrica",
  "Prancha lateral",
  "Elevação de pernas suspenso",
  "Rotação russa com anilha",
  "Pull-over com halter",
  "Good morning com barra",
  "Remada serrote",
  "Voador peitoral",
  "Tríceps coice com halteres",
];

describe("cobertura de mídia — nomes realistas de plano", () => {
  it("resolve foto para todos os nomes da amostra", () => {
    const semFoto = NOMES_REALISTAS.filter((nome) => resolveExerciseMedia(nome) === null);
    expect(semFoto).toEqual([]);
  });

  it("cada resolução aponta para 2 imagens do free-exercise-db", () => {
    for (const nome of NOMES_REALISTAS) {
      const media = resolveExerciseMedia(nome);
      expect(media, nome).not.toBeNull();
      expect(media!.imageUrls).toHaveLength(2);
      expect(media!.imageUrls[0]).toMatch(/^https:\/\/raw\.githubusercontent\.com\/.+\/0\.jpg$/);
      expect(media!.imageUrls[1]).toMatch(/\/1\.jpg$/);
    }
  });
});

describe("casamento estrutural — o modificador refina, nunca atravessa o movimento", () => {
  it("o núcleo manda: nome sem movimento conhecido continua sem foto", () => {
    // A garantia que não pode cair: melhor placeholder do que a foto de outro movimento.
    expect(resolveExerciseMedia("Aquecimento na esteira")).toBeNull();
    expect(resolveExerciseMedia("Alongamento de posterior")).toBeNull();
    expect(resolveExerciseMedia("Mobilidade de quadril")).toBeNull();
    expect(resolveExerciseMedia("")).toBeNull();
  });

  it("o equipamento escolhe a variação dentro do mesmo movimento", () => {
    const barra = resolveExerciseMedia("Supino reto com barra")!.sourceId;
    const halteres = resolveExerciseMedia("Supino reto com halteres")!.sourceId;
    expect(barra).not.toBe(halteres);
    expect(barra.toLowerCase()).toContain("barbell");
    expect(halteres.toLowerCase()).toContain("dumbbell");
  });

  it("o ângulo escolhe a variação dentro do mesmo movimento", () => {
    const reto = resolveExerciseMedia("Supino com halteres")!.sourceId;
    const inclinado = resolveExerciseMedia("Supino inclinado com halteres")!.sourceId;
    expect(inclinado).not.toBe(reto);
    expect(inclinado.toLowerCase()).toContain("incline");
  });

  it("modificador desconhecido não quebra o match, só não pontua", () => {
    // "pegada neutra" não está no vocabulário; o movimento e o equipamento ainda mandam.
    expect(resolveExerciseMedia("Remada curvada com barra pegada neutra")?.sourceId).toBe(
      resolveExerciseMedia("Remada curvada com barra")?.sourceId,
    );
  });

  it("núcleo mais específico vence o mais genérico (ordem do vocabulário)", () => {
    const lateral = resolveExerciseMedia("Elevação lateral com halteres")!.sourceId;
    const pernas = resolveExerciseMedia("Elevação de pernas suspenso")!.sourceId;
    expect(lateral.toLowerCase()).toContain("lateral");
    expect(lateral).not.toBe(pernas);
    // "remada alta" não pode cair no núcleo "remada"
    expect(resolveExerciseMedia("Remada alta com barra")!.sourceId.toLowerCase()).toContain(
      "upright",
    );
  });

  it("o dicionário curado continua tendo precedência sobre o estrutural", () => {
    // "puxada frontal" é escolha humana registrada; o estrutural não pode sobrescrevê-la.
    expect(resolveExerciseMedia("Puxada frontal")?.sourceId).toBe("Wide-Grip_Lat_Pulldown");
  });

  it("tag derivada não pode vazar de dentro de outra palavra", () => {
    // `/chin/` casava dentro de ma-CHIN-e e dava tag `supinada` a TODA variação de
    // máquina (achado [P1] do review Codex). O invariante é sobre o índice: nenhuma
    // entrada pode ser ao mesmo tempo `maquina` e `supinada` por acidente de substring.
    const vazamentos = Object.entries(EXERCISE_INDEX).flatMap(([head, variantes]) =>
      variantes
        .filter(([id, tags]) => tags.includes("supinada") && !/chin|reverse|underhand|supinat/i.test(id))
        .map(([id]) => `${head}: ${id}`),
    );
    expect(vazamentos).toEqual([]);
  });

  it("sem pista de equipamento, vence o peso livre — não a máquina", () => {
    // Empate entre variações curadas caía no id mais curto, e "supino reto supinado"
    // ia para `Machine_Bench_Press`. A versão canônica de um movimento é a de barra.
    expect(resolveExerciseMedia("Supino reto supinado")!.sourceId.toLowerCase()).toContain(
      "barbell",
    );
  });

  it("no empate vence a variação BÁSICA, não a exótica que veio primeiro na lista", () => {
    // Sem desempate por nome mais curto, "agachamento no smith" caía em
    // `Smith_Machine_Pistol_Squat` (achado [P2] do review Codex).
    const id = resolveExerciseMedia("Agachamento no smith")!.sourceId;
    expect(id.toLowerCase()).toContain("smith");
    expect(id.toLowerCase()).not.toContain("pistol");
  });

  it("nenhum núcleo contém exercício de outra musculatura", () => {
    /*
     * A guarda que fecha a classe. Três achados de review em duas rodadas foram todos a
     * MESMA falha — regex sobre o nome em inglês deixando entrar movimento errado:
     * `chin` casava dentro de ma-CHIN-e, `kickback` trazia `Glute_Kickback` para o
     * tríceps, `row` sem plural deixava `Seated_Cable_Rows` de fora. O gerador agora
     * valida contra a musculatura do catálogo; este teste trava a propriedade.
     */
    const proibidos: Record<string, RegExp> = {
      triceps: /glute|hamstring/i,
      rosca: /hamstring|leg_curl/i,
      remada: /upright/i,
      encolhimento: /squat|press/i,
    };
    const intrusos = Object.entries(proibidos).flatMap(([head, padrao]) =>
      (EXERCISE_INDEX[head] ?? []).filter(([id]) => padrao.test(id)).map(([id]) => `${head}: ${id}`),
    );
    expect(intrusos).toEqual([]);
  });

  it("remada baixa fora do dicionário não cai em outro exercício de costas", () => {
    // `\brow\b` sem plural excluía `Seated_Cable_Rows` do índice e estas frases caíam em
    // `Shotgun_Row` (achado [P1] do review Codex).
    for (const nome of ["Remada sentada no cabo pronada", "Remada baixa no cabo aberta"]) {
      expect(resolveExerciseMedia(nome)?.sourceId, nome).toBe("Seated_Cable_Rows");
    }
  });

  it("coice de tríceps não pode virar coice de glúteo", () => {
    // `kickback` cru puxava `Glute_Kickback` para o núcleo de tríceps (achado [P1]).
    for (const nome of ["Tríceps coice livre", "Tríceps coice no cabo"]) {
      const id = resolveExerciseMedia(nome)?.sourceId ?? "";
      expect(id.toLowerCase(), nome).toContain("tricep");
    }
  });

  it("`mediaId` do plano continua vencendo tudo", () => {
    expect(resolveExerciseMedia("Supino reto com barra", "Dumbbell_Flyes")?.sourceId).toBe(
      "Dumbbell_Flyes",
    );
  });
});
