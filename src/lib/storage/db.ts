import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "activve";
const DB_VERSION = 2;

export const STORE_PLANS = "plans";
export const STORE_KV = "kv";
export const STORE_SESSIONS = "sessions";

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
        // Migração aditiva: só cria stores que faltam, nunca mexe nos existentes.
        if (!db.objectStoreNames.contains(STORE_PLANS)) {
          db.createObjectStore(STORE_PLANS, { keyPath: "planId" });
        }
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const sessions = db.createObjectStore(STORE_SESSIONS, { keyPath: "sessionId" });
          sessions.createIndex("by-plan", "planId");
          sessions.createIndex("by-date", "date");
        }
      },
    });
  }
  return dbPromise;
}
