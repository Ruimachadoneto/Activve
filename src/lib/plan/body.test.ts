import { describe, it, expect } from "vitest";
import { makeEntry, weightSeries, computeTrend, type BodyEntry } from "./body";

const e = (date: string, weight_kg?: number): BodyEntry => ({
  date,
  weight_kg,
  recordedAt: `${date}T08:00:00.000Z`,
});

describe("makeEntry", () => {
  it("arredonda o peso e marca a data", () => {
    const entry = makeEntry(84.27, "2026-06-26");
    expect(entry).toMatchObject({ date: "2026-06-26", weight_kg: 84.3 });
    expect(typeof entry.recordedAt).toBe("string");
  });
});

describe("weightSeries", () => {
  it("ordena por data e ignora registros sem peso", () => {
    const s = weightSeries([e("2026-06-03", 83), e("2026-06-01", 85), e("2026-06-02")]);
    expect(s).toEqual([
      { date: "2026-06-01", weight: 85 },
      { date: "2026-06-03", weight: 83 },
    ]);
  });
});

describe("computeTrend", () => {
  it("sem registros → vazio", () => {
    expect(computeTrend([])).toEqual({});
  });

  it("calcula delta (perdeu) e quanto falta pro alvo", () => {
    const t = computeTrend([e("2026-06-01", 85), e("2026-06-10", 82.5)], 80);
    expect(t).toEqual({ latest: 82.5, start: 85, deltaKg: -2.5, toTargetKg: -2.5 });
  });

  it("sem alvo → toTargetKg ausente", () => {
    expect(computeTrend([e("2026-06-01", 85)]).toTargetKg).toBeUndefined();
  });
});
