/** Gráfico de linha genérico (SVG, sem lib) — usado no relatório visual (TASK-018). */
export function ReportLineChart({
  series,
  label,
}: {
  series: { date: string; value: number }[];
  label: string;
}) {
  if (series.length < 2) return null;

  const w = 320;
  const h = 90;
  const pad = 12;
  const values = series.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / (series.length - 1)) * (w - 2 * pad);
  const y = (val: number) => pad + (1 - (val - min) / range) * (h - 2 * pad);
  const points = series.map((s, i) => `${x(i)},${y(s.value)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full text-accent"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {series.map((s, i) => (
        <circle key={i} cx={x(i)} cy={y(s.value)} r="2" fill="currentColor" />
      ))}
    </svg>
  );
}
