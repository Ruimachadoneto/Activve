import { describe, it, expect } from "vitest";
import {
  backupFileName,
  buildBackup,
  countOf,
  describeCounts,
  parseBackup,
  type BackupFile,
} from "./backup";

const dados = (over: Partial<BackupFile["data"]> = {}): BackupFile["data"] => ({
  plans: [{ planId: "pl_1", importedAt: "2026-05-01T10:00:00.000Z", plan: {} }],
  sessions: [{ sessionId: "pl_1:A:2026-07-27", planId: "pl_1", date: "2026-07-27" }],
  bodylog: [{ date: "2026-07-01", weight_kg: 84 }],
  kv: [{ key: "activePlanId", value: "pl_1" }],
  ...over,
});

const arquivo = (data = dados()) =>
  JSON.stringify(buildBackup(data, { app: "activve@0.1.0", dbVersion: 3 }));

describe("buildBackup", () => {
  it("carimba versão, app e data", () => {
    const b = buildBackup(dados(), {
      app: "activve@0.1.0",
      dbVersion: 3,
      now: new Date("2026-08-03T12:00:00.000Z"),
    });
    expect(b.schemaVersion).toBe("1.0");
    expect(b.exportedAt).toBe("2026-08-03T12:00:00.000Z");
    expect(b.dbVersion).toBe(3);
  });

  it("ida e volta preserva tudo", () => {
    const p = parseBackup(arquivo());
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.counts).toEqual({ plans: 1, sessions: 1, bodylog: 1, kv: 1 });
    expect(p.discarded).toBe(0);
    expect(p.backup.data.sessions[0]).toMatchObject({ sessionId: "pl_1:A:2026-07-27" });
  });
});

describe("parseBackup — arquivo é ENTRADA NÃO CONFIÁVEL", () => {
  it("texto que não é JSON não estoura", () => {
    const p = parseBackup("isto não é json {{{");
    expect(p).toEqual({ ok: false, error: "Este arquivo não é um JSON válido." });
  });

  it("JSON válido sem a forma de backup é recusado", () => {
    const p = parseBackup(JSON.stringify({ qualquer: "coisa" }));
    expect(p.ok).toBe(false);
  });

  it("reconhece um arquivo de PLANO e explica o que fazer", () => {
    /*
     * É o erro mais provável na prática: o usuário escolher o plano em vez do backup. Um
     * "formato inválido" seco deixaria ele sem saber que existem dois arquivos diferentes.
     */
    const plano = JSON.stringify({ profile: { daysPerWeek: 4 }, training: { workouts: [] } });
    const p = parseBackup(plano);
    expect(p.ok).toBe(false);
    if (p.ok) return;
    expect(p.error).toContain("plano");
    expect(p.error).toContain("Trocar plano");
  });

  it("descarta registro sem chave e CONTA quantos", () => {
    // Importar em silêncio o que não se entende é pior que recusar: a UI mostra o número.
    const ruim = dados({
      sessions: [
        { sessionId: "pl_1:A:2026-07-27", date: "2026-07-27" },
        { semChave: true },
        null,
        "texto solto",
      ],
      bodylog: [{ date: "2026-07-01" }, { weight_kg: 80 }],
    });
    const p = parseBackup(arquivo(ruim));
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.counts.sessions).toBe(1);
    expect(p.counts.bodylog).toBe(1);
    expect(p.discarded).toBe(4); // 3 sessões + 1 registro de corpo
  });

  it("backup vazio é recusado em vez de 'restaurado' sem efeito", () => {
    const p = parseBackup(arquivo({ plans: [], sessions: [], bodylog: [], kv: [] }));
    expect(p.ok).toBe(false);
    if (p.ok) return;
    expect(p.error).toContain("vazio");
  });

  it("plano histórico cosmeticamente inválido PASSA — só a chave é exigida", () => {
    /*
     * Exigir o contrato inteiro aqui jogaria fora histórico aproveitável: um plano antigo
     * sem `training` ainda resolve nome de exercício, e as telas sabem se defender dele
     * desde a TASK-013. A chave é o que o `put` precisa; o resto é problema de quem lê.
     */
    const p = parseBackup(arquivo(dados({ plans: [{ planId: "pl_velho" }] })));
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.counts.plans).toBe(1);
  });

  it("versão maior é sinalizada, não recusada", () => {
    const futuro = JSON.parse(arquivo());
    futuro.schemaVersion = "2.0";
    const p = parseBackup(JSON.stringify(futuro));
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.unknownVersion).toBe(true);
  });

  it("mesma MAJOR não é sinalizada (compat por 1.x)", () => {
    const menor = JSON.parse(arquivo());
    menor.schemaVersion = "1.7";
    const p = parseBackup(JSON.stringify(menor));
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.unknownVersion).toBe(false);
  });

  it("chave de kv vazia não entra", () => {
    const p = parseBackup(arquivo(dados({ kv: [{ key: "", value: 1 }, { key: "ok", value: 2 }] })));
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.counts.kv).toBe(1);
  });
});

describe("apresentação", () => {
  it("descreve o conteúdo em português, com plural correto", () => {
    expect(describeCounts({ plans: 1, sessions: 1, bodylog: 1, kv: 0 })).toBe(
      "1 treino · 1 registro de corpo · 1 plano",
    );
    expect(describeCounts({ plans: 2, sessions: 12, bodylog: 5, kv: 0 })).toBe(
      "12 treinos · 5 registros de corpo · 2 planos",
    );
  });

  it("aparelho vazio não vira texto quebrado", () => {
    expect(describeCounts({ plans: 0, sessions: 0, bodylog: 0, kv: 0 })).toBe("nenhum registro");
  });

  it("nome do arquivo é ordenável por data", () => {
    expect(backupFileName(new Date(2026, 7, 3))).toBe("activve-backup-2026-08-03.json");
  });

  it("countOf bate com o conteúdo", () => {
    expect(countOf(dados())).toEqual({ plans: 1, sessions: 1, bodylog: 1, kv: 1 });
  });
});
