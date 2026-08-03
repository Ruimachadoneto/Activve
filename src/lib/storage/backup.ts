/**
 * IO do backup completo (TASK-031). O raciocínio do formato e as duas decisões que o
 * governam estão em `src/lib/plan/backup.ts` — aqui é só a ponte com o IndexedDB.
 */

import { getDB, STORE_BODYLOG, STORE_KV, STORE_PLANS, STORE_SESSIONS } from "./db";
import {
  buildBackup,
  countOf,
  type BackupCounts,
  type BackupFile,
} from "@/lib/plan/backup";

/** Versão do IndexedDB gravada no arquivo — diagnóstico, não migra nada. */
const DB_VERSION_ATUAL = 3;

/** Lê TUDO o que o aparelho guarda. */
export async function exportBackup(now: Date = new Date()): Promise<BackupFile> {
  const db = await getDB();
  const [plans, sessions, bodylog, kvValues, kvKeys] = await Promise.all([
    db.getAll(STORE_PLANS),
    db.getAll(STORE_SESSIONS),
    db.getAll(STORE_BODYLOG),
    db.getAll(STORE_KV),
    db.getAllKeys(STORE_KV),
  ]);

  /*
   * `kv` foi criado sem `keyPath` (chave fora de linha), então o valor sozinho não diz a
   * que chave pertence — daí ler valores e chaves e casar por índice, que é a ordem
   * garantida pelo IndexedDB para as duas leituras do mesmo store.
   */
  const kv = kvKeys
    .map((key, i) => ({ key: String(key), value: kvValues[i] }))
    .filter((par) => par.value !== undefined);

  return buildBackup(
    { plans, sessions, bodylog, kv },
    { app: "activve@0.1.0", dbVersion: DB_VERSION_ATUAL, now },
  );
}

/**
 * Restaura um backup — **união, nunca substituição** (ver o raciocínio no núcleo puro).
 * Em conflito de mesma chave o backup vence, porque foi ele que o usuário mandou restaurar.
 *
 * Cada store roda na sua própria transação: um registro problemático num store não pode
 * derrubar a restauração dos outros. `put` já é "insere ou sobrescreve".
 */
export async function restoreBackup(backup: BackupFile): Promise<BackupCounts> {
  const db = await getDB();

  const gravar = async (store: string, registros: unknown[]) => {
    if (registros.length === 0) return;
    const tx = db.transaction(store, "readwrite");
    for (const r of registros) tx.store.put(r);
    await tx.done;
  };

  await gravar(STORE_PLANS, backup.data.plans);
  await gravar(STORE_SESSIONS, backup.data.sessions);
  await gravar(STORE_BODYLOG, backup.data.bodylog);

  if (backup.data.kv.length > 0) {
    const tx = db.transaction(STORE_KV, "readwrite");
    for (const { key, value } of backup.data.kv) tx.store.put(value, key);
    await tx.done;
  }

  return countOf(backup.data);
}

/** Quanto existe hoje no aparelho — mostra ao usuário o que ele está prestes a exportar. */
export async function currentCounts(): Promise<BackupCounts> {
  const db = await getDB();
  const [plans, sessions, bodylog, kv] = await Promise.all([
    db.count(STORE_PLANS),
    db.count(STORE_SESSIONS),
    db.count(STORE_BODYLOG),
    db.count(STORE_KV),
  ]);
  return { plans, sessions, bodylog, kv };
}
