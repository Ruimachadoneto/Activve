# Estado atual do projeto — CHECKPOINT DE RETOMADA

> Atualizado: `2026-07-28` (TASK-013 implementada e revisada, aguardando só o merge; antes disso,
> 2026-07-27 — 4 tasks + pivô de produto; ver `CHECKPOINT DE RETOMADA`
> no final do arquivo pra um resumo denso). Este doc + `CLAUDE.md` + `docs/ai/tasks/*` +
> `docs/DESIGN_SYSTEM.md` + git history permitem **retomar numa sessão nova sem o histórico do
> chat**. Leia primeiro — se estiver com pressa, leia só "Onde estamos" + o
> "CHECKPOINT DE RETOMADA" no final.

## O que é o Activve (pra quem está chegando agora)
App de fitness **local-first** (Next 16 + TS + Tailwind v4 + IndexedDB, zero backend hoje) que o
usuário treina/acompanha no aparelho. A visão de produto completa (`docs/ai/PRODUCT_VISION.md`)
é um **ciclo fechado de coaching**: um "Activve Health System" (hoje um **Claude Project**, spec em
`docs/ai/coach/ACTIVVE_HEALTH_SYSTEM.md`) faz anamnese e gera um `PlanFile` (JSON) que o usuário
importa no app; o app treina/acompanha; o usuário exporta um relatório de volta pro coach ajustar o
próximo ciclo. **Local-first é decisão deliberada** (privacidade como diferencial), coach/conta/
billing na nuvem só numa Fase 2 futura, depois de validar (usuário está validando pessoalmente
agora). App publicado em produção: `activve.vercel.app` (deploy feito pelo próprio usuário).

## Onde estamos
- **Branch atual:** `ai/TASK-013-erro-plano-claude` (TASK-013 implementada, gates verdes,
  8 ciclos de review Codex com 11 achados [P2] corrigidos, decisão arquitetural tomada pelo
  usuário; **aguarda só o gate humano de merge**). `main` está limpa em `9032a5c`.
- **`main`** tem **TASK-001→012, 014→018 mergeadas**. Com a TASK-013 na branch, todas as tasks do
  ciclo do mockup original estão implementadas.
- **2026-07-27 — sessão de resposta ao feedback de uso real** (usuário testou o app publicado e
  mapeou 4 pontos): (1) sem relatório/calendário de treino, (2) sem trocar o treino "oficial" do
  dia, (3) timer de descanso divergia em background, (4) sem UI pra reimportar plano. **Os 4 foram
  resolvidos e mergeados** nesta sessão: TASK-015 (✅ trocar plano) → TASK-016 (✅ dia/treino) →
  TASK-017 (✅ timer) → TASK-018 (✅ calendário + relatório visual). Ver seção de cada task abaixo
  e o `CHECKPOINT DE RETOMADA` no final pra um resumo consolidado.
- **Pivô de produto dentro da TASK-018** (pedido explícito do usuário, meio da implementação): o
  export do relatório **não é mais JSON pro coach** — virou um **relatório VISUAL** (gráficos de
  progressão de peso/carga, PDF via impressão nativa do browser) pro **usuário acompanhar o próprio
  progresso**. Detalhe completo na seção TASK-018 abaixo.
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
  - Gates: typecheck ✓ · lint ✓ · **101/101** ✓ · build ✓.
- **Review Codex (ciclo 2, 2026-07-03) — 1 achado [P2] corrigido:** o chip "Plano importado" não
  encolhia — `training.split` longo ("Upper/Lower com foco em glúteos") estourava o chip em 375px.
  → metadado com `min-w-0 truncate` (+ label `shrink-0`); linha de equipamentos ganhou o mesmo
  tratamento (quebra com ícone alinhado). Verificado no browser com o split longo do achado:
  chip contido, ellipsis, sem overflow.
- **Re-review de confirmação (2026-07-03) — APROVADO, LIMPO:** "no discrete, actionable bug that
  would warrant a fix before merge". **TASK-011 chancelada (2 ciclos + confirmação) — pendente
  gate visual do usuário + gate humano de merge.**

## TASK-012 — Como fazer v2 (IMPLEMENTADA, branch `ai/TASK-012-como-fazer-v2-claude`, review pendente)
Contrato: `docs/ai/tasks/TASK-012-como-fazer-v2.md`. Implementado (2026-07-03):
- **PLAN_SCHEMA 1.1 (ADR-005, retrocompatível):** `howTo.tips?[]` + `howTo.quickTip?` novos;
  `howTo.mediaId` ganhou semântica = id exato do free-exercise-db, **prioridade sobre o dicionário**
  (`resolveExerciseMedia(name, mediaId?)`); compat por major (1.x) já aceitava. PLAN_SCHEMA.md +
  changelog atualizados. ⚠️ **Gerador (artifact) precisa ser atualizado** p/ emitir os campos.
- **Sheet v2 (`ExerciseSheet`):** chips de músculos (primários em teal + "· sinergista"),
  EXECUÇÃO, DICAS TÉCNICAS (checks, card), DICA RÁPIDA (lâmpada, âmbar), variações com
  **thumbnail de foto real** (mediaId ou dicionário).
- `MUSCLE_LABEL` PT-BR dos 20 músculos (`labels.ts` + teste de completude).
- **Exemplo embarcado → 1.1**: tips/quickTip em 3 exercícios + **4 mediaIds órfãos corrigidos**
  p/ ids reais (os antigos, minúsculos, virariam 404 com a nova precedência — pego antes do review).
- Testes: schema 1.1, "exemplo sempre valida", override de mediaId, labels — **107 no total**.
- Gates ✓ · sheet verificada no browser (chips/dicas/thumbs, mediaId override end-to-end) · console limpo.
- **Review Codex (ciclo 1, 2026-07-03) — 2 achados [P2], ambos corrigidos:**
  - **Thumb do "(original)" quebrava** — passei `"nome (original)"` ao resolver; o sufixo impedia o
    match no dicionário (planos sem mediaId perdiam a foto). → `VariationRow` resolve pelo nome CRU;
    "(original)" vira só rótulo. Verificado: removido o mediaId do supino, o thumb volta pelo dicionário.
  - **Sinergistas errados na variação** — a sheet mostrava `exercise.secondaryMuscles` mesmo após
    trocar para uma alternativa (que pode ser outro movimento). → secundários só quando NÃO é swap
    (`mov.isSwapped ? [] : …`). Verificado: trocar p/ halteres deixa só "Peito" (some tríceps/ombro).
  - Gates: typecheck ✓ · lint ✓ · **107/107** ✓ · build ✓.
