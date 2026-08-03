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
 *
 * **Registro C — Editorial** (DESIGN_SYSTEM §0): estado de erro é uma tela de LEITURA.
 * O título vai ao degrau *Display* e o texto ganha medida e entrelinha de leitura — quem
 * chega aqui precisa entender o que houve, não escanear um card.
 */
export function PlanErrorState({
  errors,
  children,
}: {
  errors: FieldError[];
  /**
   * Slot para uma saída ADICIONAL de recuperação. Só o `/mais` preenche, com o cartão de
   * backup: um plano corrompido é justamente o cenário em que restaurar mais importa, e
   * até a TASK-031 esta tela escondia o backup atrás de um `return` antecipado — a
   * ferramenta de recuperação indisponível exatamente na hora de recuperar (review Codex).
   */
  children?: React.ReactNode;
}) {
  const shown = errors.slice(0, MAX_SHOWN);
  const rest = errors.length - shown.length;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      {/* `danger`, não `accent`: a §2.1 reserva o teal para ação disponível e estado
          "pronto". Plano ilegível é falha real — é exatamente o que o vermelho significa.
          O tom calmo mora na copy, não em fingir que nada quebrou. */}
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface2 text-danger">
        <FileWarning size={26} aria-hidden />
      </span>

      <h1 className="mt-6 max-w-[18ch] text-[30px] font-medium leading-[1.15] tracking-tight">
        Não conseguimos abrir seu plano
      </h1>
      <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-muted">
        O arquivo salvo neste aparelho está incompleto ou fora do formato esperado. Nada de errado
        do seu lado — é só reimportar o plano para voltar ao normal.
      </p>
      <p className="mt-3 max-w-[34ch] text-[13px] leading-relaxed text-faint">
        Seu histórico de treinos e medidas continua salvo: reimportar não apaga nada.
      </p>

      <Link
        href="/import"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
      >
        <RefreshCw size={15} aria-hidden /> Reimportar plano
      </Link>

      {/* Antes dos detalhes técnicos: recuperar o histórico importa mais que diagnosticar. */}
      {children ? <div className="mt-7 w-full text-left">{children}</div> : null}

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
