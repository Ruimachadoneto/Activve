"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Utensils } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { PlanErrorState } from "@/components/PlanErrorState";
import { dietProgress, mealKcal } from "@/lib/plan/diet";
import { getMealsDone, toggleMealDone } from "@/lib/storage/meals";
import { isoDate } from "@/lib/plan/session";

const SEGMENTOS = 10;

function formatKcal(n: number): string {
  return n.toLocaleString("pt-BR");
}

export default function AlimentacaoPage() {
  const { loading, plan, invalid } = useActivePlan();
  /*
   * Marcações guardadas junto com o planId de origem — mesmo padrão do Hoje e do override
   * de treino: ao trocar de plano, a lista antiga não pode ser usada enquanto o novo fetch
   * não resolve.
   */
  const [doneFetch, setDoneFetch] = useState<{ planId: string | null; ids: string[] }>({
    planId: null,
    ids: [],
  });
  const planId = plan?.planId ?? null;
  const carregando = doneFetch.planId !== planId;
  const done = carregando ? [] : doneFetch.ids;
  const hoje = isoDate();

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    getMealsDone(planId, hoje).then((ids) => {
      if (!cancelled) setDoneFetch({ planId, ids });
    });
    return () => {
      cancelled = true;
    };
  }, [planId, hoje]);

  const alternar = useCallback(
    async (mealId: string) => {
      if (!planId) return;
      const ids = await toggleMealDone(planId, hoje, mealId);
      setDoneFetch({ planId, ids });
    },
    [planId, hoje],
  );

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
  const progresso = dietProgress(meals, done);
  const preenchidos = progresso.total
    ? Math.round((progresso.done / progresso.total) * SEGMENTOS)
    : 0;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header>
        <h1 className="text-xl font-medium tracking-tight">Alimentação</h1>
        <p className="mt-0.5 text-sm text-muted">O plano de hoje, do seu jeito.</p>
      </header>

      {meals.length === 0 ? (
        <section className="mt-5 rounded-card border border-line bg-surface p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-accent">
            <Utensils size={22} aria-hidden />
          </span>
          <p className="mt-4 text-sm text-muted">
            Este plano não traz refeições. Peça ao seu coach um plano com a parte alimentar e
            importe de novo.
          </p>
        </section>
      ) : (
        <>
          {/* Único E3 da tela: a resposta do dia vem antes da lista (DESIGN_SYSTEM §5). */}
          <section
            className="mt-5 rounded-card border border-line bg-surface p-5 elev-focus"
            aria-label={`${progresso.done} de ${progresso.total} refeições feitas hoje.`}
          >
            <p className="text-[11px] uppercase tracking-wider text-faint">Refeições de hoje</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[52px] font-medium leading-none tracking-tight" aria-hidden>
                {progresso.done}
              </span>
              <span className="text-lg text-muted" aria-hidden>
                de {progresso.total}
              </span>
            </div>

            <div className="mt-4 flex gap-1" aria-hidden>
              {Array.from({ length: SEGMENTOS }, (_, i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i < preenchidos ? "var(--color-accent)" : "var(--color-surface2)",
                    transitionDuration: "var(--dur-fast)",
                  }}
                />
              ))}
            </div>

            {/* Só existe quando o plano traz kcal — nunca inventamos contagem calórica. */}
            {progresso.kcalDone != null && progresso.kcalPlanned != null ? (
              <p className="mt-3 text-xs text-muted">
                {formatKcal(progresso.kcalDone)} de {formatKcal(progresso.kcalPlanned)} kcal
                {diet.dailyKcal ? ` · meta do plano: ${formatKcal(diet.dailyKcal)}` : ""}
              </p>
            ) : diet.dailyKcal ? (
              <p className="mt-3 text-xs text-muted">
                Meta do plano: {formatKcal(diet.dailyKcal)} kcal por dia
              </p>
            ) : null}
          </section>

          {diet.macros ? (
            <section className="mt-3 grid grid-cols-3 gap-2">
              {[
                { rotulo: "Proteínas", valor: diet.macros.protein_g },
                { rotulo: "Carboidratos", valor: diet.macros.carbs_g },
                { rotulo: "Gorduras", valor: diet.macros.fat_g },
              ].map(({ rotulo, valor }) => (
                <div key={rotulo} className="rounded-xl bg-surface2 p-3 text-center">
                  <p className="text-[15px]">{valor} g</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-faint">{rotulo}</p>
                </div>
              ))}
            </section>
          ) : null}

          <section className="mt-5">
            <p className="px-1 text-[11px] uppercase tracking-wider text-faint">Refeições</p>
            <ul className="mt-2 flex flex-col gap-2">
              {meals.map((meal) => {
                const feita = done.includes(meal.id);
                const kcal = mealKcal(meal);
                return (
                  <li key={meal.id}>
                    <div className="rounded-card border border-line bg-surface p-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => alternar(meal.id)}
                          aria-pressed={feita}
                          aria-label={`Marcar ${meal.name} como feita`}
                          className={[
                            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-[0.96]",
                            feita
                              ? "border-accent bg-accent text-on-accent"
                              : "border-line text-faint hover:border-accent/40",
                          ].join(" ")}
                        >
                          <Check size={18} aria-hidden />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-[15px] leading-snug">{meal.name}</p>
                            {meal.time ? (
                              <span className="shrink-0 text-xs tabular-nums text-faint">
                                {meal.time}
                              </span>
                            ) : null}
                          </div>
                          {meal.items.length > 0 ? (
                            <ul className="mt-1.5 space-y-0.5">
                              {meal.items.map((item, i) => (
                                <li key={`${meal.id}-${i}`} className="text-xs text-muted">
                                  {item.qty != null ? `${item.qty}${item.unit ? ` ${item.unit}` : ""} · ` : ""}
                                  {item.food}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {meal.notes ? (
                            <p className="mt-2 text-xs leading-relaxed text-faint">{meal.notes}</p>
                          ) : null}
                        </div>
                      </div>
                      {kcal != null ? (
                        <p className="mt-3 border-t border-line/60 pt-2 text-right text-xs tabular-nums text-faint">
                          {formatKcal(kcal)} kcal
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            {/*
              Anti-culpa: nada de streak, nada de "você falhou". Marcar é registro, não
              cobrança — quem não marcou não é lembrado disso.
            */}
            <p className="mt-4 px-1 text-xs leading-relaxed text-faint">
              Marque o que você comeu. Isto fica só no seu aparelho.
            </p>
          </section>
        </>
      )}

      <BottomNav active="hoje" />
    </main>
  );
}
