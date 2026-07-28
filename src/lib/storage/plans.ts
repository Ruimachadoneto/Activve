import { getDB, STORE_KV, STORE_PLANS } from "./db";
import type { PlanFile } from "../plan/schema";
import { isoDate } from "../plan/session";
import { clearDayOverride } from "./overrides";

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
  const planId = plan.meta.planId;
  const existing = (await db.get(STORE_PLANS, planId)) as StoredPlan | undefined;
  const record: StoredPlan = {
    planId,
    // Reimportar o MESMO planId (ex.: coach corrige o plano no ciclo atual) preserva
    // a data ORIGINAL — ela marca quando o ciclo começou, não quando o registro foi
    // escrito por último. Sem isso, o export de relatório (TASK-018) recortaria o
    // período pelo novo timestamp e cortaria sessões válidas registradas antes da
    // correção (achado do review Codex).
    importedAt: existing?.importedAt ?? new Date().toISOString(),
    plan,
  };
  const tx = db.transaction([STORE_PLANS, STORE_KV], "readwrite");
  await tx.objectStore(STORE_PLANS).put(record);
  await tx.objectStore(STORE_KV).put(record.planId, KEY_ACTIVE);
  await tx.done;
  // Reimportar o MESMO planId no mesmo dia (ex.: coach corrige o plano no ciclo
  // atual) pode trocar os ids de treino — um override de hoje (TASK-016) apontando
  // pro id antigo ficaria órfão e cairia em "descanso" até o usuário limpar na mão.
  // Um plano novo sempre limpa a escolha de hoje; se ela ainda fizer sentido no
  // plano novo, o usuário escolhe de novo em /treino.
  await clearDayOverride(record.planId, isoDate());
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

/**
 * Todos os planos já importados (não só o ativo) — usado pra resolver nome de
 * exercício/treino de sessões de ciclos anteriores no calendário/relatório (TASK-018).
 */
export async function getAllPlans(): Promise<StoredPlan[]> {
  const db = await getDB();
  return (await db.getAll(STORE_PLANS)) as StoredPlan[];
}
