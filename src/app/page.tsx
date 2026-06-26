"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, Dumbbell, Clock, Play, User, Utensils } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { MuscleArt } from "@/components/MuscleArt";
import { getTodayWorkout, greeting, todayIndex, weekDates, WEEK_DAYS } from "@/lib/plan/today";
import { getSessionsForPlan } from "@/lib/storage/sessions";

export default function HojePage() {
  const { loading, plan } = useActivePlan();
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());

  // Dias da semana com treino concluído (lê as sessões do período ativo).
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    getSessionsForPlan(plan.planId).then((sessions) => {
      if (cancelled) return;
      const done = new Set(sessions.filter((s) => s.status === "done").map((s) => s.date));
      setDoneDates(() => done);
    });
    return () => {
      cancelled = true;
    };
  }, [plan]);

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
        <div className="text-2xl font-medium tracking-tight">activve</div>
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
  const week = weekDates();
  const trainingDays = p.training.weekSchedule.filter((d) => d !== "rest").length;
  const mealsCount = p.diet.meals.length;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 text-sm font-medium text-accent">
          A
        </span>
        <span className="relative text-faint">
          <Bell size={20} aria-hidden />
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      </header>

      <div className="mt-5">
        <h1 className="text-[26px] font-medium leading-tight tracking-tight">
          {greeting()}
          {p.profile.name ? `, ${p.profile.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted">Como foi seu dia?</p>
      </div>

      {today.kind === "workout" ? (
        <section className="relative mt-5 overflow-hidden rounded-card border border-line bg-surface p-5">
          <div className="relative z-10 max-w-[62%]">
            <p className="text-[11px] uppercase tracking-wider text-faint">Treino de hoje</p>
            <h2 className="mt-1.5 text-[22px] font-medium leading-tight tracking-tight">
              {today.focus ?? today.name}
            </h2>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <Dumbbell size={16} aria-hidden /> {today.exerciseCount} exercícios
              </span>
              {p.profile.sessionMinutes ? (
                <span className="flex items-center gap-2">
                  <Clock size={16} aria-hidden /> ~{p.profile.sessionMinutes} min
                </span>
              ) : null}
            </div>
            <Link
              href="/treino"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
            >
              <Play size={15} aria-hidden /> Começar treino
            </Link>
          </div>
          <MuscleArt muscles={today.muscles} label={firstMuscleLabel(today.focus)} />
        </section>
      ) : (
        <section className="mt-5 rounded-card border border-line bg-surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Hoje</p>
          <h2 className="mt-1.5 text-[22px] font-medium tracking-tight">Dia de descanso</h2>
          <p className="mt-1.5 text-sm text-muted">Recuperar faz parte do plano.</p>
          <Link href="/treino" className="mt-4 inline-block text-sm text-accent">
            Quero treinar mesmo assim
          </Link>
        </section>
      )}

      <section className="mt-4 rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-faint">Seu ritmo nesta semana</p>
          <span className="text-xs text-muted">{trainingDays} treinos</span>
        </div>
        <p className="mt-2 text-sm text-muted">Constância é o que constrói.</p>
        <div className="mt-4 flex justify-between">
          {WEEK_DAYS.map((d, i) => {
            const isToday = i === ti;
            const entry = p.training.weekSchedule[i];
            const isRest = entry === "rest";
            const isDone = doneDates.has(week[i]);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    "flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-[11px]",
                    isDone || isToday
                      ? "bg-accent text-on-accent"
                      : isRest
                        ? "border border-line text-faint"
                        : "border border-accent/40 text-accent",
                  ].join(" ")}
                >
                  {isDone ? <Check size={14} aria-hidden /> : isRest ? d : entry}
                </div>
                <span className="text-[10px] text-faint">{d}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Card não-navegável até a tela /corpo existir (evita rota errada). */}
      <div className="mt-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-accent">
          <User size={18} aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Corpo</span>
          <span className="block text-xs text-muted">Acompanhe sua evolução</span>
        </span>
        <span className="text-[10px] uppercase tracking-wide text-faint">Em breve</span>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-accent">
          <Utensils size={18} aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Alimentação</span>
          <span className="block text-xs text-muted">Plano de hoje</span>
        </span>
        <span className="text-xs text-muted">{mealsCount} refeições</span>
      </div>

      <BottomNav active="hoje" />
    </main>
  );
}

function firstMuscleLabel(focus?: string): string {
  return focus ? focus.split(/[,·]/)[0].trim() : "Treino";
}
