import { describe, it, expect } from "vitest";
import {
  computeRecovery,
  stimuliFromSessions,
  buildExerciseMuscles,
  hoursToReady,
  recoveryColorVar,
  RECOVERY_LABEL_PT,
  type MuscleStimulus,
  type GetMuscles,
  type ExerciseMuscles,
} from "./recovery";
import type { WorkoutSession, SetLog } from "./session";
import { MUSCLES, type PlanFile } from "./schema";

const NOW = Date.UTC(2026, 5, 29, 12, 0, 0);
const H = 3_600_000;
const hoursAgo = (h: number) => NOW - h * H;

describe("computeRecovery — estados", () => {
  it("sem estímulos: todos os músculos ficam 'descansado'", () => {
    const r = computeRecovery([], NOW);
    expect(r.chest.state).toBe("rested");
    expect(r.quads.state).toBe("rested");
    expect(r.chest.lastWorkedAt).toBeNull();
    // o vocabulário inteiro é coberto
    expect(Object.keys(r).length).toBe(MUSCLES.length);
  });

  it("estímulo recente e pesado → 'trabalhado'", () => {
    const stimuli: MuscleStimulus[] = [{ muscle: "chest", at: hoursAgo(10), load: 1 }];
    const r = computeRecovery(stimuli, NOW);
    expect(r.chest.state).toBe("worked"); // 10h / 72h = 0.14 < 0.5
    expect(r.chest.recoveryHours).toBe(72);
  });

  it("meio da janela → 'recuperando'", () => {
    const stimuli: MuscleStimulus[] = [{ muscle: "chest", at: hoursAgo(40), load: 0.5 }];
    const r = computeRecovery(stimuli, NOW);
    // recoveryHours = 48 + 24*0.5 = 60; fraction = 40/60 = 0.67 ∈ [0.5, 1)
    expect(r.chest.state).toBe("recovering");
  });

  it("passou a janela mas dentro do lookback → 'pronto'", () => {
    const stimuli: MuscleStimulus[] = [{ muscle: "chest", at: hoursAgo(60), load: 0.1 }];
    const r = computeRecovery(stimuli, NOW);
    // recoveryHours ≈ 50.4; fraction ≈ 1.19 ≥ 1
    expect(r.chest.state).toBe("ready");
  });

  it("além do lookback (10 dias) → 'descansado'", () => {
    const stimuli: MuscleStimulus[] = [{ muscle: "chest", at: hoursAgo(24 * 11), load: 1 }];
    const r = computeRecovery(stimuli, NOW);
    expect(r.chest.state).toBe("rested");
    expect(r.chest.lastWorkedAt).toBeNull();
  });
});

describe("computeRecovery — escala por volume/esforço", () => {
  it("estímulo mais pesado alarga a janela de recuperação", () => {
    const leve = computeRecovery([{ muscle: "chest", at: hoursAgo(1), load: 0.2 }], NOW);
    const pesado = computeRecovery([{ muscle: "chest", at: hoursAgo(1), load: 1 }], NOW);
    expect(pesado.chest.recoveryHours!).toBeGreaterThan(leve.chest.recoveryHours!);
    expect(leve.chest.recoveryHours).toBeCloseTo(52.8, 5); // 48 + 24*0.2
    expect(pesado.chest.recoveryHours).toBe(72);
  });

  it("soma estímulos da mesma leva (24h) e satura em 1", () => {
    const stimuli: MuscleStimulus[] = [
      { muscle: "chest", at: hoursAgo(2), load: 0.6 },
      { muscle: "chest", at: hoursAgo(3), load: 0.6 }, // mesma leva → soma = 1.2, satura em 1
    ];
    const r = computeRecovery(stimuli, NOW);
    expect(r.chest.recoveryHours).toBe(72); // boutLoad saturado em 1
  });
});

// ---- adapter sessões → estímulos ----

const set = (over: Partial<SetLog> = {}): SetLog => ({ done: true, ...over });

function session(over: Partial<WorkoutSession> & { exercises: WorkoutSession["exercises"] }): WorkoutSession {
  return {
    sessionId: "p:A:2026-06-29",
    planId: "p",
    workoutId: "A",
    date: "2026-06-29",
    status: "done",
    startedAt: new Date(hoursAgo(2)).toISOString(),
    completedAt: new Date(hoursAgo(1)).toISOString(),
    ...over,
  };
}

const muscleTable: Record<string, ExerciseMuscles> = {
  supino: { primary: ["chest"], secondary: ["triceps", "front_delts"] },
  rosca: { primary: ["biceps"] },
  supino_incl: { primary: ["chest"], secondary: ["front_delts"] },
};
const muscleMap: GetMuscles = (id) => muscleTable[id];

