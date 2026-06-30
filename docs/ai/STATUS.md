# Estado atual do projeto — CHECKPOINT DE RETOMADA

> Atualizado: `2026-06-29`. Este doc + `CLAUDE.md` + `docs/ai/tasks/*` + `docs/DESIGN_SYSTEM.md`
> + git history permitem **retomar numa sessão nova sem o histórico do chat**. Leia primeiro.

## Onde estamos
- **Branch atual:** `ai/TASK-009-mapa-recuperacao-claude` (TASK-009 lógica+integração aprovada no review Codex; **polish visual APROVADO pelo usuário**; NÃO mergeada). Próximo: revisão Codex final (cobre o polish) → merge sob gate humano.
- **`main`** está em `4467540` (TASK-001→008 mergeadas; push de TASK-008 em `cd48227..9a0d464`).
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
    - Gates: typecheck ✓ · lint ✓ · **85/85** ✓ · build ✓. Re-review pendente.

### PRÓXIMA AÇÃO EXATA (sessão nova começa aqui)
1. **Revisão Codex final da TASK-009 completa** (`codex review --base main`, no Git Bash) — agora cobre também o polish: `RecoveryMap` (interação/tap, alpha, responsivo, a11y), `hoursToReady`, `slugRecoveryDetail`, `globals.css`. Loop de correção (P0–P3) se houver.
2. **Merge sob gate humano** (`--no-ff` → main, push, limpar branch) — como na TASK-008.
3. **Fase 2 futura (se decidir):** trocar o vetor pelo **corpo realista** com assets do usuário (máscaras por músculo tingíveis sobre base 3D) — `recovery.ts`/`muscleSlug.ts`/interação são reaproveitados.
4. **Tarefa futura — imagem real do exercício** no Modo Treino: `free-exercise-db` (Unlicense).

> ⚠️ **Estado do IndexedDB de dev:** o plano de exemplo tem **2 sessões concluídas** (`A` supino+desenvolvimento, `B` puxada+agachamento) → o mapa acende ~9 grupos. É dado de teste local; some ao limpar dados do site. Não é bug.

## Assets (resolvidos, open-source — sem custo)
- Mapa anatômico: **`react-muscle-highlighter`** (MIT) — frente+costas, cor/intensidade por músculo, clique. Estilo vetorial (não o 3D fotorrealista do mockup — aceitável p/ começar; decidir depois).
- Demonstração de exercício: **`free-exercise-db`** (Unlicense) — 800+ exercícios com imagens + dados.

## Como rodar / verificar
- `npm run dev` (porta 3000). Gates: `npm run typecheck && npm run lint && npm run test && npm run build` (47 testes).
- **Preview screenshot está intermitente** (trava, ainda mais com o timer rodando). Verificar por: **abrir `localhost:3000`** (olhos do usuário) + DOM via eval. Seed de teste: gravar plano + sessões direto no IndexedDB (store `plans`/`kv`/`sessions`/`bodylog`).
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
| TASK-009 | Mapa muscular de recuperação no Corpo | EM ANDAMENTO (lógica aprovada; polish visual em iteração) | ai/TASK-009-mapa-recuperacao-claude |
