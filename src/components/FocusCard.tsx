"use client";

import { Target } from "lucide-react";
import { muscleLabel } from "@/lib/plan/labels";
import {
  hoursToReady,
  recoveryColorVar,
  RECOVERY_LABEL_PT,
  type MuscleRecovery,
} from "@/lib/plan/recovery";
import type { Muscle } from "@/lib/plan/schema";

/** "~14h" / "~2 dias" — precisão fingida (minutos) não ajudaria a decidir nada. */
function prontoEm(horas: number): string {
  if (horas < 24) return `pronto em ~${Math.max(1, Math.round(horas))}h`;
  const dias = Math.round(horas / 24);
  return `pronto em ~${dias} ${dias === 1 ? "dia" : "dias"}`;
}

/**
 * Foco do dia (TASK-023).
 *
 * Antes era só o texto `focus` do plano, posicionado ABAIXO do card do treino — ou seja,
 * um resumo do que já estava logo acima. Agora fica entre o número-herói e o treino, e
 * explica **o que aquele número significa para este treino**: quais músculos ainda estão
 * se recuperando e quando ficam prontos.
 *
 * Limite deliberado: aqui só se DESCREVE o corpo, nunca se prescreve treino. Quem prescreve
 * é o plano gerado pelo coach (arquitetura plan-file) — o app importa e rastreia. Por isso
 * "pronto em ~2 dias" (fato derivado do histórico) e nunca "hoje use carga leve".
 */
export function FocusCard({
  focus,
  limiting,
  recovery,
}: {
  focus?: string;
  /*
   * Ausentes quando NÃO há histórico de treino. Nesse caso o card mostra só o foco do
   * plano e cala sobre recuperação — dizer "tudo recuperado" sem uma única sessão
   * registrada seria uma afirmação sobre um corpo do qual nada foi medido, exatamente o
   * que a regra de honestidade (§9) proíbe no número-herói (achado do review Codex).
   */
  limiting?: Muscle[];
  recovery?: Record<Muscle, MuscleRecovery>;
}) {
  const temDadosDeRecuperacao = !!recovery && !!limiting;
  const emRecuperacao = (limiting ?? []).slice(0, 2).map((muscle) => {
    const r = recovery?.[muscle];
    const horas = r ? hoursToReady(r) : null;
    return {
      muscle,
      estado: r?.state ?? "rested",
      detalhe: horas != null ? prontoEm(horas) : RECOVERY_LABEL_PT[r?.state ?? "rested"].toLowerCase(),
    };
  });

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <Target size={14} aria-hidden className="text-accent" />
        <p className="text-[11px] uppercase tracking-wider text-faint">Foco do dia</p>
      </div>

      {focus ? <p className="mt-2 text-[17px] leading-snug">{focus}</p> : null}

      {!temDadosDeRecuperacao ? null : emRecuperacao.length > 0 ? (
        <ul className={focus ? "mt-3 space-y-1.5" : "mt-2 space-y-1.5"}>
          {emRecuperacao.map(({ muscle, estado, detalhe }) => (
            <li key={muscle} className="flex items-center gap-2 text-xs text-muted">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: `var(${recoveryColorVar(estado)})` }}
                aria-hidden
              />
              <span>
                <span className="text-ink">{muscleLabel(muscle)}</span> · {detalhe}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={focus ? "mt-3 text-xs text-muted" : "mt-2 text-xs text-muted"}>
          Tudo que este treino exige está recuperado.
        </p>
      )}
    </section>
  );
}
