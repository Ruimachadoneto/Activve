import { describe, it, expect } from "vitest";
import { resolveMovement, videoHref } from "./movement";
import type { Exercise } from "./schema";

const exercise = {
  id: "ex1",
  name: "Supino reto",
  equipment: "barbell",
  sets: 4,
  reps: "8-10",
  rest_s: 90,
  primaryMuscles: ["chest"],
  howTo: { steps: ["Deite", "Empurre"], mediaId: "barbell_bench_press" },
  alternatives: [
    { id: "supino_halteres", name: "Supino com halteres", equipment: "dumbbell", primaryMuscles: ["chest"], howTo: { steps: ["A", "B"] } },
    { id: "flexao", name: "Flexão", equipment: "bodyweight", howTo: { steps: ["C", "D"], videoUrl: "https://x/y" } },
  ],
} as unknown as Exercise;

describe("resolveMovement", () => {
  it("sem troca → o exercício original", () => {
    const m = resolveMovement(exercise, undefined);
    expect(m).toMatchObject({ name: "Supino reto", equipment: "barbell", isSwapped: false });
  });

  it("com troca válida → a variação", () => {
    const m = resolveMovement(exercise, "flexao");
    expect(m).toMatchObject({ name: "Flexão", equipment: "bodyweight", isSwapped: true });
    expect(m.howTo.steps).toEqual(["C", "D"]);
  });

  it("troca inválida → cai no original", () => {
    expect(resolveMovement(exercise, "nao_existe").isSwapped).toBe(false);
  });
});

describe("videoHref", () => {
  it("usa o videoUrl do plano quando existe", () => {
    expect(videoHref(resolveMovement(exercise, "flexao"))).toBe("https://x/y");
  });

  it("cai na busca do YouTube pelo nome quando não há mídia", () => {
    const href = videoHref(resolveMovement(exercise, undefined));
    expect(href).toContain("youtube.com/results");
    expect(href).toContain(encodeURIComponent("Supino reto"));
  });
});
