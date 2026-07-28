"use client"; // Error boundaries precisam ser Client Components (Next 16).

import "./globals.css";

/**
 * Último recurso: substitui o root layout quando é ELE que falha (o `error.tsx` só
 * cobre do layout pra baixo). Por isso declara o próprio `<html>`/`<body>` e importa
 * os estilos globais. Deliberadamente sem ícones/componentes — se chegamos aqui, quanto
 * menos dependências no caminho de render, melhor.
 */
export default function GlobalError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  const retry = unstable_retry ?? reset;

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <h1 className="text-[22px] font-medium leading-tight tracking-tight">
            Algo saiu do lugar
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            O Activve não conseguiu iniciar. Seus treinos e medidas continuam salvos no aparelho.
          </p>
          {retry ? (
            <button
              type="button"
              onClick={() => retry()}
              className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent"
            >
              Tentar de novo
            </button>
          ) : null}
          {error.digest ? (
            <p className="mt-8 text-[11px] text-faint">Código: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
