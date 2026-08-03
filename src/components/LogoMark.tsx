/**
 * Símbolo da marca Activve — o "A" que o `DESIGN_SYSTEM` §1 sempre definiu ("'A' estilizado
 * (pico/seta)") e que **nunca tinha sido desenhado**. Até a TASK-030 o header caía no plano
 * B: a letra "A" digitada dentro de um anel, que é o que o usuário identificou como logo
 * fraca. Não era uma marca ruim — era a ausência de uma.
 *
 * CONSTRUÇÃO (direção "duplo pico", escolhida pelo usuário em 2026-08-01)
 * Dois picos ascendentes. O maior é o "A" sem travessão; o menor o antecede, e juntos são
 * o **`vv` do wordmark invertido** (`acti·vv·e`, §1). Símbolo e tipografia deixam de
 * conviver e passam a derivar da mesma ideia — a marca sai de dentro do wordmark em vez de
 * ficar ao lado dele.
 *
 * A hierarquia entre os picos vem de ALTURA, nunca de opacidade. A primeira versão usava
 * um pico a 45% e foi descartada: opacidade some em monocromático, na impressão e no
 * favicon — o mesmo defeito que eliminou a direção "linha de progressão". Medido nas quatro
 * condições de quebra (20px, 16px, mono, preto sobre branco) antes de escolher.
 *
 * Geometria: os pés dos dois picos ficam separados (14,5 → 15,5 no viewBox) para não
 * cruzarem. Um cruzamento perto da base vira um "X" acidental nos tamanhos pequenos.
 */
export function LogoMark({
  size = 32,
  strokeWidth = 3,
  className,
}: {
  size?: number;
  /** Traço um pouco mais grosso compensa o afinamento óptico abaixo de ~20px. */
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M3 26 L9 15.5 L15 26"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 26 L22.5 6 L29 26"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
