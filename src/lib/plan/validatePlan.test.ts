import { describe, it, expect } from "vitest";
import planoExemplo from "../../../examples/plano-exemplo.json";
import { hasReadableTraining, parsePlan, validatePlan } from "./parse";

/**
 * TASK-013 — validação na LEITURA do plano gravado (não só no import).
 * Os casos quebrados aqui são exatamente os da auditoria que derrubavam Hoje/Treino
 * com runtime error: sem `training`, sem `diet.meals`, sem `howTo`, weekSchedule curto.
 */

function validPlan(): Record<string, unknown> {
  return {
    schemaVersion: "1.0",
    meta: { planId: "pl_test", generatedAt: "2026-07-28T10:00:00Z", generator: "test@1.0", locale: "pt-BR" },
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
      weekSchedule: ["A", "rest", "rest", "rest", "rest", "rest", "rest"],
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
      ],
    },
    diet: { dailyKcal: 1700, meals: [{ id: "breakfast", name: "Café", items: [{ food: "Ovos" }] }] },
  };
}

/** Remove uma chave aninhada ("training.weekSchedule") de uma cópia do plano. */
function without(path: string): Record<string, unknown> {
  const plan = validPlan();
  const parts = path.split(".");
  let node = plan as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) node = node[part] as Record<string, unknown>;
  delete node[parts[parts.length - 1]];
  return plan;
}

describe("validatePlan (leitura do plano gravado)", () => {
  it("aceita um objeto já desserializado válido", () => {
    const result = validatePlan(validPlan());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.meta.planId).toBe("pl_test");
  });

  it("aceita o plano de exemplo embarcado", () => {
    expect(validatePlan(planoExemplo).ok).toBe(true);
  });

  it("rejeita plano sem training (crashava o Hoje em weekSchedule.filter)", () => {
    const result = validatePlan(without("training"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.field.startsWith("training"))).toBe(true);
  });

  it("rejeita plano sem diet.meals (crashava o Hoje em diet.meals.length)", () => {
    const result = validatePlan(without("diet.meals"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.field.includes("meals"))).toBe(true);
  });

  it("rejeita exercício sem howTo (crashava a lista de exercícios em howTo.mediaId)", () => {
    const result = validatePlan(without("training.workouts.0.exercises.0.howTo"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.field.includes("howTo"))).toBe(true);
  });

  it("rejeita weekSchedule com tamanho diferente de 7", () => {
    const plan = validPlan();
    (plan.training as { weekSchedule: string[] }).weekSchedule = ["A", "rest"];
    const result = validatePlan(plan);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.field.includes("weekSchedule"))).toBe(true);
  });

  it("rejeita valores não-objeto (registro apagado/corrompido no IndexedDB)", () => {
    for (const value of [undefined, null, "", 42, []]) {
      expect(validatePlan(value).ok).toBe(false);
    }
  });

  it("rejeita major de schemaVersion incompatível com mensagem orientativa", () => {
    const plan = validPlan();
    plan.schemaVersion = "2.0";
    const result = validatePlan(plan);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe("schemaVersion");
      expect(result.errors[0].message).toContain("1.x");
    }
  });

  it("sempre devolve erros com campo e mensagem preenchidos (a UI exibe os dois)", () => {
    const result = validatePlan(without("training"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      for (const e of result.errors) {
        expect(e.field.length).toBeGreaterThan(0);
        expect(e.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("concorda com parsePlan: mesmo plano, mesmo veredito (fonte única de validação)", () => {
    const cases = [validPlan(), without("training"), without("diet.meals")];
    for (const plan of cases) {
      expect(validatePlan(plan).ok).toBe(parsePlan(JSON.stringify(plan)).ok);
    }
  });
});

describe("hasReadableTraining (planos históricos)", () => {
  it("aceita um plano válido", () => {
    expect(hasReadableTraining(validPlan())).toBe(true);
  });

  it("aceita plano com defeito em campo que o histórico não lê", () => {
    // Caso REAL encontrado na verificação: weekSchedule aponta pro treino "B", que não
    // existe. `validatePlan` reprova (e deve reprovar como plano ATIVO), mas os nomes de
    // exercício continuam perfeitamente legíveis — o histórico não pode perdê-los.
    const plan = validPlan();
    (plan.training as { weekSchedule: string[] }).weekSchedule = [
      "A", "rest", "B", "rest", "A", "B", "rest",
    ];
    expect(validatePlan(plan).ok).toBe(false);
    expect(hasReadableTraining(plan)).toBe(true);
  });

  it("aceita plano de schemaVersion futura (nomes ainda são legíveis)", () => {
    const plan = validPlan();
    plan.schemaVersion = "2.0";
    expect(hasReadableTraining(plan)).toBe(true);
  });

  it("aceita plano sem weekSchedule (nome não depende da agenda)", () => {
    // Achado do review Codex, ciclo 3: exigir weekSchedule descartava plano antigo
    // ainda perfeitamente legível pro único uso da guarda — resolver nomes.
    expect(hasReadableTraining(without("training.weekSchedule"))).toBe(true);
  });

  it("recusa o que não dá pra percorrer sem estourar", () => {
    expect(hasReadableTraining(without("training"))).toBe(false);
    expect(hasReadableTraining(without("training.workouts"))).toBe(false);
    for (const value of [undefined, null, "", 42, [], { training: "nao-e-objeto" }]) {
      expect(hasReadableTraining(value)).toBe(false);
    }
  });

  it("recusa workouts cujos itens não são percorríveis (achado [P2] do review Codex)", () => {
    // `workouts` ser array não basta: report.ts:108 e o movementName da tela de
    // relatórios fazem `w.exercises.find(...)`, que estoura nestes casos.
    const comWorkouts = (workouts: unknown[]) => {
      const plan = validPlan();
      (plan.training as { workouts: unknown[] }).workouts = workouts;
      return plan;
    };
    expect(hasReadableTraining(comWorkouts([{ id: "A" }]))).toBe(false); // sem exercises
    expect(hasReadableTraining(comWorkouts(["A"]))).toBe(false); // item não é objeto
    expect(hasReadableTraining(comWorkouts([null]))).toBe(false);
    expect(hasReadableTraining(comWorkouts([{ id: "A", exercises: "nao-e-array" }]))).toBe(false);
    expect(hasReadableTraining(comWorkouts([{ id: "A", exercises: [null] }]))).toBe(false);
    // treino sem exercícios (array vazio) é legítimo — o plano de exemplo tem
    expect(hasReadableTraining(comWorkouts([{ id: "A", exercises: [] }]))).toBe(true);
  });
});
