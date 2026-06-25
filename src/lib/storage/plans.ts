import { getDB, STORE_KV, STORE_PLANS } from "./db";
import type { PlanFile } from "../plan/schema";

const KEY_ACTIVE = "activePlanId";

export type StoredPlan = {
  planId: string;
  importedAt: string;
  plan: PlanFile;
};

/**
 * Salva o plano importado e o marca como ativo. Subir um plano novo cria/atualiza
 * o registro pelo planId (ADR-002: continuidade por id) sem apagar os demais.
 */
export async function saveImportedPlan(plan: PlanFile): Promise<StoredPlan> {
  const db = await getDB();
  const record: StoredPlan = {
    planId: plan.meta.planId,
    importedAt: new Date().toISOString(),
    plan,
  };
  const tx = db.transaction([STORE_PLANS, STORE_KV], "readwrite");
  await tx.objectStore(STORE_PLANS).put(record);
  await tx.objectStore(STORE_KV).put(record.planId, KEY_ACTIVE);
  await tx.done;
  return record;
}

/** Lê o plano ativo (ou null se ainda não houver import). */
export async function getActivePlan(): Promise<StoredPlan | null> {
  const db = await getDB();
  const activeId = (await db.get(STORE_KV, KEY_ACTIVE)) as string | undefined;
  if (!activeId) return null;
  const record = (await db.get(STORE_PLANS, activeId)) as StoredPlan | undefined;
  return record ?? null;
}
