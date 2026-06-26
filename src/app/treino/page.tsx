"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, Minus, Plus } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { getTodayWorkout } from "@/lib/plan/today";
import { BottomNav } from "@/components/BottomNav";
import {
  createSession,
  sessionProgress,
  completeSession,
  isoDate,
  type WorkoutSession,
} from "@/lib/plan/session";
import { getSession, saveSession } from "@/lib/storage/sessions";

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

const LOAD_STEP = 2.5;
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function TreinoPage() {
  const { loading, plan } = useActivePlan();
  const [selected, setSelected] = useState<string | null>(null);
  const [stored, setStored] = useState<WorkoutSession | null>(null);

  const p = plan?.plan;
  const planId = plan?.planId ?? null;
  const hasWorkouts = !!p && p.training.workouts.length > 0;

  const today = p ? getTodayWorkout(p) : null;
  const activeId =
    selected ??
    (today?.kind === "workout" ? today.workoutId : p?.training.workouts[0]?.id) ??
    null;
  const workout = p?.training.workouts.find((w) => w.id === activeId) ?? p?.training.workouts[0];

  // Rascunho da sessão do dia (em memória, não salvo até interagir).
  const draft = useMemo(
    () => (planId && workout ? createSession(planId, workout, isoDate()) : null),
    // workout muda de identidade a cada render; basta reagir ao id
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planId, workout?.id],
  );

  // Retoma a sessão salva do IndexedDB (sistema externo) quando o treino muda.
  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    getSession(draft.sessionId).then((saved) => {
      if (cancelled || !saved) return;
      setStored((prev) => (prev && prev.sessionId === saved.sessionId ? prev : saved));
    });
    return () => {
      cancelled = true;
    };
  }, [draft]);

  // Sessão efetiva: a salva (se for deste treino) ou o rascunho.
  const session = stored && draft && stored.sessionId === draft.sessionId ? stored : draft;

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (!plan || !p) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Nenhum plano importado ainda.</p>
        <Link href="/import" className="mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent">
          Importar plano
        </Link>
      </main>
    );
  }

  if (!hasWorkouts || !workout || !session) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Este plano não tem treinos.</p>
      </main>
    );
  }

  const progress = sessionProgress(session);
  const isDone = session.status === "done";

  function patchSet(
    exerciseId: string,
    setIdx: number,
    patch: Partial<WorkoutSession["exercises"][number]["sets"][number]>,
  ) {
    if (!session) return;
    const next: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: e.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)) }
          : e,
      ),
    };
    setStored(next);
    void saveSession(next);
  }

  function concluir() {
    if (!session) return;
    const next = completeSession(session);
    setStored(next);
    void saveSession(next);
  }

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
          const isActive = w.id === workout.id;
          return (
            <button
              key={w.id}
              onClick={() => setSelected(w.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition-colors ${
                isActive ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-ink"
              }`}
            >
              {w.id} · {w.focus ?? w.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="uppercase tracking-wider text-faint">{workout.name}</span>
          <span className="text-muted">
            {progress.doneSets} de {progress.totalSets} séries
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress.totalSets ? (progress.doneSets / progress.totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {workout.exercises.map((ex) => {
          const log = session.exercises.find((e) => e.exerciseId === ex.id);
          return (
            <article key={ex.id} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{ex.name}</h3>
                <span className="shrink-0 text-xs text-faint">
                  {ex.equipment ? EQUIP_LABEL[ex.equipment] ?? ex.equipment : "Livre"} · {ex.sets}×{ex.reps}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {log?.sets.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 text-center text-xs text-faint">{i + 1}</span>
                    <Stepper
                      value={s.reps ?? 0}
                      label="reps"
                      onDec={() => patchSet(ex.id, i, { reps: Math.max(0, (s.reps ?? 0) - 1) })}
                      onInc={() => patchSet(ex.id, i, { reps: (s.reps ?? 0) + 1 })}
                    />
                    <Stepper
                      value={s.load_kg ?? 0}
                      suffix="kg"
                      label="carga"
                      onDec={() => patchSet(ex.id, i, { load_kg: Math.max(0, round1((s.load_kg ?? 0) - LOAD_STEP)) })}
                      onInc={() => patchSet(ex.id, i, { load_kg: round1((s.load_kg ?? 0) + LOAD_STEP) })}
                    />
                    <button
                      onClick={() => patchSet(ex.id, i, { done: !s.done })}
                      aria-pressed={s.done}
                      aria-label={`Série ${i + 1} feita`}
                      className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        s.done ? "border-accent bg-accent text-on-accent" : "border-line text-faint"
                      }`}
                    >
                      <Check size={16} aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {isDone ? (
        <p className="mt-5 rounded-xl bg-accent/10 px-4 py-3 text-center text-sm font-medium text-accent">
          Treino concluído — bom trabalho 💪
        </p>
      ) : (
        <button
          onClick={concluir}
          className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
        >
          Concluir treino{progress.allDone ? "" : ` · ${progress.doneSets}/${progress.totalSets}`}
        </button>
      )}

      <BottomNav active="treino" />
    </main>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
  suffix,
  label,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onDec}
        aria-label={`Diminuir ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted active:bg-surface2"
      >
        <Minus size={14} aria-hidden />
      </button>
      <span className="min-w-12 text-center text-sm tabular-nums">
        {value}
        {suffix ? <span className="text-xs text-faint"> {suffix}</span> : null}
      </span>
      <button
        onClick={onInc}
        aria-label={`Aumentar ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted active:bg-surface2"
      >
        <Plus size={14} aria-hidden />
      </button>
    </div>
  );
}
