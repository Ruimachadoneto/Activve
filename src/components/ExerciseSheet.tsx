"use client";

import { useEffect } from "react";
import { X, Play, Check, CheckCircle2, Lightbulb } from "lucide-react";
import type { Exercise } from "@/lib/plan/schema";
import { resolveMovement, videoHref } from "@/lib/plan/movement";
import { resolveExerciseMedia } from "@/lib/plan/exerciseMedia";
import { equipmentLabel, muscleLabel } from "@/lib/plan/labels";
import { ExerciseThumb } from "@/components/ExerciseMediaCard";

/**
 * Detalhe do exercício (bottom-sheet): músculos trabalhados, como fazer, dicas
 * técnicas/dica rápida (schema 1.1, quando o plano traz) e troca de variação.
 *
 * **Registro C — Editorial** (DESIGN_SYSTEM §0): aqui a tarefa é LER e absorver como
 * executar um movimento, não decidir nem agir sob esforço. Por isso o nome do exercício
 * sobe ao degrau *Display* e os passos deixam de ser legenda cinza para virar o texto
 * principal da tela — era a informação mais importante da sheet renderizada com a menor
 * ênfase disponível.
 */
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
  // Músculos do MOVIMENTO executado. Os primários vêm da variação quando ela os
  // define; os SECUNDÁRIOS só são confiáveis para o exercício base — o schema das
  // alternativas não os expressa, então numa troca preferimos não afirmar sinergistas
  // (que podem ser de outro movimento) a mostrar informação errada.
  const primaries = mov.primaryMuscles?.length ? mov.primaryMuscles : exercise.primaryMuscles;
  const secondaries = mov.isSwapped ? [] : (exercise.secondaryMuscles ?? []);
  const tips = mov.howTo.tips ?? [];
  const quickTip = mov.howTo.quickTip;

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
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Fechar" onClick={onClose} />

      {/* E4 — é um elemento que de fato flutua, o único nível com sombra projetada (§5). */}
      <div className="elev-float relative max-h-[85vh] w-full max-w-[440px] overflow-y-auto rounded-t-2xl border border-line bg-surface px-6 py-6 pb-9">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[30px] font-medium leading-[1.12] tracking-tight">{mov.name}</h2>
            <p className="mt-1.5 text-xs text-muted">
              {equipmentLabel(mov.equipment)}
              {mov.isSwapped ? <span className="text-accent"> · variação</span> : null}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" autoFocus className="-mr-1 -mt-1 p-1 text-faint">
            <X size={20} aria-hidden />
          </button>
        </div>

        {primaries.length > 0 || secondaries.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Músculos trabalhados">
            {primaries.map((m) => (
              <span
                key={m}
                className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent"
              >
                {muscleLabel(m)}
              </span>
            ))}
            {secondaries.map((m) => (
              <span
                key={m}
                className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted"
              >
                {muscleLabel(m)} · sinergista
              </span>
            ))}
          </div>
        ) : null}

        <section className="mt-6 border-t border-line pt-5">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-faint">Execução</h3>
          {/* Numeral em `faint`, não em teal: a §2.1 reserva o acento para ação e para o
              estado "pronto". Número de passo é estrutura de leitura, não ação. */}
          <ol className="mt-3 flex flex-col gap-3.5">
            {mov.howTo.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="w-4 shrink-0 tabular-nums text-faint">{i + 1}</span>
                <span className="max-w-[46ch] text-ink">{step}</span>
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

        {tips.length > 0 ? (
          <section className="mt-6 rounded-xl border border-line bg-surface2/30 px-4 py-4">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-faint">Dicas técnicas</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
                  <CheckCircle2 size={15} aria-hidden className="mt-1 shrink-0 text-accent" />
                  <span className="max-w-[46ch] text-ink">{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 border-t border-line pt-5">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-faint">Variações</h3>
          <div className="mt-2 flex flex-col gap-2">
            <VariationRow
              name={exercise.name}
              isOriginal
              equipment={exercise.equipment}
              mediaId={exercise.howTo.mediaId}
              active={!mov.isSwapped}
              onUse={() => onSwap(undefined)}
            />
            {exercise.alternatives.map((alt) => (
              <VariationRow
                key={alt.id}
                name={alt.name}
                equipment={alt.equipment}
                mediaId={alt.howTo.mediaId}
                active={swappedToId === alt.id}
                onUse={() => onSwap(alt.id)}
              />
            ))}
          </div>
        </section>

        {quickTip ? (
          <section className="mt-6 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-4">
            <Lightbulb size={16} aria-hidden className="mt-1 shrink-0 text-warn" />
            <p className="min-w-0 text-[15px] leading-relaxed">
              <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.18em] text-warn">
                Dica rápida
              </span>
              <span className="block max-w-[46ch] text-ink">{quickTip}</span>
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function VariationRow({
  name,
  isOriginal = false,
  equipment,
  mediaId,
  active,
  onUse,
}: {
  name: string;
  isOriginal?: boolean;
  equipment?: string;
  mediaId?: string;
  active: boolean;
  onUse: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onUse}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        active ? "border-accent bg-accent/10" : "border-line hover:border-faint"
      }`}
    >
      {/* Resolve a mídia pelo nome CRU do exercício — o "(original)" é só rótulo. */}
      <ExerciseThumb media={resolveExerciseMedia(name, mediaId)} className="h-10 w-10 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">
          {name}
          {isOriginal ? <span className="text-faint"> (original)</span> : null}
        </span>
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
