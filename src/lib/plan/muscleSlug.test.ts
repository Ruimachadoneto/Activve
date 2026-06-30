import { describe, it, expect } from "vitest";
import { MUSCLE_TO_SLUG, slugRecoveryStates, slugRecoveryDetail } from "./muscleSlug";
import { MUSCLES, type Muscle } from "./schema";
import { computeRecovery, type MuscleRecovery, type MuscleStimulus, type RecoveryState } from "./recovery";

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

describe("slugRecoveryDetail", () => {
  const withFraction = (state: RecoveryState, fraction: number): MuscleRecovery => ({
    state,
    lastWorkedAt: 0,
    hoursSince: 0,
    recoveryHours: 1,
    fraction,
  });

  it("propaga estado + fração por região", () => {
    const r = recovery({});
    r.chest = withFraction("worked", 0.2);
    const d = slugRecoveryDetail(r);
    expect(d.get("chest")).toEqual({ state: "worked", fraction: 0.2 });
    expect(d.get("abs")).toEqual({ state: "rested", fraction: 1 }); // default
  });

  it("região compartilhada: empate de estado → vence a menor fração (mais fresco)", () => {
    const r = recovery({});
    // front_delts e side_delts → 'deltoids', ambos worked; o mais fresco (0.1) vence
    r.front_delts = withFraction("worked", 0.4);
    r.side_delts = withFraction("worked", 0.1);
    expect(slugRecoveryDetail(r).get("deltoids")).toEqual({ state: "worked", fraction: 0.1 });
  });
});

describe("slugRecoveryStates", () => {
  it("sem estímulo → todas as regiões musculares em 'descansado' (corpo todo pintado)", () => {
    const m = slugRecoveryStates(recovery({}));
    const distinctSlugs = new Set(Object.values(MUSCLE_TO_SLUG)).size;
    expect(m.size).toBe(distinctSlugs);
    expect([...m.values()].every((s) => s === "rested")).toBe(true);
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

// Verificação integral: passa por TODOS os músculos, nos 4 estados, da heurística
// (computeRecovery) até a agregação por região (slugRecoveryStates).
describe("integração — todos os músculos e estados", () => {
  const NOW = Date.UTC(2026, 5, 29, 12, 0, 0);
  const H = 3_600_000;
  // tempos/cargas escolhidos para produzir cada estado de forma determinística:
  const stim = (muscle: Muscle, state: Exclude<RecoveryState, "rested">): MuscleStimulus => {
    if (state === "worked") return { muscle, at: NOW - 5 * H, load: 1 }; // 5/72 → trabalhado
    if (state === "recovering") return { muscle, at: NOW - 50 * H, load: 0.5 }; // 50/60 → recuperando
    return { muscle, at: NOW - 80 * H, load: 0.1 }; // 80/50.4 → pronto
  };

  const worked: Muscle[] = ["quads", "hamstrings", "glutes", "calves"];
  const recovering: Muscle[] = ["lats", "upper_back", "biceps", "forearms"];
  const ready: Muscle[] = ["chest", "triceps", "front_delts"];
  // resto (traps, lower_back, side_delts, rear_delts, abs, obliques, adductors, abductors, neck) = descansado

  const stimuli: MuscleStimulus[] = [
    ...worked.map((m) => stim(m, "worked")),
    ...recovering.map((m) => stim(m, "recovering")),
    ...ready.map((m) => stim(m, "ready")),
  ];
  const rec = computeRecovery(stimuli, NOW);

  it("cada músculo recebe o estado esperado (incluindo descansados)", () => {
    for (const m of worked) expect(rec[m].state, m).toBe("worked");
    for (const m of recovering) expect(rec[m].state, m).toBe("recovering");
    for (const m of ready) expect(rec[m].state, m).toBe("ready");
    const restedExpected: Muscle[] = MUSCLES.filter(
      (m) => ![...worked, ...recovering, ...ready].includes(m),
    );
    for (const m of restedExpected) expect(rec[m].state, m).toBe("rested");
  });

  it("os 4 estados são alcançáveis pela heurística", () => {
    const states = new Set(MUSCLES.map((m) => rec[m].state));
    expect(states).toEqual(new Set(["worked", "recovering", "ready", "rested"]));
  });

  it("agregação por slug cobre frente E costas, com o pior estado por região", () => {
    const slugs = slugRecoveryStates(rec);
    // pernas (frente+costas) trabalhadas
    expect(slugs.get("quadriceps")).toBe("worked");
    expect(slugs.get("hamstring")).toBe("worked");
    expect(slugs.get("calves")).toBe("worked");
    expect(slugs.get("gluteal")).toBe("worked"); // glutes worked > abductors rested
    // costas/braços recuperando
    expect(slugs.get("upper-back")).toBe("recovering"); // lats + upper_back
    expect(slugs.get("biceps")).toBe("recovering");
    expect(slugs.get("forearm")).toBe("recovering");
    // empurrar pronto; deltoids = front_delts(ready) vs side/rear(rested) → ready
    expect(slugs.get("chest")).toBe("ready");
    expect(slugs.get("triceps")).toBe("ready");
    expect(slugs.get("deltoids")).toBe("ready");
    // descansados também entram no mapa, pintados com o token rested
    expect(slugs.get("abs")).toBe("rested");
    expect(slugs.get("neck")).toBe("rested");
  });
});
