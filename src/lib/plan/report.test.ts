import { describe, it, expect } from "vitest";
import { buildReport, reportToMarkdown, type ReportPeriod } from "./report";
import type { PlanFile } from "./schema";
import type { WorkoutSession } from "./session";
import type { BodyEntry } from "./body";

const plan = {
  meta: { planId: "pl_test" },
  profile: { weight_kg: 80 },
  goal: { type: "lose_fat", targetWeight_kg: 75, targetDate: "2026-12-31" },
  training: {
    split: "AB",
    weekSchedule: ["A", "rest", "B", "rest", "A", "B", "rest"], // seg..dom
    workouts: [
      {
        id: "A",
        name: "Treino A",
        exercises: [
          {
            id: "supino",
            name: "Supino reto",
            primaryMuscles: ["chest"],
            secondaryMuscles: ["triceps"],
            alternatives: [],
          },
        ],
      },
      {
        id: "B",
        name: "Treino B",
        exercises: [
          {
            id: "puxada",
            name: "Puxada frontal",
            primaryMuscles: ["lats"],
            secondaryMuscles: ["biceps"],
            alternatives: [],
          },
        ],
      },
    ],
  },
} as unknown as PlanFile;

const period: ReportPeriod = { from: "2026-06-22", to: "2026-06-28" }; // seg..dom

function session(
  date: string,
  status: WorkoutSession["status"],
  sets: { load_kg?: number; reps?: number; rpe?: number; done?: boolean }[],
): WorkoutSession {
  return {
    sessionId: `pl_test:A:${date}`,
    planId: "pl_test",
    workoutId: "A",
    date,
    status,
    startedAt: `${date}T10:00:00Z`,
    completedAt: status === "done" ? `${date}T11:00:00Z` : undefined,
    exercises: [
      {
        exerciseId: "supino",
        sets: sets.map((s) => ({ done: true, ...s })),
      },
    ],
  };
}

describe("buildReport — adherence", () => {
  it("conta dias agendados pelo weekSchedule (seg/qua/sex..) dentro do período", () => {
    const r = buildReport(plan, [], [], period);
    // semana seg..dom: A,rest,B,rest,A,B,rest → 4 dias de treino
    expect(r.adherence.workoutsScheduled).toBe(4);
    expect(r.adherence.totalDays).toBe(7);
  });

  it("conta treinos concluídos e parciais no período, ignora fora do período", () => {
    const sessions = [
      session("2026-06-22", "done", [{ load_kg: 60, reps: 8 }]),
      session("2026-06-24", "in_progress", [{ load_kg: 62.5, reps: 8 }]),
      session("2026-07-01", "done", [{ load_kg: 999, reps: 1 }]), // fora do período
    ];
    const r = buildReport(plan, sessions, [], period);
    expect(r.adherence.workoutsCompleted).toBe(1);
    expect(r.adherence.workoutsPartial).toBe(1);
    expect(r.adherence.activeDays).toBe(2);
  });
});

describe("buildReport — training.exercises", () => {
  it("agrega só séries done, calcula melhor/última série e tendência", () => {
    const sessions = [
      session("2026-06-22", "done", [
        { load_kg: 60, reps: 8 },
        { load_kg: 60, reps: 8 },
      ]),
      session("2026-06-25", "done", [
        { load_kg: 70, reps: 6 },
        { load_kg: 70, reps: 6, done: false }, // não feita: não conta
      ]),
    ];
    const r = buildReport(plan, sessions, [], period);
    const ex = r.training.exercises.find((e) => e.exerciseId === "supino");
    expect(ex).toBeDefined();
    expect(ex!.sessions).toBe(2);
    expect(ex!.totalSets).toBe(3); // 2 + 1 (a não-done não conta)
    expect(ex!.bestSet.load_kg).toBe(70);
    expect(ex!.lastSet.load_kg).toBe(70);
    expect(ex!.trend).toBe("up"); // 60 → 70, +16.7%
    expect(ex!.series).toEqual([
      { date: "2026-06-22", avgLoad: 60 },
      { date: "2026-06-25", avgLoad: 70 },
    ]);
  });

  it("ignora sessões sem nenhuma série done", () => {
    const sessions = [session("2026-06-22", "done", [{ load_kg: 60, reps: 8, done: false }])];
    const r = buildReport(plan, sessions, [], period);
    expect(r.training.exercises).toHaveLength(0);
  });
});

describe("buildReport — volumeByMuscle", () => {
  it("primário conta peso 1, secundário peso 0.5 (mesma convenção do recovery.ts)", () => {
    const sessions = [session("2026-06-22", "done", [{ load_kg: 60, reps: 8 }])];
    const r = buildReport(plan, sessions, [], period);
    const chest = r.training.volumeByMuscle.find((m) => m.muscle === "chest");
    const triceps = r.training.volumeByMuscle.find((m) => m.muscle === "triceps");
    expect(chest?.sets).toBe(1);
    expect(triceps?.sets).toBe(0.5);
    expect(chest?.volume_kg).toBe(480); // 60*8
    expect(triceps?.volume_kg).toBe(240); // metade
  });
});

describe("buildReport — body", () => {
  const entries: BodyEntry[] = [
    { date: "2026-06-22", weight_kg: 82, measures: { waist: 90 }, recordedAt: "" },
    { date: "2026-06-27", weight_kg: 80.5, measures: { waist: 88 }, recordedAt: "" },
    { date: "2026-07-05", weight_kg: 78, recordedAt: "" }, // fora do período
  ];

  it("calcula tendência de peso e delta de medidas só dentro do período", () => {
    const r = buildReport(plan, [], entries, period);
    expect(r.body.weight.start_kg).toBe(82);
    expect(r.body.weight.latest_kg).toBe(80.5);
    expect(r.body.weight.trend).toBe("down");
    expect(r.body.weight.samples).toBe(2);
    expect(r.body.weight.series).toEqual([
      { date: "2026-06-22", weight: 82 },
      { date: "2026-06-27", weight: 80.5 },
    ]);
    const waist = r.body.measures.find((m) => m.key === "waist");
    expect(waist?.delta_cm).toBe(-2);
  });

  it("lápide (null) apagando uma medida no período vira 'sem valor', não o número antigo", () => {
    const withTombstone: BodyEntry[] = [
      { date: "2026-06-22", measures: { waist: 90 }, recordedAt: "" },
      { date: "2026-06-27", measures: { waist: null }, recordedAt: "" }, // apagada
    ];
    const r = buildReport(plan, [], withTombstone, period);
    const waist = r.body.measures.find((m) => m.key === "waist");
    expect(waist?.latest_cm).toBeUndefined();
    expect(waist?.delta_cm).toBeUndefined();
  });
});

describe("buildReport — honestidade do v1 (campos sem dado real ficam neutros)", () => {
  it("paceVsTarget sempre 'na'; diet.adherencePct sempre 0; flags sempre vazio", () => {
    const r = buildReport(plan, [], [], period);
    expect(r.goal.paceVsTarget).toBe("na");
    expect(r.diet.adherencePct).toBe(0);
    expect(r.training.flags).toEqual([]);
  });
});

describe("reportToMarkdown", () => {
  it("gera um resumo legível com as seções principais", () => {
    const sessions = [session("2026-06-22", "done", [{ load_kg: 60, reps: 8 }])];
    const r = buildReport(plan, sessions, [], period, "Ombro reclamou um pouco.");
    const md = reportToMarkdown(r);
    expect(md).toContain("Relatório Activve");
    expect(md).toContain("Supino reto");
    expect(md).toContain("Ombro reclamou um pouco.");
  });
});
