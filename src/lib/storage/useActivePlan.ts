"use client";

import { useEffect, useState } from "react";
import { getActivePlan, type StoredPlan } from "./plans";

export type ActivePlanState = { loading: boolean; plan: StoredPlan | null };

/** Lê o plano ativo do IndexedDB no cliente. */
export function useActivePlan(): ActivePlanState {
  const [state, setState] = useState<ActivePlanState>({ loading: true, plan: null });

  useEffect(() => {
    let alive = true;
    getActivePlan()
      .then((plan) => alive && setState({ loading: false, plan }))
      .catch(() => alive && setState({ loading: false, plan: null }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
