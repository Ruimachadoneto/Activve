"use client";

import Link from "next/link";
import { FileWarning, RefreshCw } from "lucide-react";
import type { FieldError } from "@/lib/plan/parse";

/** Quantos erros mostramos no detalhe técnico — o resto vira "e mais N". */
const MAX_SHOWN = 8;
/** Mensagem do zod é derivada de entrada não confiável: corta antes de exibir. */
const MAX_MESSAGE_CHARS = 160;

function truncate(value: string): string {
  return value.length > MAX_MESSAGE_CHARS ? `${value.slice(0, MAX_MESSAGE_CHARS)}…` : value;
}

/**
 * Estado de erro para plano inválido/corrompido (TASK-013).
 *
 * Tom anti-culpa: o problema é do arquivo, não do usuário, e existe uma saída óbvia.
 * Os erros são renderizados como TEXTO (React escapa) e truncados — o conteúdo vem de
 * um arquivo não confiável.
 */
export function PlanErrorState({ errors }: { errors: FieldError[] }) {
  const shown = errors.slice(0, MAX_SHOWN);
  const rest = errors.length - shown.length;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface2 text-accent">
        <FileWarning size={26} aria-hidden />
      </span>

      <h1 className="mt-5 text-[22px] font-medium leading-tight tracking-tight">
        Não conseguimos abrir seu plano
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
        O arquivo salvo neste aparelho está incompleto ou fora do formato esperado. Nada de errado
        do seu lado — é só reimportar o plano para voltar ao normal.
      </p>
      <p className="mt-3 max-w-xs text-xs leading-relaxed text-faint">
        Seu histórico de treinos e medidas continua salvo: reimportar não apaga nada.
      </p>

      <Link
        href="/import"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
      >
        <RefreshCw size={15} aria-hidden /> Reimportar plano
      </Link>

      {shown.length > 0 ? (
        <details className="mt-8 w-full text-left">
          <summary className="cursor-pointer text-xs text-faint">Detalhes técnicos</summary>
          <ul className="mt-3 space-y-1.5 rounded-xl border border-line bg-surface p-3">
            {shown.map((e, i) => (
              <li key={`${e.field}-${i}`} className="text-xs leading-relaxed text-muted">
                <span className="font-medium text-ink">{truncate(e.field)}</span>{" "}
                <span className="break-words">{truncate(e.message)}</span>
              </li>
            ))}
            {rest > 0 ? <li className="text-xs text-faint">e mais {rest}…</li> : null}
          </ul>
        </details>
      ) : null}
    </main>
  );
}
