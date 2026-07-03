# Estado atual do projeto — CHECKPOINT DE RETOMADA

> Atualizado: `2026-06-29`. Este doc + `CLAUDE.md` + `docs/ai/tasks/*` + `docs/DESIGN_SYSTEM.md`
> + git history permitem **retomar numa sessão nova sem o histórico do chat**. Leia primeiro.

## Onde estamos
- **Branch atual:** `main` (limpa; TASK-010 mergeada em `80f4f4d`). Sem branches de feature abertas.
- **`main`** tem **TASK-001→010 mergeadas**.
- Repo: `github.com/Ruimachadoneto/Activve`. App roda em `C:\Users\Rui Neto\dev\activve` (Next 16 + TS + Tailwind v4 + IndexedDB, local-first).

## O alvo (não-negociável)
Bater o **mockup aprovado** (3 telas: Hoje, Modo Treino, Corpo) — direção **"Calm Coach"** (dark + 1 acento teal, respiro, premium). Política: `docs/ai/VISUAL_QUALITY.md`. Sistema: `docs/DESIGN_SYSTEM.md`. **Anti-culpa** sempre. O usuário exige fidelidade ao mockup — qualidade menor não é aceita.

## Feito (mergeado em main)
- **TASK-004** — Hoje com fidelidade + **mapa muscular** (10 PNGs transparentes em `public/muscles/`, `resolveMuscleImage`, `MuscleArt`). Script `scripts/dewhite-muscles.py`.
- **TASK-005** — Treino execução série-a-série + persistência (IndexedDB store `sessions`, DB v2), checks da semana no Hoje. `session.ts`/`sessions.ts`.
- **TASK-006** — "Como fazer" + troca de variações (`ExerciseSheet`, `movement.ts`). Fix P1 XSS: `videoHref` só http(s).
- **TASK-007** — Corpo/evolução: peso + tendência anti-culpa (`body.ts`, store `bodylog` DB v3, `WeightChart`).
- **TASK-008** — Overhaul visual "Calm Coach" (merge `9a0d464`, 2026-06-29). Fase 1: tokens de recuperação (`globals.css`) + `Logo` + Hoje (barra da semana, "X de Y treinos"). Fase 2: **Modo Treino** focado (`/treino` reescrito) — 1 exercício/vez, Variação (reusa `ExerciseSheet`), slot de mídia, tabela SÉRIE·CARGA·REPS·RPE, anterior/próximo. Fase 2.1: **descanso em overlay bottom-sheet** (`RestTimer.tsx`, `role=dialog`), dispara por Concluir série **e** pelo ✓ da linha (toggle false→true). Fase 2.2 (review Codex ciclo 1): restaurada a **textarea de observações** (P1) e RPE normalizado **6–10** via `clampRpe`+`RpeInput` (P2) +4 testes. Fase 2.3: re-review Codex **aprovado, sem P0/P1**. Gates no merge: typecheck ✓ · lint ✓ · **51/51** ✓ · build ✓.
  - **Risco residual (pré-existente, não-bloqueante):** `patchSet`/`patchExercise` derivam o `session` do snapshot do render; edições em campos diferentes no mesmo frame (<100ms) podem se sobrescrever. Não ocorre com digitação humana. Candidato a functional updater.
  - **Dívida de teste:** faltam testes de UI/interação para `/treino` e `RestTimer` (infra é node-only; exigiria RTL/jsdom).

