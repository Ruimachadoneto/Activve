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

/**
 * Calorias planejadas para o dia inteiro — `null` quando o plano não traz kcal.
 *
 * Não existe "consumido": o app **não rastreia** refeição (decisão de produto do usuário —
 * marcar cria atrito diário e prende a uma refeição específica quando existem várias
 * equivalentes, virando motivo de abandono). Esta é uma tela de consulta.
 */
export function plannedKcal(meals: Meal[]): number | null {
  const lista = Array.isArray(meals) ? meals : [];
  const porRefeicao = lista.map(mealKcal);
  if (!porRefeicao.some((k) => k !== null)) return null;
  return porRefeicao.reduce<number>((soma, k) => soma + (k ?? 0), 0);
}
