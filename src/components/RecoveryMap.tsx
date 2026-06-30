"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { BodyProps, ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import type { Muscle } from "@/lib/plan/schema";
import { RECOVERY_LABEL_PT, type MuscleRecovery, type RecoveryState } from "@/lib/plan/recovery";
import { slugRecoveryStates } from "@/lib/plan/muscleSlug";

// Lib só-cliente (SVG): carrega sem SSR — os dados vêm do IndexedDB de qualquer forma.
const Body = dynamic(() => import("react-muscle-highlighter"), { ssr: false }) as ComponentType<BodyProps>;

// Paleta de estados afinada para o navy "Calm Coach" (mais sóbria que os tokens crus).
const STATE_HEX: Record<RecoveryState, string> = {
  worked: "#ef7a52", // coral quente, menos berrante que o laranja puro
  recovering: "#f3c44d", // âmbar
  ready: "#33d6b8", // teal de marca
  rested: "#5b6c80", // ardósia calma (músculo em repouso)
};
const BODY_FILL = "#13233a"; // partes não-musculares (cabeça/mãos/pés) — recuam no card
const BODY_STROKE = "#0b1726"; // separa os músculos → leitura esculpida
const BODY_BORDER = "#2b4150"; // silhueta

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

function listNames(names: string[]): string {
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  const base = shown.join(", ");
  return extra > 0 ? `${base} +${extra}` : base;
}

export function RecoveryMap({
  recovery,
  gender = "male",
}: {
  recovery: Record<Muscle, MuscleRecovery>;
  gender?: "male" | "female";
}) {
  const slugStates = slugRecoveryStates(recovery);
  const data: ExtendedBodyPart[] = [...slugStates.entries()].map(([slug, state]) => ({
    slug,
    color: STATE_HEX[state],
  }));

  const namesIn = (state: RecoveryState) =>
    [...slugStates.entries()]
      .filter(([, s]) => s === state)
      .map(([slug]) => SLUG_LABEL_PT[slug])
      .filter((n): n is string => Boolean(n));

  const worked = namesIn("worked");
  const recovering = namesIn("recovering");
  const anyReady = [...slugStates.values()].includes("ready");
  const anyActive = worked.length > 0 || recovering.length > 0 || anyReady;

  // Resumo do coach (anti-culpa, orientado à ação).
  const summary = worked.length
    ? `Trabalhado há pouco: ${listNames(worked)}.`
    : recovering.length
      ? `Em recuperação: ${listNames(recovering)}.`
      : anyReady
        ? "Recuperado e pronto pra treinar."
        : "Tudo descansado. Bora começar?";

  return (
    <div>
      <p className="mb-4 text-sm text-muted">{summary}</p>

      <div className="relative">
        {/* Spotlight: dá profundidade e foco aos corpos */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 38%, rgba(51,214,184,0.08), transparent 70%)",
          }}
        />
        <div className="relative flex items-start justify-center gap-2">
          {(["front", "back"] as const).map((side) => (
            <div key={side} className="flex flex-1 flex-col items-center">
              <div style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))" }}>
                <Body
                  data={data}
                  side={side}
                  gender={gender}
                  scale={0.82}
                  border={BODY_BORDER}
                  defaultFill={BODY_FILL}
                  defaultStroke={BODY_STROKE}
                  defaultStrokeWidth={0.5}
                />
              </div>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
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
