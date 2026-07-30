import { describe, it, expect } from "vitest";
import { resolveExerciseMedia } from "./exerciseMedia";

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

  it("`mediaId` do plano continua vencendo tudo", () => {
    expect(resolveExerciseMedia("Supino reto com barra", "Dumbbell_Flyes")?.sourceId).toBe(
      "Dumbbell_Flyes",
    );
  });
});
