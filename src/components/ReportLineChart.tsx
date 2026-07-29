"use client";

import { LineChart } from "./LineChart";

/**
 * Gráfico do relatório visual (TASK-018). Casca fina sobre `LineChart`.
 *
 * `static` por padrão: o relatório é lido e **impresso em PDF** — animação de desenho e
 * scrub não existem no papel, e um gráfico meio-desenhado no momento da impressão sairia
 * cortado. Os valores continuam legíveis pelo rótulo do ponto final, pelos ticks do eixo
 * e pela tabela equivalente.
 */
export function ReportLineChart({
  series,
  label,
  unit,
  highlights,
}: {
  series: { date: string; value: number }[];
  label: string;
  unit?: string;
  highlights?: string[];
}) {
  return (
    <LineChart series={series} label={label} unit={unit} highlights={highlights} static height={96} />
  );
}
