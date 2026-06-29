/** Wordmark da marca: `acti·vv·e` com o "vv" no acento. Ver docs/DESIGN_SYSTEM.md §1. */
export function Logo({
  size = "md",
  tagline = false,
}: {
  size?: "md" | "lg";
  tagline?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
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
