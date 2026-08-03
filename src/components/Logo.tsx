import { LogoMark } from "./LogoMark";

/**
 * Assinatura da marca: símbolo + wordmark `acti·vv·e` com o "vv" no acento.
 * Ver `docs/DESIGN_SYSTEM.md` §1. O símbolo mora em `LogoMark` (tem o raciocínio da
 * construção) e só aparece quando a marca se apresenta — telas de entrada, import e
 * estados vazios. No chrome do app, o símbolo vai sozinho.
 */
export function Logo({
  size = "md",
  tagline = false,
  mark = true,
}: {
  size?: "md" | "lg";
  tagline?: boolean;
  /** Só o wordmark, sem símbolo — para onde o símbolo já esteja presente na tela. */
  mark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      {mark ? (
        <LogoMark size={size === "lg" ? 48 : 32} className="mb-3 text-accent" />
      ) : null}
      <span
        className={`font-light lowercase tracking-[0.12em] text-ink ${
          size === "lg" ? "text-[40px] leading-none" : "text-2xl"
        }`}
      >
        acti<span className="text-accent">vv</span>e
      </span>
      {tagline ? (
        <span className="mt-2.5 text-[10px] uppercase tracking-[0.28em] text-faint">
          treino inteligente · vida real
        </span>
      ) : null}
    </div>
  );
}
