"use client";

import { Info, Repeat2, ShoppingBasket, Utensils } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { PlanErrorState } from "@/components/PlanErrorState";
import { hasDietContent, mealKcal, plannedKcal, type KcalCount } from "@/lib/plan/diet";

function formatKcal(n: number): string {
  return n.toLocaleString("pt-BR");
}

/**
 * "520 kcal" quando a contagem é completa, "520+ kcal" quando há item sem `kcal` no plano.
 * O "+" é a diferença entre informar e subdeclarar.
 */
function formatContagem(c: KcalCount): string {
  return `${formatKcal(c.kcal)}${c.partial ? "+" : ""} kcal`;
}

/**
 * Alimentação — **aba de consulta** (TASK-024).
 *
 * Decisão de produto do usuário: o app **não rastreia** refeição. Marcar "feito" obriga a
 * manter registro todo dia e prende a pessoa a uma refeição específica quando existem
 * várias equivalentes — atrito que vira abandono da função, e possivelmente do app. Aqui a
 * dieta é referência: o que o coach definiu, com que trocar, e por quê.
 *
 * Nada nesta tela grava dado. É leitura pura do `PlanFile`.
 */
export default function AlimentacaoPage() {
  const { loading, plan, invalid } = useActivePlan();

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (invalid) return <PlanErrorState errors={invalid.errors} />;

  if (!plan) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Importe um plano para ver sua alimentação.</p>
        <BottomNav active="hoje" />
      </main>
    );
  }

  const diet = plan.plan.diet;
  const meals = diet.meals ?? [];
  const kcalDia = plannedKcal(meals);

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header>
        <h1 className="text-xl font-medium tracking-tight">Alimentação</h1>
        <p className="mt-0.5 text-sm text-muted">O que seu coach definiu, e por quê.</p>
      </header>

      {/*
        Estado vazio olha a dieta INTEIRA, não só `meals`: `shoppingList` e `prep` são
        campos independentes no schema, e um plano só com eles ficaria inalcançável se o
        vazio fosse decidido por refeições (achado do review Codex).
      */}
      {!hasDietContent(diet) ? (
        <section className="mt-5 rounded-card border border-line bg-surface p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-accent">
            <Utensils size={22} aria-hidden />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Este plano não traz a parte alimentar. Peça ao seu coach um plano com dieta e importe
            de novo.
          </p>
        </section>
      ) : null}

      {meals.length > 0 ? (
        <>
          {/* Resumo do dia: números do PLANO, não do que foi consumido — nada é rastreado. */}
          <section className="mt-5 rounded-card border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-faint">O dia no plano</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[42px] font-medium leading-none tracking-tight">
                {meals.length}
              </span>
              <span className="text-sm text-muted">
                {meals.length === 1 ? "refeição" : "refeições"}
              </span>
              {kcalDia ? (
                <span className="ml-auto text-sm text-muted">{formatContagem(kcalDia)}</span>
              ) : null}
            </div>

            {/*
              Divergência entre a soma das refeições e a meta do plano é mostrada, não
              escondida — os dois números vêm do coach e podem discordar de propósito
              (margem de ajuste), mas quem decide o que fazer com isso é o usuário.
            */}
            {diet.dailyKcal != null ? (
              <p className="mt-2 text-xs text-muted">
                Meta do plano: {formatKcal(diet.dailyKcal)} kcal por dia
                {kcalDia && (kcalDia.partial || kcalDia.kcal !== diet.dailyKcal)
                  ? ` · as refeições somam ${formatContagem(kcalDia)}`
                  : ""}
              </p>
            ) : null}

            {diet.macros ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { rotulo: "Proteínas", valor: diet.macros.protein_g },
                  { rotulo: "Carboidratos", valor: diet.macros.carbs_g },
                  { rotulo: "Gorduras", valor: diet.macros.fat_g },
                ].map(({ rotulo, valor }) => (
                  <div key={rotulo} className="rounded-xl bg-surface2 p-3 text-center">
                    <p className="text-[15px] tabular-nums">{valor} g</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-faint">
                      {rotulo}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-5">
            <p className="px-1 text-[11px] uppercase tracking-wider text-faint">Refeições</p>
            <ul className="mt-2 flex flex-col gap-2">
              {meals.map((meal, i) => {
                const kcal = mealKcal(meal);
                return (
                  <li key={`${meal.id}-${i}`} className="rounded-card border border-line bg-surface p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[17px] leading-snug">{meal.name}</p>
                      <span className="shrink-0 text-xs tabular-nums text-faint">
                        {meal.time ? meal.time : null}
                        {meal.time && kcal ? " · " : ""}
                        {kcal ? formatContagem(kcal) : null}
                      </span>
                    </div>

                    {meal.items.length > 0 ? (
                      <ul className="mt-3 flex flex-col gap-2">
                        {meal.items.map((item, j) => (
                          <li key={`${meal.id}-${i}-${j}`}>
                            <p className="text-sm">
                              {item.qty != null ? (
                                <span className="tabular-nums text-ink">
                                  {item.qty}
                                  {item.unit ? ` ${item.unit}` : ""}{" "}
                                </span>
                              ) : null}
                              <span className="text-ink">{item.food}</span>
                            </p>
                            {/* Variações: o que faz o plano caber na vida real. */}
                            {item.alternatives && item.alternatives.length > 0 ? (
                              <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                                <Repeat2 size={13} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                                <span>
                                  <span className="text-faint">ou </span>
                                  {item.alternatives.join(" · ")}
                                </span>
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {meal.why ? (
                      <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface2 p-3 text-xs leading-relaxed text-muted">
                        <Info size={14} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                        <span>{meal.why}</span>
                      </p>
                    ) : null}

                    {meal.notes ? (
                      <p className="mt-2 text-xs leading-relaxed text-faint">{meal.notes}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}

      {diet.shoppingList && diet.shoppingList.length > 0 ? (
        <section className="mt-5 rounded-card border border-line bg-surface p-4">
          <div className="flex items-center gap-2">
            <ShoppingBasket size={14} aria-hidden className="text-accent" />
            <p className="text-[11px] uppercase tracking-wider text-faint">Lista de compras</p>
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {diet.shoppingList.map((produto, i) => (
              <li key={`compra-${i}`} className="rounded-lg bg-surface2 px-2.5 py-1 text-xs text-muted">
                {produto}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {diet.prep && diet.prep.length > 0 ? (
        <section className="mt-3 rounded-card border border-line bg-surface p-4">
          <p className="text-[11px] uppercase tracking-wider text-faint">Preparo</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {diet.prep.map((passo, i) => (
              <li key={`prep-${i}`} className="flex gap-2 text-xs leading-relaxed text-muted">
                <span className="tabular-nums text-faint">{i + 1}.</span>
                <span>{passo}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BottomNav active="hoje" />
    </main>
  );
}
