import { describe, it, expect } from "vitest";
import { getTodayWorkout, greeting, todayIndex, weekDates } from "./today";
import type { PlanFile } from "./schema";

const plan = {
  training: {
    split: "AB",
    weekSchedule: ["A", "rest", "B", "rest", "A", "B", "rest"],
    workouts: [
      { id: "A", name: "Treino A", focus: "Empurrar", exercises: [{}, {}] },
      { id: "B", name: "Treino B", focus: "Puxar", exercises: [{}] },
    ],
  },
} as unknown as PlanFile;

describe("getTodayWorkout", () => {
  it("retorna o treino agendado num dia de treino (segunda → A)", () => {
    const monday = new Date("2026-06-22T10:00:00"); // segunda-feira
    const result = getTodayWorkout(plan, monday);
    expect(result.kind).toBe("workout");
    if (result.kind === "workout") {
      expect(result.workoutId).toBe("A");
      expect(result.exerciseCount).toBe(2);
    }
  });

  it("retorna descanso num dia de rest (terça)", () => {
    const tuesday = new Date("2026-06-23T10:00:00");
    expect(getTodayWorkout(plan, tuesday).kind).toBe("rest");
  });

  it("trata referência a treino inexistente como descanso", () => {
    const broken = { training: { ...plan.training, weekSchedule: ["Z", "rest", "rest", "rest", "rest", "rest", "rest"] } } as unknown as PlanFile;
    const monday = new Date("2026-06-22T10:00:00");
    expect(getTodayWorkout(broken, monday).kind).toBe("rest");
  });
});

describe("greeting", () => {
  it("varia por horário", () => {
    expect(greeting(new Date("2026-06-22T08:00:00"))).toBe("Bom dia");
    expect(greeting(new Date("2026-06-22T14:00:00"))).toBe("Boa tarde");
    expect(greeting(new Date("2026-06-22T20:00:00"))).toBe("Boa noite");
  });
});

describe("todayIndex", () => {
  it("segunda = 0, domingo = 6", () => {
    expect(todayIndex(new Date("2026-06-22T10:00:00"))).toBe(0);
    expect(todayIndex(new Date("2026-06-28T10:00:00"))).toBe(6);
  });
});

describe("weekDates", () => {
  it("retorna seg→dom da semana atual em yyyy-mm-dd", () => {
    const friday = new Date(2026, 5, 26); // sexta 2026-06-26
    const w = weekDates(friday);
    expect(w).toHaveLength(7);
    expect(w[0]).toBe("2026-06-22"); // segunda
    expect(w[4]).toBe("2026-06-26"); // sexta (hoje)
    expect(w[6]).toBe("2026-06-28"); // domingo
  });

  it("atravessa virada de mês", () => {
    const w = weekDates(new Date(2026, 6, 1)); // quarta 2026-07-01
    expect(w[0]).toBe("2026-06-29");
    expect(w[6]).toBe("2026-07-05");
  });
});
