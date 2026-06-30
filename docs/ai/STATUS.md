# Estado atual do projeto — CHECKPOINT DE RETOMADA

> Atualizado: `2026-06-29`. Este doc + `CLAUDE.md` + `docs/ai/tasks/*` + `docs/DESIGN_SYSTEM.md`
> + git history permitem **retomar numa sessão nova sem o histórico do chat**. Leia primeiro.

## Onde estamos
- **Branch atual:** `ai/TASK-009-mapa-recuperacao-claude` (TASK-009 — **passos 1 e 2 feitos, NÃO mergeada**; aguardando review do passo 2).
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

### PRÓXIMA AÇÃO EXATA (sessão nova começa aqui)
1. **Revisão Codex do passo 2** (`codex review --base main`) — foco: `RecoveryMap`/`corpo page` (hooks, SSR/dynamic, regressão do peso), `muscleSlug` (mapeamento/agrupamento), `buildExerciseMuscles` (variações). Loop de correção; depois **merge sob gate humano**.
2. **Auditoria visual** do mapa (fidelidade ao mockup; tamanho/escala dos corpos; contraste no dark) — `docs/ai/VISUAL_QUALITY.md`.
3. **Tarefa futura — imagem real do exercício** no Modo Treino: `free-exercise-db` (Unlicense).

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
| TASK-009 | Mapa muscular de recuperação no Corpo | EM ANDAMENTO (UI feita, review pendente) | ai/TASK-009-mapa-recuperacao-claude |