## TASK-009 — Mapa muscular de recuperação no Corpo (o 3º "uau"). Contrato: `docs/ai/tasks/TASK-009-mapa-recuperacao.md`.
- **Passo 1 — núcleo de domínio (FEITO 2026-06-29):** `src/lib/plan/recovery.ts` puro e testado.
  - `stimuliFromSessions(sessions, getMuscles, now)`: sessões → estímulos (só séries `done`; usa `swappedToId`; primário peso 1, secundário 0.5; intensidade = esforço(RPE 6–10→0.2..1) × volume(séries/4)).
  - `computeRecovery(stimuli, now)`: por músculo → estado `worked|recovering|ready|rested` (janela `48 + 24×boutLoad` h; <50%=trabalhado, <100%=recuperando, ≥100%=pronto; sem estímulo no lookback de 10d=descansado). Helpers `recoveryColorVar` (→tokens) e `RECOVERY_LABEL_PT` (anti-culpa).
  - `recovery.test.ts`: 15 testes (4 estados + escala volume/esforço + adapter). Gates: typecheck ✓ · lint ✓ · **66/66** ✓.
  - **Review Codex do núcleo — APROVADO (2026-06-29).** Ciclo 1: 1 achado [P2] — `stimuliFromSessions` não filtrava `status === "done"` (contrato diz "sessões concluídas"); um treino em andamento acenderia o mapa. → adicionado `if (session.status !== "done") continue;` (consistente com o Hoje, que já filtra done) + teste "in_progress não gera estímulo". Ciclo 2: **re-review limpo, nenhum achado novo, nenhum P0/P1.** Núcleo chancelado — commit `d2d3e98`, branch pushada.