- **Re-review de confirmação (2026-07-03) — APROVADO, LIMPO:** "no discrete, actionable bugs…
  schema fields, media override plumbing e UI updates internamente consistentes com o modelo 1.x".
  **TASK-012 chancelada — pendente gate visual + merge do usuário.**

## TASK-014 — Corpo v2 (IMPLEMENTADA, branch `ai/TASK-014-corpo-v2-claude`, review pendente)
Contrato: `docs/ai/tasks/TASK-014-corpo-v2.md`. Implementado (2026-07-04):
- `body.ts`: `weightDelta(entries, days, now)` (último − mais antigo na janela; null se <2) e
  `latestMeasures(entries)` (valor mais recente por medida) + `MEASURES` (cintura/peito/coxa/braço).
  +6 testes (**112** no total). **Sem migration** — `BodyEntry.measures` já existia.
- `corpo/page.tsx` reescrita com **3 abas** (Visão geral / Medidas / Histórico):
  - **Visão geral:** mapa + **Tendência de peso** (número grande + **chip de delta 30d** "-1.8 kg ·
    últ. 30 dias") + gráfico + **Medidas principais** (grid leitura + Editar) + meta.
  - **Medidas:** registrar peso + inputs de cintura/peito/coxa/braço (pré-preenchidos com o último
    valor); `upsertToday` **mescla** — salvar peso não apaga medidas e vice-versa.
  - **Histórico:** registros por data (mais recente no topo, peso + nº de medidas).
- Gates ✓ (112 testes) · verificado no browser em 375px: delta -1.8, merge peso↔medidas preservado,
  histórico ok, sem overflow, console limpo.
- **Review Codex (ciclo 1, 2026-07-04) — 2 achados, corrigidos:**
  - **[P2] não dava pra apagar medida** — campo limpo era pulado e o valor antigo voltava no merge.
    → `mergeMeasures(existing, patch)` puro (número define, **null apaga**; vazio→undefined) +3 testes;
    branco explícito no input vira delete. Verificado: apagar Coxa persiste.
  - **[P3] lost-update em saves consecutivos** — peso e medidas (botões separados) liam a mesma
    linha e o 2º sobrescrevia o 1º. → escritas **serializadas** por `writeChain` (useRef). Verificado:
    disparar peso+medidas juntos preserva os dois (weight 82.5 + arm 38).
  - Gates: typecheck ✓ · lint ✓ · **115/115** ✓ · build ✓.
- **Review Codex (ciclo 2, 2026-07-04) — 1 achado [P2], corrigido:** o fix do ciclo 1 só apagava
  medida criada HOJE; se o valor visível veio de um dia anterior, limpar não vencia o histórico
  (`latestMeasures` ressurgia o valor antigo). → **lápides (tombstones):** `BodyEntry.measures`
  aceita `null` = "apagada nesta data"; `mergeMeasures` preserva o null; `latestMeasures` esquece a
  medida ao ver a lápide; Histórico não conta lápide. +2 testes ajustados/novos. Verificado no
  browser: cintura vinda de 5 dias atrás, limpa hoje, some do resumo (registro de hoje `{waist:null}`).
  Gates: typecheck ✓ · lint ✓ · **116/116** ✓ · build ✓.
- **Review Codex (ciclo 3, 2026-07-04) — 1 achado [P2], corrigido:** num plano recém-importado sem
  registros, o número grande da tendência caía p/ `profile.weight_kg` mas o resumo "Medidas
  principais" mostrava `—` → dois pesos conflitantes na mesma tela. → resumo usa o mesmo fallback
  `latest`. Verificado: ambos mostram 84 kg. Gates: **116/116** ✓ · build ✓.
  ⚠️ **Limite de ciclos (AGENTS §13): 3 ciclos.**
- **Re-review de confirmação (2026-07-04) — APROVADO, LIMPO:** "changes internally consistent…
  helpers covered by tests, same-day weight/measure merges preserved; no actionable regression".
  **TASK-014 chancelada — pendente gate visual + merge do usuário.**

## TASK-015 — Trocar plano visível na UI (MERGEADA em `main` `cb1b07b`, 2026-07-27)
Contrato: `docs/ai/tasks/TASK-015-trocar-plano.md`. Causa raiz do "preciso limpar cache pra
reimportar": `saveImportedPlan` **nunca apagou** `sessions`/`bodylog` — só faltava um caminho de UI
(`/import` só linkava quando `!plan`). Implementado: página `/mais` (resumo do plano ativo + CTA
"Trocar plano"); `BottomNav` "Mais" deixou de ser inerte; `goalLabel` consolidado em `labels.ts`
(estava triplicado). Verificado no browser com seed direto no IndexedDB: reimportar plano com
**planId diferente** (simulando novo ciclo do coach) não apaga nada — confirmado por inspeção
direta do IndexedDB pós-reimport. Gates: **116/116** ✓. Review Codex ciclo 1: **APROVADO, LIMPO**.
- **Descoberta p/ TASK-018:** o mapa de recuperação em `/corpo` é filtrado por `planId` **ativo**
  (`getSessionsForPlan`) — ao trocar de plano, sessões do ciclo anterior somem do mapa (não é bug,
  é o design do ADR-002, mas o calendário/relatório da TASK-018 **deve** listar sessões de todos os
  planos, não só o ativo, senão o histórico "sumiria" visualmente a cada novo ciclo).

## TASK-016 — Selecionar/fixar treino do dia (MERGEADA em `main` `76c7dcb`, 2026-07-27)
Contrato: `docs/ai/tasks/TASK-016-dia-treino.md`. Override por data (`src/lib/storage/overrides.ts`,
store `kv`, sem migration) permite trocar qual treino é o "oficial" de hoje quando o `weekSchedule`
fixo não bate com o que o usuário quer fazer. `getTodayWorkout(plan, now, override?)` ganha 3º
parâmetro; Hoje e `/treino` mostram/permitem trocar, com aviso e reversão.
- **6 ciclos de review Codex, 5 achados reais (acima do limite normal de 3 do AGENTS §13 —
  aprovado explicitamente pelo usuário pra continuar, cada achado era genuíno, não cosmético):**
  corrida de carregamento (`/treino` derivava sessão antes do override resolver — risco real de
  logar série no treino errado); botão "Voltar ao planejado" sumia ao pré-visualizar outro treino
  com override ativo; `selected` local não resetava ao reverter (tela ficava presa); a MESMA
  corrida reaparecia numa variante mais sutil (booleano `overrideLoading` ficava obsoleto quando
  `planId` mudava de `null` pro id real — resolvido trocando por estado **derivado**
  `{planId, value}` comparado ao planId atual); override sobrevivia a reimport do MESMO planId no
  mesmo dia com ids de treino trocados (`saveImportedPlan` agora limpa o override do dia ao salvar).
- Gates finais: typecheck ✓ · lint ✓ · **120/120** ✓ · build ✓. Verificado no browser em cada
  ciclo, incluindo o cenário exato de cada achado (cold-load com override pré-existente, reimport
  do mesmo planId via `/import` real).

## TASK-017 — Timer de descanso ancorado em tempo real (MERGEADA em `main` `fb09bbe`, 2026-07-27)
Contrato: `docs/ai/tasks/TASK-017-timer-ancorado.md`. `RestTimer.tsx` reescrito: `endAtRef` (epoch
ms) é a fonte da verdade, `remaining` sempre recalculado de `endAt - Date.now()` (nunca
decrementado); recalcula na hora ao voltar foco/visibilidade. **Sem** notificação em background
(isso é PWA/Service Worker → TASK-019, à parte) — só resolve a contagem não divergir.
- **2 ciclos de review Codex, 1 achado [P1] real:** reiniciar o descanso com a **mesma duração**
  enquanto já `running` (ex.: fechar cedo via X, concluir outra série do mesmo exercício pouco
  depois) não reancorava — o efeito de ancoragem dependia de `running`/`duration` **mudarem de
  valor**, e nesse caso nenhum dos dois muda. → toda ação que (re)inicia a contagem ancora
  **explicitamente**, nunca inferido de mudança de valor.
- Verificado no browser: `Date.now` mockado +30s/+35s + `visibilitychange`/`focus` sem esperar tick
  real → corrige na hora; pause/resume sem pular segundos; +15s correto; zera e revive com preset
  (sem reintroduzir o bug da TASK-010); reiniciar com mesma duração reancora fresco (não o achado).
  Gates: **120/120** ✓ · build ✓.

## TASK-018 — Calendário de treinos + relatório visual (MERGEADA em `main` `98a7703`, 2026-07-27)
Contrato: `docs/ai/tasks/TASK-018-calendario-relatorio.md` (o mais detalhado — leia se for mexer
em `report.ts`/`relatorios/page.tsx`, tem o raciocínio completo de 8 ciclos de review).
- **Calendário** (`/relatorios`, linkado em `/mais`): grade do mês, navegação, dias com sessão
  marcados/clicáveis (usa `getAllSessions()` — **todos os planos**, não só o ativo, per o achado da
  TASK-015). Clicar no dia mostra treino + série/peso/reps/RPE por exercício, com o nome do
  movimento resolvido pelo plano **daquela sessão** (não o ativo — `getAllPlans()` + `plansById`).
- **Pivô de produto (pedido explícito do usuário, no meio da implementação):** o export
  "Esta semana"/"Este mês" **não é mais um `ReportFile` JSON baixado como arquivo** — virou um
  **relatório VISUAL** na tela (gráficos SVG puros de progressão de peso e carga por exercício —
  `ReportLineChart.tsx`, mesmo padrão do `WeightChart` já existente, zero lib nova) +
  **"Baixar PDF" via `window.print()`** nativo (`.report-print` em `globals.css` sobrescreve os
  tokens de cor só pro print, sem duplicar classe por elemento). `buildReport`/`reportToMarkdown`
  (`src/lib/plan/report.ts`) continuam existindo — o Markdown virou uma opção secundária "Texto p/
  coach" (ainda serve pro hand-off ao Claude Project).
- **`buildReport` resolve histórico CROSS-PLANO**: recebe `knownPlans: KnownPlan[]` (todos os
  planos já importados, com `importedAt`) e resolve agenda/nome de exercício/músculos pelo plano
  que valia em CADA data/sessão (`planForDate`/`planForSession`) — trocar de plano não apaga mais o
  histórico de um ciclo anterior do período exportado. `goal`/`refersToPlanId` continuam vindo do
  plano **ativo** (é o ciclo vigente que importa pra meta).
- **8 ciclos de review Codex** (muito acima do limite normal de 3 do AGENTS §13 — usuário consultado
  2x via pergunta explícita e aprovou continuar/corrigir, dado que cada achado era genuíno):
  7 achados reais corrigidos (corrida de carregamento em 2 variantes, export misturando planos,
  variação trocada não separada na progressão, período invertido/futuro, `reportId` colidindo,
  `importedAt` sobrescrito em reimport do mesmo plano, agenda inventada pra dias antes do primeiro
  plano existir); **1 registrado como dívida técnica** por decisão do usuário (ver seção própria
  abaixo — fronteira de troca de plano no mesmo dia calendário, impacto muito baixo).
- Gates finais: typecheck ✓ · lint ✓ · **132/132** ✓ · build ✓. Verificado no browser em cada
  ciclo — inclusive um cenário real de troca de ciclo (2 planos distintos no IndexedDB, sessão em
  cada um dentro do mesmo mês): relatório mostrou as duas sessões juntas, peso cruzando os dois
  ciclos, e cada exercício com o nome certo do plano de origem.

## Dívida técnica registrada (decisões explícitas do usuário — revisitar se incomodar na prática)
- **TASK-016 [P2]:** reimportar o **mesmo** `planId` com ids de treino/exercício **renomeados**
  perde o nome antigo pras sessões anteriores àquele ciclo — `saveImportedPlan` **sobrescreve** o
  registro por planId, a revisão antiga é apagada de verdade do IndexedDB (não é bug de lookup da
  UI). Corrigir de verdade exige guardar histórico de revisões do plano (nova store ou chave
  composta `planId+importedAt`) — mudança de arquitetura, não um ajuste pontual.
- **TASK-018 [P2]:** `planForDate`/`earliestKnown` (`report.ts`) comparam só a **data**
  (`importedAt.slice(0,10)`), não o timestamp completo — se um plano novo for importado no MEIO do
  dia (mesmo dia calendário do plano anterior), o dia inteiro cai pro plano novo em vez de
  reconhecer a fronteira por horário. Como `workoutsScheduled` já opera em granularidade de DIA
  (não hora), afeta no máximo 1 dia de fronteira, cenário raro. Não corrigido.
- **Dívida de teste (desde TASK-008):** faltam testes de UI/interação pra `/treino`, `RestTimer`,
  `/relatorios` (infra Vitest é node-only; exigiria RTL/jsdom — nunca configurado).

## TASK-013 — Estado de erro amigável p/ plano corrompido (IMPLEMENTADA + REVISADA, branch `ai/TASK-013-erro-plano-claude`, **aguardando só o merge**)
Contrato: `docs/ai/tasks/TASK-013-erro-plano.md`. Implementada em 2026-07-28.
- **Problema confirmado no código antes de mexer:** `useActivePlan` devolvia o registro CRU do
  IndexedDB (`parsePlan` só era usado em `/import`) e não existia **nenhum** error boundary em
  `src/app`. Plano sem `training`/`diet.meals`/`howTo` derrubava as telas com runtime error.
- **Implementado:** `validatePlan(json)` extraído de `parsePlan(text)` (fonte única — validação de
  leitura não pode divergir da de import); `useActivePlan` revalida e expõe `invalid`, mantendo
  `plan: null` de propósito (tela que não tratar cai no empty state, nunca no crash);
  `PlanErrorState` (anti-culpa, CTA "Reimportar plano", detalhe técnico truncado em texto — vem de
  arquivo não confiável); ligado em `/`, `/treino`, `/corpo`, `/mais`, `/relatorios`;
  `error.tsx` + `global-error.tsx` como backstop (Next 16.2: aceita `unstable_retry` **e** `reset`).
- **Gates:** typecheck ✓ · lint ✓ · **161/161** ✓ · build ✓ (eram 132 antes da task).
- **Verificado no browser** (plano real do usuário no IndexedDB, não sintético): as 4 variantes de
  corrupção da auditoria (sem `training`, sem `diet.meals`, sem `howTo`, `weekSchedule` curto) nas
  5 rotas → estado amigável, console limpo, 375px sem overflow, CTA de 44px levando a `/import`
  funcional; boundary testado com `throw` temporário (capturou, "Tentar de novo" presente);
  **plano válido sem regressão** em todas as telas.
- ⚠️ **8 ciclos de review Codex, 11 achados [P2] — todos reais, todos corrigidos.** Muito acima do
  limite de 3 do AGENTS §13; houve **uma parada formal** no ciclo 3 (ciclos 2 e 3 puxavam em
  direções opostas — apertar × afrouxar a guarda) e o usuário **decidiu a arquitetura** (opção B:
  proteger na origem da leitura, não filtrando a entrada). Depois da decisão, cada rodada apontou
  **outro campo** de plano histórico possivelmente malformado (`exercises` → `primaryMuscles` →
  `alternatives` → elementos nulos → `name`). A correção final fecha a classe **por construção**
  — resolver nome virou função total, músculos sempre array, agenda guardada — em vez de enumerar
  campos. Raciocínio completo no contrato da task.
- **Re-review de confirmação (2026-07-28) — APROVADO, LIMPO:** "I did not identify any actionable
  regressions… the new validation/error-state flow and the defensive historical-plan handling
  appear internally consistent and are covered by targeted tests." **TASK-013 chancelada — pendente
  apenas o gate humano de merge.**
- **Aprendizado registrado durante a execução:** a primeira versão descartava planos históricos por
  `validatePlan` completo e **regredia o histórico pra ids crus** — pego pela verificação no
  browser, não pelos testes. Validação uniforme é errada quando os consumidores têm necessidades
  diferentes: o plano ATIVO precisa do contrato inteiro (monta agenda/treino/dieta), um plano
  histórico usado só pra resolver nome precisa apenas ser percorrível.

## UPGRADE VISUAL v2 (em andamento — iniciado 2026-07-28)

**Origem:** o usuário classificou o app como "monótono/simples" e pediu algo "arrojado, imersivo,
surpreendente, premium — que valha a assinatura de um pagante". Três queixas concretas: sino de
notificação morto, gráficos precários, monotonia geral.

**Diagnóstico medido no código** (não impressão) — em `docs/ai/BENCHMARK_VISUAL_2026-07.md`:
sino é `<span>` sem handler (`page.tsx:145`); gráficos usam `preserveAspectRatio="none"` (distorce
traço/pontos) e não mostram um único número legível; 1 acento faz tudo; todo card tem o mesmo
tratamento (sem elevação); o app inteiro tem 2 animações; nenhum momento de celebração.

**Benchmark concluído** (exigência da `VISUAL_QUALITY.md` §3, antes de qualquer pixel): WHOOP,
Oura, Strong, Hevy + estado da arte de movimento/microinterações. Padrões adotados e **rejeitados
com justificativa** (score 0–100 fabricado, streaks punitivos, glass/gradiente pesado, copiar telas,
lib de gráfico de terceiros) no documento.

**Decisões do usuário (2026-07-28):**
- **Direção: A + B + C** — os três registros. Risco de identidade difusa foi levantado e o usuário
  decidiu pelos três mesmo assim; a mitigação está na §0 do `docs/DESIGN_SYSTEM.md`: são
  **registros escolhidos pela tarefa**, com 6 invariantes que nunca mudam entre eles.
- **Número-herói: prontidão muscular do dia**, derivado do `recovery.ts` que já existe e é testado.
  Regras de honestidade na §9 do design system (não é score de saúde, sem dado não exibe número,
  nunca é nota do usuário).
- **Sino: virar centro de avisos locais real** (IndexedDB, sem Service Worker, sem backend).

**`docs/DESIGN_SYSTEM.md` reescrito para v2** com o que faltava e causa a monotonia: modelo de
**elevação** (E0–E4, máx. 1 foco por tela), **semântica estrita de cor** (cada matiz significa uma
coisa só), **escala com degrau de display** + regra de `tabular-nums` obrigatória em toda métrica,
**sistema de movimento** (tokens de duração/easing + regra 80/20 + reduced-motion) e **9 regras de
dataviz**.

### Roadmap de tasks do upgrade

| ID | Task | Depende de | Entrega |
|---|---|---|---|
| TASK-020 | ✅ **MERGEADA** (`main`) — fundação do sistema v2 | — | Base que as demais consomem |
| TASK-021 | ✅ **MERGEADA** (`main`) — dataviz v2 (`LineChart` único) | 020 | Maior salto de percepção; resolveu a queixa mais concreta |
| TASK-022 | Hoje v3 — registro A (número-herói de prontidão + elevação) | 020, 021 | Tela de entrada vira "instrumento" |
| TASK-023 | Centro de avisos (substitui o sino morto) | 020 | Feature nova, local-first |
| TASK-024 | Modo Treino — registro B (imersivo + celebração de recorde) | 020 | O momento "uau" |
| TASK-025 | Corpo + Relatórios — registro A | 020, 021 | Consistência do sistema |
| TASK-026 | Registro C (Como fazer, import, PDF, estados vazios) | 020 | Acabamento editorial |

Cada task segue o fluxo do projeto: contrato → gates → verificação no browser → review Codex →
**gate visual + aprovação humana de merge** (o usuário aprova cada merge).

### TASK-021 — Dataviz v2 (MERGEADA em `main`, 2026-07-29)
Contrato: `docs/ai/tasks/TASK-021-dataviz.md`.
- **Causa raiz do "gráfico feio"**: os dois SVGs usavam `preserveAspectRatio="none"` — escala
  não-uniforme distorcia a espessura do traço e virava os pontos em elipses. Somado a: nenhum
  número legível, `<circle>` em toda amostra, sem eixo, sem interação, sem estado vazio.
- **`src/components/LineChart.tsx`** é agora o ÚNICO gráfico de linha do app; `WeightChart` e
  `ReportLineChart` são cascas finas. Regra registrada no `DESIGN_SYSTEM` §7.0.
- **6 ciclos de review Codex, 9 achados [P2]**, todos reais. Os mais graves eram de **veracidade**:
  (a) a META entrava nos extremos do eixo, então o gráfico exibia 78 kg como se fosse um peso
  medido; (b) precisão fixa (`toFixed(1)`) mostrava 61,25 como "61,3", fora da faixa medida;
  (c) o `aria-label` divergia do eixo visível — leitor de tela ouvia número diferente do exibido.
  Também 2 regressões de mobile que EU introduzi com o scrub (`touch-none` travava a rolagem;
  estado preso ao soltar o dedo) e sobreposição de rótulos em série plana.
- **Lição transversal** (a mesma da TASK-013): toda regra "por faixa" era um **proxy** do
  invariante real. A versão que fechou a classe não adivinha quando arredondar — usa a menor
  precisão que representa o valor **exatamente**, e só cai em arredondamento para *dentro* da
  faixa quando nem 2 casas bastam. `formatTick` coberto por teste de invariante em 13 faixas.
- **Correção de documentação**: o `DESIGN_SYSTEM` v2 mandava `tabular-nums` em toda métrica.
  Errado — largura fixa faz `121` parecer frouxo em display. Corrigido: só onde números se
  alinham verticalmente (eixos, tabelas, cronômetro).
- **Paleta validada por script** (não no olho): CVD, visão normal e contraste PASSAM
  (pior par ΔE 12.3 deutan). Os 2 FAILs — banda de luminosidade e croma do cinza `rested` — ficam
  como candidatos a refino: o cinza é neutro de propósito, e a paleta já tem gate visual aprovado.
- Gates no merge: typecheck ✓ · lint ✓ · **172/172** ✓ · build ✓.

### TASK-025 — Super upgrade "Vivid", Fase 1 (branch `ai/TASK-025-vivid-claude`, aguardando gate visual + merge)
Contrato: `docs/ai/tasks/TASK-025-vivid.md`. **Direção v3 registrada no `DESIGN_SYSTEM.md` §0.1**:
o usuário liberou explicitamente os limites de sobriedade da política ("não precisa se limitar ao
padrão exigido na documentação") — liberou-se estética, não integridade (honestidade, anti-culpa,
plan-file e acessibilidade continuam).
- **Entregue:** atmosfera de luz global; `.card-lift`; nome em gradiente; brilho ambiente no E3;
  nav em pílula flutuante com blur (espaçador interno, nenhuma tela mudou); herói vira **gauge em
  arco** com brilho semântico; Modo Treino com **foto desfocada como palco**; **recorde pessoal**
  (`bestPreviousLoad` puro, +5 testes) com selo + anel + vibração e compasso de 1,6s antes do
  descanso.
- **3 ciclos de review Codex (limite §13), 7 achados: 6 corrigidos, 1 recusado com evidência**
  (o `calc` do nav: largura computada 350px provou que o Tailwind v4 normaliza; adotada a sintaxe
  canônica mesmo assim). Correções notáveis: régua do recorde inclui a própria sessão (50 hoje →
  47 não celebra, 52 celebra); navegação cancela compasso e selo via helper `navegar()` nos
  handlers; histórico recarrega na troca de sessão; safe-area no espaçador do nav.
- Gates: typecheck ✓ · lint ✓ · **200/200** ✓ · build ✓. Verificações no browser em cada ciclo.
- **Fases seguintes (não iniciadas):** tela de conclusão de treino celebrada; Corpo/Relatórios no
  tratamento v3; registro C editorial.

### TASK-026 — Vivid Fase 2 (IMPLEMENTADA + REVISADA, branch `ai/TASK-026-vivid-corpo-claude`, **aguarda só o merge**)
Contrato completo: `docs/ai/tasks/TASK-026-vivid-fase2.md` — **ler antes de mexer**.
Os **4 itens** foram entregues, revisados (3 ciclos Codex, 5 achados [P2] reais, todos corrigidos)
e verificados no browser em 390×844.

- ✅ **Corpo v3** (`42aaf98`): mapa muscular vira o E3 com spotlight radial atrás dos corpos; peso
  vira número-herói de 44px e perde o `tabular-nums` que violava a §3.2; `card-lift` + `stagger`.
  Review Codex **limpo no ciclo 1**. 1 achado meu na verificação: `BottomNav` (espaçador + nav são
  filhos DIRETOS do `<main>`) entrava na escada do `.stagger` e a navegação principal ficava
  invisível ~280ms — classe **`stagger-skip`** (`1483e46`).
- ✅ **Tela de conclusão de treino** (`779ab0f`+): a tela de execução **sai de cena** e entra uma
  composição sobre o que acabou de acontecer — volume levantado como herói de 56px com count-up,
  recordes da sessão em âmbar, séries/exercícios/duração, foco muscular e saídas explícitas.
  Núcleo puro novo: **`src/lib/plan/summary.ts`** (`buildSessionSummary`, `sessionVolume`,
  `buildConstancy`, `formatDuration`) com 27 testes.
- ✅ **Relatórios v3** (`7648ef6`): o calendário vira **mapa de constância** — o dia se acende com
  intensidade proporcional ao volume daquele dia sobre o maior do mês. Sessão aberta não soma
  volume (mesma régua de `recovery.ts`), mas aparece tracejada e contada à parte.
- ✅ **Registro C (Editorial)** (`5c855d0`): o degrau **Display (30–34px)**, que a §3.1 define e
  nenhuma tela usava, passa a marcar as telas de LEITURA — `ReportView`, `ExerciseSheet`,
  `PlanErrorState` e `/import`.

**Gates:** typecheck ✓ · lint ✓ · **228/228** ✓ · build ✓ (eram 200 antes da task).

**Dois achados de acessibilidade pegos MEDINDO no browser, não no olho** (detalhe no contrato):
o teto da escala do calendário caiu de 60% para 44% porque o contraste do número do dia batia
3,6:1 (abaixo do AA); e o alvo de toque da grade, que era 36px **desde antes desta task**, subiu
para 44,6×44.

⚠️ **Screenshot indisponível na sessão de 2026-07-30** (Browser pane não compositava). A
verificação foi por DOM + estilos computados, com `getAnimations().finish()` para inspecionar o
estado assentado. **O gate visual humano continua pendente.**

### PRÓXIMA AÇÃO EXATA (sessão nova começa aqui)
**TASK-013 MERGEADA em `main` (`2118ff0`, 2026-07-28)** — gates revalidados na main (161/161),
branch apagada. ⚠️ **`main` está à frente de `origin` e o push NÃO foi feito** — o push dispara o
deploy do Vercel, e isso é decisão do usuário.

**Trabalho atual: UPGRADE VISUAL v2** (seção acima). Benchmark e direção aprovados.
**TASK-020 e TASK-021 mergeadas; `main` empurrada para `origin` (deploy do Vercel disparado).**
Próxima do roadmap: **TASK-022 — Hoje v3 (registro A)**, com o número-herói de prontidão muscular
derivado do `recovery.ts` (regras de honestidade na §9 do design system). Depois: 023 centro de
avisos, 024 Modo Treino imersivo, 025 Corpo/Relatórios, 026 registro editorial.
Candidatos que seguem depois do upgrade:
1. **TASK-019 — PWA (manifest + Service Worker)**: instalação na tela inicial + notificação REAL
   do timer em background (a TASK-017 corrigiu a contagem não divergir, mas só um Service Worker
   pode notificar com o app minimizado/tela apagada — documentado como fora de escopo da TASK-017).
3. Seguir testando o app + o coach (`ACTIVVE_HEALTH_SYSTEM.md`) e trazer novo feedback de uso real
   — o usuário mencionou que vai validar pessoalmente antes de decidir escalar (Fase 2).
4. Fase 1 do `PRODUCT_VISION.md` ainda não iniciada: rastreio leve de dieta (marcar refeição), exibir
   o plano de bem-estar/psicológico no app (hoje só existe no Documento humano do coach).

**(referência) TASK-013 — Robustez: estado de erro amigável p/ plano corrompido** (última do ciclo do mockup, ainda não iniciada).
Bug descoberto na auditoria: plano parcial/corrompido no IndexedDB (sem weekSchedule/howTo/diet.meals)
derruba Hoje/Treino com runtime error (tela vermelha) — viola VISUAL_QUALITY §8 (estados). Criar
branch `ai/TASK-013-erro-plano-claude` + contrato. Escopo: as páginas que leem o plano (`page.tsx`,
`treino`, `corpo`) devem **validar/cair num estado de erro amigável** ("plano inválido — reimporte")
em vez de crashar. Considerar validar com `parsePlan`/schema no `useActivePlan` e um ErrorBoundary.
Mesmo processo (contrato → gates → browser → review → gate visual/merge).

**(escopo TASK-014 original, para referência)** — **TASK-014 — Corpo v2** (auditoria `VISUAL_GAP_AUDIT_2026-06-30.md`, tela Corpo do mockup base):
criar branch `ai/TASK-014-corpo-v2-claude` + contrato. Escopo: **número grande + chip de delta**
("↓ 1,8 kg últ. 30 dias") na tendência de peso; tabs **Medidas / Histórico**; **Medidas
principais** (cintura/peito/coxa/braço — estende `bodylog` ou store novo, + Editar); refino do
card. Preparar caminho da **Fase 2 realista** do mapa (assets do usuário). Reusa a lógica de
recovery já pronta. Mesmo processo (contrato → gates → browser → review → gate visual/merge).
Depois: **TASK-013** erro amigável p/ plano corrompido (crash → estado de erro).

**Pendências fora do repo:** o **gerador (artifact do GPT) precisa aprender o schema 1.1**
(`tips`/`quickTip`/`mediaId`). Material pronto para colar no GPT em **`docs/ai/GENERATOR_1.1.md`**
(instruções + vocabulários + exemplo few-shot + **catálogo de 76 exercícios com mediaId verificado**).
Escolhida a **Opção B** (catálogo trava name↔mediaId↔equipment; GPT atribui músculos).

**Visão de produto + Coach (2026-07-04):** ciclo fechado confirmado com o usuário (site "Activve
Health System" faz anamnese+gera+ajusta ↔ app rastreia+exporta relatório). Registrado em
`docs/ai/PRODUCT_VISION.md`. **Spec do coach** pronto pra rodar como Claude Project em
`docs/ai/coach/ACTIVVE_HEALTH_SYSTEM.md` (anamnese + geração do documento/PlanFile + ajuste por
ReportFile). Estratégia: local-first (dados no aparelho) + coach/billing na nuvem só na Fase 2, após
validar. Usuário vai **testar app + coach** e escalar se aprovar.
Elo faltante do loop (Fase 1, app), **atualizado 2026-07-27**: o export virou relatório **visual**
(TASK-018) — resolve "acompanhar progresso" pro usuário, mas o coach espera `ReportFile` **JSON**
(ver nuance em `CHECKPOINT DE RETOMADA` no final deste arquivo — pode precisar reavaliar quando o
ciclo com o coach for fechado de novo). Ainda faltam: dieta leve (marcar refeição), exibir plano de
bem-estar.
Backlog: Fase 2 corpo realista; RTL/jsdom; `sex:"other"`; meal tracking (anel de dieta).

**(escopo TASK-012 original, para referência)** — **TASK-012 — Como fazer v2** (auditoria `VISUAL_GAP_AUDIT_2026-06-30.md`, tela 3): criar branch
`ai/TASK-012-como-fazer-v2-claude` + contrato. Escopo: **chips de músculos** no topo da sheet
(primary/secondaryMuscles — dado pronto); **DICAS TÉCNICAS** (checks teal) + **DICA RÁPIDA**
(lâmpada) — exige campos opcionais novos no schema (`howTo.tips[]`, `howTo.quickTip`) = minor bump
do PLAN_SCHEMA + ADR (contrato bidirecional: gerador acompanha); **alternativas com thumbnail +
badge**; integrar o campo `mediaId` órfão (schema.ts:24) como override explícito de mídia do
gerador (prioridade sobre o dicionário). Mesmo processo: contrato → gates → browser → review Codex
→ gate visual/merge do usuário.
Depois: **TASK-014** Corpo v2 → **TASK-013** erro amigável.
Backlog: Fase 2 corpo realista; RTL/jsdom; `sex:"other"`; meal tracking (anel de dieta).

## Assets (resolvidos, open-source — sem custo)
- Mapa anatômico: **`react-muscle-highlighter`** (MIT) — frente+costas, cor/intensidade por músculo, clique. Estilo vetorial (não o 3D fotorrealista do mockup — aceitável p/ começar; decidir depois).
- Demonstração de exercício: **`free-exercise-db`** (Unlicense) — 800+ exercícios com imagens + dados.

## Como rodar / verificar
- `npm run dev` (porta 3000). Gates: `npm run typecheck && npm run lint && npm run test && npm run build` (**132 testes** em 2026-07-27).
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
| TASK-011 | Hoje v2 (saudação, hero, foco do dia, lista de exercícios) | MERGEADA | main (`ef33d74`) |
| TASK-012 | Como fazer v2 + PLAN_SCHEMA 1.1 (tips/quickTip/mediaId) | MERGEADA | main (`c1b40ea`) |
| TASK-014 | Corpo v2 (tendência+delta, medidas, histórico) | MERGEADA | main (`1b2ae92`) |
| TASK-015 | Trocar plano visível na UI | MERGEADA | main (`cb1b07b`) |
| TASK-016 | Selecionar/fixar treino do dia | MERGEADA | main (`76c7dcb`) |
| TASK-017 | Timer de descanso ancorado em tempo real | MERGEADA | main (`fb09bbe`) |
| TASK-018 | Calendário de treinos + relatório visual (PDF) | MERGEADA | main (`98a7703`) |
| TASK-013 | Estado de erro amigável p/ plano corrompido | IMPLEMENTADA + REVISADA — aguarda só o merge | `ai/TASK-013-erro-plano-claude` |

---

# CHECKPOINT DE RETOMADA (2026-07-28, fim de sessão)

> Seção pensada pra responder, sozinha, as 15 perguntas de continuidade do `CLAUDE.md` §2.3 —
> se a janela de contexto for compactada ou limpa, comece por aqui.

**Última task concluída**
TASK-018 — Calendário de treinos + relatório visual (mergeada em `main` `98a7703`).

**Task atual**
**TASK-013 — estado de erro amigável p/ plano corrompido: IMPLEMENTADA, REVISADA e verificada,
NÃO mergeada.** Branch `ai/TASK-013-erro-plano-claude` (11 commits sobre `9032a5c`). O único gate
que falta é **humano: aprovar o merge** (o usuário aprova cada merge).
Houve uma parada formal no ciclo 3 do review — ciclos 2 e 3 apontavam em direções opostas sobre
onde a robustez deve morar (`AGENTS.md` §13) — e o usuário **decidiu a opção B**: proteger na
ORIGEM da leitura, não filtrando a entrada. Implementada e revisada depois disso.

**Último step concluído**
Última rodada de review Codex: achado [P2] de que exercício histórico sem `name` virava rótulo em
branco e furava o contrato `string` do `ReportFile` → resolver nome virou **função total**
(`label`/`planLabel`: sempre string usável, senão cai no id). Gates revalidados (161/161) + esta
atualização de documentação.

**Estado atual do código**
`main` limpa em `9032a5c`. Branch da TASK-013 com todos os gates verdes (`typecheck`, `lint`,
`test` **161/161**, `build`). App funcional ponta a ponta: importar plano → treinar
(Hoje/Treino/Corpo) → trocar plano/treino do dia → timer confiável → calendário + relatório visual
com PDF → **e agora plano corrompido cai em estado de erro amigável em vez de crashar**.

**O que funciona (verificado no browser nesta sessão)**
- Trocar plano via `/mais` sem perder histórico (sessions/bodylog sobrevivem a reimport).
- Fixar/trocar o treino "oficial" do dia (override por data), com reversão.
- Timer de descanso corrige sozinho a contagem ao sair/voltar do app (não notifica em background
  ainda — isso é PWA, ver TASK-019 candidata).
- Calendário em `/relatorios`: dias com sessão marcados, clique mostra detalhe completo
  (série/peso/reps/RPE), inclusive de planos antigos (nome do exercício resolvido corretamente
  pelo plano da sessão, não o ativo).
- Relatório visual: gráficos de progressão de peso e carga por exercício, "Baixar PDF"
  (`window.print()`), histórico cruzando trocas de plano dentro do mesmo período exportado.

**O que não funciona / não existe ainda**
- Estado de erro amigável pra plano corrompido: **resolvido na branch da TASK-013, ainda não em
  `main`** — em produção (`activve.vercel.app`) o crash continua até o merge.
- Relatório exportado perde fidelidade (nomes/volume) em plano histórico cosmeticamente inválido —
  é o achado [P2] em aberto da TASK-013, não um bug esquecido. Ver contrato da task.
- Notificação real do timer com o app minimizado/tela apagada — exige Service Worker (PWA), fora
  de escopo da TASK-017 de propósito.
- App não é instalável (sem `manifest.json`/Service Worker) — TASK-019 candidata.
- Sem rastreio de dieta (marcar refeição) nem exibição do plano de bem-estar no app — Fase 1 do
  `PRODUCT_VISION.md`, não iniciada.
- **Nuance a resolver quando o coach for usado de novo**: `ACTIVVE_HEALTH_SYSTEM.md` (spec do
  coach) espera reingerir um `ReportFile` **JSON**; depois do pivô da TASK-018, a UI só oferece
  **Markdown** ("Texto p/ coach") como export primário pro usuário — não removi a função
  `buildReport`/o tipo `ReportFile`, só parei de expor o download de JSON na tela. Se o usuário for
  fechar o ciclo com o coach de verdade, ou o Markdown basta (Claude Project lê texto bem) ou vale
  reavaliar se precisa reexpor o JSON como opção terciária.

**Arquivos-chave desta sessão (se for mexer de novo, comece por eles)**
- `src/lib/plan/report.ts` — núcleo puro do relatório (`buildReport`, `KnownPlan`,
  `planForDate`/`planForSession`, `reportToMarkdown`). Mexeu muito, testado a fundo (132 testes).
- `src/app/relatorios/page.tsx` — calendário + UI do relatório visual.
- `src/components/ReportView.tsx` / `ReportLineChart.tsx` — o relatório visual em si + gráfico SVG.
- `src/lib/storage/overrides.ts` — override de treino do dia (TASK-016).
- `src/lib/storage/plans.ts` — `saveImportedPlan` (preserva `importedAt` original em reimport do
  mesmo planId), `getAllPlans`.
- `src/components/RestTimer.tsx` — reescrito com âncora `Date.now()` (TASK-017).
- `src/app/mais/page.tsx` — hub de navegação novo (trocar plano, relatórios).

**Decisões tomadas nesta sessão (não reabrir sem justificativa nova)**
- Relatório é **visual/PDF**, não JSON, pro usuário (pedido explícito) — ver nuance do coach acima.
- Relatório/calendário atravessa **todos os planos** (histórico cross-plano), não só o ativo —
  `goal`/`refersToPlanId` continuam vindo do plano ativo (é o ciclo vigente).
- `saveImportedPlan` preserva `importedAt` original em reimport do mesmo `planId` (semântica:
  "início do ciclo", não "última escrita").
- Duas dívidas técnicas aceitas conscientemente (ver seção "Dívida técnica" acima) — não são bugs
  esquecidos, são trade-offs decididos com o usuário.

**Testes executados**
`npm run typecheck && npm run lint && npm run test && npm run build` — todos verdes, 132/132
testes, revalidados na `main` pós-merge de cada task. Verificação manual no browser em cada ciclo
de review (Codex + humano), incluindo cenários de borda semeados direto no IndexedDB (múltiplos
planos, sessões cross-ciclo, medidas com lápide, período invertido, etc. — ver os arquivos
`docs/ai/tasks/TASK-01{5,6,7,8}-*.md` pro detalhe de cada verificação).

**Testes pendentes**
Nenhum teste automatizado pendente pras 4 tasks desta sessão. Dívida de longo prazo: testes de
UI/interação (RTL/jsdom nunca configurado — infra Vitest atual é node-only).

**Riscos**
- Perda de contexto entre sessões — mitigado por este arquivo + os contratos de task detalhados.
- App em produção (`activve.vercel.app`) sem estado de erro amigável — um plano corrompido vindo
  do coach quebra a experiência de verdade agora, não só em teste (motivo da TASK-013 ter subido
  de prioridade).
- Nenhum risco novo introduzido pelas mudanças desta sessão que não esteja já registrado como
  dívida técnica acima.

**Próxima ação exata**
1. **Aprovar (ou recusar) o merge** de `ai/TASK-013-erro-plano-claude` em `main` — único gate que
   falta. Enquanto não mergear, produção (`activve.vercel.app`) segue crashando com plano
   corrompido. Merge com `--no-ff` + revalidar gates na `main` + apagar a branch.
2. Só depois, escolher entre TASK-019 (PWA) e Fase 1 do PRODUCT_VISION (dieta/bem-estar).

**Comando recomendado**
```bash
git log --oneline main..ai/TASK-013-erro-plano-claude
```

**Arquivo inicial a ser lido**
- `docs/ai/STATUS.md` (este arquivo, inteiro) → depois `docs/ai/tasks/TASK-013-erro-plano.md`
  (tem o registro de execução completo e as opções do achado em aberto).
