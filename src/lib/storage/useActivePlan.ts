"use client";

import { useEffect, useState } from "react";
import { getActivePlan, type StoredPlan } from "./plans";
import { validatePlan } from "../plan/parse";
import type { FieldError } from "../plan/parse";

/** Plano gravado que não passa mais no schema — o app não consegue montar as telas com ele. */
export type InvalidPlan = { planId: string | null; errors: FieldError[] };

export type ActivePlanState = {
  loading: boolean;
  plan: StoredPlan | null;
  /**
   * Preenchido quando existe um plano gravado mas ele é inválido (TASK-013).
   * `plan` continua `null` nesse caso de propósito: uma tela que ainda não trate
   * `invalid` cai no empty state "importe seu plano" — degradação segura em vez do
   * crash que existia antes.
   */
  invalid: InvalidPlan | null;
};

/**
 * Lê o plano ativo do IndexedDB no cliente e o **revalida** contra o schema.
 * O import valida na entrada, mas o registro pode degradar depois (escrita
 * interrompida, semeadura manual, versão antiga do app, bug futuro de migração);
 * validar de novo na leitura é a fronteira que impede um plano quebrado de
 * derrubar a renderização das telas.
 */
export function useActivePlan(): ActivePlanState {
  const [state, setState] = useState<ActivePlanState>({
    loading: true,
    plan: null,
    invalid: null,
  });

  useEffect(() => {
    let alive = true;
    getActivePlan()
      .then((stored) => {
        if (!alive) return;
        if (!stored) {
          setState({ loading: false, plan: null, invalid: null });
          return;
        }
        const result = validatePlan(stored.plan);
        if (!result.ok) {
          setState({
            loading: false,
            plan: null,
            invalid: { planId: stored.planId ?? null, errors: result.errors },
          });
          return;
        }
        // Reaproveita o registro original (mantém planId/importedAt) com o plano tipado.
        setState({ loading: false, plan: { ...stored, plan: result.plan }, invalid: null });
      })
      .catch(() => alive && setState({ loading: false, plan: null, invalid: null }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
