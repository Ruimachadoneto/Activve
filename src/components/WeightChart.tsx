"use client";

import { LineChart } from "./LineChart";

/**
 * Tendência de peso (tela Corpo). Casca fina sobre `LineChart` — a implementação do
 * gráfico é única no app (DESIGN_SYSTEM §7); antes havia dois SVGs quase iguais, cada um
 * com os mesmos defeitos.
 *
 * A "tabela equivalente" exigida pelas regras de dataviz existe duas vezes aqui: dentro do
 * `LineChart` (oculta, para leitor de tela) e visível na aba **Histórico** da tela Corpo.
 */
export function WeightChart({
  series,
  target,
}: {
  series: { date: string; weight: number }[];
  target?: number;
}) {
  return (
    <LineChart
      series={series.map((s) => ({ date: s.date, value: s.weight }))}
      label="Peso ao longo do tempo"
      unit="kg"
      target={target}
    />
  );
}