describe("stimuliFromSessions", () => {
  it("primário fadiga mais que secundário (mesma sessão)", () => {
    const s = session({
      exercises: [
        { exerciseId: "supino", sets: [set({ rpe: 10 }), set({ rpe: 10 }), set({ rpe: 10 }), set({ rpe: 10 })] },
      ],
    });
    const r = computeRecovery(stimuliFromSessions([s], muscleMap, NOW), NOW);
    // intensity = effort(10)=1 * volume(4)=1 = 1 → chest load 1, triceps load 0.5
    expect(r.chest.recoveryHours).toBe(72);
    expect(r.triceps.recoveryHours).toBe(60); // 48 + 24*0.5
    expect(r.chest.fraction).toBeLessThan(r.triceps.fraction); // peito "mais trabalhado"
  });

  it("sessão em andamento (in_progress) não gera estímulo, mesmo com séries feitas", () => {
    const s = session({
      status: "in_progress",
      completedAt: undefined,
      exercises: [{ exerciseId: "supino", sets: [set(), set(), set(), set()] }],
    });
    expect(stimuliFromSessions([s], muscleMap, NOW)).toHaveLength(0);
  });

  it("ignora séries não feitas; exercício sem série feita não gera estímulo", () => {
    const s = session({
      exercises: [
        { exerciseId: "rosca", sets: [set({ done: false }), set({ done: false })] },
      ],
    });
    expect(stimuliFromSessions([s], muscleMap, NOW)).toHaveLength(0);
  });

  it("usa a variação executada (swappedToId) para resolver os músculos", () => {
    const s = session({
      exercises: [{ exerciseId: "rosca", swappedToId: "supino_incl", sets: [set(), set()] }],
    });
    const stimuli = stimuliFromSessions([s], muscleMap, NOW);
    const muscles = stimuli.map((x) => x.muscle).sort();
    expect(muscles).toEqual(["chest", "front_delts"]); // do supino_incl, não da rosca
  });

  it("exercício fora do plano (lookup undefined) é ignorado sem quebrar", () => {
    const s = session({ exercises: [{ exerciseId: "desconhecido", sets: [set()] }] });
    expect(stimuliFromSessions([s], muscleMap, NOW)).toHaveLength(0);
  });

  it("descarta sessões além do lookback", () => {
    const old = session({
      date: "2026-06-01",
      completedAt: new Date(hoursAgo(24 * 20)).toISOString(),
      exercises: [{ exerciseId: "supino", sets: [set()] }],
    });
    expect(stimuliFromSessions([old], muscleMap, NOW)).toHaveLength(0);
  });
});

describe("buildExerciseMuscles", () => {
  const plan = {
    training: {
      workouts: [
        {
          exercises: [
            {
              id: "supino",
              primaryMuscles: ["chest"],
              secondaryMuscles: ["triceps", "front_delts"],
              alternatives: [
                { id: "supino_halter", primaryMuscles: ["chest"] }, // tem primário próprio
                { id: "crucifixo" }, // sem primário próprio
              ],
            },
          ],
        },
      ],
    },
  } as unknown as PlanFile;
  const getMuscles = buildExerciseMuscles(plan);

  it("exercício base mantém primários e secundários", () => {
    expect(getMuscles("supino")).toEqual({
      primary: ["chest"],
      secondary: ["triceps", "front_delts"],
    });
  });

  it("variação com primário próprio HERDA os secundários do pai (não os perde)", () => {
    expect(getMuscles("supino_halter")).toEqual({
      primary: ["chest"],
      secondary: ["triceps", "front_delts"],
    });
  });

  it("variação sem primário próprio herda primário e secundário do pai", () => {
    expect(getMuscles("crucifixo")).toEqual({
      primary: ["chest"],
      secondary: ["triceps", "front_delts"],
    });
  });

  it("exercício fora do plano → undefined", () => {
    expect(getMuscles("inexistente")).toBeUndefined();
  });
});

describe("hoursToReady", () => {
  it("retorna as horas restantes quando ainda em recuperação", () => {
    expect(hoursToReady({ hoursSince: 20, recoveryHours: 72 })).toBe(52);
  });
  it("null quando já recuperado (≤0)", () => {
    expect(hoursToReady({ hoursSince: 80, recoveryHours: 72 })).toBeNull();
  });
  it("null quando descansado (sem timestamps)", () => {
    expect(hoursToReady({ hoursSince: null, recoveryHours: null })).toBeNull();
  });
});

describe("apresentação", () => {
  it("cada estado mapeia para um token de cor distinto", () => {
    const vars = (["worked", "recovering", "ready", "rested"] as const).map(recoveryColorVar);
    expect(new Set(vars).size).toBe(4);
    expect(vars.every((v) => v.startsWith("--color-"))).toBe(true);
  });

  it("rótulos PT-BR anti-culpa", () => {
    expect(RECOVERY_LABEL_PT.rested).toBe("Descansado");
    expect(RECOVERY_LABEL_PT.worked).toBe("Trabalhado");
  });
});
