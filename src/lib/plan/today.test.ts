import { describe, it, expect } from "vitest";
import { estimateWorkoutMinutes, greeting, todayIndex, weekDates, workoutBadge } from "./today";
/*
 * Os testes de `getTodayWorkout` foram removidos junto com a função na TASK-029: eles
 * codificavam a regra ANTIGA (treino resolvido pelo dia da semana), que o feedback de uso
 * real derrubou. A regra nova — sugestão pela rotação do que foi concluído — está coberta
 * em `rotation.test.ts`, incluindo o caso que originou o pedido.
 */

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

describe("estimateWorkoutMinutes", () => {
  it("estima por série: 45s de execução + descanso do exercício", () => {
    // 4×(45+60) + 3×(45+90) = 420 + 405 = 825s ≈ 13.75min → arredonda p/ 15
    const w = { exercises: [{ sets: 4, rest_s: 60 }, { sets: 3, rest_s: 90 }] };
    expect(estimateWorkoutMinutes(w)).toBe(15);
  });

  it("usa 60s de descanso quando o exercício não define rest_s", () => {
    // 4×(45+60) = 420s = 7min → arredonda p/ 5
    expect(estimateWorkoutMinutes({ exercises: [{ sets: 4 }] })).toBe(5);
  });

  it("nunca estima abaixo de 5 minutos", () => {
    expect(estimateWorkoutMinutes({ exercises: [{ sets: 1, rest_s: 0 }] })).toBe(5);
    expect(estimateWorkoutMinutes({ exercises: [] })).toBe(5);
  });
});

describe("workoutBadge", () => {
  it("exibe ids curtos e legíveis (maiúsculos)", () => {
    expect(workoutBadge("A")).toBe("A");
    expect(workoutBadge("b2")).toBe("B2");
    expect(workoutBadge("ABC")).toBe("ABC");
  });

  it("id técnico (slug/uuid) → null (não vazar identificador na UI)", () => {
    expect(workoutBadge("push_day")).toBeNull();
    expect(workoutBadge("wk_42_a")).toBeNull();
    expect(workoutBadge("3f2c9d1e-aaaa")).toBeNull();
    expect(workoutBadge("")).toBeNull();
  });
});
