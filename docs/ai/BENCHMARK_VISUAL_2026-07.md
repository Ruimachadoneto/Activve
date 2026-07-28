# Benchmark visual — upgrade de direção (2026-07-28)

> Exigido por `VISUAL_QUALITY.md` §3: **a implementação visual não começa antes do benchmark**.
> Complementa `docs/ai/BENCHMARK.md` (que é benchmark de PRODUTO/mercado). Este aqui é de
> **direção visual, dataviz e movimento**.
> Motivação: o usuário classificou o app atual como "monótono/simples" e pediu algo "arrojado,
> imersivo, surpreendente, premium — que valha a assinatura de um pagante".

## 1. Diagnóstico do estado atual (medido no código, não impressão)

| Queixa do usuário | Causa concreta encontrada |
|---|---|
| "Ícone de notificação sem motivo" | `src/app/page.tsx:145` — é um `<span>`, não botão; bolinha de "não lida" fixa no CSS; zero handler. Viola `VISUAL_QUALITY.md` §6 ("widgets só pra preencher"). |
| "Gráficos feios, parecem precários" | `WeightChart.tsx` e `ReportLineChart.tsx` usam **`preserveAspectRatio="none"`** → escala não-uniforme distorce a espessura do traço e transforma os pontos em elipses. Além disso: sem eixos, sem rótulos, **nenhum número legível dentro do gráfico**, sem área preenchida, `<circle>` em todo ponto (vira "colar de contas"), sem interação, e `return null` com <2 pontos (sem estado vazio). |
| "Monótono/simples" | 1 acento (teal `#2fd4b6`) faz tudo; todo card tem o mesmo tratamento (`bg-surface` + `border-line`) → sem hierarquia de elevação; o app inteiro tem **2 animações** (`media-drift`, `recovery-rise`); nenhum momento de recompensa ao concluir série/treino. |

## 2. Produtos analisados

### WHOOP — referência de **densidade de dados que parece simples**
- **Divulgação progressiva em 3 camadas, cada uma em sua própria TELA** (não seções colapsáveis
  na mesma página): (1) score glanceável, (2) tendências semanais, (3) gráficos biométricos crus.
- **Score-first:** comprime dezenas de sinais em **um número 0–100** exibido ANTES de qualquer
  gráfico. O usuário recebe a resposta antes da complexidade.
- **Cor é arquitetura de informação, não decoração:** vocabulário semântico estrito de 3 cores;
  "toda matiz carrega significado" em todas as telas, o que elimina o custo de reaprender.
- **Fundo escuro é funcional, não estético:** faz o dado colorido saltar e reduz fadiga em uso de
  madrugada. Decisão dirigida por restrição.
- **Tipografia:** score em ~72pt equivalente (legível à distância do braço); texto de apoio pequeno
  e secundário. A hierarquia de tamanho espelha a divulgação progressiva.
- **Coaching embutido NA visualização**, não numa tela separada — o score *é* a instrução do dia.
- **Sinal de premium:** biblioteca de gráficos própria, feita do zero por designer de informação.

### Oura — referência de **dado de saúde que parece acolhedor**
- Framework de dataviz em 3 níveis: (1) indicadores abstratos (anéis/barras), (2) métricas-chave
  sem excesso, (3) exploração de tendências em janelas longas.
- **Sistema de cor semântico unificado**, com pistas dinâmicas que dirigem a atenção ao que importa
  — "mais fácil escanear, comparar e agir".
- Redesign recente: "tipografia refinada, grid e layout atualizados, linguagem de componentes
  simplificada"; resultado descrito como "mais leve, mais rápido, mais aterrado".
- Objetivo explícito: equilibrar **utilidade e expressão** — comprensão + ressonância emocional.

### Strong / Hevy — referência do nicho direto (log de força)
- **Strong:** gráficos mais polidos; **notificação de PR com animação breve** ao bater recorde —
  "pequeno mas motivador". Interface desenhada para o usuário *no meio da série*, entre descansos.
- **Hevy:** analytics mais completo — quebra por grupo muscular, frequência de treino, relatórios
  de volume; celebra PR com badge + notificação in-workout, "motivador sem ser irritante".
- Lição: no nicho, **celebração de PR é padrão esperado** — e o Activve não tem nenhuma.

