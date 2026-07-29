import { describe, it, expect } from "vitest";
import { hasDietContent, hasDietTargets, mealKcal, plannedKcal } from "./diet";
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
    expect(mealKcal(meal("m1", [160, 90]))).toEqual({ kcal: 250, partial: false });
  });

  it("marca como PARCIAL quando algum item não declara kcal", () => {
    // Somar só os conhecidos e exibir como total subdeclararia a refeição — mesma mentira
    // que o `null` evita no caso sem kcal nenhum (achado do review Codex).
    expect(mealKcal(meal("m1", [160, undefined, 40]))).toEqual({ kcal: 200, partial: true });
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
    expect(plannedKcal(meals)).toEqual({ kcal: 1500, partial: false });
  });

  it("plano sem kcal devolve null em vez de zero", () => {
    expect(plannedKcal([meal("a", [undefined]), meal("b", [undefined])])).toBeNull();
  });

  it("dia fica PARCIAL se alguma refeição não declara kcal", () => {
    expect(plannedKcal([meal("a", [300]), meal("b", [undefined])])).toEqual({
      kcal: 300,
      partial: true,
    });
  });

  it("dia fica PARCIAL se alguma refeição é parcial por dentro", () => {
    expect(plannedKcal([meal("a", [300, undefined])])).toEqual({ kcal: 300, partial: true });
  });

  it("lista vazia ou inválida não quebra", () => {
    expect(plannedKcal([])).toBeNull();
    expect(plannedKcal(undefined as unknown as Meal[])).toBeNull();
  });
});

describe("hasDietContent", () => {
  it("reconhece plano só com lista de compras ou preparo", () => {
    // Campos independentes no schema: um plano sem refeições mas com compras/preparo tem
    // conteúdo, e cair no estado vazio o deixaria inalcançável (achado do review Codex).
    expect(hasDietContent({ meals: [], shoppingList: ["Ovos"] } as never)).toBe(true);
    expect(hasDietContent({ meals: [], prep: ["Cozinhar arroz"] } as never)).toBe(true);
  });

  it("reconhece plano com refeições", () => {
    expect(hasDietContent({ meals: [meal("cafe", [300])] } as never)).toBe(true);
  });

  it("reconhece plano só com metas diárias", () => {
    // Forma MAIS COMUM de prescrição: coach define kcal/macros sem detalhar refeição a
    // refeição. Tratar isso como "sem dieta" escondia o plano inteiro (review Codex).
    expect(hasDietContent({ meals: [], dailyKcal: 2100 } as never)).toBe(true);
    expect(
      hasDietContent({ meals: [], macros: { protein_g: 165, carbs_g: 210, fat_g: 60 } } as never),
    ).toBe(true);
  });

  it("dieta realmente vazia é vazia", () => {
    expect(hasDietContent({ meals: [] } as never)).toBe(false);
    expect(hasDietContent({ meals: [], shoppingList: [], prep: [] } as never)).toBe(false);
    expect(hasDietContent(undefined)).toBe(false);
  });
});

describe("hasDietTargets", () => {
  it("só considera meta diária, não refeições nem compras", () => {
    expect(hasDietTargets({ meals: [], dailyKcal: 2100 } as never)).toBe(true);
    expect(hasDietTargets({ meals: [], macros: { protein_g: 1, carbs_g: 1, fat_g: 1 } } as never)).toBe(true);
    expect(hasDietTargets({ meals: [meal("cafe", [300])] } as never)).toBe(false);
    expect(hasDietTargets({ meals: [], shoppingList: ["Ovos"] } as never)).toBe(false);
    expect(hasDietTargets(undefined)).toBe(false);
  });
});
