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

/**
 * Variação de peso nos últimos `days` dias: último peso menos o registro mais antigo
 * dentro da janela. `null` se houver menos de 2 registros na janela (nada a comparar).
 * Anti-culpa: retorna só o número (a UI mostra a seta/direção, sem juízo).
 */
export function weightDelta(
  entries: BodyEntry[],
  days: number,
  now: Date = new Date(),
): number | null {
  const series = weightSeries(entries);
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const y = cutoff.getFullYear();
  const m = String(cutoff.getMonth() + 1).padStart(2, "0");
  const d = String(cutoff.getDate()).padStart(2, "0");
  const cutoffStr = `${y}-${m}-${d}`;
  const window = series.filter((s) => s.date >= cutoffStr);
  if (window.length < 2) return null;
  return round1(window[window.length - 1].weight - window[0].weight);
}

/** Medidas conhecidas (cm) exibidas na tela Corpo, na ordem, com rótulo PT-BR. */
export const MEASURES = [
  { key: "waist", label: "Cintura" },
  { key: "chest", label: "Peito" },
  { key: "thigh", label: "Coxa" },
  { key: "arm", label: "Braço" },
] as const;

export type MeasureKey = (typeof MEASURES)[number]["key"];

/** Valor mais recente de cada medida ao longo do tempo (registros diferentes podem trazer medidas diferentes). */
export function latestMeasures(entries: BodyEntry[]): Record<string, number> {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const out: Record<string, number> = {};
  for (const e of sorted) {
    if (!e.measures) continue;
    for (const [k, v] of Object.entries(e.measures)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
  }
  return out;
}
