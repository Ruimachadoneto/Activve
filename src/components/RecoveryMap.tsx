"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { BodyProps, ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import type { Muscle } from "@/lib/plan/schema";
import {
  RECOVERY_LABEL_PT,
  hoursToReady,
  type MuscleRecovery,
  type RecoveryState,
} from "@/lib/plan/recovery";
import { slugRecoveryDetail, type SlugRecovery } from "@/lib/plan/muscleSlug";

// Lib só-cliente (SVG): carrega sem SSR — os dados vêm do IndexedDB de qualquer forma.
const Body = dynamic(() => import("react-muscle-highlighter"), { ssr: false }) as ComponentType<BodyProps>;

// Paleta de estados afinada para o navy "Calm Coach".
const STATE_HEX: Record<RecoveryState, string> = {
  worked: "#e8744a", // coral quente
  recovering: "#eebd45", // âmbar
  ready: "#33d6b8", // teal de marca
  rested: "#46586e", // azul-aço calmo (músculo em repouso = parte do corpo)
};
const BODY_FILL = "#0f1d30"; // partes não-musculares (cabeça/mãos/pés) — recuam
const BODY_STROKE = "#0a1524"; // separa os músculos → leitura esculpida
const BODY_BORDER = "#314a5c"; // silhueta

const LEGEND: RecoveryState[] = ["worked", "recovering", "ready", "rested"];

// Nome PT-BR de cada região desenhável.
const SLUG_LABEL_PT: Partial<Record<Slug, string>> = {
  chest: "peito",
  "upper-back": "costas",
  trapezius: "trapézio",
  "lower-back": "lombar",
  deltoids: "ombros",
  biceps: "bíceps",
  triceps: "tríceps",
  forearm: "antebraço",
  abs: "abdômen",
  obliques: "oblíquos",
  gluteal: "glúteos",
  quadriceps: "quadríceps",
  hamstring: "posterior",
  adductors: "adutores",
  calves: "panturrilha",
  neck: "pescoço",
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const withAlpha = (hex: string, a: number) =>
  hex + Math.round(clamp01(a) * 255).toString(16).padStart(2, "0");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Cor por região: cor do estado com opacidade modulada pela frescura do estímulo. */
function colorFor(state: RecoveryState, fraction: number): string {
  const heat = clamp01(1 - fraction);
  switch (state) {
    case "worked":
      return withAlpha(STATE_HEX.worked, 0.55 + 0.45 * heat);
    case "recovering":
      return withAlpha(STATE_HEX.recovering, 0.5 + 0.4 * heat);
    case "ready":
      return withAlpha(STATE_HEX.ready, 0.92);
    case "rested":
      return STATE_HEX.rested;
  }
}

/** Duração amigável até ficar pronto. */
function fmtDuration(hours: number): string {
  if (hours < 1) return "menos de 1h";
  if (hours < 24) return `~${Math.round(hours)}h`;
  const days = hours / 24;
  return days < 1.5 ? "~1 dia" : `~${Math.round(days)} dias`;
}

/** Texto de detalhe ao tocar um músculo. */
function detailText(name: string, d: SlugRecovery): string {
  const label = RECOVERY_LABEL_PT[d.state];
  if (d.state === "ready") return `${cap(name)} · pronto pra treinar`;
  if (d.state === "rested") return `${cap(name)} · descansado`;
  const left = hoursToReady(d);
  return left ? `${cap(name)} · ${label} · pronto em ${fmtDuration(left)}` : `${cap(name)} · ${label}`;
}

function listNames(names: string[]): string {
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  return extra > 0 ? `${shown.join(", ")} +${extra}` : shown.join(", ");
}

export function RecoveryMap({
  recovery,
  gender = "male",
}: {
  recovery: Record<Muscle, MuscleRecovery>;
  gender?: "male" | "female";
}) {
  const [selected, setSelected] = useState<Slug | null>(null);

  const detail = slugRecoveryDetail(recovery);
  const data: ExtendedBodyPart[] = [...detail.entries()].map(([slug, d]) => ({
    slug,
    color: colorFor(d.state, d.fraction),
  }));

  const namesIn = (state: RecoveryState) =>
    [...detail.entries()]
      .filter(([, d]) => d.state === state)
      .map(([slug]) => SLUG_LABEL_PT[slug])
      .filter((n): n is string => Boolean(n));

  const worked = namesIn("worked");
  const recovering = namesIn("recovering");
  const ready = namesIn("ready");
  const anyActive = worked.length > 0 || recovering.length > 0 || ready.length > 0;

  const summary = worked.length
    ? `Trabalhado há pouco: ${listNames(worked)}.`
    : recovering.length
      ? `Em recuperação: ${listNames(recovering)}.`
      : ready.length
        ? "Recuperado e pronto pra treinar."
        : "Tudo descansado. Bora começar?";

  const selDetail = selected ? detail.get(selected) : undefined;
  const selName = selected ? SLUG_LABEL_PT[selected] : undefined;

  function handlePress(part: ExtendedBodyPart) {
    const slug = part.slug;
    setSelected((cur) => (slug && detail.has(slug) && cur !== slug ? slug : null));
  }

  return (
    <div style={{ animation: "recovery-rise 0.35s ease-out both" }}>
      {/* Linha dinâmica: detalhe do músculo tocado ou resumo do coach */}
      <div className="mb-4 flex min-h-[20px] items-center gap-2 text-sm">
        {selDetail && selName ? (
          <>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATE_HEX[selDetail.state] }}
              aria-hidden
            />
            <span className="text-ink">{detailText(selName, selDetail)}</span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fechar detalhe"
              className="ml-auto rounded-md px-1.5 text-faint hover:text-muted"
            >
              ✕
            </button>
          </>
        ) : (
          <span className="text-muted">{summary}</span>
        )}
      </div>

      <div className="relative">
        {/* Spotlight + vinheta: foco e profundidade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(68% 56% at 50% 36%, rgba(51,214,184,0.15), rgba(51,214,184,0.04) 46%, transparent 72%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 50%, transparent 54%, rgba(0,0,0,0.5) 100%)",
          }}
        />
        <div
          className="relative flex items-start justify-center gap-1"
          role="group"
          aria-label="Mapa de recuperação muscular. Toque num músculo para ver quando estará pronto."
        >
          {(["front", "back"] as const).map((side) => (
            <div key={side} className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className="w-full [&_svg]:!h-auto [&_svg]:!w-full"
                style={{ filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.55))" }}
              >
                <Body
                  data={data}
                  side={side}
                  gender={gender}
                  scale={1}
                  border={BODY_BORDER}
                  defaultFill={BODY_FILL}
                  defaultStroke={BODY_STROKE}
                  defaultStrokeWidth={0.5}
                  onBodyPartPress={handlePress}
                />
              </div>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
                {side === "front" ? "Frente" : "Costas"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {LEGEND.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATE_HEX[s], boxShadow: `0 0 7px ${STATE_HEX[s]}66` }}
              aria-hidden
            />
            {RECOVERY_LABEL_PT[s]}
          </li>
        ))}
      </ul>

      {anyActive ? (
        <p className="mt-3 text-center text-[11px] text-faint">Toque num músculo para detalhes.</p>
      ) : (
        <p className="mt-3 text-center text-xs text-faint">
          Conclua um treino para ver seus músculos acenderem aqui.
        </p>
      )}
    </div>
  );
}
