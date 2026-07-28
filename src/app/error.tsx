"use client"; // Error boundaries precisam ser Client Components (Next 16).

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Backstop de render (TASK-013). O caminho previsto pra plano corrompido é o
 * `PlanErrorState` (validação em `useActivePlan`); este boundary existe pra tudo que
 * NÃO foi previsto — bug de componente, dado inesperado numa store, etc. — para que a
 * falha vire uma tela de recuperação em vez de tela branca/stack trace.
 *
 * `unstable_retry` é o recomendado no Next 16.2 (re-busca e re-renderiza o segmento);
 * `reset` é a API estável mais antiga. Aceitamos os dois e usamos o que estiver
 * presente, pra não quebrar se um deles mudar de nome numa versão futura.
 */
export default function AppError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface2 text-accent">
        <AlertTriangle size={26} aria-hidden />
      </span>

      <h1 className="mt-5 text-[22px] font-medium leading-tight tracking-tight">
        Algo saiu do lugar
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
        Esta tela não conseguiu carregar. Seus treinos e medidas continuam salvos no aparelho.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        {retry ? (
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
          >
            <RotateCcw size={15} aria-hidden /> Tentar de novo
          </button>
        ) : null}
        <Link href="/" className="text-sm text-accent">
          Voltar ao Hoje
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-8 text-[11px] text-faint">Código: {error.digest}</p>
      ) : null}
    </main>
  );
}
