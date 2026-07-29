import { describe, it, expect } from "vitest";
import { mealKcal, plannedKcal } from "./diet";
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

describe("plannedKcal", () => {
  const meals = [meal("cafe", [300]), meal("almoco", [700]), meal("jantar", [500])];

  it("soma as calorias planejadas do dia", () => {
    expect(plannedKcal(meals)).toBe(1500);
  });

  it("plano sem kcal devolve null em vez de zero", () => {
    expect(plannedKcal([meal("a", [undefined]), meal("b", [undefined])])).toBeNull();
  });

  it("soma o que sabe quando o plano traz kcal parcial", () => {
    expect(plannedKcal([meal("a", [300]), meal("b", [undefined])])).toBe(300);
  });

  it("lista vazia ou inválida não quebra", () => {
    expect(plannedKcal([])).toBeNull();
    expect(plannedKcal(undefined as unknown as Meal[])).toBeNull();
  });
});
