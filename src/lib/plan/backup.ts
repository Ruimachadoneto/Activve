/**
 * Backup completo dos dados do aparelho (TASK-031) — camada pura.
 *
 * POR QUE ISTO EXISTE
 * A auditoria de 2026-08 encontrou o achado mais severo do sistema: **não havia nenhum
 * caminho de UI que exportasse o histórico**. O `AGENTS.md` §2 afirmava "backup via
 * export/import JSON", mas isso cobria só o PLANO — sessões, cargas, RPE, peso e medidas
 * não saíam do aparelho por via nenhuma. Trocar de celular, limpar dados do site ou um
 * navegador reciclando storage sob pressão apagava meses de histórico, sem aviso e sem
 * recuperação. Num app local-first cujo valor É o acúmulo, isso é perda total.
 *
 * DUAS DECISÕES QUE GOVERNAM O FORMATO
 *
 * 1. **Restaurar NUNCA apaga.** A restauração é uma união: traz de volta o que está no
 *    backup e preserva o que já existe aqui. Um app sem desfazer não pode ter uma operação
 *    que destrói meses de dado por um toque errado — e o cenário real (aparelho novo, app
 *    vazio) funciona igual nos dois modelos. Em conflito de mesma chave o backup vence,
 *    porque foi o usuário que pediu para restaurá-lo.
 *
 * 2. **Arquivo de backup é ENTRADA NÃO CONFIÁVEL.** Pode vir editado à mão, truncado, de
 *    uma versão futura ou de outro app. A leitura é **total** (mesma postura da TASK-013):
 *    registro sem chave utilizável é DESCARTADO e CONTADO, e a UI diz quantos — importar em
 *    silêncio o que não se entende é pior que recusar.
 *
 * Camada pura: sem IndexedDB e sem React (o IO mora em `src/lib/storage/backup.ts`).
 */

/** Sobe se o formato mudar de forma que uma versão antiga não consiga ler. */
export const BACKUP_SCHEMA_VERSION = "1.0";

export type BackupFile = {
  schemaVersion: string;
  app: string;
  exportedAt: string;
  /** Versão do IndexedDB na origem — diagnóstico, não é usada para migrar. */
  dbVersion: number;
  data: {
    plans: unknown[];
    sessions: unknown[];
    bodylog: unknown[];
    /** `kv` tem chave fora de linha, então o par vai explícito. */
    kv: { key: string; value: unknown }[];
  };
};

/** Quantos registros de cada tipo — serve ao resumo antes e depois de restaurar. */
export type BackupCounts = {
  plans: number;
  sessions: number;
  bodylog: number;
  kv: number;
};

export type BackupParse =
  | {
      ok: true;
      backup: BackupFile;
      counts: BackupCounts;
      /** Registros ilegíveis que foram descartados na leitura. */
      discarded: number;
      /** Backup de uma versão que esta build não conhece por completo. */
      unknownVersion: boolean;
    }
  | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const arrayOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * Registro utilizável é o que tem a CHAVE do seu store — sem ela o `put` nem sequer
 * funcionaria. O resto do conteúdo não é validado aqui de propósito: um plano histórico
 * cosmeticamente inválido ainda é útil (resolve nome de exercício antigo), e as telas já
 * sabem se defender dele desde a TASK-013. Exigir o contrato inteiro aqui jogaria fora
 * histórico perfeitamente aproveitável.
 */
function keepWithKey(records: unknown[], key: string): { kept: unknown[]; dropped: number } {
  const kept = records.filter((r) => isObject(r) && typeof r[key] === "string" && r[key] !== "");
  return { kept, dropped: records.length - kept.length };
}

function keepKvPairs(records: unknown[]): { kept: { key: string; value: unknown }[]; dropped: number } {
  const kept = records
    .filter((r): r is Record<string, unknown> => isObject(r) && typeof r.key === "string" && r.key !== "")
    .map((r) => ({ key: r.key as string, value: r.value }));
  return { kept, dropped: records.length - kept.length };
}

