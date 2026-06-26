import { getDB, STORE_SESSIONS } from "./db";
import {
  createSession,
  isoDate,
  sessionIdFor,
  type WorkoutSession,
} from "../plan/session";

type WorkoutLike = Parameters<typeof createSession>[1];

/** Lê uma sessão pelo id (ou null). */
export async function getSession(sessionId: string): Promise<WorkoutSession | null> {
  const db = await getDB();
  return ((await db.get(STORE_SESSIONS, sessionId)) as WorkoutSession | undefined) ?? null;
}

/** Sessão do dia para um treino: retoma a existente ou cria (e salva) uma nova. */
export async function getOrCreateTodaySession(
  planId: string,
  workout: WorkoutLike,
  date: string = isoDate(),
): Promise<WorkoutSession> {
  const existing = await getSession(sessionIdFor(planId, workout.id, date));
  if (existing) return existing;
  const fresh = createSession(planId, workout, date);
  await saveSession(fresh);
  return fresh;
}

/** Persiste a sessão (a cada mudança — não perder série se o navegador fechar). */
export async function saveSession(session: WorkoutSession): Promise<void> {
  const db = await getDB();
  await db.put(STORE_SESSIONS, session);
}

/** Sessões de um período (plano) — base para os checks da semana no Hoje. */
export async function getSessionsForPlan(planId: string): Promise<WorkoutSession[]> {
  const db = await getDB();
  return (await db.getAllFromIndex(STORE_SESSIONS, "by-plan", planId)) as WorkoutSession[];
}
