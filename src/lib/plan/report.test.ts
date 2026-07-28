import { describe, it, expect } from "vitest";
import { buildReport, reportToMarkdown, type KnownPlan, type ReportPeriod } from "./report";
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
            alternatives: [{ id: "supino_halteres", name: "Supino com halteres", primaryMuscles: ["chest"] }],
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

// Ciclo iniciado bem antes do período de teste — não recorta nada nos testes abaixo.
const knownPlans: KnownPlan[] = [{ planId: "pl_test", importedAt: "2026-01-01T00:00:00.000Z", plan }];

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
    const r = buildReport(plan, knownPlans, [], [], period);
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
    const r = buildReport(plan, knownPlans, sessions, [], period);
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
    const r = buildReport(plan, knownPlans, sessions, [], period);
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
    const r = buildReport(plan, knownPlans, sessions, [], period);
    expect(r.training.exercises).toHaveLength(0);
  });

  it("não mistura a carga de uma variação trocada com o exercício original", () => {
    const sessions: WorkoutSession[] = [
      {
        sessionId: "pl_test:A:2026-06-22",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22",
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [{ exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 8 }] }],
      },
      {
        sessionId: "pl_test:A:2026-06-25",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-25",
        status: "done",
        startedAt: "2026-06-25T10:00:00Z",
        completedAt: "2026-06-25T11:00:00Z",
        exercises: [
          {
            exerciseId: "supino",
            swappedToId: "supino_halteres",
            sets: [{ done: true, load_kg: 20, reps: 10 }], // halteres: carga bem menor, movimento diferente
          },
        ],
      },
    ];
    const r = buildReport(plan, knownPlans, sessions, [], period);
    expect(r.training.exercises).toHaveLength(2); // dois movimentos distintos, não um só
    const supino = r.training.exercises.find((e) => e.name === "Supino reto");
    const halteres = r.training.exercises.find((e) => e.name === "Supino com halteres");
    expect(supino?.bestSet.load_kg).toBe(60);
    expect(supino?.series).toEqual([{ date: "2026-06-22", avgLoad: 60 }]);
    expect(halteres?.bestSet.load_kg).toBe(20);
    expect(halteres?.series).toEqual([{ date: "2026-06-25", avgLoad: 20 }]);
  });
});

describe("buildReport — volumeByMuscle", () => {
  it("primário conta peso 1, secundário peso 0.5 (mesma convenção do recovery.ts)", () => {
    const sessions = [session("2026-06-22", "done", [{ load_kg: 60, reps: 8 }])];
    const r = buildReport(plan, knownPlans, sessions, [], period);
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
    const r = buildReport(plan, knownPlans, [], entries, period);
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
    const r = buildReport(plan, knownPlans, [], withTombstone, period);
    const waist = r.body.measures.find((m) => m.key === "waist");
    expect(waist?.latest_cm).toBeUndefined();
    expect(waist?.delta_cm).toBeUndefined();
  });
});

