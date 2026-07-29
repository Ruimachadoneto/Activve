import type { PlanFile } from "./schema";

type Meal = PlanFile["diet"]["meals"][number];
type Diet = PlanFile["diet"];

/**
 * Calorias conhecidas, e se a contagem está **incompleta**.
 *
 * `partial: true` significa "pelo menos isto" — há item sem `kcal` declarado. Somar só os
 * itens conhecidos e exibir o resultado como total seria **subdeclarar** a refeição, que é
 * o mesmo tipo de mentira que o `null` evita no caso sem kcal nenhum (achado do review
 * Codex). A UI marca o parcial com "+" em vez de esconder ou fingir precisão.
 *
 * `null` = o plano não traz contagem calórica nenhuma. Nunca `0`: plano sem kcal é
 * legítimo, e "0 kcal" afirmaria ausência de caloria.
 */
export type KcalCount = { kcal: number; partial: boolean };

export function mealKcal(meal: Meal): KcalCount | null {
  const itens = meal?.items ?? [];
  const comKcal = itens.filter((i) => typeof i?.kcal === "number");
  if (comKcal.length === 0) return null;
  return {
    kcal: comKcal.reduce((soma, i) => soma + (i.kcal as number), 0),
    partial: comKcal.length < itens.length,
  };
}

/**
 * Calorias planejadas para o dia — `null` quando nenhuma refeição traz kcal.
 *
 * O dia é parcial se **qualquer** refeição for parcial ou se alguma refeição não declarar
 * kcal alguma: nos dois casos o total conhecido é menor que o real.
 *
 * Não existe "consumido": o app **não rastreia** refeição (decisão de produto do usuário —
 * marcar cria atrito diário e prende a uma refeição específica quando existem várias
 * equivalentes, virando motivo de abandono). Esta é uma tela de consulta.
 */
export function plannedKcal(meals: Meal[]): KcalCount | null {
  const lista = Array.isArray(meals) ? meals : [];
  const contagens = lista.map(mealKcal);
  if (!contagens.some((c) => c !== null)) return null;
  return {
    kcal: contagens.reduce<number>((soma, c) => soma + (c?.kcal ?? 0), 0),
    partial: contagens.some((c) => c === null || c.partial),
  };
}

/**
 * A dieta tem algo a mostrar? `shoppingList` e `prep` são campos independentes no schema —
 * um plano só com lista de compras e preparo é válido, e cair no estado vazio deixaria
 * esse conteúdo inalcançável (achado do review Codex).
 */
export function hasDietContent(diet: Diet | undefined): boolean {
  if (!diet) return false;
  return (
    (diet.meals?.length ?? 0) > 0 ||
    (diet.shoppingList?.length ?? 0) > 0 ||
    (diet.prep?.length ?? 0) > 0 ||
    // Metas diárias sozinhas já são dieta — e são a forma mais comum de prescrição:
    // muito coach define kcal/macros sem detalhar refeição a refeição.
    diet.dailyKcal != null ||
    diet.macros != null
  );
}

/** Há meta diária (kcal ou macros) para exibir, independente de haver refeições? */
export function hasDietTargets(diet: Diet | undefined): boolean {
  return !!diet && (diet.dailyKcal != null || diet.macros != null);
}
