import { describe, it, expect } from "vitest";
import { buildConstancy, buildSessionSummary, formatDuration, sessionVolume } from "./summary";
import type { WorkoutSession } from "./session";

type SetSpec = { done: boolean; load_kg?: number; reps?: number };

function session(
  id: string,
  exercises: { exerciseId: string; swappedToId?: string; sets: SetSpec[] }[],
  extra: Partial<WorkoutSession> = {},
): WorkoutSession {
  return {
    sessionId: id,
    planId: "p1",
    workoutId: "A",
    date: "2026-07-30",
    status: "done",
    startedAt: "2026-07-30T19:00:00.000Z",
    completedAt: "2026-07-30T20:05:00.000Z",
    exercises,
    ...extra,
  };
}

describe("buildSessionSummary — volume", () => {
  it("soma carga × reps só das séries feitas", () => {
    const s = session("s1", [
      {
        exerciseId: "supino",
        sets: [
          { done: true, load_kg: 60, reps: 8 }, // 480
          { done: true, load_kg: 60, reps: 6 }, // 360
          { done: false, load_kg: 60, reps: 8 }, // não conta
        ],
      },
    ]);
    const sum = buildSessionSummary(s, []);
    expect(sum.volumeKg).toBe(840);
    expect(sum.volumeSets).toBe(2);
    expect(sum.doneSets).toBe(2);
    expect(sum.totalSets).toBe(3);
  });

  it("série feita sem carga OU sem reps fica fora do volume, e isso é visível", () => {
    const s = session("s1", [
      {
        exerciseId: "flexao",
        sets: [
          { done: true, load_kg: 40, reps: 10 }, // 400
          { done: true, reps: 12 }, // sem carga — peso corporal não é conhecido
          { done: true, load_kg: 40 }, // sem reps
        ],
      },
    ]);
    const sum = buildSessionSummary(s, []);
    expect(sum.volumeKg).toBe(400);
    // A diferença entre doneSets e volumeSets é o que a UI usa pra avisar que a conta
    // é parcial — nunca estimar o que falta.
    expect(sum.volumeSets).toBe(1);
    expect(sum.doneSets).toBe(3);
  });

  it("arredonda o acumulado de ponto flutuante", () => {
    const s = session("s1", [
      { exerciseId: "rosca", sets: [{ done: true, load_kg: 12.5, reps: 3 }] },
    ]);
    expect(buildSessionSummary(s, []).volumeKg).toBe(38); // 37.5 → 38
  });
});

describe("buildSessionSummary — contagens", () => {
  it("conta exercícios com ao menos uma série feita", () => {
    const s = session("s1", [
      { exerciseId: "a", sets: [{ done: true, load_kg: 10, reps: 10 }] },
      { exerciseId: "b", sets: [{ done: false }] },
      { exerciseId: "c", sets: [{ done: true }] },
    ]);
    const sum = buildSessionSummary(s, []);
    expect(sum.exercisesDone).toBe(2);
    expect(sum.exercisesTotal).toBe(3);
  });

  it("lista os movimentos executados, respeitando a variação trocada", () => {
    const s = session("s1", [
      { exerciseId: "supino", swappedToId: "supino_halteres", sets: [{ done: true, load_kg: 30 }] },
      { exerciseId: "remada", sets: [{ done: false }] },
    ]);
    expect(buildSessionSummary(s, []).movementIds).toEqual([
      { exerciseId: "supino", movementId: "supino_halteres" },
    ]);
  });
});