describe("buildReport — histórico entre planos (troca de ciclo no meio do período)", () => {
  const planB = {
    meta: { planId: "pl_test2" },
    profile: { weight_kg: 80 },
    goal: { type: "lose_fat", targetWeight_kg: 75, targetDate: "2026-12-31" },
    training: { split: "Full body", weekSchedule: ["rest", "rest", "rest", "rest", "rest", "rest", "rest"], workouts: [] },
  } as unknown as PlanFile;

  // Ciclo antigo (pl_test) vale até 24/06; a partir de 25/06 (quinta) o novo ciclo
  // (pl_test2, tudo "rest") entra em vigor.
  const knownPlansCrossCycle: KnownPlan[] = [
    { planId: "pl_test", importedAt: "2026-01-01T00:00:00.000Z", plan },
    { planId: "pl_test2", importedAt: "2026-06-25T00:00:00.000Z", plan: planB },
  ];

  it("resolve agenda e nome de exercício pelo plano de CADA data/sessão, não só o ativo", () => {
    const sessions: WorkoutSession[] = [
      {
        sessionId: "pl_test:A:2026-06-22",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22", // segunda, ainda sob o ciclo antigo
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [{ exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 8 }] }],
      },
    ];
    // activePlan = planB (o ciclo VIGENTE hoje), mas o período tem histórico do ciclo anterior.
    const r = buildReport(planB, knownPlansCrossCycle, sessions, [], period);
    // seg(A, ciclo antigo)=treino · ter=rest · qua(B, ciclo antigo)=treino · qui..dom sob
    // o ciclo novo (tudo rest) = 2 dias agendados, não 4 (só o antigo) nem 0 (só o novo).
    expect(r.adherence.workoutsScheduled).toBe(2);
    // Nome resolvido pelo plano da SESSÃO (pl_test) — planB nem tem "supino" no catálogo.
    const ex = r.training.exercises.find((e) => e.exerciseId === "supino");
    expect(ex?.name).toBe("Supino reto");
    // refersToPlanId continua sendo o ciclo ATIVO — o relatório é gerado "hoje".
    expect(r.meta.refersToPlanId).toBe("pl_test2");
  });

  it("não inventa agenda pra dias ANTES do primeiro plano importado", () => {
    // Só um plano conhecido, importado no MEIO do período (25/06, quinta) — dias
    // 22–24/06 (seg/ter/qua) são de ANTES de qualquer plano existir.
    const knownPlansLateStart: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-25T00:00:00.000Z", plan },
    ];
    const r = buildReport(plan, knownPlansLateStart, [], [], period);
    // weekSchedule seg..dom = A,rest,B,rest,A,B,rest. Sem o fix, os dias 22(seg=A) e
    // 24(qua=B) — ANTES do plano existir — cairiam no fallback (o único plano
    // conhecido) e contariam como agendados, dando 4 (22+24+26+27). Com o fix, só
    // 25/06 em diante conta: sex(26)=A e sáb(27)=B → 2 agendados.
    expect(r.adherence.workoutsScheduled).toBe(2);
  });

  // TASK-013: planos históricos entram no relatório após só uma guarda estrutural.
  it("não conta agenda de plano histórico com weekSchedule ilegível", () => {
    const semAgenda = JSON.parse(JSON.stringify(plan));
    delete semAgenda.training.weekSchedule;
    const knownSemAgenda: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: semAgenda },
    ];
    // Não dá pra afirmar que o dia era de treino sem agenda legível — e inventar
    // "agendado" faria a constância parecer PIOR do que foi (anti-culpa).
    const r = buildReport(semAgenda, knownSemAgenda, [], [], period);
    expect(r.adherence.workoutsScheduled).toBe(0);
  });

  it("um treino corrompido não cega os outros treinos do mesmo ciclo", () => {
    // Achado do review Codex: descartar o plano inteiro por um subtree ruim fazia o
    // ciclo perder TODOS os nomes. Agora o treino ruim é pulado e o resto resolve.
    const parcial = JSON.parse(JSON.stringify(plan));
    parcial.training.workouts.unshift({ id: "X", name: "Treino corrompido" }); // sem exercises
    parcial.training.workouts.push(null);
    const known: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: parcial },
    ];
    const sessions: WorkoutSession[] = [
      {
        sessionId: "s_parcial",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22",
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [{ exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 8 }] }],
      },
    ];
    expect(() => buildReport(parcial, known, sessions, [], period)).not.toThrow();
    const r = buildReport(parcial, known, sessions, [], period);
    // o nome vem do treino BOM, apesar do corrompido estar antes dele na lista
    expect(r.training.exercises[0].name).toBe("Supino reto");
    expect(r.training.volumeByMuscle.map((v) => v.muscle)).toContain("chest");
  });

  it("resolve nome de sessão com swap quando `alternatives` está corrompido", () => {
    // Achado do review Codex: `alternatives` não-array não tem `.find` — a tela de
    // relatórios estourava ao abrir/exportar uma sessão com variação trocada.
    const altTorta = JSON.parse(JSON.stringify(plan));
    altTorta.training.workouts[0].exercises[0].alternatives = "nao-e-array";
    // (o caso `alternatives: [null]` está coberto logo abaixo)
    const known: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: altTorta },
    ];
    const sessions: WorkoutSession[] = [
      {
        sessionId: "s_swap",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22",
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [
          {
            exerciseId: "supino",
            swappedToId: "supino_halteres",
            sets: [{ done: true, load_kg: 30, reps: 10 }],
          },
        ],
      },
    ];
    expect(() => buildReport(altTorta, known, sessions, [], period)).not.toThrow();
    const r = buildReport(altTorta, known, sessions, [], period);
    // sem catálogo de variações legível, cai no nome do exercício base
    expect(r.training.exercises[0].name).toBe("Supino reto");
  });

  it("resolve swap com elemento nulo dentro de `alternatives`", () => {
    // Achado do review Codex: `Array.isArray` não basta — `[null]` estourava em `a.id`.
    const comNull = JSON.parse(JSON.stringify(plan));
    comNull.training.workouts[0].exercises[0].alternatives = [
      null,
      { id: "supino_halteres", name: "Supino com halteres", primaryMuscles: ["chest"] },
    ];
    const known: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: comNull },
    ];
    const sessions: WorkoutSession[] = [
      {
        sessionId: "s_null_alt",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22",
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [
          {
            exerciseId: "supino",
            swappedToId: "supino_halteres",
            sets: [{ done: true, load_kg: 30, reps: 10 }],
          },
        ],
      },
    ];
    expect(() => buildReport(comNull, known, sessions, [], period)).not.toThrow();
    const r = buildReport(comNull, known, sessions, [], period);
    // a variação VÁLIDA ao lado do null continua resolvendo o nome
    expect(r.training.exercises[0].name).toBe("Supino com halteres");
  });

  it("gera relatório de plano histórico sem primaryMuscles em vez de estourar", () => {
    const semMusculos = JSON.parse(JSON.stringify(plan));
    for (const w of semMusculos.training.workouts) {
      for (const ex of w.exercises) delete ex.primaryMuscles;
    }
    const knownSemMusculos: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: semMusculos },
    ];
    const sessions: WorkoutSession[] = [
      {
        sessionId: "s_musc",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22",
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [{ exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 8 }] }],
      },
    ];
    expect(() => buildReport(semMusculos, knownSemMusculos, sessions, [], period)).not.toThrow();
    const r = buildReport(semMusculos, knownSemMusculos, sessions, [], period);
    // O primário some do cômputo (não é inventado), mas o que o plano AINDA declara
    // continua valendo: "supino" mantém `secondaryMuscles: ["triceps"]`.
    expect(r.training.volumeByMuscle.map((v) => v.muscle)).toEqual(["triceps"]);
    expect(r.training.volumeByMuscle.some((v) => v.muscle === "chest")).toBe(false);
    expect(r.adherence.workoutsCompleted).toBe(1);
  });
});

describe("buildReport — honestidade do v1 (campos sem dado real ficam neutros)", () => {
  it("paceVsTarget sempre 'na'; diet.adherencePct sempre 0; flags sempre vazio", () => {
    const r = buildReport(plan, knownPlans, [], [], period);
    expect(r.goal.paceVsTarget).toBe("na");
    expect(r.diet.adherencePct).toBe(0);
    expect(r.training.flags).toEqual([]);
  });
});

describe("reportToMarkdown", () => {
  it("gera um resumo legível com as seções principais", () => {
    const sessions = [session("2026-06-22", "done", [{ load_kg: 60, reps: 8 }])];
    const r = buildReport(plan, knownPlans, sessions, [], period, "Ombro reclamou um pouco.");
    const md = reportToMarkdown(r);
    expect(md).toContain("Relatório Activve");
    expect(md).toContain("Supino reto");
    expect(md).toContain("Ombro reclamou um pouco.");
  });
});
