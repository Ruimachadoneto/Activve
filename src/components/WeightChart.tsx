/** Gráfico de tendência de peso (SVG, sem lib). Espera ≥2 pontos. */
export function WeightChart({
  series,
  target,
}: {
  series: { date: string; weight: number }[];
  target?: number;
}) {
  if (series.length < 2) return null;

  const w = 320;
  const h = 120;
  const pad = 14;
  const weights = series.map((s) => s.weight);
  const all = target !== undefined ? [...weights, target] : weights;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / (series.length - 1)) * (w - 2 * pad);
  const y = (val: number) => pad + (1 - (val - min) / range) * (h - 2 * pad);
  const points = series.map((s, i) => `${x(i)},${y(s.weight)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full text-accent"
      role="img"
      aria-label="Tendência de peso ao longo do tempo"
      preserveAspectRatio="none"
    >
      {target !== undefined && (
        <line
          x1={pad}
          x2={w - pad}
          y1={y(target)}
          y2={y(target)}
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeDasharray="4 4"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {series.map((s, i) => (
        <circle key={i} cx={x(i)} cy={y(s.weight)} r="2.5" fill="currentColor" />
      ))}
    </svg>
  );
}
