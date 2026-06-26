"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, Minus, Plus, Info } from "lucide-react";
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
import { resolveMovement } from "@/lib/plan/movement";
import { equipmentLabel } from "@/lib/plan/labels";
import { ExerciseSheet } from "@/components/ExerciseSheet";

const LOAD_STEP = 2.5;
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function TreinoPage() {
  const { loading, plan } = useActivePlan();
  const [selected, setSelected] = useState<string | null>(null);
  const [stored, setStored] = useState<WorkoutSession | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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

  function patchExercise(exerciseId: string, patch: Partial<WorkoutSession["exercises"][number]>) {
    if (!session) return;
    const next: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)),
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

  const openExercise = openId ? (workout.exercises.find((e) => e.id === openId) ?? null) : null;
  const openLog = openExercise
    ? session.exercises.find((e) => e.exerciseId === openExercise.id)
    : undefined;

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

      {workout.exercises.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-surface p-4 text-center text-sm text-muted">
          Este treino ainda não tem exercícios no plano.
        </p>
      ) : (
        <>
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
          const mov = resolveMovement(ex, log?.swappedToId);
          return (
            <article key={ex.id} className="rounded-card border border-line bg-surface p-4">
              <button
                onClick={() => setOpenId(ex.id)}
                aria-label={`Como fazer: ${mov.name}`}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">{mov.name}</span>
                  {mov.isSwapped ? (
                    <span className="text-[10px] uppercase tracking-wide text-accent">trocado</span>
                  ) : null}
                  <Info size={14} className="text-faint" aria-hidden />
                </span>
                <span className="shrink-0 text-xs text-faint">
                  {equipmentLabel(mov.equipment)} · {ex.sets}×{ex.reps}
                </span>
              </button>

              <div className="mt-3 flex flex-col gap-2">
                {log?.sets.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 text-center text-xs text-faint">{i + 1}</span>
                    <NumberStepper
                      value={s.reps ?? 0}
                      step={1}
                      inputMode="numeric"
                      label="reps"
                      onChange={(n) => patchSet(ex.id, i, { reps: Math.round(n) })}
                    />
                    <NumberStepper
                      value={s.load_kg ?? 0}
                      step={LOAD_STEP}
                      inputMode="decimal"
                      suffix="kg"
                      label="carga"
                      onChange={(n) => patchSet(ex.id, i, { load_kg: round1(n) })}
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

              <textarea
                value={log?.note ?? ""}
                onChange={(e) => patchExercise(ex.id, { note: e.target.value })}
                placeholder="Observações (ex.: troquei por supino máquina)"
                rows={2}
                className="mt-3 w-full resize-none rounded-lg border border-line bg-surface2/30 px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/50"
              />
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
        </>
      )}

      {openExercise && (
        <ExerciseSheet
          exercise={openExercise}
          swappedToId={openLog?.swappedToId}
          onSwap={(altId) => patchExercise(openExercise.id, { swappedToId: altId })}
          onClose={() => setOpenId(null)}
        />
      )}

      <BottomNav active="treino" />
    </main>
  );
}

/** Stepper + entrada por teclado numérico (mantém o valor enquanto digita, normaliza no blur). */
function NumberStepper({
  value,
  onChange,
  step,
  inputMode,
  suffix,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  step: number;
  inputMode: "numeric" | "decimal";
  suffix?: string;
  label: string;
}) {
  const [text, setText] = useState(() => String(value));
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  // Sincroniza com mudança externa (stepper) só quando NÃO está digitando — senão o
  // valor normalizado colapsa estados decimais intermediários (ex.: "42.") e impede
  // digitar cargas como 42,5 pelo teclado.
  if (value !== prev && !focused) {
    setPrev(value);
    setText(String(value));
  }

  const commit = (n: number) => onChange(Math.max(0, n));

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => commit(round1(value - step))}
        aria-label={`Diminuir ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted active:bg-surface2"
      >
        <Minus size={14} aria-hidden />
      </button>
      <span className="inline-flex items-baseline">
        <input
          value={text}
          inputMode={inputMode}
          aria-label={label}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value.replace(",", "."));
            if (!Number.isNaN(n)) commit(n);
          }}
          onBlur={() => {
            setFocused(false);
            const n = parseFloat(text.replace(",", "."));
            const v = Number.isNaN(n) ? 0 : Math.max(0, n);
            commit(v);
            setText(String(v));
          }}
          className="w-9 bg-transparent text-center text-sm tabular-nums outline-none focus:text-accent"
        />
        {suffix ? <span className="text-xs text-faint">{suffix}</span> : null}
      </span>
      <button
        onClick={() => commit(round1(value + step))}
        aria-label={`Aumentar ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted active:bg-surface2"
      >
        <Plus size={14} aria-hidden />
      </button>
    </div>
  );
}
