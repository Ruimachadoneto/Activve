import { getDB, STORE_BODYLOG } from "./db";
import type { BodyEntry } from "../plan/body";

/** Todos os registros de corpo (timeline contínua, não escopada a plano). */
export async function getBodyLog(): Promise<BodyEntry[]> {
  const db = await getDB();
  return (await db.getAll(STORE_BODYLOG)) as BodyEntry[];
}

/** Salva (ou atualiza, pelo `date`) um registro de corpo. */
export async function saveBodyEntry(entry: BodyEntry): Promise<void> {
  const db = await getDB();
  await db.put(STORE_BODYLOG, entry);
}

export async function getBodyEntry(date: string): Promise<BodyEntry | null> {
  const db = await getDB();
  return ((await db.get(STORE_BODYLOG, date)) as BodyEntry | undefined) ?? null;
}
