import { isoDate } from "./session";

/**
 * Registro de corpo (peso/medidas) — timeline contínua, local-first.
 * 1 registro por dia (keyPath `date`); re-pesar no mesmo dia atualiza.
 */
export type BodyEntry = {
  date: string; // yyyy-mm-dd
  weight_kg?: number;
  measures?: Record<string, number>; // cm
  note?: string;
  recordedAt: string; // ISO
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function makeEntry(weight_kg: number, date: string = isoDate()): BodyEntry {
  return { date, weight_kg: round1(weight_kg), recordedAt: new Date().toISOString() };
}

/** Série de peso (data+valor) ordenada por data, só registros com peso. */
export function weightSeries(entries: BodyEntry[]): { date: string; weight: number }[] {
  return entries
    .filter((e): e is BodyEntry & { weight_kg: number } => typeof e.weight_kg === "number")
    .map((e) => ({ date: e.date, weight: e.weight_kg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type Trend = {
  latest?: number; // peso mais recente
  start?: number; // primeiro registro
  deltaKg?: number; // latest - start (negativo = perdeu)
  toTargetKg?: number; // alvo - latest (quanto falta; sinal indica direção)
};

/** Tendência: variação do 1º ao último registro e quanto falta pro alvo (anti-culpa: só números). */
export function computeTrend(entries: BodyEntry[], targetWeight?: number): Trend {
  const series = weightSeries(entries);
  if (series.length === 0) return {};
  const latest = series[series.length - 1].weight;
  const start = series[0].weight;
  return {
    latest,
    start,
    deltaKg: round1(latest - start),
    toTargetKg: targetWeight !== undefined ? round1(targetWeight - latest) : undefined,
  };
}
