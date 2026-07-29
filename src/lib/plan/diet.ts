import type { PlanFile } from "./schema";

type Meal = PlanFile["diet"]["meals"][number];

/**
 * Calorias de uma refeição, somando os itens — `null` quando **nenhum** item declara
 * `kcal`.
 *
 * O `null` é deliberado e não deve virar `0`: o coach pode montar um plano sem contagem
 * calórica, e mostrar "0 kcal" afirmaria que a refeição não tem caloria. Ausência de dado
 * e valor zero são coisas diferentes — mesma regra de honestidade do resto do app.
 */
export function mealKcal(meal: Meal): number | null {
  const comKcal = (meal?.items ?? []).filter((i) => typeof i?.kcal === "number");
  if (comKcal.length === 0) return null;
  return comKcal.reduce((soma, i) => soma + (i.kcal as number), 0);
}

export type DietProgress = {
  /** Refeições marcadas como feitas hoje. */
  done: number;
  /** Refeições previstas no plano. */
  total: number;
  /** Calorias das refeições já feitas — `null` se o plano não traz kcal. */
  kcalDone: number | null;
  /** Calorias previstas para o dia inteiro — `null` se o plano não traz kcal. */
  kcalPlanned: number | null;
};

/**
 * Progresso do dia. `doneIds` que não existem mais no plano são ignorados: um ciclo novo
 * traz refeições próprias, e uma marcação órfã não pode inflar a contagem.
 */
export function dietProgress(meals: Meal[], doneIds: string[]): DietProgress {
  const lista = Array.isArray(meals) ? meals : [];
  const feitos = new Set(doneIds);
  const kcalPorRefeicao = lista.map(mealKcal);
  const temKcal = kcalPorRefeicao.some((k) => k !== null);

  let done = 0;
  let kcalDone = 0;
  lista.forEach((meal, i) => {
    if (!feitos.has(meal.id)) return;
    done += 1;
    kcalDone += kcalPorRefeicao[i] ?? 0;
  });

  return {
    done,
    total: lista.length,
    kcalDone: temKcal ? kcalDone : null,
    // `reduce<number>` explícito: sem isso o acumulador herda `number | null` do array.
    kcalPlanned: temKcal ? kcalPorRefeicao.reduce<number>((s, k) => s + (k ?? 0), 0) : null,
  };
}
