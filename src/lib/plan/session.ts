/**
 * Modelo de execução de treino (local-first). Uma sessão = uma execução de um treino
 * num dia. Logs casados por `exercise.id` (continuidade entre planos/períodos).
 * Camada pura — sem IndexedDB aqui (ver src/lib/storage/sessions.ts).
 */

export type SetLog = {
  done: boolean;
  reps?: number;
  load_kg?: number;
  rpe?: number; // esforço percebido (6–10), opcional
};

export type ExerciseLog = {
  exerciseId: string;
  sets: SetLog[];
  /** Observação livre do usuário (ex.: "troquei por supino máquina, não tinha banco"). */
  note?: string;
  /** Id da variação escolhida (ausente = exercício original). Só muda o movimento. */
  swappedToId?: string;
};

export type WorkoutSession = {
  sessionId: string;
  planId: string;
  workoutId: string;
  date: string; // yyyy-mm-dd (dia executado; agenda é flexível)
  status: "in_progress" | "done";
  startedAt: string;
  completedAt?: string;
  exercises: ExerciseLog[];
};

/** Subconjunto estrutural do workout do plano necessário para iniciar uma sessão. */
type WorkoutLike = {
  id: string;
  exercises: { id: string; sets: number; reps?: string; load_kg?: number; effortTarget?: number }[];
};

/** Data local em yyyy-mm-dd (não usa UTC pra não "virar o dia" à noite). */
export function isoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sessionIdFor(planId: string, workoutId: string, date: string): string {
  return `${planId}:${workoutId}:${date}`;
}

/** Extrai um número de reps do alvo do plano ("8-10" → 8, "12" → 12, "AMRAP" → undefined). */
export function parseReps(reps?: string): number | undefined {
  const m = reps?.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

/** Cria uma sessão nova a partir do workout — séries pré-criadas, nada feito ainda. */
export function createSession(
  planId: string,
  workout: WorkoutLike,
  date: string = isoDate(),
): WorkoutSession {
  return {
    sessionId: sessionIdFor(planId, workout.id, date),
    planId,
    workoutId: workout.id,
    date,
    status: "in_progress",
    startedAt: new Date().toISOString(),
    exercises: workout.exercises.map((ex) => ({
      exerciseId: ex.id,
      sets: Array.from({ length: Math.max(1, ex.sets || 0) }, () => ({
        done: false,
        reps: parseReps(ex.reps),
        load_kg: ex.load_kg,
        rpe: ex.effortTarget,
      })),
    })),
  };
}

export type SessionProgress = { doneSets: number; totalSets: number; allDone: boolean };

export function sessionProgress(session: WorkoutSession): SessionProgress {
  let doneSets = 0;
  let totalSets = 0;
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      totalSets += 1;
      if (s.done) doneSets += 1;
    }
  }
  return { doneSets, totalSets, allDone: totalSets > 0 && doneSets === totalSets };
}

/** Marca a sessão como concluída (idempotente). */
export function completeSession(session: WorkoutSession, now: Date = new Date()): WorkoutSession {
  return { ...session, status: "done", completedAt: session.completedAt ?? now.toISOString() };
}