- **Passo 2 — UI (FEITO 2026-06-29):** `react-muscle-highlighter` v1.2.0 (MIT) instalada — ADR-003. Componente `src/components/RecoveryMap.tsx` (lib via `next/dynamic ssr:false`; frente+costas; cor por estado via tokens; legenda dos 4 estados; hint quando vazio). Ponte `src/lib/plan/muscleSlug.ts` (`MUSCLE_TO_SLUG` + `slugRecoveryStates`, agrega pelo estado mais fatigado) +5 testes. `buildExerciseMuscles(plan)` em `recovery.ts` (lookup exerciseId→músculos, inclui variações). Tela Corpo (`corpo/page.tsx`) reescrita com **abas Visão geral / Medições**: Visão geral = mapa + meta; Medições = peso+registro (sem regressão).
  - **Verificado no browser** (`localhost:3000/corpo`, DOM — screenshot trava nesta máquina): abas alternam; após semear 1 sessão concluída (supino+desenvolvimento, ~10h atrás), **14 regiões acendem em "trabalhado"** (chest/deltoids/triceps); aba Medições mantém peso+input; **0 erros no console**. Gates: typecheck ✓ · lint ✓ · **71/71** ✓ · build ✓.
  - ⚠️ **Sessão de teste semeada** no IndexedDB do navegador (`pl_exemplo_2026_06:A:2026-06-29`) para a verificação — some ao limpar dados do site; o Hoje agora mostra "1 de 4".
  - **Teste integral (2026-06-29):** +3 testes em `muscleSlug.test.ts` cobrindo **os 20 músculos nos 4 estados** + agregação por slug (frente e costas, pior estado vence). Prova visual no browser com plano de teste rico (pernas/costas/braços/core em idades 8h/50h/82h): **ambos os corpos (frente+costas) acenderam em 3 estados simultâneos** (trabalhado/recuperando/pronto); plano+sessões de teste depois **removidos** (estado restaurado ao plano de exemplo). Total: **74 testes**.
  - **Review Codex do passo 2 (ciclo 1) — 1 achado [P2] aceito e corrigido:** o estado `rested` estava na heurística/legenda/critérios mas o mapa nunca o desenhava (`slugRecoveryStates` pulava rested → `defaultFill`, não o token). A legenda prometia 4 estados, o SVG mostrava 3. → `slugRecoveryStates` agora **inclui rested** (corpo todo pintado: músculos descansados em `#6b7688`, só partes não-musculares no fill padrão); hint passou a depender de "nenhum ativo". Verificado no browser: **99 regiões `rested` + 14 `worked`**, legenda condizente, 0 erros.
  - **Review Codex do passo 2 (ciclo 2) — 1 novo achado [P2] aceito e corrigido:** `buildExerciseMuscles` **perdia os secundários do pai** quando a variação tinha `primaryMuscles` próprios (`{ primary: alt.primaryMuscles }`). Como o schema das alternativas só expressa primários, um swap subestimava a fadiga (perdia tríceps/deltoides/etc.). → variação agora **sempre herda os secundários do pai** (sobrescreve só os primários). +4 testes de `buildExerciseMuscles` (78 testes no total).
  - **Review Codex do passo 2 (ciclo 3) — APROVADO (2026-06-29):** re-review **limpo, nenhum achado novo, nenhum P0/P1**. Risco residual baixo: só falta teste de **interação de UI no browser** para a aba Corpo (infra é node-only — mesma dívida da TASK-008; sem regressão acionável). **TASK-009 (lógica+integração) chancelada.**
  - **Polish visual Fase 1 — vetor (2026-06-30, APROVADO VISUALMENTE pelo usuário):** decisão = polir o vetor agora (realista com assets fica p/ Fase 2 futura; lógica já pronta pra troca). 3 iterações:
    - **1.1** paleta sóbria, stroke por músculo, corpos maiores, spotlight, resumo dinâmico, legenda com glow, card com gradiente.
    - **1.2** `slugRecoveryDetail` (estado+fração); **gradação por intensidade** (alpha pela frescura do estímulo — doma o calor), base muscular azul-aço, scale maior, vinheta.
    - **1.3** **toque-para-inspecionar** (mostra "Peito · Trabalhado · pronto em ~3 dias"; `hoursToReady` puro+testado), **corpos responsivos** (svg width 100%, cabem em 375px sem overflow), **animação de entrada** (`recovery-rise`, respeita reduced-motion), **a11y** (role/aria-label, hint).
    - Gates: typecheck ✓ · lint ✓ · **83/83** ✓ · build ✓. Verificado por DOM + screenshots (375/440), 0 erros. Commits WIP `3a0114e`→`54886bd`. **Gate visual: PASS** (usuário aprovou 2026-06-30).
    - Teto atingido: ganhos adicionais no vetor são marginais; salto seguinte (se desejado) = **Fase 2 realista** com assets.
  - **Revisão Codex final do polish (2026-06-30) — 2 achados:**
    - **[P2] ACEITO/corrigido** — o mapa não "envelhecia" com a tela aberta (`useMemo` da recovery só dependia de plan/sessions; `Date.now()` congelava). → `corpo/page.tsx` ganhou estado `now` que tica a cada 5 min + atualiza em `visibilitychange`/`focus`; `now` é passado a `stimuliFromSessions`/`computeRecovery`.
    - **[P3] limitação conhecida documentada (não corrigível com a lib atual)** — `sex: "other"` cai em corpo `male`. A lib só tem male/female; **os dados de recuperação são idênticos** (mesmos músculos), só a silhueta muda. Escolha tornada explícita + comentada no código. Corpo neutro = candidato à **Fase 2** (assets realistas). Não bloqueia (P3).
    - Gates: typecheck ✓ · lint ✓ · 83/83 ✓ · build ✓.
  - **Revisão Codex (ciclo 2 do polish, 2026-06-30) — 2 achados, ambos corrigidos:**
    - **[P2] colisão de ids de alternativa** — `buildExerciseMuscles` punha todos os `alternatives[].id` num Map global, mas o schema só garante unicidade de `exercise.id`; dois exercícios com uma alt de mesmo id (ex.: "machine") faziam o swap ler músculos errados. → reescrito com **escopo por exercício** (cada base guarda sub-mapa das suas variações); `GetMuscles` agora é `(exerciseId, swappedToId?)`; `stimuliFromSessions` passa os dois. +2 testes (colisão não ocorre; swap desconhecido cai no base).
    - **[P3] sessões não recarregavam ao focar** — o handler de foco só atualizava `now`; treino concluído noutra aba com `/corpo` aberto não aparecia. → `loadSessions` (useCallback) recarrega no foco/visibility além do tick.
    - Gates: typecheck ✓ · lint ✓ · **85/85** ✓ · build ✓.
  - **Re-review Codex (2026-06-30) — APROVADO, LIMPO:** "no discrete, actionable bugs… recovery-domain logic, page integration e muscle-map aggregation internamente consistentes e cobertos por testes".
  - **MERGEADA em `main` (`abacf6c`, 2026-06-30)** via `--no-ff`; gates revalidados na main (85 testes, build ok); branch apagada (local+remota). Visual aprovado pelo usuário; 3 ciclos de review Codex (último limpo).

