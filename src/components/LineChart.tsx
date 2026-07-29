"use client";

import { useId, useMemo, useRef, useState } from "react";

export type ChartPoint = { date: string; value: number };

type Props = {
  series: ChartPoint[];
  /** Descreve o que está plotado — vira o `aria-label` e o cabeçalho da tabela acessível. */
  label: string;
  /** Sufixo de unidade exibido nos rótulos ("kg", "min"…). */
  unit?: string;
  /** Linha de referência (meta). Tracejada de propósito: é um LIMIAR, não uma gridline. */
  target?: number;
  /** Datas que merecem marcador de destaque (ex.: recorde). */
  highlights?: string[];
  /** Sem interação nem animação — usado na versão impressa/PDF. */
  static?: boolean;
  /** Altura do gráfico em unidades do viewBox (a faixa do eixo X é somada por dentro). */
  height?: number;
};

const W = 320;
const PAD_L = 30;
const PAD_R = 12;
const PAD_T = 16;
const AXIS_BAND = 18; // faixa reservada ao eixo X — nunca deixar o rótulo pra fora do container

function formatValue(v: number, unit?: string): string {
  const n = Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
  return unit ? `${n} ${unit}` : n;
}

/**
 * Tick do eixo: arredondar sempre para inteiro colapsa faixas curtas — uma série de
 * 80,2 a 80,4 kg mostraria "80" nos dois extremos, e o eixo contradiria a variação que a
 * linha desenha (achado do review Codex). Ganha uma casa decimal quando os inteiros
 * empatariam.
 */
export function formatTick(v: number, min: number, max: number): string {
  // Faixa menor que 1 unidade: arredondar SEMPRE mente. Ou colapsa (80,2–80,4 → "80" nos
  // dois extremos) ou estoura para fora dos valores observados quando cruza o meio
  // (62,4–62,6 → "62" e "63", exagerando a variação). Nos dois casos o eixo contradiz a
  // linha (achados do review Codex, ciclos 1 e 2).
  return max - min < 1 ? v.toFixed(1).replace(".", ",") : String(Math.round(v));
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
}

/**
 * Gráfico de linha do Activve (DESIGN_SYSTEM §7).
 *
 * Substitui `WeightChart`/`ReportLineChart`, que compartilhavam os mesmos defeitos:
 * `preserveAspectRatio="none"` (escala não-uniforme distorcia a espessura do traço e
 * transformava os pontos em elipses — a causa técnica do "parece precário"), nenhum
 * número legível dentro do gráfico, sem eixo, e `<circle>` em TODA amostra.
 *
 * Regras aplicadas: escala uniforme; traço 2px; marcador do último ponto ≥8px com anel
 * da cor da superfície; área a ~10% de opacidade; eixos em hairline sólido e recessivo;
 * rótulo direto SÓ no ponto final (nunca um número por ponto); scrub por toque/mouse
 * com alvo generoso; e uma tabela oculta com todos os valores, para que o tooltip
 * nunca seja o único caminho até o dado.
 */