describe("buildSessionSummary — recordes", () => {
  const anterior = session(
    "s0",
    [{ exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 8 }] }],
    { date: "2026-07-23" },
  );

  it("celebra quando a maior carga do dia supera o melhor anterior", () => {
    const hoje = session("s1", [
      {
        exerciseId: "supino",
        sets: [
          { done: true, load_kg: 60, reps: 8 },
          { done: true, load_kg: 62.5, reps: 6 },
        ],
      },
    ]);
    const sum = buildSessionSummary(hoje, [anterior, hoje]);
    expect(sum.records).toEqual([
      { exerciseId: "supino", movementId: "supino", load_kg: 62.5, previousBest: 60, reps: 6 },
    ]);
  });

  it("um recorde por exercício, não um por série acima da régua", () => {
    const hoje = session("s1", [
      {
        exerciseId: "supino",
        sets: [
          { done: true, load_kg: 62.5, reps: 6 },
          { done: true, load_kg: 65, reps: 4 },
        ],
      },
    ]);
    const sum = buildSessionSummary(hoje, [anterior, hoje]);
    expect(sum.records).toHaveLength(1);
    expect(sum.records[0].load_kg).toBe(65);
  });

  it("não celebra sem histórico anterior (primeiro treino)", () => {
    const hoje = session("s1", [
      { exerciseId: "supino", sets: [{ done: true, load_kg: 100, reps: 5 }] },
    ]);
    expect(buildSessionSummary(hoje, [hoje]).records).toEqual([]);
  });

  it("empatar o recorde não é bater o recorde", () => {
    const hoje = session("s1", [
      { exerciseId: "supino", sets: [{ done: true, load_kg: 60, reps: 12 }] },
    ]);
    expect(buildSessionSummary(hoje, [anterior, hoje]).records).toEqual([]);
  });

  it("variação trocada tem régua própria — não herda o recorde do movimento base", () => {
    const hoje = session("s1", [
      {
        exerciseId: "supino",
        swappedToId: "supino_halteres",
        sets: [{ done: true, load_kg: 30, reps: 10 }],
      },
    ]);
    // 30 kg de halteres não é recorde sobre 60 kg de barra: são movimentos diferentes.
    // E como nunca houve halteres antes, também não há régua — logo, nada a celebrar.
    expect(buildSessionSummary(hoje, [anterior, hoje]).records).toEqual([]);
  });

  it("ordena do maior salto para o menor", () => {
    const base = session(
      "s0",
      [
        { exerciseId: "supino", sets: [{ done: true, load_kg: 60 }] },
        { exerciseId: "agacho", sets: [{ done: true, load_kg: 80 }] },
      ],
      { date: "2026-07-23" },
    );
    const hoje = session("s1", [
      { exerciseId: "supino", sets: [{ done: true, load_kg: 62.5 }] }, // +2,5
      { exerciseId: "agacho", sets: [{ done: true, load_kg: 90 }] }, // +10
    ]);
    expect(buildSessionSummary(hoje, [base, hoje]).records.map((r) => r.exerciseId)).toEqual([
      "agacho",
      "supino",
    ]);
  });
});

describe("buildSessionSummary — série mais pesada", () => {
  it("pega a maior carga da sessão inteira, desempatando por repetições", () => {
    const s = session("s1", [
      { exerciseId: "a", sets: [{ done: true, load_kg: 80, reps: 5 }] },
      { exerciseId: "b", sets: [{ done: true, load_kg: 80, reps: 8 }] },
      { exerciseId: "c", sets: [{ done: false, load_kg: 200, reps: 1 }] },
    ]);
    expect(buildSessionSummary(s, []).heaviestSet).toEqual({
      exerciseId: "b",
      movementId: "b",
      load_kg: 80,
      reps: 8,
    });
  });

  it("é null quando nenhuma série feita tem carga", () => {
    const s = session("s1", [{ exerciseId: "a", sets: [{ done: true, reps: 10 }] }]);
    expect(buildSessionSummary(s, []).heaviestSet).toBeNull();
  });
});

describe("buildSessionSummary — duração", () => {
  it("calcula minutos entre início e fim", () => {
    expect(buildSessionSummary(session("s1", []), []).durationMin).toBe(65);
  });

  it("sem completedAt não há duração", () => {
    const s = session("s1", [], { completedAt: undefined });
    expect(buildSessionSummary(s, []).durationMin).toBeNull();
  });

  it("carimbo invertido (relógio do aparelho) não vira duração negativa", () => {
    const s = session("s1", [], { completedAt: "2026-07-30T18:00:00.000Z" });
    expect(buildSessionSummary(s, []).durationMin).toBeNull();
  });

  it("carimbo ilegível não derruba o resumo", () => {
    const s = session("s1", [], { startedAt: "ontem à noite" });
    expect(buildSessionSummary(s, []).durationMin).toBeNull();
  });
});

