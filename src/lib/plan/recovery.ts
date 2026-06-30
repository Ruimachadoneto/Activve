/**
 * Heurística de recuperação muscular (local-first, pura — sem IndexedDB/React aqui).
 *
 * Ideia: cada série concluída de um exercício "estimula" os músculos que ele trabalha.
 * Quanto mais volume (séries) e esforço (RPE), maior o estímulo e mais tempo o músculo
 * leva para recuperar (janela 48–72h). A partir do tempo decorrido desde o último
 * estímulo, classificamos cada músculo em 4 estados (mapeados aos tokens do design):
 *
 *   worked     "Trabalhado"  — estímulo recente, ainda em fadiga          (--color-worked)
 *   recovering "Recuperando" — no meio da janela de recuperação           (--color-recovering)
 *   ready      "Pronto"      — recuperado e pronto para treinar de novo    (--color-ready)
 *   rested     "Descansado"  — sem estímulo recente (fora do lookback)     (--color-rested)
 *
 * Vocabulário anti-culpa: nenhum estado é "ruim". "Descansado" ≠ "abandonado".
 */

import { MUSCLES, type Muscle, type PlanFile } from "./schema";
import type { WorkoutSession } from "./session";

export type RecoveryState = "worked" | "recovering" | "ready" | "rested";

/** Um estímulo pontual sobre um músculo (uma "leva" de trabalho num momento). */
export type MuscleStimulus = {
  muscle: Muscle;
  at: number; // epoch ms
  load: number; // magnitude do estímulo neste músculo, 0..1
};

export type MuscleRecovery = {
  state: RecoveryState;
  /** Último momento em que o músculo foi trabalhado (epoch ms), ou null se descansado. */
  lastWorkedAt: number | null;
  /** Horas desde o último estímulo, ou null se descansado. */
  hoursSince: number | null;
  /** Janela de recuperação estimada para a última leva (horas), ou null se descansado. */
  recoveryHours: number | null;
  /** Progresso de recuperação: hoursSince / recoveryHours. ≥1 = recuperado. Descansado = 1. */
  fraction: number;
};

/** Músculos trabalhados por um exercício (resolvido a partir do plano). */
export type ExerciseMuscles = { primary: Muscle[]; secondary?: Muscle[] };
/** Lookup `exerciseId → músculos`. Retorna undefined se o exercício não existe no plano. */
export type GetMuscles = (exerciseId: string) => ExerciseMuscles | undefined;

// ---- Parâmetros da heurística (ajustáveis num só lugar) ----
const PRIMARY_WEIGHT = 1;
const SECONDARY_WEIGHT = 0.5;
const RECOVERY_MIN_H = 48; // estímulo leve recupera em ~48h
const RECOVERY_MAX_H = 72; // estímulo pesado leva ~72h
const LOOKBACK_H = 24 * 10; // sem estímulo nesse período → "descansado"
const SAME_BOUT_H = 24; // estímulos dentro de 24h do último contam como a mesma leva
const DEFAULT_RPE = 8; // RPE assumido quando a série não registrou esforço
const WORKED_UNTIL = 0.5; // < 50% da janela = ainda "trabalhado"

const H_IN_MS = 3_600_000;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** RPE (6–10) → fator de esforço 0.2..1. RPE ausente assume DEFAULT_RPE. */
function effortFactor(rpe: number): number {
  return clamp((rpe - 5) / 5, 0.2, 1);
}

/** Nº de séries feitas → fator de volume 0.25..1 (satura em 4 séries). */
function volumeFactor(doneSets: number): number {
  return clamp(doneSets / 4, 0.25, 1);
}

/** Momento de um treino: usa `completedAt` se houver, senão a data local ao meio-dia. */
function sessionTime(session: WorkoutSession): number {
  if (session.completedAt) {
    const t = Date.parse(session.completedAt);
    if (!Number.isNaN(t)) return t;
  }
  const [y, m, d] = session.date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12).getTime();
}

/**
 * Converte sessões + lookup de músculos em estímulos pontuais. Considera apenas
 * **sessões concluídas** (`status === "done"`) — um treino em andamento ainda pode
 * mudar e não deve acender o mapa. Dentro delas, só conta séries efetivamente feitas
 * (`done`). Usa a variação executada (`swappedToId`) quando houver.
 */
