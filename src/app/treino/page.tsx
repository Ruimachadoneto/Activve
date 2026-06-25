"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { getTodayWorkout } from "@/lib/plan/today";
import { BottomNav } from "@/components/BottomNav";

const EQUIP_LABEL: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Halteres",
  machine: "Máquina",
  cable: "Cabo",
  bodyweight: "Peso do corpo",
  band: "Elástico",
  kettlebell: "Kettlebell",
  other: "Outro",
};

export default function TreinoPage() {
  const { loading, plan } = useActivePlan();
  const [selected, setSelected] = useState<string | null>(null);

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
        <p className="text-sm text-muted">Nenhum plano importado ainda.</p>
        <Link href="/import" className="mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent">
          Importar plano
        </Link>
      </main>
    );
  }

  const p = plan.plan;
  const today = getTodayWorkout(p);
  const activeId =
    selected ?? (today.kind === "workout" ? today.workoutId : p.training.workouts[0].id);
  const workout = p.training.workouts.find((w) => w.id === activeId) ?? p.training.workouts[0];

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-8 pt-7">
      <header className="flex items-center gap-2">
        <Link href="/" aria-label="Voltar" className="text-muted">
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <h1 className="text-xl font-medium tracking-tight">Treino</h1>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {p.training.workouts.map((w) => {
          const isActive = w.id === activeId;
          return (
            <button
              key={w.id}
              onClick={() => setSelected(w.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {w.id} · {w.focus ?? w.name}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs uppercase tracking-wider text-faint">
        {workout.name} · {workout.exercises.length} exercícios
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        {workout.exercises.map((ex) => (
          <article key={ex.id} className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{ex.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {ex.equipment ? EQUIP_LABEL[ex.equipment] ?? ex.equipment : "Livre"} · descanso{" "}
                  {ex.rest_s}s
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-accent">
                {ex.sets} × {ex.reps}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {ex.primaryMuscles.map((m) => (
                <span key={m} className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] text-muted">
                  {m}
                </span>
              ))}
              <span className="ml-auto text-[11px] text-faint">
                {ex.alternatives.length} variações
              </span>
            </div>
          </article>
        ))}
        {workout.exercises.length === 0 && (
          <p className="rounded-card border border-line bg-surface p-4 text-sm text-muted">
            Este treino ainda não tem exercícios no plano.
          </p>
        )}
      </div>

      <BottomNav active="treino" />
    </main>
  );
}
