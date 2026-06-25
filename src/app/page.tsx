"use client";

import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import {
  getTodayWorkout,
  greeting,
  experienceLabel,
  todayIndex,
  WEEK_DAYS,
} from "@/lib/plan/today";

export default function HojePage() {
  const { loading, plan } = useActivePlan();

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (!plan) {
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

  const p = plan.plan;
  const today = getTodayWorkout(p);
  const ti = todayIndex();
  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-8 pt-7">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">
            {greeting()}
            {p.profile.name ? (
              <>
                , <span className="text-accent">{p.profile.name}</span>
              </>
            ) : null}
            .
          </h1>
          <p className="mt-1 text-sm text-muted">Foco hoje, evolução sempre.</p>
        </div>
        <Bell size={20} className="mt-1 text-faint" aria-hidden />
      </header>

      {today.kind === "workout" ? (
        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-faint">Treino de hoje</span>
            <span className="rounded-lg border border-accent/30 px-2 py-0.5 text-xs text-accent">
              {today.workoutId}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">{today.focus ?? today.name}</h2>
          <p className="mt-1.5 text-sm text-muted">
            {today.exerciseCount} exercícios
            {p.profile.sessionMinutes ? ` · ~${p.profile.sessionMinutes} min` : ""} ·{" "}
            {experienceLabel(p.profile.experience)}
          </p>
          <Link
            href="/treino"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
          >
            Começar treino <ArrowRight size={16} aria-hidden />
          </Link>
        </section>
      ) : (
        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <span className="text-xs uppercase tracking-wider text-faint">Hoje</span>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">Dia de descanso</h2>
          <p className="mt-1.5 text-sm text-muted">
            Recuperar faz parte do plano. Volte amanhã com tudo.
          </p>
          <Link href="/treino" className="mt-4 inline-block text-sm text-accent">
            Quero treinar mesmo assim
          </Link>
        </section>
      )}

      <section className="mt-6">
        <p className="mb-3 text-sm font-medium">Sua semana</p>
        <div className="flex justify-between">
          {WEEK_DAYS.map((d, i) => {
            const isToday = i === ti;
            const isRest = p.training.weekSchedule[i] === "rest";
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs",
                    isToday
                      ? "bg-accent text-on-accent"
                      : isRest
                        ? "text-faint"
                        : "border border-line text-muted",
                  ].join(" ")}
                >
                  {d}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-faint capitalize">{dateStr}</p>
      </section>

      <BottomNav active="hoje" />
    </main>
  );
}
