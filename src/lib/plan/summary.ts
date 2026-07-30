/**
 * Resumo de uma sessão de treino — o material da tela de conclusão (TASK-026).
 * Camada pura (sem React, sem IndexedDB), no padrão de `recovery.ts`/`report.ts`.
 *
 * Princípio que governa este módulo: **só conta o que o usuário registrou**. Volume
 * não estima carga faltante, recorde não celebra sem régua anterior, duração não é
 * inventada quando falta carimbo. Quando falta dado, o resumo DIZ que falta (os campos
 * `volumeSets`/`doneSets`) em vez de esconder — é a mesma regra da §9 do DESIGN_SYSTEM
 * que já vale no relatório.
 */

import { bestPreviousLoad, type WorkoutSession } from "./session";

/** Recorde pessoal batido nesta sessão para um movimento. */
export type SessionRecord = {
  exerciseId: string;
  /** Movimento efetivo (variação escolhida ou o próprio exercício). */
  movementId: string;
  /** Maior carga feita hoje neste movimento. */
  load_kg: number;
  /** Maior carga registrada ANTES desta sessão (a régua que foi batida). */
  previousBest: number;
  /** Repetições da série que estabeleceu o recorde (a mais pesada; desempata por reps). */
  reps?: number;
};

export type HeaviestSet = {
  exerciseId: string;
  movementId: string;
  load_kg: number;
  reps?: number;
};

export type SessionSummary = {
  /** Σ (carga × reps) das séries feitas que têm **os dois** valores registrados. */
  volumeKg: number;
  /** Quantas séries feitas entraram no volume — menor que `doneSets` = conta parcial. */
  volumeSets: number;
  doneSets: number;
  totalSets: number;
  /** Exercícios com ao menos uma série feita. */
  exercisesDone: number;
  /** Total de exercícios previstos na sessão. */
  exercisesTotal: number;
  /** Minutos entre `startedAt` e `completedAt`; `null` sem carimbo válido. */
  durationMin: number | null;
  /** Recordes batidos nesta sessão, do maior salto para o menor. */
  records: SessionRecord[];
  /** Série mais pesada da sessão (referência concreta do dia). */
  heaviestSet: HeaviestSet | null;
  /** Movimentos executados (`swappedToId ?? exerciseId`) com ao menos uma série feita. */
  movementIds: { exerciseId: string; movementId: string }[];
};

const movementOf = (log: { exerciseId: string; swappedToId?: string }) =>
  log.swappedToId ?? log.exerciseId;

/** Minutos inteiros entre dois ISO timestamps; `null` se algo não for utilizável. */
function minutesBetween(startedAt?: string, completedAt?: string): number | null {
  if (!startedAt || !completedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const min = Math.round((end - start) / 60000);
  // Relógio do aparelho pode ter andado pra trás entre os dois carimbos — negativo não é
  // duração, é dado quebrado. Melhor não exibir do que exibir mentira.
  return min < 0 ? null : min;
}

/**
 * Constrói o resumo da sessão. `history` é a lista de sessões conhecidas (a própria
 * sessão pode estar dentro — `bestPreviousLoad` a exclui por `sessionId`, então a
 * régua do recorde nunca se compara consigo mesma).
 */
export function buildSessionSummary(
  session: WorkoutSession,
  history: WorkoutSession[],
): SessionSummary {
  let volumeKg = 0;
  let volumeSets = 0;
  let doneSets = 0;
  let totalSets = 0;
  let exercisesDone = 0;
  const records: SessionRecord[] = [];
  const movementIds: { exerciseId: string; movementId: string }[] = [];
  let heaviestSet: HeaviestSet | null = null;

  for (const log of session.exercises) {
    const movementId = movementOf(log);
    let exerciseHasDone = false;
    /** Série mais pesada DESTE exercício hoje — é ela que disputa o recorde. */
    let bestToday: { load_kg: number; reps?: number } | null = null;

    for (const set of log.sets) {
      totalSets += 1;
      if (!set.done) continue;
      doneSets += 1;
      exerciseHasDone = true;

      if (typeof set.load_kg === "number" && typeof set.reps === "number") {
        volumeKg += set.load_kg * set.reps;
        volumeSets += 1;
      }
      if (typeof set.load_kg !== "number") continue;

      // Empate de carga: fica a de mais repetições (esforço maior no mesmo peso).
      const better =
        bestToday === null ||
        set.load_kg > bestToday.load_kg ||
        (set.load_kg === bestToday.load_kg && (set.reps ?? 0) > (bestToday.reps ?? 0));
      if (better) bestToday = { load_kg: set.load_kg, reps: set.reps };

      const heavier =
        heaviestSet === null ||
        set.load_kg > heaviestSet.load_kg ||
        (set.load_kg === heaviestSet.load_kg && (set.reps ?? 0) > (heaviestSet.reps ?? 0));
      if (heavier) {
        heaviestSet = { exerciseId: log.exerciseId, movementId, load_kg: set.load_kg, reps: set.reps };
      }
    }

    if (!exerciseHasDone) continue;
    exercisesDone += 1;
    movementIds.push({ exerciseId: log.exerciseId, movementId });

    if (!bestToday) continue;
    // Mesma régua do selo in-workout (TASK-025): sem recorde ANTERIOR não há o que
    // bater — no primeiro treino toda carga seria "recorde", e celebração barata deixa
    // de ser celebração.
    const previousBest = bestPreviousLoad(history, log.exerciseId, session.sessionId, movementId);
    if (previousBest == null || bestToday.load_kg <= previousBest) continue;
    records.push({
      exerciseId: log.exerciseId,
      movementId,
      load_kg: bestToday.load_kg,
      previousBest,
      reps: bestToday.reps,
    });
  }

  records.sort((a, b) => b.load_kg - b.previousBest - (a.load_kg - a.previousBest));

  return {
    // Ponto flutuante acumulado (2,5 kg × 8 …) rende 4859.999999; o volume é uma
    // contagem de quilos, não uma medida de precisão infinita.
    volumeKg: Math.round(volumeKg),
    volumeSets,
    doneSets,
    totalSets,
    exercisesDone,
    exercisesTotal: session.exercises.length,
    durationMin: minutesBetween(session.startedAt, session.completedAt),
    records,
    heaviestSet,
    movementIds,
  };
}

/** "1h05" / "48 min" — duração legível, sem inventar precisão que não existe. */
export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
