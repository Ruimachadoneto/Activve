"use client";

import { useEffect } from "react";
import { X, Play, Check } from "lucide-react";
import type { Exercise } from "@/lib/plan/schema";
import { resolveMovement, videoHref } from "@/lib/plan/movement";
import { equipmentLabel } from "@/lib/plan/labels";

/** Detalhe do exercício (bottom-sheet): como fazer + mídia + troca de variação. */
export function ExerciseSheet({
  exercise,
  swappedToId,
  onSwap,
  onClose,
}: {
  exercise: Exercise;
  swappedToId?: string;
  onSwap: (altId: string | undefined) => void;
  onClose: () => void;
}) {
  const mov = resolveMovement(exercise, swappedToId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={mov.name}
    >
      <button className="absolute inset-0 bg-black/60" aria-label="Fechar" onClick={onClose} />

      <div className="relative max-h-[85vh] w-full max-w-[440px] overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium leading-tight">{mov.name}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {equipmentLabel(mov.equipment)}
              {mov.isSwapped ? <span className="text-accent"> · variação</span> : null}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" autoFocus className="-mr-1 -mt-1 p-1 text-faint">
            <X size={20} aria-hidden />
          </button>
        </div>

        <section className="mt-4">
          <h3 className="text-[11px] uppercase tracking-wider text-faint">Como fazer</h3>
          <ol className="mt-2 flex flex-col gap-2">
            {mov.howTo.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="shrink-0 font-medium text-accent">{i + 1}.</span>
                <span className="text-muted">{step}</span>
              </li>
            ))}
          </ol>
          <a
            href={videoHref(mov)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent"
          >
            <Play size={14} aria-hidden /> Ver vídeo
          </a>
        </section>

        <section className="mt-5">
          <h3 className="text-[11px] uppercase tracking-wider text-faint">Variações</h3>
          <div className="mt-2 flex flex-col gap-2">
            <VariationRow
              name={`${exercise.name} (original)`}
              equipment={exercise.equipment}
              active={!mov.isSwapped}
              onUse={() => onSwap(undefined)}
            />
            {exercise.alternatives.map((alt) => (
              <VariationRow
                key={alt.id}
                name={alt.name}
                equipment={alt.equipment}
                active={swappedToId === alt.id}
                onUse={() => onSwap(alt.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function VariationRow({
  name,
  equipment,
  active,
  onUse,
}: {
  name: string;
  equipment?: string;
  active: boolean;
  onUse: () => void;
}) {
  return (
    <button
      onClick={onUse}
      aria-pressed={active}
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        active ? "border-accent bg-accent/10" : "border-line hover:border-faint"
      }`}
    >
      <span>
        <span className="block text-sm">{name}</span>
        <span className="block text-xs text-faint">{equipmentLabel(equipment)}</span>
      </span>
      {active ? (
        <Check size={16} className="shrink-0 text-accent" aria-hidden />
      ) : (
        <span className="shrink-0 text-xs text-accent">Usar</span>
      )}
    </button>
  );
}