## TASK-010 — Modo Treino: mídia real + foco na série (MERGEADA em `main` `80f4f4d`, 2026-07-02)
Contrato: `docs/ai/tasks/TASK-010-treino-media.md`. Plano geral: auditoria `VISUAL_GAP_AUDIT_2026-06-30.md`.
- **Pesquisa de mídia (feita 2026-07-02):** fonte escolhida = **`free-exercise-db`** (Unlicense/domínio
  público, 873 exercícios, 2 fotos JPG cada, hotlink no raw do GitHub) — **ADR-004**. Rejeitados:
  ExerciseDB (licença da mídia duvidosa), exercises-dataset (mídia removida), everkinetic (ilustração CC-BY-SA).
- **Implementado (2026-07-02):**
  - `src/lib/plan/exerciseMedia.ts` — dicionário curado PT-BR→id (~90 nomes/apelidos), nome normalizado
    (sem acento/caixa); **sem match → null** (placeholder; nunca foto errada). +5 testes (90 no total).
  - `src/components/ExerciseMediaCard.tsx` — foto com **alternância das 2 posições** (1.6s, respeita
    reduced-motion), tratamento dark (vinheta/gradiente), dots, botão "Vídeo" overlay; `onError`/sem
    match → placeholder antigo. + `ExerciseThumb` (thumb 48px c/ fallback de ícone).
  - `/treino` reestruturado: header c/ **nome do treino + barra de progresso i/N**; botão livro (Como
    fazer); **card série-foco** (badge SÉRIE X DE N + chip RPE alvo + steppers GRANDES carga/reps +
    CTA "Concluir série ✓"); **Todas as séries** colapsável (tabela antiga completa, RPE + ✓ por linha);
    card **PRÓXIMO EXERCÍCIO** (thumb+nome+séries; último → Concluir treino); **VARIAÇÕES inline**
    (original+alternativas c/ thumb e seleção; swap reusa `patchExercise`); rodapé mantido.
  - `RestTimer`: rótulo **Sugestão** + presets incluem o `rest_s` do exercício (30/60/90/120+plano).
  - **Ajuste de UX (pedido do usuário):** carga/reps 100% digitáveis pelo teclado com cara de input
    (caixa com borda, 44px, seleciona ao focar, aceita vírgula) — e correção do overflow que isso
    causou em 375px (medido por DOM: checks dentro do card, 17px entre colunas).
  - **Camada "surpreendente" (2026-07-02):**
    - **"Última vez: X kg × N"** no card da série — memória de progressão da sessão anterior
      (`previousPerformance` puro em session.ts, prefere mesmo índice de série; +4 testes).
    - **+15s** no descanso (estende sem reiniciar) e **vibração** ao fim (navigator.vibrate, guarded).
    - **Drift Ken Burns** sutil na foto (`.media-drift`, respeita reduced-motion) e
      **pré-carregamento** das fotos do próximo exercício (`PreloadImages`).
    - Micro-feedback no CTA (scale no toque).
  - Gates: typecheck ✓ · lint ✓ · **94/94** ✓ · build ✓ · console limpo. Verificado em 375px: fotos
    reais carregando, "Última vez: 62.5 kg × 8" com histórico semeado, +15s (1:00→1:14), sem overflow.
  - **Review Codex (ciclo 1 da TASK-010, 2026-07-02) — 2 achados, ambos corrigidos:**
    - **[P2] histórico morria na troca de plano** — o "Última vez" lia `getSessionsForPlan(planId)`;
      importar plano novo (planId novo) zerava a memória, violando a continuidade por `exercise.id`
      do ADR-002. → novo `getAllSessions()` no storage; o histórico do treino agora é global.
    - **[P3] falha do frame oculto derrubava a foto visível** — `onError` de qualquer frame matava o
      card. → falha rastreada **por frame**: 1 frame ok → estático nele (sem dots); só cai no
      placeholder quando nenhum renderiza.
  - **Review Codex (ciclo 2, 2026-07-02) — 2 achados, ambos corrigidos:**
    - **[P2] dicionário não cobria o plano de exemplo embarcado** ("Desenvolvimento de ombro",
      "Desenvolvimento na máquina", "Agachamento goblet" → placeholder). → aliases adicionados +
      **teste de regressão que lê o `examples/plano-exemplo.json` real** e exige foto p/ todos os
      nomes (95 testes).
    - **[P3] `ExerciseThumb` grudava no fallback** — uma falha de thumb persistia ao navegar de
      exercício (componente reusado). → reset do `failed` quando `sourceId` muda (mesmo padrão do
      card principal).
  - **Review Codex (ciclo 3, 2026-07-02) — 2 achados [P2], ambos corrigidos:**
    - **"Última vez" ignorava a variação** — casava só por `exerciseId`; carga de outra variação
      aparecia como referência. → `previousPerformance` agora compara o **movimento efetivo**
      (`swappedToId ?? exerciseId`; param `movementId`); +1 teste (3 cenários). Verificado no
      browser: original mostra, variação nunca feita some, volta ao original volta.
    - **Timer morto após zerar** — `running` ficava true no fim; preset/+15s só mudavam o número.
      → countdown reestruturado p/ **timeout re-agendado com `remaining` nas deps** (padrão
      canônico): qualquer mudança de tempo religa o tique, inclusive pós-zero (a 1ª tentativa com
      efeito de sync de estado foi barrada pelo lint `react-hooks/set-state-in-effect` — a
      reestruturação é a solução correta, sem estado contraditório). Verificado no browser:
      tica, pausa, preset religa.
    - Gates: typecheck ✓ · lint ✓ · **96/96** ✓ · build ✓.
    - ⚠️ **Limite de ciclos (AGENTS §13):** 3 ciclos completos de correção nesta task.
  - **Re-review de confirmação (2026-07-02) — APROVADO, LIMPO:** "no discrete, actionable bugs…
    media, focused-set UI, timer changes e previous-performance logic internamente consistentes".
    **TASK-010 chancelada — pendente apenas o gate humano de merge.**
  - Nota do review: existe um campo `mediaId` órfão em `schema.ts:24`/`movement.test.ts` (aceito no
    schema mas não usado pela UI) — candidato a integrar na TASK-012 (mídia explícita do gerador).

