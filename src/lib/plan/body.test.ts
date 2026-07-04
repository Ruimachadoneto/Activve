import { describe, it, expect } from "vitest";
import {
  makeEntry,
  weightSeries,
  computeTrend,
  weightDelta,
  latestMeasures,
  type BodyEntry,
} from "./body";

const e = (date: string, weight_kg?: number, measures?: Record<string, number>): BodyEntry => ({
  date,
  weight_kg,
  measures,
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

describe("weightDelta", () => {
  const now = new Date(2026, 5, 30); // 2026-06-30 local

  it("variação na janela: último menos o mais antigo dentro dela", () => {
    const entries = [e("2026-06-05", 85), e("2026-06-20", 84), e("2026-06-29", 83.2)];
    expect(weightDelta(entries, 30, now)).toBe(-1.8);
  });

  it("ignora registros fora da janela", () => {
    const entries = [e("2026-01-01", 90), e("2026-06-10", 84), e("2026-06-28", 83)];
    // janela de 30 dias (a partir de 2026-05-31): só 84 e 83 entram
    expect(weightDelta(entries, 30, now)).toBe(-1);
  });

  it("menos de 2 registros na janela → null", () => {
    expect(weightDelta([e("2026-06-29", 83)], 30, now)).toBeNull();
    expect(weightDelta([e("2026-01-01", 90), e("2026-06-29", 83)], 30, now)).toBeNull();
    expect(weightDelta([], 30, now)).toBeNull();
  });
});

describe("latestMeasures", () => {
  it("pega o valor mais recente de cada medida ao longo do tempo", () => {
    const entries = [
      e("2026-06-01", 85, { waist: 88, chest: 104 }),
      e("2026-06-15", 84, { waist: 86 }), // só cintura neste dia
      e("2026-06-20", 83, { thigh: 60 }),
    ];
    expect(latestMeasures(entries)).toEqual({ waist: 86, chest: 104, thigh: 60 });
  });

  it("sem medidas → objeto vazio", () => {
    expect(latestMeasures([e("2026-06-01", 85)])).toEqual({});
  });
});
