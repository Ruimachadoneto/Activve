"use client";

import { useEffect, useRef, useState } from "react";
import { Download, HardDriveDownload, Loader2, ShieldAlert } from "lucide-react";
import { currentCounts, exportBackup, restoreBackup } from "@/lib/storage/backup";
import {
  backupFileName,
  describeCounts,
  parseBackup,
  type BackupCounts,
  type BackupFile,
} from "@/lib/plan/backup";

type Pendente = { backup: BackupFile; counts: BackupCounts; discarded: number; unknownVersion: boolean };

/**
 * Backup completo dos dados (TASK-031) — a correção do achado mais severo da auditoria de
 * 2026-08: **não existia nenhuma forma de tirar o histórico do aparelho**.
 *
 * O texto desta tela é deliberadamente direto sobre o custo do local-first. Privacidade
 * total significa que ninguém guarda uma cópia por você — e omitir isso seria vender o
 * benefício escondendo a contrapartida, que é a mesma desonestidade que a §9 barra nos
 * números.
 */
export function BackupCard() {
  const [agora, setAgora] = useState<BackupCounts | null>(null);
  const [ocupado, setOcupado] = useState<null | "exportando" | "restaurando">(null);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recarregarAppRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (recarregarAppRef.current !== null) window.clearTimeout(recarregarAppRef.current);
    },
    [],
  );

  const recarregar = () => {
    void currentCounts().then(setAgora);
  };
  useEffect(recarregar, []);

  async function baixar() {
    setErro(null);
    setFeito(null);
    setOcupado("exportando");
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFileName();
      a.click();
      // Sem revoke, o Blob inteiro fica preso na memória da aba até ela fechar.
      URL.revokeObjectURL(url);
      setFeito("Backup baixado. Guarde num lugar que não seja só este aparelho.");
    } catch {
      setErro("Não consegui ler os dados do aparelho para gerar o backup.");
    } finally {
      setOcupado(null);
    }
  }

  async function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Zera o input: sem isso, escolher o MESMO arquivo de novo não dispara `change`.
    e.target.value = "";
    if (!file) return;
    setErro(null);
    setFeito(null);
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setErro(parsed.error);
      return;
    }
    setPendente({
      backup: parsed.backup,
      counts: parsed.counts,
      discarded: parsed.discarded,
      unknownVersion: parsed.unknownVersion,
    });
  }

  async function confirmarRestauracao() {
    if (!pendente) return;
    setOcupado("restaurando");
    try {
      const c = await restoreBackup(pendente.backup);
      setFeito(`Restaurado: ${describeCounts(c)}. Recarregando o app…`);
      setPendente(null);
      recarregar();
      /*
       * Recarrega a página inteira, e não só este card.
       *
       * A restauração reescreve o banco INTEIRO por baixo de telas que leram o estado uma
       * vez na montagem — `useActivePlan` entre elas. Sem isto, restaurar num aparelho
       * novo deixava o `/mais` ainda dizendo "Nenhum plano importado ainda" apesar de o
       * plano já estar no disco (achado do review Codex). Atualizar só as contagens
       * corrigiria este card e deixaria todo o resto mentindo.
       *
       * O atraso existe para a confirmação ser lida antes de a tela trocar; o timer é
       * cancelado na desmontagem para não recarregar uma tela que o usuário já deixou.
       */
      recarregarAppRef.current = window.setTimeout(() => window.location.reload(), 1200);
    } catch {
      setErro("Não consegui gravar o backup no aparelho.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-5">
      <p className="text-[11px] uppercase tracking-wider text-faint">Seus dados</p>
      <h2 className="mt-1.5 text-lg font-medium">Backup</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {agora
          ? `Neste aparelho: ${describeCounts(agora)}.`
          : "Lendo o que existe neste aparelho…"}
      </p>

      {/*
        O aviso é o ponto central da tela, não rodapé: o usuário precisa saber que a
        privacidade total tem como contrapartida ser ele o dono do backup.
      */}
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-faint">
        <ShieldAlert size={13} aria-hidden className="mt-0.5 shrink-0 text-recovering" />
        <span>
          Nada do Activve sai do seu aparelho — e por isso ninguém guarda uma cópia por você.
          Limpar os dados do site ou trocar de celular apaga tudo. Baixe um backup de vez em
          quando.
        </span>
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={baixar}
          disabled={ocupado !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98] disabled:opacity-60"
        >
          {ocupado === "exportando" ? (
            <Loader2 size={15} aria-hidden className="animate-spin" />
          ) : (
            <Download size={15} aria-hidden />
          )}
          Baixar backup
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={ocupado !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent/40 disabled:opacity-60"
        >
          <HardDriveDownload size={15} aria-hidden />
          Restaurar backup
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={escolherArquivo}
          className="sr-only"
          aria-label="Escolher arquivo de backup"
        />
      </div>

      {pendente ? (
        <div
          role="group"
          aria-label="Confirmar restauração"
          className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4"
        >
          <p className="text-sm text-ink">
            Este backup tem <span className="font-medium">{describeCounts(pendente.counts)}</span>.
          </p>
          {/* Dizer o que a operação FAZ, antes dela: restaurar aqui é união, não troca. */}
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Restaurar traz esses registros de volta e <span className="text-ink">não apaga</span> o
            que já existe aqui. Se algo coincidir, vale o que está no backup.
          </p>
          {pendente.discarded > 0 ? (
            <p className="mt-1.5 text-xs leading-relaxed text-recovering">
              {pendente.discarded}{" "}
              {pendente.discarded === 1 ? "registro ilegível será ignorado" : "registros ilegíveis serão ignorados"}.
            </p>
          ) : null}
          {pendente.unknownVersion ? (
            <p className="mt-1.5 text-xs leading-relaxed text-recovering">
              Este backup é de uma versão mais nova do Activve. Vou restaurar o que consigo ler.
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmarRestauracao}
              disabled={ocupado !== null}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98] disabled:opacity-60"
            >
              {ocupado === "restaurando" ? (
                <Loader2 size={15} aria-hidden className="animate-spin" />
              ) : null}
              Restaurar
            </button>
            <button
              type="button"
              onClick={() => setPendente(null)}
              disabled={ocupado !== null}
              className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {/* `role="status"` para o leitor de tela anunciar o resultado sem roubar o foco. */}
      {feito ? (
        <p role="status" className="mt-3 text-xs leading-relaxed text-accent">
          {feito}
        </p>
      ) : null}
      {erro ? (
        <p role="status" className="mt-3 text-xs leading-relaxed text-recovering">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
