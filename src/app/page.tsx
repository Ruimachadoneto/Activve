"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Clock,
  Gauge,
  Play,
  Target,
  User,
  Utensils,
} from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { MuscleArt } from "@/components/MuscleArt";
import { Logo } from "@/components/Logo";
import { ExerciseThumb } from "@/components/ExerciseMediaCard";
import { resolveExerciseMedia } from "@/lib/plan/exerciseMedia";
import { equipmentLabel } from "@/lib/plan/labels";
import {
  estimateWorkoutMinutes,
  experienceLabel,
  getTodayWorkout,
  greeting,
  todayIndex,
  weekDates,
  workoutBadge,
  WEEK_DAYS,
} from "@/lib/plan/today";
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
        <Logo size="lg" tagline />
        <p className="mt-6 max-w-xs text-sm text-muted">
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
  const doneThisWeek = week.filter((d) => doneDates.has(d)).length;
  const trainingDays = p.training.weekSchedule.filter((d) => d !== "rest").length;
  const mealsCount = p.diet.meals.length;

  const todayWorkout =
    today.kind === "workout"
      ? p.training.workouts.find((w) => w.id === today.workoutId)
      : undefined;
  const minutes = todayWorkout
    ? (p.profile.sessionMinutes ?? estimateWorkoutMinutes(todayWorkout))
    : null;
  // Só equipamentos CONHECIDOS: `equipment` omitido é desconhecido, não "livre" —
  // afirmar "Livre" pro usuário seria converter incerteza em promessa.
  const equipmentList = todayWorkout
    ? [
        ...new Set(
          todayWorkout.exercises
            .map((e) => e.equipment)
            .filter((eq): eq is NonNullable<typeof eq> => Boolean(eq))
            .map((eq) => equipmentLabel(eq)),
        ),
      ]
    : [];
  const badge = today.kind === "workout" ? workoutBadge(today.workoutId) : null;

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
          {p.profile.name ? (
            <>
              , <span className="text-accent">{p.profile.name}.</span>
            </>
          ) : (
            "."
          )}
        </h1>
        <p className="mt-1 text-sm text-muted">Foco agora, resultados sempre.</p>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
        <CheckCircle2 size={16} aria-hidden className="shrink-0 text-accent" />
        <span className="shrink-0 text-sm">Plano importado</span>
        {/* split é texto livre do plano — precisa poder encolher/truncar em 375px */}
        <span className="ml-auto min-w-0 truncate text-right text-xs text-muted">
          {p.training.split} · {trainingDays}x por semana
        </span>
      </div>

      {today.kind === "workout" ? (
        <>
          <section className="relative mt-5 overflow-hidden rounded-card border border-line bg-surface p-5">
            <div className="relative z-10 max-w-[62%]">
              <div className="flex items-center gap-2">
                {badge ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-accent/15 px-1 text-[11px] font-medium text-accent">
                    {badge}
                  </span>
                ) : null}
                <p className="text-[11px] uppercase tracking-wider text-faint">Seu treino de hoje</p>
              </div>
              <h2 className="mt-2 text-[22px] font-medium leading-tight tracking-tight">
                {today.name}
              </h2>
              <div className="mt-4 space-y-2 text-sm text-muted">
                <span className="flex items-center gap-2">
                  <Dumbbell size={16} aria-hidden /> {today.exerciseCount} exercícios
                </span>
                {minutes ? (
                  <span className="flex items-center gap-2">
                    <Clock size={16} aria-hidden /> ~{minutes} min
                  </span>
                ) : null}
                <span className="flex items-center gap-2">
                  <Gauge size={16} aria-hidden /> {experienceLabel(p.profile.experience)}
                </span>
              </div>
              <Link
                href="/treino"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98]"
              >
                <Play size={15} aria-hidden /> Começar treino
              </Link>
            </div>
            <MuscleArt muscles={today.muscles} label={firstMuscleLabel(today.focus)} />
          </section>

          {today.focus ? (
            <section className="mt-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-accent">
                <Target size={17} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-faint">
                  Foco do dia
                </span>
                <span className="mt-0.5 block text-sm">{today.focus}</span>
              </span>
            </section>
          ) : null}

          {todayWorkout && todayWorkout.exercises.length > 0 ? (
            <section className="mt-4 rounded-card border border-line bg-surface p-4">
              <p className="px-1 text-[11px] uppercase tracking-wider text-faint">Exercícios</p>
              <div className="mt-2 flex flex-col">
                {todayWorkout.exercises.map((ex, i) => (
                  <Link
                    key={ex.id}
                    href="/treino"
                    className={`flex items-center gap-3 rounded-xl px-1 py-2.5 active:bg-surface2 ${
                      i > 0 ? "border-t border-line/60" : ""
                    }`}
                  >
                    <span className="w-4 text-center text-xs tabular-nums text-faint">{i + 1}</span>
                    <ExerciseThumb media={resolveExerciseMedia(ex.name)} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{ex.name}</span>
                      <span className="block text-xs text-muted">
                        {ex.sets} séries · {ex.reps}
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden className="shrink-0 text-faint" />
                  </Link>
                ))}
              </div>
              {equipmentList.length > 0 ? (
                <p className="mt-2 flex items-start gap-1.5 px-1 text-xs leading-relaxed text-faint">
                  <Check size={13} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">Equipamentos: {equipmentList.join(", ")}</span>
                </p>
              ) : null}
            </section>
          ) : null}
        </>
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
          <span className="text-xs text-muted">
            {doneThisWeek} de {trainingDays} treinos
          </span>
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
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${trainingDays ? (doneThisWeek / trainingDays) * 100 : 0}%` }}
          />
        </div>
      </section>

      <Link
        href="/corpo"
        className="mt-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-accent">
          <User size={18} aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Corpo</span>
          <span className="block text-xs text-muted">Acompanhe sua evolução</span>
        </span>
        <ChevronRight size={18} className="text-faint" aria-hidden />
      </Link>

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
