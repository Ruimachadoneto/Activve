import { describe, it, expect } from "vitest";
import {
  buildReport,
  constancyView,
  reportToMarkdown,
  type KnownPlan,
  type ReportFile,
  type ReportPeriod,
} from "./report";
import { rotationOf } from "./rotation";
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
  it("reporta a meta SEMANAL do plano e a extensão do período, sem projetar um total", () => {
    /*
     * TASK-029: `workoutsScheduled` (dias marcados no weekSchedule dentro do período)
     * saiu no schema 1.1. Ele media o usuário contra um calendário que o app parou de
     * seguir quando a agenda virou rotação, e a alternativa — meta × semanas — seria uma
     * projeção com fração num mês. A §9 pede denominador verificável: a meta semanal
     * está escrita no plano, o resto conta o que aconteceu.
     */
    const r = buildReport(plan, knownPlans, [], [], period);
    expect(r.adherence.weeklyTarget).toBe(4); // A,rest,B,rest,A,B,rest
    expect(r.adherence.periodWeeks).toBe(1);
    expect(r.adherence.totalDays).toBe(7);
    expect(r.schemaVersion).toBe("1.1");
  });

  describe("constancyView — não extrapola a partir de período curto", () => {
    const adherence = (over: Partial<ReportFile["adherence"]>): ReportFile["adherence"] => ({
      weeklyTarget: 4,
      periodWeeks: 1,
      workoutsCompleted: 0,
      workoutsPartial: 0,
      mealsCheckedPct: 0,
      activeDays: 0,
      totalDays: 7,
      ...over,
    });

    it("até uma semana compara TREINOS com a meta, sem dividir por fração de semana", () => {
      /*
       * 4 treinos em 6 dias viravam "4,7 por semana" e 1 treino na segunda virava
       * "7,0 por semana" — extrapolação de um ponto só. Pego na verificação do browser,
       * não por teste: o período "Esta semana" termina HOJE, então quase sempre é
       * parcial.
       */
      const v = constancyView(adherence({ periodWeeks: 6 / 7, totalDays: 6, workoutsCompleted: 4 }));
      expect(v.extent).toBe("6 dias");
      expect(v.comparison).toBe("meta da semana: 4 treinos");
      expect(v.fillPct).toBe(100); // 4 de 4, não 117%
      expect(v.ariaLabel).toContain("4 de 4 treinos previstos");
    });

    it("um treino num único dia não vira '7 por semana'", () => {
      const v = constancyView(adherence({ periodWeeks: 1 / 7, totalDays: 1, workoutsCompleted: 1 }));
      expect(v.extent).toBe("1 dia");
      expect(v.comparison).toBe("meta da semana: 4 treinos");
      expect(v.fillPct).toBe(25);
    });

    it("acima de uma semana o ritmo volta a ter base", () => {
      const v = constancyView(
        adherence({ periodWeeks: 31 / 7, totalDays: 31, workoutsCompleted: 11 }),
      );
      expect(v.extent).toBe("4,4 semanas");
      expect(v.comparison).toBe("2,5 por semana — o plano prevê 4");
      expect(Math.round(v.fillPct)).toBe(62);
    });

    it("meta zerada não vira divisão por zero", () => {
      expect(constancyView(adherence({ weeklyTarget: 0 })).fillPct).toBe(0);
    });
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

  it("uma medição só não vira delta 0 — sem duas pontas não há variação", () => {
    const umaSo: BodyEntry[] = [{ date: "2026-06-22", measures: { waist: 90 }, recordedAt: "" }];
    const r = buildReport(plan, knownPlans, [], umaSo, period);
    const waist = r.body.measures.find((m) => m.key === "waist");
    expect(waist?.latest_cm).toBe(90);
    // "0 cm" afirmaria que mediu duas vezes e não mudou nada (§9: nada de número
    // fabricado). O relatório simplesmente não mostra a linha.
    expect(waist?.delta_cm).toBeUndefined();
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
    // A meta semanal vem do plano ATIVO (o ciclo vigente), como `refersToPlanId`.
    expect(r.adherence.weeklyTarget).toBe(rotationOf(planB).weeklyTarget);
    // Nome resolvido pelo plano da SESSÃO (pl_test) — planB nem tem "supino" no catálogo.
    const ex = r.training.exercises.find((e) => e.exerciseId === "supino");
    expect(ex?.name).toBe("Supino reto");
    // refersToPlanId continua sendo o ciclo ATIVO — o relatório é gerado "hoje".
    expect(r.meta.refersToPlanId).toBe("pl_test2");
  });

  /*
   * Os dois testes que viviam aqui — "não inventa agenda pra dias ANTES do primeiro
   * plano" e "não conta agenda de plano histórico com weekSchedule ilegível" — foram
   * removidos com o `workoutsScheduled` na TASK-029. Os dois protegiam a MESMA coisa:
   * que o app não afirmasse "você tinha treino nesse dia" sem base. Sem denominador de
   * período, a afirmação não é mais feita em lugar nenhum, então o risco não existe
   * (não é cobertura perdida — é a pergunta que deixou de ser feita). O que restou do
   * histórico cross-plano é a resolução por `planId` da sessão, coberta logo acima.
   */

  // TASK-013: planos históricos entram no relatório após só uma guarda estrutural.
  it("plano histórico com weekSchedule ilegível não derruba o relatório", () => {
    const semAgenda = JSON.parse(JSON.stringify(plan));
    delete semAgenda.training.weekSchedule;
    const knownSemAgenda: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: semAgenda },
    ];
    const r = buildReport(semAgenda, knownSemAgenda, [], [], period);
    // Sem agenda legível, `rotationOf` cai em `profile.daysPerWeek` — o relatório
    // continua saindo, com uma meta declarada em vez de um número inventado.
    expect(r.adherence.weeklyTarget).toBeGreaterThan(0);
    expect(r.adherence.workoutsCompleted).toBe(0);
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

  it("exercício histórico sem `name` cai num id legível, nunca em rótulo vazio", () => {
    // Achado do review Codex: `{ id: "supino" }` sem name virava rótulo em branco na
    // UI e furava o contrato `name: string` do ReportFile.
    const semNome = JSON.parse(JSON.stringify(plan));
    delete semNome.training.workouts[0].exercises[0].name;
    const known: KnownPlan[] = [
      { planId: "pl_test", importedAt: "2026-06-01T00:00:00.000Z", plan: semNome },
    ];
    const sessions: WorkoutSession[] = [
      {
        sessionId: "s_sem_nome",
        planId: "pl_test",
        workoutId: "A",
        date: "2026-06-22",
        status: "done",
        startedAt: "2026-06-22T10:00:00Z",
        completedAt: "2026-06-22T11:00:00Z",
        exercises: [{ exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 8 }] }],
      },
    ];
    const r = buildReport(semNome, known, sessions, [], period);
    const nome = r.training.exercises[0].name;
    expect(typeof nome).toBe("string");
    expect(nome.trim()).not.toBe("");
    expect(nome).toBe("supino"); // cai no exerciseId
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
