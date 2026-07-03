"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { getTodayWorkout } from "@/lib/plan/today";
import { BottomNav } from "@/components/BottomNav";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { RestTimer } from "@/components/RestTimer";
import { ExerciseMediaCard, ExerciseThumb, PreloadImages } from "@/components/ExerciseMediaCard";
import { resolveMovement, videoHref } from "@/lib/plan/movement";
import { resolveExerciseMedia } from "@/lib/plan/exerciseMedia";
import { equipmentLabel } from "@/lib/plan/labels";
import {
  createSession,
  sessionProgress,
  completeSession,
  clampRpe,
  previousPerformance,
  RPE_MIN,
  RPE_MAX,
  isoDate,
  type WorkoutSession,
} from "@/lib/plan/session";
import { getSession, saveSession, getAllSessions } from "@/lib/storage/sessions";

const LOAD_STEP = 2.5;
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function TreinoPage() {
  const { loading, plan } = useActivePlan();
  const [selected, setSelected] = useState<string | null>(null);
  const [stored, setStored] = useState<WorkoutSession | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [restToken, setRestToken] = useState(0);
  const [restOpen, setRestOpen] = useState(false);
  const [allSetsOpen, setAllSetsOpen] = useState(false);
  const [history, setHistory] = useState<WorkoutSession[]>([]);

  const p = plan?.plan;
  const planId = plan?.planId ?? null;
  const hasWorkouts = !!p && p.training.workouts.length > 0;

  const today = p ? getTodayWorkout(p) : null;
  const activeId =
    selected ??
    (today?.kind === "workout" ? today.workoutId : p?.training.workouts[0]?.id) ??
    null;
  const workout = p?.training.workouts.find((w) => w.id === activeId) ?? p?.training.workouts[0];

  const draft = useMemo(
    () => (planId && workout ? createSession(planId, workout, isoDate()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planId, workout?.id],
  );

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

  // Histórico para o "Última vez" (memória de progressão). É GLOBAL, não por plano:
  // a continuidade do produto é por exercise.id entre planos/períodos (ADR-002), então
  // importar um plano novo não pode zerar a memória de carga.
  useEffect(() => {
    let cancelled = false;
    getAllSessions().then((list) => {
      if (!cancelled) setHistory(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (!hasWorkouts || !workout || !session || workout.exercises.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-sm text-muted">Este treino ainda não tem exercícios no plano.</p>
        <Link href="/" className="text-sm text-accent">
          Voltar ao Hoje
        </Link>
      </main>
    );
  }

  const total = workout.exercises.length;
  const idx = Math.min(current, total - 1);
  const ex = workout.exercises[idx];
  const log = session.exercises.find((e) => e.exerciseId === ex.id);
  const mov = resolveMovement(ex, log?.swappedToId);
  const media = resolveExerciseMedia(mov.name);
  const progress = sessionProgress(session);
  const activeSet = log ? log.sets.findIndex((s) => !s.done) : -1;
  const activeLog = activeSet >= 0 ? log?.sets[activeSet] : undefined;

  const nextEx = idx < total - 1 ? workout.exercises[idx + 1] : null;
  const nextLog = nextEx ? session.exercises.find((e) => e.exerciseId === nextEx.id) : null;
  const nextMov = nextEx ? resolveMovement(nextEx, nextLog?.swappedToId ?? undefined) : null;
  const nextMedia = nextMov ? resolveExerciseMedia(nextMov.name) : null;

  // "Última vez": o que foi feito nesta série no treino anterior (progressão consciente),
  // comparando o MESMO movimento (variação escolhida conta — carga de outra variação não serve).
  const prevPerf = previousPerformance(
    history,
    ex.id,
    activeSet >= 0 ? activeSet : 0,
    session.sessionId,
    log?.swappedToId ?? ex.id,
  );

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

  function startRest() {
    setRestToken((t) => t + 1);
    setRestOpen(true);
  }

  function concluirSerie() {
    if (activeSet === -1) return;
    patchSet(ex.id, activeSet, { done: true });
    startRest();
  }

  function toggleSetDone(i: number, currentDone: boolean) {
    patchSet(ex.id, i, { done: !currentDone });
    if (!currentDone) startRest();
  }

  function concluirTreino() {
    if (!session) return;
    const next = completeSession(session);
    setStored(next);
    void saveSession(next);
  }

  const allDone = progress.allDone;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-8 pt-6">
      <header>
        <div className="flex items-center justify-between gap-2">
          <Link href="/" aria-label="Voltar" className="text-muted">
            <ChevronLeft size={22} aria-hidden />
          </Link>
          <p className="text-sm font-medium leading-tight">{workout.name}</p>
          <span className="w-[22px]" aria-hidden />
        </div>
        {/* Progresso do treino: exercício atual sobre o total */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="text-[11px] tabular-nums text-faint">
            {idx + 1}/{total}
          </span>
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-surface2"
            role="progressbar"
            aria-label="Progresso do treino"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={idx + 1}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {p.training.workouts.length > 1 ? (
        <div className="mt-3 flex justify-center gap-2">
          {p.training.workouts.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setSelected(w.id);
                setCurrent(0);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                w.id === workout.id ? "border-accent text-accent" : "border-line text-faint"
              }`}
            >
              {w.id}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-faint">Exercício atual</p>
          <h1 className="mt-1 text-[22px] font-medium leading-tight tracking-tight">{mov.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {equipmentLabel(mov.equipment)} · {ex.sets} × {ex.reps}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenId(ex.id)}
          aria-label="Como fazer e variações"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted active:bg-surface2"
        >
          <BookOpen size={16} aria-hidden />
        </button>
      </div>

      <ExerciseMediaCard media={media} videoUrl={videoHref(mov)} alt={`Demonstração: ${mov.name}`} />

      {/* Série atual em foco (mockup: SÉRIE X DE N + steppers grandes) */}
      <section className="mt-4 rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-surface2 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted">
            {activeSet === -1 ? "Séries concluídas" : `Série ${activeSet + 1} de ${log?.sets.length ?? ex.sets}`}
          </span>
          {ex.effortTarget ? (
            <span className="rounded-md border border-line px-2 py-1 text-[10px] uppercase tracking-wider text-faint">
              RPE {ex.effortTarget}
            </span>
          ) : null}
        </div>

        {prevPerf && activeSet !== -1 ? (
          <p className="mt-3 text-center text-xs text-muted">
            Última vez:{" "}
            <span className="font-medium text-ink">
              {prevPerf.load_kg != null ? `${prevPerf.load_kg} kg` : "—"}
              {prevPerf.reps != null ? ` × ${prevPerf.reps}` : ""}
            </span>
          </p>
        ) : null}

        {activeSet !== -1 && activeLog ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-faint">Carga (kg)</span>
              <Stepper
                size="lg"
                value={activeLog.load_kg ?? 0}
                label="carga da série atual"
                onChange={(n) => patchSet(ex.id, activeSet, { load_kg: round1(n) })}
                step={LOAD_STEP}
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-faint">Repetições</span>
              <Stepper
                size="lg"
                value={activeLog.reps ?? 0}
                label="repetições da série atual"
                onChange={(n) => patchSet(ex.id, activeSet, { reps: Math.round(n) })}
                step={1}
                inputMode="numeric"
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-muted">
            Todas as séries deste exercício foram feitas. 💪
          </p>
        )}

        <button
          type="button"
          onClick={concluirSerie}
          disabled={activeSet === -1}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98] disabled:opacity-40"
        >
          {activeSet === -1 ? "Exercício concluído" : "Concluir série"}
          <Check size={16} aria-hidden />
        </button>
      </section>

      {/* Todas as séries (tabela completa, com RPE e ✓ por linha) */}
      <section className="mt-3 rounded-card border border-line bg-surface">
        <button
          type="button"
          onClick={() => setAllSetsOpen((v) => !v)}
          aria-expanded={allSetsOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[11px] uppercase tracking-wider text-faint">Todas as séries</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            {log ? `${log.sets.filter((s) => s.done).length}/${log.sets.length}` : ""}
            <ChevronDown
              size={16}
              aria-hidden
              className={`transition-transform ${allSetsOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
        {allSetsOpen ? (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-1.5 px-1 text-[10px] uppercase tracking-wider text-faint">
              <span className="w-4">Série</span>
              <span className="flex-1 text-center">KG</span>
              <span className="flex-1 text-center">Reps</span>
              <span className="w-9 text-center">RPE</span>
              <span className="w-7" />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {log?.sets.map((s, i) => {
                const isActive = i === activeSet;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 rounded-xl px-1 py-1.5 ${
                      isActive ? "bg-accent/5" : ""
                    }`}
                  >
                    <span
                      className={`w-4 text-center text-xs ${isActive ? "font-medium text-accent" : "text-faint"}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex flex-1 justify-center">
                      <Stepper
                        value={s.load_kg ?? 0}
                        label={`carga da série ${i + 1}`}
                        onChange={(n) => patchSet(ex.id, i, { load_kg: round1(n) })}
                        step={LOAD_STEP}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex flex-1 justify-center">
                      <Stepper
                        value={s.reps ?? 0}
                        label={`repetições da série ${i + 1}`}
                        onChange={(n) => patchSet(ex.id, i, { reps: Math.round(n) })}
                        step={1}
                        inputMode="numeric"
                      />
                    </div>
                    <RpeInput
                      value={s.rpe}
                      label={`RPE da série ${i + 1}`}
                      onCommit={(rpe) => patchSet(ex.id, i, { rpe })}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSetDone(i, s.done)}
                      aria-pressed={s.done}
                      aria-label={`Série ${i + 1} feita`}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        s.done ? "border-accent bg-accent text-on-accent" : "border-line text-faint"
                      }`}
                    >
                      <Check size={14} aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-4">
        <label htmlFor="exercise-note" className="text-[10px] uppercase tracking-wider text-faint">
          Observações
        </label>
        <textarea
          id="exercise-note"
          value={log?.note ?? ""}
          onChange={(e) => patchExercise(ex.id, { note: e.target.value })}
          placeholder="Ex.: troquei por supino máquina, ombro reclamou na última."
          rows={2}
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent/50"
        />
      </div>

      {/* Próximo exercício (mockup) ou fechamento do treino */}
      {nextMedia ? <PreloadImages urls={nextMedia.imageUrls} /> : null}
      {nextEx && nextMov ? (
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
          className="mt-4 flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-left active:bg-surface2"
        >
          <ExerciseThumb media={nextMedia} className="h-12 w-12 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wider text-faint">
              Próximo exercício
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">{nextMov.name}</span>
            <span className="block text-xs text-muted">{nextEx.sets} séries</span>
          </span>
          <ChevronRight size={18} aria-hidden className="shrink-0 text-faint" />
        </button>
      ) : (
        <button
          type="button"
          onClick={concluirTreino}
          disabled={session.status === "done"}
          className="mt-4 w-full rounded-card border border-accent/40 bg-accent/10 p-4 text-sm font-medium text-accent transition-colors active:bg-accent/20 disabled:opacity-60"
        >
          {session.status === "done"
            ? "Treino concluído 💪"
            : `Concluir treino${allDone ? "" : ` (${progress.doneSets}/${progress.totalSets} séries)`}`}
        </button>
      )}

      {/* Variações inline (mockup base): original + alternativas, com thumbnail */}
      {ex.alternatives.length > 0 ? (
        <section className="mt-5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] uppercase tracking-wider text-faint">Variações</p>
            <button type="button" onClick={() => setOpenId(ex.id)} className="text-xs text-accent">
              Como fazer ›
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {[{ id: undefined as string | undefined, name: ex.name, equipment: ex.equipment },
              ...ex.alternatives.map((a) => ({ id: a.id as string | undefined, name: a.name, equipment: a.equipment }))].map(
              (opt) => {
                const selectedOpt = (log?.swappedToId ?? undefined) === opt.id;
                return (
                  <button
                    key={opt.id ?? "__original"}
                    type="button"
                    onClick={() => patchExercise(ex.id, { swappedToId: opt.id })}
                    aria-pressed={selectedOpt}
                    className={`flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors ${
                      selectedOpt ? "border-accent/60 bg-accent/5" : "border-line bg-surface active:bg-surface2"
                    }`}
                  >
                    <ExerciseThumb
                      media={resolveExerciseMedia(opt.name)}
                      className="h-11 w-11 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{opt.name}</span>
                      <span className="block text-xs text-muted">
                        {equipmentLabel(opt.equipment)}
                        {opt.id === undefined ? " · original" : ""}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selectedOpt ? "border-accent bg-accent text-on-accent" : "border-line text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={idx === 0}
          className="flex items-center gap-1 text-muted disabled:opacity-30"
        >
          <ChevronLeft size={16} aria-hidden /> Anterior
        </button>
        {idx === total - 1 ? (
          <button
            type="button"
            onClick={concluirTreino}
            disabled={session.status === "done"}
            className="text-accent disabled:opacity-50"
          >
            {session.status === "done" ? "Treino concluído 💪" : "Concluir treino"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="flex items-center gap-1 text-muted"
          >
            Próximo <ChevronRight size={16} aria-hidden />
          </button>
        )}
      </div>

      {openId && log ? (
        <ExerciseSheet
          exercise={ex}
          swappedToId={log.swappedToId}
          onSwap={(altId) => patchExercise(ex.id, { swappedToId: altId })}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      <RestTimer
        open={restOpen}
        onClose={() => setRestOpen(false)}
        seconds={ex.rest_s ?? 60}
        runToken={restToken}
      />

      <BottomNav active="treino" />
    </main>
  );
}

/**
 * Input de RPE (esforço percebido) restrito ao domínio 6–10. Mantém um buffer de
 * texto para permitir digitar "10" sem o clamp atrapalhar no meio; só persiste
 * valor válido (durante a digitação) e grampeia no blur. Vazio → undefined.
 */
function RpeInput({
  value,
  label,
  onCommit,
}: {
  value: number | undefined;
  label: string;
  onCommit: (rpe: number | undefined) => void;
}) {
  const [text, setText] = useState(() => (value == null ? "" : String(value)));
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  if (value !== prev && !focused) {
    setPrev(value);
    setText(value == null ? "" : String(value));
  }

  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={text}
      placeholder="—"
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value.trim() === "") {
          onCommit(undefined);
          return;
        }
        const n = parseInt(e.target.value, 10);
        // Só persiste em tempo real quando já está na faixa; o resto espera o blur.
        if (!Number.isNaN(n) && n >= RPE_MIN && n <= RPE_MAX) onCommit(n);
      }}
      onBlur={() => {
        setFocused(false);
        const raw = text.trim() === "" ? undefined : parseInt(text, 10);
        const rpe = clampRpe(Number.isNaN(raw as number) ? undefined : raw);
        onCommit(rpe);
        setText(rpe == null ? "" : String(rpe));
      }}
      className="w-9 rounded-lg bg-surface2/40 py-1 text-center text-sm tabular-nums outline-none placeholder:text-faint focus:text-accent"
    />
  );
}

function Stepper({
  value,
  onChange,
  step,
  inputMode,
  suffix,
  label,
  size = "sm",
}: {
  value: number;
  onChange: (n: number) => void;
  step: number;
  inputMode: "numeric" | "decimal";
  suffix?: string;
  label: string;
  size?: "sm" | "lg";
}) {
  const [text, setText] = useState(() => String(value));
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  if (value !== prev && !focused) {
    setPrev(value);
    setText(String(value));
  }
  const commit = (n: number) => onChange(Math.max(0, n));
  const lg = size === "lg";

  return (
    <div className={`flex items-center ${lg ? "gap-1.5" : "gap-1"}`}>
      <button
        type="button"
        onClick={() => commit(round1(value - step))}
        aria-label={`Diminuir ${label}`}
        className={`flex shrink-0 items-center justify-center rounded-full border border-line text-muted active:bg-surface2 ${
          lg ? "h-9 w-9" : "h-6 w-6"
        }`}
      >
        <Minus size={lg ? 16 : 12} aria-hidden />
      </button>
      <span className="inline-flex items-center gap-1">
        {/* Campo digitável de verdade (o usuário pode preferir o teclado aos botões ±) —
            visual de input para o affordance ficar óbvio, sem estourar a largura do card. */}
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
          className={`rounded-lg border bg-surface2/40 text-center tabular-nums outline-none transition-colors focus:border-accent/60 focus:text-accent ${
            lg ? "h-11 w-14 border-line text-xl font-medium" : "h-7 w-10 border-transparent text-sm"
          }`}
        />
        {suffix ? <span className="text-xs text-faint">{suffix}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => commit(round1(value + step))}
        aria-label={`Aumentar ${label}`}
        className={`flex shrink-0 items-center justify-center rounded-full border border-line text-muted active:bg-surface2 ${
          lg ? "h-9 w-9" : "h-6 w-6"
        }`}
      >
        <Plus size={lg ? 16 : 12} aria-hidden />
      </button>
    </div>
  );
}
