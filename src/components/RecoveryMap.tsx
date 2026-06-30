"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { BodyProps, ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import type { Muscle } from "@/lib/plan/schema";
import { RECOVERY_LABEL_PT, type MuscleRecovery, type RecoveryState } from "@/lib/plan/recovery";
import { slugRecoveryDetail } from "@/lib/plan/muscleSlug";

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

// Nome PT-BR de cada região desenhável (para a linha-resumo do coach).
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

/**
 * Cor final por região: a cor do estado, com opacidade modulada pela "frescura" do
 * estímulo (heat = 1 − fração). Músculo recém-trabalhado fica forte; quanto mais
 * recuperado, mais discreto — isso "dома" o calor quando há muito grupo trabalhado.
 * Pronto/descansado têm opacidade fixa (são estados estáveis, não graduados).
 */
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
  const anyReady = [...detail.values()].some((d) => d.state === "ready");
  const anyActive = worked.length > 0 || recovering.length > 0 || anyReady;

  const summary = worked.length
    ? `Trabalhado há pouco: ${listNames(worked)}.`
    : recovering.length
      ? `Em recuperação: ${listNames(recovering)}.`
      : anyReady
        ? "Recuperado e pronto pra treinar."
        : "Tudo descansado. Bora começar?";

  return (
    <div>
      <p className="mb-5 text-sm text-muted">{summary}</p>

      <div className="relative">
        {/* Spotlight + vinheta: foco e profundidade nos corpos */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 58% at 50% 36%, rgba(51,214,184,0.14), rgba(51,214,184,0.04) 45%, transparent 72%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        <div className="relative flex items-start justify-center gap-1">
          {(["front", "back"] as const).map((side) => (
            <div key={side} className="flex flex-1 flex-col items-center">
              <div style={{ filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.55))" }}>
                <Body
                  data={data}
                  side={side}
                  gender={gender}
                  scale={0.95}
                  border={BODY_BORDER}
                  defaultFill={BODY_FILL}
                  defaultStroke={BODY_STROKE}
                  defaultStrokeWidth={0.5}
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

      {!anyActive ? (
        <p className="mt-3 text-center text-xs text-faint">
          Conclua um treino para ver seus músculos acenderem aqui.
        </p>
      ) : null}
    </div>
  );
}