describe("sessionVolume — fonte única do número", () => {
  it("é o mesmo número que o resumo completo publica", () => {
    const s = session("s1", [
      {
        exerciseId: "a",
        sets: [
          { done: true, load_kg: 62.5, reps: 8 },
          { done: true, load_kg: 62.5 },
          { done: false, load_kg: 62.5, reps: 8 },
        ],
      },
    ]);
    const sum = buildSessionSummary(s, []);
    expect(sessionVolume(s)).toEqual({ kg: 500, sets: 1 });
    expect(sum.volumeKg).toBe(500);
    expect(sum.volumeSets).toBe(1);
  });
});

describe("buildConstancy — mapa do calendário", () => {
  const dia = (date: string, status: WorkoutSession["status"], load: number, reps: number) =>
    session(`${date}-${status}-${load}`, [{ exerciseId: "a", sets: [{ done: true, load_kg: load, reps }] }], {
      date,
      status,
    });

  it("agrega sessões do mesmo dia e normaliza pelo maior volume do período", () => {
    const map = buildConstancy([
      dia("2026-07-01", "done", 50, 10), // 500
      dia("2026-07-08", "done", 100, 10), // 1000 — o maior
      dia("2026-07-15", "done", 25, 10), // 250
    ]);
    expect(map.get("2026-07-01")).toMatchObject({ volumeKg: 500, intensity: 0.5, done: 1 });
    expect(map.get("2026-07-08")).toMatchObject({ volumeKg: 1000, intensity: 1 });
    expect(map.get("2026-07-15")).toMatchObject({ volumeKg: 250, intensity: 0.25 });
  });

  it("dois treinos no mesmo dia somam volume e contagem", () => {
    const map = buildConstancy([dia("2026-07-02", "done", 40, 10), dia("2026-07-02", "done", 60, 10)]);
    expect(map.get("2026-07-02")).toMatchObject({ done: 2, volumeKg: 1000, intensity: 1 });
  });

  it("separa em andamento de concluído", () => {
    const map = buildConstancy([dia("2026-07-03", "in_progress", 30, 10)]);
    expect(map.get("2026-07-03")).toMatchObject({ done: 0, inProgress: 1 });
  });

  it("sem volume em lugar nenhum, não há régua — intensidade fica null", () => {
    const semCarga = session("x", [{ exerciseId: "a", sets: [{ done: true, reps: 10 }] }], {
      date: "2026-07-04",
    });
    const map = buildConstancy([semCarga]);
    expect(map.get("2026-07-04")).toMatchObject({ volumeKg: 0, intensity: null, done: 1 });
  });

  it("dia sem volume convive com dias medidos e vale 0, não desaparece", () => {
    const semCarga = session("x", [{ exerciseId: "a", sets: [{ done: true, reps: 10 }] }], {
      date: "2026-07-05",
    });
    const map = buildConstancy([semCarga, dia("2026-07-06", "done", 100, 10)]);
    expect(map.get("2026-07-05")).toMatchObject({ intensity: 0, done: 1 });
  });

  it("dia sem sessão não entra no mapa (não existe registro de ausência)", () => {
    const map = buildConstancy([dia("2026-07-07", "done", 50, 10)]);
    expect(map.has("2026-07-06")).toBe(false);
    expect(map.size).toBe(1);
  });
});

describe("formatDuration", () => {
  it("abaixo de 1h mostra minutos", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(48)).toBe("48 min");
  });

  it("hora cheia não mostra minutos", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("hora quebrada mostra minutos com dois dígitos", () => {
    expect(formatDuration(65)).toBe("1h05");
    expect(formatDuration(125)).toBe("2h05");
    expect(formatDuration(155)).toBe("2h35");
  });
});
