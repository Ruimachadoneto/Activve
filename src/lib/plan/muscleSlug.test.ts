import { describe, it, expect } from "vitest";
import { MUSCLE_TO_SLUG, slugRecoveryStates } from "./muscleSlug";
import { MUSCLES, type Muscle } from "./schema";
import type { MuscleRecovery, RecoveryState } from "./recovery";

const rec = (state: RecoveryState): MuscleRecovery =>
  ({ state, lastWorkedAt: null, hoursSince: null, recoveryHours: null, fraction: 1 });

/** Constrói um mapa de recuperação com todos descansados, sobrescrevendo alguns. */
function recovery(overrides: Partial<Record<Muscle, RecoveryState>>): Record<Muscle, MuscleRecovery> {
  const out = {} as Record<Muscle, MuscleRecovery>;
  for (const m of MUSCLES) out[m] = rec(overrides[m] ?? "rested");
  return out;
}

describe("MUSCLE_TO_SLUG", () => {
  it("cobre todos os 20 músculos do vocabulário", () => {
    for (const m of MUSCLES) expect(MUSCLE_TO_SLUG[m]).toBeTruthy();
    expect(Object.keys(MUSCLE_TO_SLUG).length).toBe(MUSCLES.length);
  });
});

describe("slugRecoveryStates", () => {
  it("sem estímulo (tudo descansado) → mapa vazio (corpo usa fill padrão)", () => {
    expect(slugRecoveryStates(recovery({})).size).toBe(0);
  });

  it("agrega vários músculos numa região pelo estado mais fatigado", () => {
    // 3 deltoides → 'deltoids'; o pior estado (worked) deve prevalecer
    const r = recovery({ front_delts: "ready", side_delts: "worked", rear_delts: "recovering" });
    expect(slugRecoveryStates(r).get("deltoids")).toBe("worked");
  });

  it("mapeia regiões diretas", () => {
    const r = recovery({ chest: "recovering", quads: "ready" });
    const m = slugRecoveryStates(r);
    expect(m.get("chest")).toBe("recovering");
    expect(m.get("quadriceps")).toBe("ready");
  });

  it("lats e upper_back compartilham 'upper-back' (pior vence)", () => {
    const r = recovery({ lats: "worked", upper_back: "ready" });
    expect(slugRecoveryStates(r).get("upper-back")).toBe("worked");
  });
});