## TASK-011 — Hoje v2 (IMPLEMENTADA, branch `ai/TASK-011-hoje-v2-claude`, review pendente)
Contrato: `docs/ai/tasks/TASK-011-hoje-v2.md`. Implementado (2026-07-03): saudação c/ **nome em
teal** + tagline; chip **"Plano importado · split · Nx por semana"** (informativo, sem botão morto);
hero c/ badge do treino + **nome do treino** + ícones (exercícios · ~min · nível via
`experienceLabel`); card **FOCO DO DIA**; **lista EXERCÍCIOS numerada c/ thumbs de foto real** +
"Equipamentos: …"; `estimateWorkoutMinutes` puro (+3 testes, **99** no total). Decisão: anel de
dieta FORA (não rastreamos refeições — progresso fake violaria a política). Mantidos: asset 3D,
ritmo da semana, Corpo/Alimentação, descanso anti-culpa.
Gates ✓ (typecheck/lint/99 testes/build) · DOM 375px ✓ sem overflow · console limpo.
- **Review Codex (ciclo 1, 2026-07-03) — 2 achados [P2], ambos corrigidos:**
  - **Badge expunha id interno do treino** — `workoutId` pode ser slug/UUID; renderizar id de
    armazenamento na UI confunde/estoura. → `workoutBadge(id)` puro: só exibe ids curtos legíveis
    (`^[A-Za-z0-9]{1,3}$`, maiúsculo); senão o badge some. +2 testes.
  - **"Equipamentos: Livre" convertia desconhecido em afirmação** — `equipment` omitido é
    DESCONHECIDO, não "sem equipamento". → a linha filtra só equipamentos conhecidos; sem nenhum,
    é omitida. Verificado: "Equipamentos: Cabo, Barra" (sem Livre).
  - Gates: typecheck ✓ · lint ✓ · **101/101** ✓ · build ✓. Re-review pendente.