export function stimuliFromSessions(
  sessions: WorkoutSession[],
  getMuscles: GetMuscles,
  now: number = Date.now(),
): MuscleStimulus[] {
  const out: MuscleStimulus[] = [];
  for (const session of sessions) {
    if (session.status !== "done") continue; // só treinos concluídos contam
    const at = sessionTime(session);
    if (now - at > LOOKBACK_H * H_IN_MS) continue; // muito antigo, irrelevante
    for (const ex of session.exercises) {
      const doneSets = ex.sets.filter((s) => s.done).length;
      if (doneSets === 0) continue;
      const rpes = ex.sets.filter((s) => s.done && s.rpe != null).map((s) => s.rpe as number);
      const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : DEFAULT_RPE;
      const intensity = effortFactor(avgRpe) * volumeFactor(doneSets); // 0..1

      const muscles = getMuscles(ex.swappedToId ?? ex.exerciseId);
      if (!muscles) continue;
      for (const muscle of muscles.primary) {
        out.push({ muscle, at, load: PRIMARY_WEIGHT * intensity });
      }
      for (const muscle of muscles.secondary ?? []) {
        out.push({ muscle, at, load: SECONDARY_WEIGHT * intensity });
      }
    }
  }
  return out;
}

/**
 * Constrói o lookup `exerciseId → músculos` a partir do plano, incluindo as variações
 * (`alternatives`). Variação sem músculos próprios herda os do exercício pai.
 */
export function buildExerciseMuscles(plan: PlanFile): GetMuscles {
  const map = new Map<string, ExerciseMuscles>();
  for (const workout of plan.training.workouts) {
    for (const ex of workout.exercises) {
      map.set(ex.id, { primary: ex.primaryMuscles, secondary: ex.secondaryMuscles });
      for (const alt of ex.alternatives ?? []) {
        // A alternativa só pode sobrescrever os PRIMÁRIOS (o schema não expressa
        // secundários nela), então herda sempre os secundários do exercício pai —
        // senão um swap subestima a fadiga (perde tríceps/deltoides/etc.).
        map.set(alt.id, {
          primary: alt.primaryMuscles?.length ? alt.primaryMuscles : ex.primaryMuscles,
          secondary: ex.secondaryMuscles,
        });
      }
    }
  }
  return (id) => map.get(id);
}

/**
 * Classifica cada músculo do vocabulário num estado de recuperação a partir dos estímulos.
 * Todos os músculos sempre aparecem no resultado (default: descansado).
 */
export function computeRecovery(
  stimuli: MuscleStimulus[],
  now: number = Date.now(),
): Record<Muscle, MuscleRecovery> {
  const byMuscle = new Map<Muscle, MuscleStimulus[]>();
  for (const s of stimuli) {
    const list = byMuscle.get(s.muscle);
    if (list) list.push(s);
    else byMuscle.set(s.muscle, [s]);
  }

  const result = {} as Record<Muscle, MuscleRecovery>;
  for (const muscle of MUSCLES) {
    const list = byMuscle.get(muscle);
    if (!list || list.length === 0) {
      result[muscle] = rested();
      continue;
    }
    const lastAt = Math.max(...list.map((s) => s.at));
    const hoursSince = (now - lastAt) / H_IN_MS;
    if (hoursSince > LOOKBACK_H) {
      result[muscle] = rested();
      continue;
    }
    // Soma o estímulo da última leva (mesmo dia/24h do último), saturado em 1.
    const boutLoad = clamp(
      list.filter((s) => lastAt - s.at <= SAME_BOUT_H * H_IN_MS).reduce((a, s) => a + s.load, 0),
      0,
      1,
    );
    const recoveryHours = RECOVERY_MIN_H + (RECOVERY_MAX_H - RECOVERY_MIN_H) * boutLoad;
    const fraction = hoursSince / recoveryHours;
    const state: RecoveryState =
      fraction < WORKED_UNTIL ? "worked" : fraction < 1 ? "recovering" : "ready";
    result[muscle] = { state, lastWorkedAt: lastAt, hoursSince, recoveryHours, fraction };
  }
  return result;
}

function rested(): MuscleRecovery {
  return { state: "rested", lastWorkedAt: null, hoursSince: null, recoveryHours: null, fraction: 1 };
}

/**
 * Horas estimadas até o músculo ficar "pronto" — `null` se já recuperado ou descansado
 * (não há contagem a mostrar). Usado para o detalhe "pronto em ~X" ao tocar um músculo.
 */
export function hoursToReady(
  r: Pick<MuscleRecovery, "hoursSince" | "recoveryHours">,
): number | null {
  if (r.hoursSince == null || r.recoveryHours == null) return null; // descansado
  const left = r.recoveryHours - r.hoursSince;
  return left > 0 ? left : null; // ≤ 0 = já pronto
}

/** Variável CSS do token de cor para cada estado (ver globals.css). */
export function recoveryColorVar(state: RecoveryState): string {
  switch (state) {
    case "worked":
      return "--color-worked";
    case "recovering":
      return "--color-recovering";
    case "ready":
      return "--color-ready";
    case "rested":
      return "--color-rested";
  }
}

/** Rótulo PT-BR (anti-culpa) de cada estado. */
export const RECOVERY_LABEL_PT: Record<RecoveryState, string> = {
  worked: "Trabalhado",
  recovering: "Recuperando",
  ready: "Pronto",
  rested: "Descansado",
};
