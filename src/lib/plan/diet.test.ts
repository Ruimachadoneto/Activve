import { describe, it, expect } from "vitest";
import { dietProgress, mealKcal } from "./diet";
import type { PlanFile } from "./schema";

type Meal = PlanFile["diet"]["meals"][number];

const meal = (id: string, kcals: (number | undefined)[]): Meal =>
  ({
    id,
    name: id,
    items: kcals.map((kcal, i) => ({ food: `item${i}`, ...(kcal != null ? { kcal } : {}) })),
  }) as Meal;

describe("mealKcal", () => {
  it("soma as calorias dos itens", () => {
    expect(mealKcal(meal("m1", [160, 90]))).toBe(250);
  });

  it("ignora itens sem kcal, mas soma os que têm", () => {
    expect(mealKcal(meal("m1", [160, undefined, 40]))).toBe(200);
  });

  it("devolve null — não 0 — quando nenhum item declara kcal", () => {
    // Plano sem contagem calórica é legítimo; "0 kcal" afirmaria que a refeição não tem
    // caloria, o que é diferente de "o plano não informa".
    expect(mealKcal(meal("m1", [undefined, undefined]))).toBeNull();
    expect(mealKcal(meal("m1", []))).toBeNull();
  });

  it("refeição malformada não quebra", () => {
    expect(mealKcal({ id: "x", name: "x" } as Meal)).toBeNull();
  });
});

describe("dietProgress", () => {
  const meals = [meal("cafe", [300]), meal("almoco", [700]), meal("jantar", [500])];

  it("conta as refeições feitas", () => {
    expect(dietProgress(meals, ["cafe", "jantar"]).done).toBe(2);
    expect(dietProgress(meals, []).done).toBe(0);
    expect(dietProgress(meals, []).total).toBe(3);
  });

  it("soma calorias só das refeições feitas", () => {
    const p = dietProgress(meals, ["cafe", "jantar"]);
    expect(p.kcalDone).toBe(800);
    expect(p.kcalPlanned).toBe(1500);
  });

  it("ignora ids que não existem mais no plano (ciclo anterior)", () => {
    const p = dietProgress(meals, ["cafe", "lanche_do_plano_antigo"]);
    expect(p.done).toBe(1);
    expect(p.kcalDone).toBe(300);
  });

  it("plano sem kcal devolve null em vez de zero", () => {
    const semKcal = [meal("a", [undefined]), meal("b", [undefined])];
    const p = dietProgress(semKcal, ["a"]);
    expect(p.done).toBe(1);
    expect(p.kcalDone).toBeNull();
    expect(p.kcalPlanned).toBeNull();
  });

  it("plano com kcal parcial ainda reporta o que sabe", () => {
    const parcial = [meal("a", [300]), meal("b", [undefined])];
    const p = dietProgress(parcial, ["a", "b"]);
    expect(p.done).toBe(2);
    expect(p.kcalDone).toBe(300);
  });

  it("lista vazia ou inválida não quebra", () => {
    expect(dietProgress([], []).total).toBe(0);
    expect(dietProgress(undefined as unknown as Meal[], []).total).toBe(0);
  });
});
