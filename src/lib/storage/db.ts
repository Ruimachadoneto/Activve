import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "activve";
const DB_VERSION = 1;

export const STORE_PLANS = "plans";
export const STORE_KV = "kv";

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Abre (e cria, se necessário) o IndexedDB local. Só funciona no browser —
 * o app é local-first (ADR-001), nada vai para servidor.
 */
export function getDB(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB indisponível fora do navegador."));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_PLANS)) {
          db.createObjectStore(STORE_PLANS, { keyPath: "planId" });
        }
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
      },
    });
  }
  return dbPromise;
}
