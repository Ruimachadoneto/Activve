import { describe, it, expect } from "vitest";
import {
  createSession,
  sessionProgress,
  completeSession,
  sessionIdFor,
  isoDate,
  type WorkoutSession,
} from "./session";

const workout = {
  id: "A",
  exercises: [
    { id: "ex1", sets: 3 },
    { id: "ex2", sets: 4 },
  ],
};

describe("createSession", () => {
  it("pré-cria as séries de cada exercício, nada feito", () => {
    const s = createSession("pl1", workout, "2026-06-26");
    expect(s.sessionId).toBe("pl1:A:2026-06-26");
    expect(s.status).toBe("in_progress");
    expect(s.exercises.map((e) => e.sets.length)).toEqual([3, 4]);
    expect(s.exercises.every((e) => e.sets.every((set) => set.done === false))).toBe(true);
  });

  it("garante ao menos 1 série mesmo se sets for 0", () => {
    const s = createSession("pl1", { id: "B", exercises: [{ id: "x", sets: 0 }] });
    expect(s.exercises[0].sets.length).toBe(1);
  });
});

describe("sessionProgress", () => {
  it("conta séries feitas e detecta conclusão", () => {
    const s = createSession("pl1", workout, "2026-06-26");
    expect(sessionProgress(s)).toEqual({ doneSets: 0, totalSets: 7, allDone: false });

    s.exercises[0].sets[0].done = true;
    expect(sessionProgress(s).doneSets).toBe(1);

    for (const ex of s.exercises) for (const set of ex.sets) set.done = true;
    expect(sessionProgress(s)).toEqual({ doneSets: 7, totalSets: 7, allDone: true });
  });
});

describe("completeSession", () => {
  it("marca done com completedAt e é idempotente", () => {
    const s = createSession("pl1", workout, "2026-06-26");
    const done = completeSession(s, new Date("2026-06-26T10:00:00Z"));
    expect(done.status).toBe("done");
    expect(done.completedAt).toBe("2026-06-26T10:00:00.000Z");

    const again = completeSession(done, new Date("2026-06-26T11:00:00Z"));
    expect(again.completedAt).toBe("2026-06-26T10:00:00.000Z"); // não sobrescreve
  });
});

describe("helpers", () => {
  it("sessionIdFor compõe planId:workoutId:date", () => {
    expect(sessionIdFor("p", "A", "2026-06-26")).toBe("p:A:2026-06-26");
  });

  it("isoDate é yyyy-mm-dd local", () => {
    expect(isoDate(new Date(2026, 5, 7))).toBe("2026-06-07");
  });
});

// guard de tipo: garante que WorkoutSession está exportado e bem formado
const _typecheck: WorkoutSession = createSession("p", workout);
void _typecheck;
