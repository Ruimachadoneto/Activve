/**
 * Estado de "lido" dos avisos (TASK-030).
 *
 * Só os IDS lidos são persistidos — os avisos em si são recalculados do zero a cada
 * abertura por `buildNotices`. Guardar o texto seria criar uma segunda verdade que
 * envelheceria: um recorde renomeado no plano ficaria com o nome velho para sempre.
 *
 * Local-first como todo o resto (ADR-001): store `kv`, nada sai do aparelho.
 */

import { getDB, STORE_KV } from "./db";

const KEY = "readNotices";

/**
 * Teto de ids guardados. Sem ele a lista cresceria para sempre, já que um aviso lido
 * some da geração (passa da janela de 30 dias) mas o id ficaria no disco. Os mais
 * recentes são os que importam: um id antigo que reaparecesse seria de um fato fora da
 * janela, que `buildNotices` já não emite.
 */
const TETO = 200;

export async function getReadNoticeIds(): Promise<string[]> {
  const db = await getDB();
  const value = (await db.get(STORE_KV, KEY)) as unknown;
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Marca ids como lidos (união com o que já havia), mantendo os mais recentes no teto. */
export async function markNoticesRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDB();
  const atuais = await getReadNoticeIds();
  // Os novos entram no fim: o corte pelo teto descarta os mais ANTIGOS, não os de agora.
  const uniao = [...new Set([...atuais, ...ids])];
  await db.put(STORE_KV, uniao.slice(-TETO), KEY);
}
