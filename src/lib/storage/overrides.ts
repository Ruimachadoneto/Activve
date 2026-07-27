import { getDB, STORE_KV } from "./db";

function key(planId: string, date: string): string {
  return `dayOverride:${planId}:${date}`;
}

/**
 * Treino "oficial" do dia escolhido pelo usuário, sobrepondo o `weekSchedule` fixo do
 * plano (TASK-016). Guardado na store `kv` — leve, sem migration. `"rest"` marca dia
 * de descanso forçado; um workoutId marca o treino escolhido.
 */
export async function getDayOverride(planId: string, date: string): Promise<string | null> {
  const db = await getDB();
  const value = (await db.get(STORE_KV, key(planId, date))) as string | undefined;
  return value ?? null;
}

export async function setDayOverride(
  planId: string,
  date: string,
  workoutIdOrRest: string,
): Promise<void> {
  const db = await getDB();
  await db.put(STORE_KV, workoutIdOrRest, key(planId, date));
}

export async function clearDayOverride(planId: string, date: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_KV, key(planId, date));
}
