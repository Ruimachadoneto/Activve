# Estado atual do projeto — CHECKPOINT DE RETOMADA

> Atualizado: `2026-06-29`. Este doc + `CLAUDE.md` + `docs/ai/tasks/*` + `docs/DESIGN_SYSTEM.md`
> + git history permitem **retomar numa sessão nova sem o histórico do chat**. Leia primeiro.

## Onde estamos
- **Branch atual:** `ai/TASK-008-design-system-claude` (overhaul visual; pushed, **NÃO mergeada**).
- **`main`** está em `cd48227` com TASK-001→007 mergeadas.
- Repo: `github.com/Ruimachadoneto/Activve`. App roda em `C:\Users\Rui Neto\dev\activve` (Next 16 + TS + Tailwind v4 + IndexedDB, local-first).

## O alvo (não-negociável)
Bater o **mockup aprovado** (3 telas: Hoje, Modo Treino, Corpo) — direção **"Calm Coach"** (dark + 1 acento teal, respiro, premium). Política: `docs/ai/VISUAL_QUALITY.md`. Sistema: `docs/DESIGN_SYSTEM.md`. **Anti-culpa** sempre. O usuário exige fidelidade ao mockup — qualidade menor não é aceita.

## Feito (mergeado em main)
- **TASK-004** — Hoje com fidelidade + **mapa muscular** (10 PNGs transparentes em `public/muscles/`, `resolveMuscleImage`, `MuscleArt`). Script `scripts/dewhite-muscles.py`.
- **TASK-005** — Treino execução série-a-série + persistência (IndexedDB store `sessions`, DB v2), checks da semana no Hoje. `session.ts`/`sessions.ts`.
- **TASK-006** — "Como fazer" + troca de variações (`ExerciseSheet`, `movement.ts`). Fix P1 XSS: `videoHref` só http(s).
- **TASK-007** — Corpo/evolução: peso + tendência anti-culpa (`body.ts`, store `bodylog` DB v3, `WeightChart`).

## Em andamento — TASK-008 (overhaul visual, branch atual)
- **Fase 1 (feita):** tokens de recuperação no `globals.css` (`ready/recovering/worked/rested`); `Logo`; Hoje com barra da semana + "X de Y treinos".
- **Fase 2 (feita):** **Modo Treino** focado (`/treino` reescrito) — 1 exercício/vez, header (X de N), botão Variação (reusa `ExerciseSheet`), slot de mídia (link de vídeo externo), tabela SÉRIE·CARGA·REPS·RPE, **anel de descanso** (`RestTimer.tsx`), Concluir série, anterior/próximo. RPE no `SetLog`.
- **Fase 2.1 (feita 2026-06-29):** `RestTimer` agora é **overlay bottom-sheet** (`role=dialog`, backdrop `bg-black/70`, fecha por X/Esc/Pular/clique no backdrop). Dispara em **Concluir série E no ✓ da linha** (apenas no toggle false→true; desmarcar não dispara). `treino/page.tsx`: novo state `restOpen`, helper `toggleSetDone(i, done)`, seção inline de descanso removida — só o botão "Concluir série" permanece na coluna. Commit `5abcf98`. Gates: typecheck ✓ · lint ✓ · 47/47 testes ✓ · build ✓.
- **Fase 2.2 — revisão Codex (ciclo 1, feita 2026-06-29):** `codex review --base main` apontou 2 achados, ambos **aceitos e corrigidos**:
  - **[P1] Regressão:** a reescrita do `/treino` (TASK-008) dropou a **textarea de observações por exercício** que existia na TASK-005 (`ExerciseLog.note` ficou sem UI). → restaurada abaixo da tabela de séries (usa `patchExercise`).
  - **[P2] Integridade:** o input de RPE persistia qualquer inteiro (0, 42), mas o domínio é 6–10 (`schema.ts` `effortTarget`). → novo helper puro `clampRpe` em `session.ts` (vazio→undefined; fora da faixa grampeia 6/10) + componente `RpeInput` com buffer de texto (só persiste valor válido na digitação, clampa no blur). +4 testes unitários.
  - Gates: typecheck ✓ · lint ✓ · **51/51** testes ✓ · build ✓. Verificado em `localhost:3000/treino`: nota persiste no IndexedDB; RPE 42→10 e 0→6, nenhum valor inválido gravado; 0 erros no console.
  - **Risco residual (pré-existente, não-bloqueante):** `patchSet`/`patchExercise` derivam o `session` do snapshot do render; **edições em campos diferentes no mesmo frame** (sub-100ms) podem se sobrescrever. Não ocorre com digitação humana (há re-render entre edições). Candidato a functional updater no futuro.

## PRÓXIMA AÇÃO EXATA (sessão nova começa aqui)
1. **Mapa muscular de recuperação no Corpo (o 3º "uau"):** `npm i react-muscle-highlighter` (MIT). Frente+costas coloridos por **heurística de recuperação local** (48–72h, escalada por volume/esforço) lendo as **sessões concluídas** (`getSessionsForPlan`) + os `primaryMuscles`/`secondaryMuscles` de cada exercício. Estados: trabalhado/recuperando/pronto/descansado (tokens já existem). Mapear nosso vocabulário `MUSCLES` → slugs da lib (chest, biceps, triceps, deltoids, quadriceps, hamstring, gluteal, calves, abs, trapezius, lower-back, upper-back…). Abas do mockup: Visão geral / Medições / Fotos(fora por ora) / Desempenho.
2. **Imagem real do exercício** no slot de mídia do Modo Treino: integrar `free-exercise-db` (Unlicense) — imagens em `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<...>`; casar por nome/`primaryMuscles`. Manter o link "ver vídeo".
3. Polish transversal + auditoria visual; nova **revisão Codex** (`codex review --base main`) confirmando os fixes do ciclo 1 sem novos P0/P1; depois merge da TASK-008.

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
| TASK-008 | Overhaul visual (Modo Treino, branding) | EM ANDAMENTO | ai/TASK-008-design-system-claude |
