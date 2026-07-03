import { describe, it, expect } from "vitest";
import { normalizeExerciseName, resolveExerciseMedia } from "./exerciseMedia";
import planoExemplo from "../../../examples/plano-exemplo.json";

describe("normalizeExerciseName", () => {
  it("remove acentos, caixa e pontuação", () => {
    expect(normalizeExerciseName("Elevação Lateral")).toBe("elevacao lateral");
    expect(normalizeExerciseName("  Tríceps — Pulley!  ")).toBe("triceps pulley");
    expect(normalizeExerciseName("Leg Press 45°")).toBe("leg press 45");
  });
});

describe("resolveExerciseMedia", () => {
  it("resolve exercícios comuns PT-BR para o free-exercise-db", () => {
    const m = resolveExerciseMedia("Puxada frontal");
    expect(m?.sourceId).toBe("Wide-Grip_Lat_Pulldown");
    expect(m?.imageUrls[0]).toBe(
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
    );
    expect(m?.imageUrls[1]).toMatch(/Wide-Grip_Lat_Pulldown\/1\.jpg$/);
  });

  it("é insensível a acento e caixa", () => {
    expect(resolveExerciseMedia("ELEVAÇÃO PÉLVICA")?.sourceId).toBe("Barbell_Hip_Thrust");
    expect(resolveExerciseMedia("agachamento")?.sourceId).toBe("Barbell_Squat");
    expect(resolveExerciseMedia("Rosca Direta")?.sourceId).toBe("Barbell_Curl");
  });

  it("cobre os exercícios do plano de exemplo", () => {
    for (const name of ["Supino reto", "Desenvolvimento", "Puxada frontal", "Agachamento", "Remada curvada", "Rosca direta"]) {
      expect(resolveExerciseMedia(name), name).not.toBeNull();
    }
  });

  it("desconhecido → null (nunca chutar foto de outro movimento)", () => {
    expect(resolveExerciseMedia("Exercício Maluco do Coach")).toBeNull();
    expect(resolveExerciseMedia("")).toBeNull();
  });

  it("TODOS os nomes do plano de exemplo embarcado resolvem (regressão de conteúdo nosso)", () => {
    // Lê o JSON real: se alguém adicionar exercício novo ao exemplo sem alias no
    // dicionário, este teste quebra — em vez de a foto sumir silenciosamente no app.
    const names = planoExemplo.training.workouts.flatMap((w) => [
      ...w.exercises.map((e) => e.name),
      ...w.exercises.flatMap((e) => (e.alternatives ?? []).map((a) => a.name)),
    ]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(resolveExerciseMedia(name), `sem foto para "${name}"`).not.toBeNull();
    }
  });
});
