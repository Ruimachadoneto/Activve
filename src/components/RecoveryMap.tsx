"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { BodyProps, ExtendedBodyPart } from "react-muscle-highlighter";
import type { Muscle } from "@/lib/plan/schema";
import { RECOVERY_LABEL_PT, type MuscleRecovery, type RecoveryState } from "@/lib/plan/recovery";
import { slugRecoveryStates } from "@/lib/plan/muscleSlug";

// Lib só-cliente (SVG): carrega sem SSR — os dados vêm do IndexedDB de qualquer forma.
const Body = dynamic(() => import("react-muscle-highlighter"), { ssr: false }) as ComponentType<BodyProps>;

// Espelha os tokens de recuperação do globals.css (a lib pinta via fill no SVG).
const STATE_HEX: Record<RecoveryState, string> = {
  worked: "#f2854a",
  recovering: "#f2c94c",
  ready: "#2fd4b6",
  rested: "#6b7688",
};
const BODY_FILL = "#1b2a3d"; // músculo em repouso / regiões não rastreadas
const BODY_BORDER = "#33455c"; // silhueta no fundo escuro

const LEGEND: RecoveryState[] = ["worked", "recovering", "ready", "rested"];

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

  return (
    <div>
      <div className="flex items-start justify-center gap-3">
        {(["front", "back"] as const).map((side) => (
          <div key={side} className="flex flex-1 flex-col items-center">
            <Body
              data={data}
              side={side}
              gender={gender}
              scale={0.62}
              border={BODY_BORDER}
              defaultFill={BODY_FILL}
            />
            <span className="mt-1.5 text-[10px] uppercase tracking-wider text-faint">
              {side === "front" ? "Frente" : "Costas"}
            </span>
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {LEGEND.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATE_HEX[s] }}
              aria-hidden
            />
            {RECOVERY_LABEL_PT[s]}
          </li>
        ))}
      </ul>

      {data.length === 0 ? (
        <p className="mt-3 text-center text-xs text-faint">
          Conclua um treino para ver seus músculos acenderem aqui.
        </p>
      ) : null}
    </div>
  );
}