### PRÓXIMA AÇÃO EXATA (sessão nova começa aqui)
1. **Review Codex** da TASK-011 (`codex review --base main`, Git Bash) + **gate visual do usuário**
   na home. Loop de correção; **merge sob gate humano**.
2. Depois: **TASK-012** Como fazer v2 (inclui integrar o campo `mediaId` órfão do schema) →
   **TASK-014** Corpo v2 → **TASK-013** erro amigável.
3. Backlog: Fase 2 corpo realista; testes de interação de UI (RTL/jsdom); `sex:"other"` (lib);
   meal tracking (pré-requisito do anel de dieta do mockup).

## Assets (resolvidos, open-source — sem custo)
- Mapa anatômico: **`react-muscle-highlighter`** (MIT) — frente+costas, cor/intensidade por músculo, clique. Estilo vetorial (não o 3D fotorrealista do mockup — aceitável p/ começar; decidir depois).
- Demonstração de exercício: **`free-exercise-db`** (Unlicense) — 800+ exercícios com imagens + dados.

## Como rodar / verificar
- `npm run dev` (porta 3000). Gates: `npm run typecheck && npm run lint && npm run test && npm run build` (85 testes).
- ⚠️ **IndexedDB do preview é efêmero entre sessões** — pra ver `/corpo` aceso, semear plano de exemplo (`examples/plano-exemplo.json`) + sessões concluídas direto no IndexedDB (stores `plans`/`kv`/`sessions`).
- **Preview screenshot está intermitente** (trava, ainda mais com o timer rodando). Verificar por: **abrir `localhost:3000`** (olhos do usuário) + DOM via eval. Seed de teste: gravar plano + sessões direto no IndexedDB (store `plans`/`kv`/`sessions`/`bodylog`).
- ⚠️ **Aba do preview às vezes fica `document.hidden`** → Chromium NÃO carrega `loading="lazy"` em aba oculta (thumbs parecem quebrados e screenshot trava). **Não é bug do app** — validar forçando `img.loading='eager'` via eval ou pelos olhos do usuário. Não trocar lazy→eager no código por causa disso.
- Fluxo de revisão cruzada: Codex revisa (`codex review --base main` no **Git Bash**, não PowerShell — modo restrito trava). Loop em `docs/ai/CODE_REVIEW.md` (P0–P3).

## Notas de ambiente / git
- Repo `Ruimachadoneto/Activve`; usuário tem 2 contas GitHub (`RuiMachadopmo` é colaborador). 403 = conta errada no GCM.
- C: já esteve cheio (trava screenshot + git ENOSPC) — checar espaço se travar.
- **Consumo do plano:** conversas longas + screenshots queimam orçamento rápido (o modelo relê todo o chat por turno). **Trabalhar em sessões curtas; minimizar screenshots; preferir DOM + olhos do usuário.**

## Tarefas
| ID | Título | Status | Branch |
|---|---|---|---|
| TASK-004 | Hoje fidelidade + mapa muscular | MERGEADA | main |
| TASK-005 | Treino execução + persistência | MERGEADA | main |
| TASK-006 | Como fazer + variações | MERGEADA | main |
| TASK-007 | Corpo / evolução (peso+tendência) | MERGEADA | main |
| TASK-008 | Overhaul visual (Modo Treino, branding) | MERGEADA | main (`9a0d464`) |
| TASK-009 | Mapa muscular de recuperação no Corpo (+ polish visual) | MERGEADA | main (`abacf6c`) |
| TASK-010 | Modo Treino: foto real + série em foco + premium | MERGEADA | main (`80f4f4d`) |
| TASK-011 | Hoje v2 (saudação, hero, foco do dia, lista de exercícios) | EM ANDAMENTO (implementada; review pendente) | ai/TASK-011-hoje-v2-claude |