export function LineChart({
  series,
  label,
  unit,
  target,
  highlights,
  static: isStatic = false,
  height = 120,
}: Props) {
  const uid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const H = height + AXIS_BAND;
  const plotBottom = height - 8;

  const geom = useMemo(() => {
    const values = series.map((s) => s.value);
    // A meta entra na ESCALA (senão a linha de meta sairia do quadro), mas NUNCA nos
    // extremos exibidos: rotular o eixo com a meta faria o gráfico afirmar um peso que o
    // usuário nunca teve. Medido e desejado são coisas diferentes (achado do review Codex).
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const withTarget = target !== undefined ? [...values, target] : values;
    const rawMin = Math.min(...withTarget);
    const rawMax = Math.max(...withTarget);
    // Escala NÃO começa no zero de propósito: forçar o zero achataria a variação real de
    // peso/carga. Uma folga de 8% evita que a linha encoste nas bordas (§7.8 anti-culpa:
    // não dramatizar oscilação, mas também não esconder progresso).
    const span = rawMax - rawMin || Math.max(1, rawMax * 0.02);
    const min = rawMin - span * 0.08;
    const max = rawMax + span * 0.08;
    const x = (i: number) =>
      series.length === 1
        ? (PAD_L + (W - PAD_R)) / 2
        : PAD_L + (i / (series.length - 1)) * (W - PAD_L - PAD_R);
    const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * (plotBottom - PAD_T);
    return { min, max, dataMin, dataMax, x, y };
  }, [series, target, plotBottom]);

  /*
   * Menos de 2 pontos não é tendência — uma reta com um ponto só sugeriria estabilidade
   * que não foi medida. Quem chama é dono do estado vazio, de propósito: a tela Corpo diz
   * "Registre mais um peso (aba Medidas)" e o relatório mostra o valor em texto logo
   * abaixo. Mensagens contextuais desse tipo são melhores que uma genérica aqui — por isso
   * este componente não tenta escrever a sua.
   */
  if (series.length < 2) return null;

  const { x, y, dataMin, dataMax } = geom;
  const linePoints = series.map((s, i) => `${x(i)},${y(s.value)}`).join(" ");
  const areaPoints = `${PAD_L},${plotBottom} ${linePoints} ${x(series.length - 1)},${plotBottom}`;
  const last = series[series.length - 1];
  const lastX = x(series.length - 1);
  const lastY = y(last.value);
  const highlightSet = new Set(highlights ?? []);
  const shown = active != null ? series[active] : null;

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    if (isStatic) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    const t = (svgX - PAD_L) / (W - PAD_L - PAD_R);
    const i = Math.round(t * (series.length - 1));
    setActive(Math.max(0, Math.min(series.length - 1, i)));
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`${label}. De ${formatValue(dataMin, unit)} a ${formatValue(dataMax, unit)}.`}
        onPointerDown={handlePointer}
        onPointerMove={(e) => e.buttons !== 0 && handlePointer(e)}
        onPointerLeave={() => setActive(null)}
      >
        {/* Eixos: hairline sólido, recessivo. Nunca tracejado — tracejado lê como limiar. */}
        <line x1={PAD_L} y1={plotBottom} x2={W - PAD_R} y2={plotBottom} stroke="var(--color-line)" strokeWidth="1" />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={plotBottom} stroke="var(--color-line)" strokeWidth="1" />

        {/* Ticks do eixo Y: só extremos, com `tabular-nums` (aqui números SE ALINHAM). */}
        <text x={PAD_L - 5} y={y(dataMax) + 3} textAnchor="end" fill="var(--color-faint)" fontSize="10" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatTick(dataMax, dataMin, dataMax)}
        </text>
        <text x={PAD_L - 5} y={y(dataMin) + 3} textAnchor="end" fill="var(--color-faint)" fontSize="10" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatTick(dataMin, dataMin, dataMax)}
        </text>

        {/* Meta: tracejada porque É um limiar (a exceção legítima ao "nunca tracejar"). */}
        {target !== undefined && (
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(target)}
            y2={y(target)}
            stroke="var(--color-faint)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Área: lavagem a ~10%, nunca bloco saturado. */}
        <polygon points={areaPoints} fill="var(--color-accent)" fillOpacity="0.1" />

        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className={isStatic ? undefined : "draw-line"}
          style={isStatic ? undefined : ({ "--draw-length": 1200 } as React.CSSProperties)}
        />

        {/* Marcadores só onde importam: destaques (recorde) e o último ponto. */}
        {series.map((s, i) =>
          highlightSet.has(s.date) && i !== series.length - 1 ? (
            <circle
              key={`${uid}-h-${i}`}
              cx={x(i)}
              cy={y(s.value)}
              r="4"
              fill="var(--color-recovering)"
              stroke="var(--color-surface)"
              strokeWidth="2"
            />
          ) : null,
        )}

        <circle cx={lastX} cy={lastY} r="4.5" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />

        {/* Rótulo direto SÓ no ponto final. Ancoragem evita estourar a borda direita. */}
        <text
          x={Math.min(lastX + 7, W - PAD_R)}
          y={Math.max(lastY - 7, PAD_T + 8)}
          textAnchor={lastX > W - PAD_R - 40 ? "end" : "start"}
          fill="var(--color-ink)"
          fontSize="11"
        >
          {formatValue(last.value, unit)}
        </text>

        {/* Datas do período — o usuário precisa saber "de quando até quando". */}
        <text x={PAD_L} y={H - 4} fill="var(--color-faint)" fontSize="10">
          {formatDate(series[0].date)}
        </text>
        <text x={W - PAD_R} y={H - 4} textAnchor="end" fill="var(--color-faint)" fontSize="10">
          {formatDate(last.date)}
        </text>

        {/* Crosshair do scrub. */}
        {shown && active != null && (
          <>
            <line x1={x(active)} y1={PAD_T} x2={x(active)} y2={plotBottom} stroke="var(--color-accent)" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx={x(active)} cy={y(shown.value)} r="4.5" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />
          </>
        )}
      </svg>

      {shown && (
        <div className="pointer-events-none absolute left-0 top-0 w-full text-center">
          <span className="inline-block rounded-lg border border-line bg-surface2 px-2 py-1 text-[11px] text-ink">
            {formatDate(shown.date)} · {formatValue(shown.value, unit)}
          </span>
        </div>
      )}

      {/* Tabela equivalente: o tooltip nunca pode ser o único caminho até o valor. */}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={`${uid}-t-${s.date}`}>
              <td>{formatDate(s.date)}</td>
              <td>{formatValue(s.value, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
