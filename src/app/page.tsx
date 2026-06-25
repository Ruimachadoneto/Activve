"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActivePlan, type StoredPlan } from "@/lib/storage/plans";

type State = { loading: boolean; plan: StoredPlan | null };

export default function Home() {
  const [state, setState] = useState<State>({ loading: true, plan: null });

  useEffect(() => {
    getActivePlan()
      .then((plan) => setState({ loading: false, plan }))
      .catch(() => setState({ loading: false, plan: null }));
  }, []);

  if (state.loading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (!state.plan) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 text-center">
        <div className="text-2xl font-medium tracking-tight">Activve</div>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Seu plano. Seu ritmo. Comece importando o arquivo do seu plano.
        </p>
        <Link
          href="/import"
          className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
        >
          Importar plano
        </Link>
      </main>
    );
  }

  const { plan } = state.plan;
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-10 pt-8">
      <p className="text-xl font-medium tracking-tight">
        Olá{plan.profile.name ? `, ${plan.profile.name}` : ""}.
      </p>
      <p className="mt-1 text-sm text-muted">Plano importado e salvo neste aparelho.</p>

      <div className="mt-5 rounded-card border border-line bg-surface p-4">
        <p className="text-xs uppercase tracking-wider text-faint">Plano ativo</p>
        <p className="mt-1 text-lg font-medium">{plan.goal.summary ?? plan.training.split}</p>
        <div className="mt-3 flex gap-5 text-sm text-muted">
          <span>{plan.profile.daysPerWeek}x / semana</span>
          <span>{plan.training.workouts.length} treinos</span>
          {plan.diet.dailyKcal ? <span>{plan.diet.dailyKcal} kcal</span> : null}
        </div>
      </div>

      <Link href="/import" className="mt-4 text-sm text-accent">
        Importar outro plano
      </Link>

      <p className="mt-auto pt-8 text-xs text-faint">
        TASK-002 — import + validação + persistência local (IndexedDB).
      </p>
    </main>
  );
}