### Movimento / microinterações (estado da arte 2026)
- **Regra 80/20:** ~80% das interações devem ser invisíveis e fluidas; só os ~20% de alto valor
  são celebratórios. Celebração em tudo = ruído.
- Curvas de easing que imitam física real → sensação orgânica em vez de robótica.
- **Movimento é a camada que carrega a personalidade da marca** na UI — é ali que mora o "premium".
- Háptica combinada com feedback visual cria interação mais rica (o app já usa `navigator.vibrate`
  no fim do descanso — base existe).

## 3. Padrões ADOTADOS (e como adaptar ao Activve)

1. **Resposta antes da complexidade.** Toda tela abre com o "e daí?" resolvido, gráfico depois.
2. **Divulgação progressiva em camadas** — mas adaptada: o Activve é mobile-first com 5 rotas; a
   camada 3 (exploração) vira uma tela de detalhe, não mais um nível de nav.
3. **Cor semântica estrita.** Hoje há 1 acento genérico. Passa a existir vocabulário onde cada
   matiz significa uma coisa só — e o heat de recuperação (`ready`/`recovering`/`worked`/`rested`)
   já é um embrião disso que deve virar sistema.
4. **Escuro funcional** (já é o caso) — mas com **hierarquia de elevação** real, que hoje não existe.
5. **Numeral herói grande com tabular figures** para métricas-chave.
6. **Celebração de PR/marco** — lacuna clara frente a Strong/Hevy, e a maior fonte de "surpresa"
   barata e legítima.
7. **Dataviz próprio, bem-feito, como sinal de premium** — é literalmente o que o usuário apontou
   como pior. Consertar isso é o maior salto de percepção por esforço.
8. **80/20 no movimento** — o app hoje está em ~0/100; a meta não é 100% animado.

## 4. Padrões REJEITADOS (e por quê)

| Padrão | Por que NÃO |
|---|---|
| Score único 0–100 tipo WHOOP | Exigiria HRV/sono/biometria que o Activve **não tem** (local-first, sem wearable). Inventar um número com aparência científica violaria a regra de honestidade do projeto (`report.ts` tem testes de "honestidade do v1": campos sem dado real ficam neutros). Adotamos o *princípio* (resposta antes do gráfico), com entradas honestas. |
| Streaks/badges gamificados tipo Duolingo | Viola a política **anti-culpa** do produto (sem streak punitivo). Celebração sim; punição por quebrar sequência, não. |
| Glass/gradiente/sombra pesados | `VISUAL_QUALITY.md` §6 proíbe explicitamente excesso. Premium aqui vem de precisão + movimento + densidade, não de decoração. |
| Copiar telas das referências | §4: extrair princípios, **nunca copiar**. Identidade própria é requisito. |
| Biblioteca de gráficos de terceiros (Recharts/Chart.js) | Bundle grande num PWA local-first, e o padrão do projeto já é SVG próprio (`WeightChart`, `RecoveryMap`). Manter SVG próprio — o problema atual é execução, não a abordagem. |

## 5. Tensão registrada (decisão consciente)

O usuário pediu "arrojado, imersivo, surpreendente"; a política do projeto (§1, §6) diz que premium
**não** é excesso visual. Não é contradição, mas define onde investir: **precisão, movimento com
propósito, densidade de informação legível e momentos-assinatura** — não mais decoração. Se a
direção escolhida começar a empilhar gradiente/glass, ela deve ser barrada pela própria §6.

## 6. Fontes

- [WHOOP Design Breakdown: Data-Dense UI That Feels Simple](https://www.925studios.co/blog/whoop-design-breakdown)
- [Designing a more intuitive ŌURA app — Instrument](https://www.instrument.com/work/oura-app)
- [How Whoop Perfected Data Visualization](https://matthewritchey.wordpress.com/2023/11/12/whoop-and-perfecting-data-visualization/)
- [Strong App vs Hevy — RepReturn](https://repreturn.com/strong-app-vs-hevy/)
- [Hevy vs Strong vs Fitbod vs Jefit](https://www.sensai.fit/blog/hevy-vs-strong-vs-fitbod-vs-jefit)
- [How Micro-Interactions & Motion Design Improve UX in 2026](https://acodez.in/micro-interactions-motion-design/)
- [Motion UI Trends 2026](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)
- [Microinteractions UI Best Practices: A 2026 Guide](https://createbytes.com/insights/microinteractions-ui-best-practices)
