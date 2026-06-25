import { describe, it, expect } from "vitest";
import { parsePlan } from "./parse";

function validPlan() {
  return {
    schemaVersion: "1.0",
    meta: { planId: "pl_test", generatedAt: "2026-06-22T18:00:00Z", generator: "test@1.0", locale: "pt-BR" },
    profile: {
      name: "Ana",
      sex: "female",
      age: 30,
      height_cm: 165,
      weight_kg: 72,
      environment: "gym",
      daysPerWeek: 3,
      experience: "beginner",
    },
    goal: { type: "lose_fat", summary: "Perder gordura" },
    training: {
      split: "ABC",
      weekSchedule: ["A", "rest", "B", "rest", "C", "rest", "rest"],
      workouts: [
        {
          id: "A",
          name: "Treino A",
          exercises: [
            {
              id: "goblet_squat",
              name: "Agachamento goblet",
              sets: 3,
              reps: "10-12",
              rest_s: 90,
              primaryMuscles: ["quads", "glutes"],
              howTo: { steps: ["Desça controlando.", "Suba sem travar o joelho."] },
              alternatives: [
                { id: "leg_press", name: "Leg press", howTo: { steps: ["Empurre a plataforma."] } },
                { id: "bw_squat", name: "Agachamento livre", howTo: { steps: ["Desça e suba."] } },
              ],
            },
          ],
        },
        { id: "B", name: "Treino B", exercises: [] },
        { id: "C", name: "Treino C", exercises: [] },
      ],
    },
    diet: { dailyKcal: 1700, meals: [{ id: "breakfast", name: "Café", items: [{ food: "Ovos" }] }] },
  };
}

describe("parsePlan", () => {
  it("aceita um plano válido", () => {
    const result = parsePlan(JSON.stringify(validPlan()));
    expect(result.ok).toBe(true);
  });

  it("rejeita JSON inválido", () => {
    const result = parsePlan("isto não é json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].field).toBe("arquivo");
  });

  it("rejeita versão de schema incompatível", () => {
    const plan = { ...validPlan(), schemaVersion: "2.0" };
    const result = parsePlan(JSON.stringify(plan));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].field).toBe("schemaVersion");
  });

  it("exige pelo menos 2 variações por exercício", () => {
    const plan = validPlan();
    plan.training.workouts[0].exercises[0].alternatives = [
      { id: "leg_press", name: "Leg press", howTo: { steps: ["Empurre."] } },
    ];
    const result = parsePlan(JSON.stringify(plan));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("2 variações"))).toBe(true);
    }
  });

  it("rejeita idade fora da faixa", () => {
    const plan = validPlan();
    plan.profile.age = 5;
    const result = parsePlan(JSON.stringify(plan));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.field.includes("age"))).toBe(true);
  });

  it("rejeita weekSchedule apontando para treino inexistente", () => {
    const plan = validPlan();
    plan.training.weekSchedule = ["A", "rest", "X", "rest", "C", "rest", "rest"];
    const result = parsePlan(JSON.stringify(plan));
    expect(result.ok).toBe(false);
  });

  it("rejeita exercise.id duplicado no arquivo (continuidade de histórico)", () => {
    const plan = validPlan();
    const dup = JSON.parse(JSON.stringify(plan.training.workouts[0].exercises[0]));
    plan.training.workouts[1].exercises = [dup];
    const result = parsePlan(JSON.stringify(plan));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("duplicado"))).toBe(true);
    }
  });
});
