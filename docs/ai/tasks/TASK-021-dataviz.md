# TASK-021 — Dataviz v2

## Metadados
- Status: `review` · Risco: `médio` (UI em 2 telas; sem mudança de dado ou contrato)
- Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-021-dataviz-claude` · Base: `main`

## Objetivo
Substituir os dois gráficos "precários" por um primitivo único e bem-feito. Resultado observável:
o usuário consegue **ler valores** no gráfico, tocar para inspecionar um ponto, e o traço não sai
distorcido.

## Causa raiz (medida, não estimada)
`WeightChart` e `ReportLineChart` eram dois SVGs quase idênticos, ambos com:
1. **`preserveAspectRatio="none"`** — escala não-uniforme distorcia a espessura do traço e
   transformava os pontos em elipses. É a causa técnica do ar de "feito às pressas".
2. Nenhum número legível dentro do gráfico (sem eixo, sem rótulo, sem valor).
3. `<circle>` em TODA amostra → "colar de contas" com muitos pontos.
4. Sem área, sem interação, sem estado vazio (`return null` com <2 pontos).

## O que foi feito
- **`src/components/LineChart.tsx`** — primitivo único. `WeightChart` e `ReportLineChart` viraram
  cascas finas (mantém a API das telas; diff mínimo — AGENTS §10).
- Regras aplicadas (guia de dataviz + `DESIGN_SYSTEM` §7): escala uniforme; traço 2px round;
  marcador ≥8px só no ponto final e nos destaques, com anel de 2px da cor da superfície; área a
  10%; eixos hairline **sólidos** e recessivos; rótulo direto **só** no ponto final; ticks de eixo
  com `tabular-nums`; período datado nos dois extremos; faixa do eixo X somada à altura do
  container (o rótulo nunca fica fora).
- **Scrub** por toque/mouse com crosshair + tooltip. `static` no relatório (impressão/PDF não tem
  interação, e um gráfico meio-animado sairia cortado no papel).
- **Estados**: 0 pontos (mensagem), 1 ponto (mostra o valor e diz o que falta — uma reta com um
  ponto só sugeriria estabilidade que não foi medida).
- **Tabela equivalente** (`sr-only`) dentro do componente: o tooltip nunca é o único caminho até o
  valor. Na tela Corpo há ainda a aba Histórico como versão visível.
- Linha de meta **tracejada** — exceção legítima ao "nunca tracejar", porque é um **limiar**, não
  uma gridline.
- Escala **não** começa no zero (achataria a variação real de peso/carga), com folga de 8%.

## Validação de paleta (executada, não estimada)
`node scripts/validate_palette.js "#2FD4B6,#F2C94C,#F2854A,#6B7688" --mode dark --surface "#101D2E"`
- **PASS** separação CVD (pior par ΔE 12.3 deutan / 16.0 tritan), **PASS** visão normal (16.5),
  **PASS** contraste (todos ≥ 3:1) — a paleta é segura para daltonismo.
- **FAIL** banda de luminosidade (3 cores mais claras que a banda) e **FAIL** croma em `#6B7688`.
  O croma do cinza é **deliberado** (§2.1: cinza = neutro/ausência de dado, não é categoria).
  A banda de luminosidade fica registrada como **candidata a refino** — não alterada aqui porque
  essa paleta foi aprovada visualmente pelo usuário em 2026-06-30 e mudá-la unilateralmente
  reabriria um gate visual já fechado.

## Correção de documentação
O `DESIGN_SYSTEM` v2 dizia "todo número que representa medida usa `tabular-nums`". **Errado**:
largura fixa faz `121` parecer frouxo em tamanho display. Corrigido — `tabular-nums` só onde
números se alinham verticalmente (eixos, tabelas, cronômetro).

## Evidências (browser, 390×844)
- Escala **uniforme** confirmada por `getScreenCTM()`: `escalaX 1.119 = escalaY 1.119`.
- Textos dentro do gráfico: `85 | 78 | 83 kg | 06/07 | 22/07`. Marcadores: **1** (era 1 por ponto).
- Scrub: tooltip `06/07 · 85 kg` à esquerda, `22/07 · 83 kg` à direita; limpa ao sair.
- Relatório: gráfico `static` (sem `draw-line`), valores legíveis.
- Gates: typecheck ✓ · lint ✓ · **161/161** ✓ · build ✓.

## Pendente
- [ ] Gate visual do usuário + aprovação de merge.
