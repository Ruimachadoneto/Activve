import { getDB, STORE_KV } from "./db";

function key(planId: string, date: string): string {
  return `mealsDone:${planId}:${date}`;
}

/**
 * Refeições marcadas como feitas num dia (TASK-024).
 *
 * Guardado na store `kv` — leve, sem migration, mesmo padrão do override de treino
 * (TASK-016). A chave inclui o `planId` porque os ids de refeição vêm do plano: um ciclo
 * novo tem refeições próprias, e misturar marcações entre ciclos daria falso positivo.
 *
 * Ids que não existem mais no plano ativo são simplesmente ignorados na leitura da tela —
 * ao contrário do override de treino, uma marcação órfã aqui não muda o que o app mostra,
 * então não precisa de limpeza no reimport.
 */
export async function getMealsDone(planId: string, date: string): Promise<string[]> {
  const db = await getDB();
  const value = (await db.get(STORE_KV, key(planId, date))) as string[] | undefined;
  return Array.isArray(value) ? value : [];
}

/**
 * Alterna uma refeição e devolve a lista resultante. Faz leitura+escrita numa transação
 * só: dois toques rápidos em refeições diferentes não podem se sobrescrever (é a mesma
 * classe de lost-update que a TASK-014 corrigiu nas medidas corporais).
 */
export async function toggleMealDone(
  planId: string,
  date: string,
  mealId: string,
): Promise<string[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_KV, "readwrite");
  const store = tx.objectStore(STORE_KV);
  const atual = ((await store.get(key(planId, date))) as string[] | undefined) ?? [];
  const proximo = atual.includes(mealId)
    ? atual.filter((id) => id !== mealId)
    : [...atual, mealId];
  await store.put(proximo, key(planId, date));
  await tx.done;
  return proximo;
}