/** Monta o arquivo a partir do que foi lido do banco. */
export function buildBackup(
  data: BackupFile["data"],
  opts: { app: string; dbVersion: number; now?: Date },
): BackupFile {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: opts.app,
    exportedAt: (opts.now ?? new Date()).toISOString(),
    dbVersion: opts.dbVersion,
    data,
  };
}

export function countOf(data: BackupFile["data"]): BackupCounts {
  return {
    plans: data.plans.length,
    sessions: data.sessions.length,
    bodylog: data.bodylog.length,
    kv: data.kv.length,
  };
}

/**
 * Lê e valida um arquivo de backup. **Função total**: nunca lança — devolve `ok: false`
 * com uma razão exibível, ou `ok: true` com o que sobrou de utilizável e quantos registros
 * foram descartados.
 */
export function parseBackup(text: string): BackupParse {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "Este arquivo não é um JSON válido." };
  }
  if (!isObject(json)) return { ok: false, error: "Este arquivo não tem o formato de um backup." };
  if (!isObject(json.data)) {
    /*
     * Erro mais provável na prática: o usuário escolher o arquivo do PLANO em vez do
     * backup. Vale reconhecer e dizer o que fazer, em vez de um "formato inválido" seco.
     */
    const pareceePlano = isObject(json.training) || isObject(json.profile);
    return {
      ok: false,
      error: pareceePlano
        ? "Isto parece um arquivo de plano, não um backup. Para importar um plano, use “Trocar plano”."
        : "Este arquivo não tem o formato de um backup do Activve.",
    };
  }

  const d = json.data as Record<string, unknown>;
  const plans = keepWithKey(arrayOf(d.plans), "planId");
  const sessions = keepWithKey(arrayOf(d.sessions), "sessionId");
  const bodylog = keepWithKey(arrayOf(d.bodylog), "date");
  const kv = keepKvPairs(arrayOf(d.kv));

  const data: BackupFile["data"] = {
    plans: plans.kept,
    sessions: sessions.kept,
    bodylog: bodylog.kept,
    kv: kv.kept,
  };
  const counts = countOf(data);
  if (counts.plans + counts.sessions + counts.bodylog + counts.kv === 0) {
    return { ok: false, error: "O backup está vazio — não há nada para restaurar." };
  }

  const versao = typeof json.schemaVersion === "string" ? json.schemaVersion : "";
  return {
    ok: true,
    backup: {
      schemaVersion: versao || BACKUP_SCHEMA_VERSION,
      app: typeof json.app === "string" ? json.app : "desconhecido",
      exportedAt: typeof json.exportedAt === "string" ? json.exportedAt : "",
      dbVersion: typeof json.dbVersion === "number" ? json.dbVersion : 0,
      data,
    },
    counts,
    discarded: plans.dropped + sessions.dropped + bodylog.dropped + kv.dropped,
    // Compat por MAJOR, igual ao PLAN_SCHEMA: 1.x é legível, 2.x seria outra coisa.
    unknownVersion: versao !== "" && versao.split(".")[0] !== BACKUP_SCHEMA_VERSION.split(".")[0],
  };
}

/** Nome do arquivo baixado: ordenável por data e óbvio no meio de outros downloads. */
export function backupFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `activve-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

/** Resumo humano do que um backup contém. Usado antes e depois de restaurar. */
export function describeCounts(c: BackupCounts): string {
  const partes: string[] = [];
  if (c.sessions > 0) partes.push(`${c.sessions} ${c.sessions === 1 ? "treino" : "treinos"}`);
  if (c.bodylog > 0) partes.push(`${c.bodylog} ${c.bodylog === 1 ? "registro" : "registros"} de corpo`);
  if (c.plans > 0) partes.push(`${c.plans} ${c.plans === 1 ? "plano" : "planos"}`);
  return partes.length > 0 ? partes.join(" · ") : "nenhum registro";
}
