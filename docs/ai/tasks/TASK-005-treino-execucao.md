# TASK-005 — Treino: execução série-a-série + persistência

## Metadados
- Status: `ready`
- Risco: `médio` (novo store IndexedDB + migração v1→v2; persistência de dados do usuário)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex` + olhos do usuário
- Branch: `ai/TASK-005-treino-execucao-claude` · Base: `origin/main`

## Objetivo
Transformar o `/treino` (hoje só lista os exercícios) num **fluxo de execução**: o usuário
registra **série a série** com steppers (sem teclado), marca série/exercício, **conclui o treino**,
e tudo **persiste no IndexedDB** — fechar/reabrir o app **retoma de onde parou** sem perder nada.

## Contexto
- Problema atual: `src/app/treino/page.tsx` é read-only (lista exercícios, sem registrar nada).
- Fluxo afetado: execução do treino do dia (coração do app).
- Módulos relevantes: `src/lib/storage/db.ts` (idb v1, stores `plans`/`kv`), `src/lib/storage/plans.ts`
  (padrão de API), `src/lib/plan/schema.ts` (exercício tem `sets`, `reps`, `load_kg?`, `rest_s`,
  `effortTarget?`, `primaryMuscles`), `src/lib/plan/today.ts`.
- Decisões (FEATURE_MAP): execução **série-a-série com steppers (sem teclado)**, **marcar
  série/exercício/treino**, **retomar no meio**, **nunca perder série**, **histórico por período**
  (logs casados por `exercise.id`, nunca apagados ao subir plano novo), **princípio anti-culpa**.

## Modelo de dados (novo)
Novo store `sessions` (keyPath `sessionId`), DB **v1 → v2** (migração aditiva, não toca `plans`/`kv`):
```
WorkoutSession {
  sessionId: string         // `${planId}:${workoutId}:${date}`
  planId: string            // período (continuidade)
  workoutId: string         // ex.: "A"
  date: string              // yyyy-mm-dd (dia executado; agenda é flexível)
  status: "in_progress" | "done"
  startedAt: string; completedAt?: string
  exercises: { exerciseId: string; sets: SetLog[] }[]
}
SetLog { done: boolean; reps?: number; load_kg?: number }   // alvo vem do plano; aqui grava o real
```
Índices: por `date` e por `planId` (consulta de conclusão p/ os checks da semana no Hoje).

## Restrições
- Entrada rápida por **steppers** (+/–, carga passo 2,5 kg) **e** por **teclado numérico** (`inputMode`); **observações** por exercício (texto livre). _(Atualiza a decisão original "sem teclado": o usuário pediu digitar direto e anotar substituições de exercício.)_
- Persistir **a cada mudança** (não perder série se o navegador fechar).
- Migração IndexedDB **não pode** corromper planos existentes.
- Anti-culpa: sem "você falhou", sem streak punitivo. Conclusão é celebratória e neutra.
- Local-first: nada vai a servidor. Sem libs novas além do que já existe (`idb`, `zod`).

## Fora de escopo (tasks seguintes)
- **"Como fazer"** (passos + mídia) e tela de detalhe do exercício → TASK-006.
- **Troca de variação** (≥2 alternativas) → TASK-006.
- **Timer de descanso** (tem fragilidade iOS/background — prototipar isolado) → TASK-007.
- Sugestão de progressão de carga / referência da última sessão → SHOULD, depois.

## Critérios de aceite
- [x] Dado um treino do dia, quando marco uma série como feita e ajusto reps/carga nos steppers, então o estado persiste e sobrevive a um reload. _(verificado no preview: marca + 40→42,5kg + reload)_
- [x] Dado um treino em andamento, quando reabro o `/treino`, então ele **retoma** as séries já marcadas.
- [x] Dado as séries feitas, quando concluo o treino, então a sessão vira `done` (`completedAt`) com feedback positivo (anti-culpa: conclui em qualquer momento).
- [x] Subir um plano novo **não apaga** sessões/logs anteriores. _(por design: sessões por `planId`; store separado)_
- [x] Nenhuma regressão no Hoje/import; migração v2 abre bases v1 sem perda. _(verificado: base v1 → v2, plano intacto)_
- [x] Testes da camada de sessão passam; typecheck/lint/build/test verdes (34 testes).

## Plano proposto
1. **Tipos + storage:** `session.ts` (tipos + helpers puros: cria sessão a partir do workout, atualiza set), `sessions.ts` (store, migração v2, `getOrCreateTodaySession`, `saveSession`, `getSessionForDay`). Testes puros.
2. **UI de execução:** no `/treino`, cada exercício vira card com linhas de série (alvo + steppers reps/carga + toggle "feita"); barra de progresso; botão **Concluir treino**. Hook que carrega/salva a sessão.
3. **Retomar:** hidratar do store ao abrir; refletir séries já feitas.
4. **(Stretch) Hoje:** checks reais da semana lendo `sessions` (fecha o pendente da TASK-004).
5. **Validação:** gates + preview (marcar série → reload → retoma → concluir).

## Riscos e mitigação
| Risco | Prob | Impacto | Mitigação | Rollback |
|---|---:|---:|---|---|
| Migração IndexedDB corromper dados | B | A | Migração aditiva (só `createObjectStore`), testar abrir base v1 | Reverter DB_VERSION; store novo é isolado |
| Perda de série (escrita não persistida) | M | A | Persistir a cada toggle/stepper; sessão é a fonte | — |
| Escopo inchar (timer/variações) | M | M | Fora de escopo explícito; tasks 006/007 | — |

## Validações obrigatórias
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução
- 2026-06-26 — contrato criado; modelo de sessão definido (store `sessions`, DB v2).
- 2026-06-26 — Fase 1 (fundação): `session.ts` + `sessions.ts` + migração v1→v2; 6 testes; migração verificada não-destrutiva.
- 2026-06-26 — Fase 2 (UI): `/treino` reescrito como execução série-a-série (steppers reps/carga sem teclado, toggle de série, barra de progresso, concluir treino). Sessão lazy (rascunho em memória, só persiste ao interagir; retoma do IndexedDB). Reps/carga pré-preenchidos do plano. **Verificado no preview**: marcar → steppers → reload retoma → concluir. Gates verdes (34 testes). Fora: como-fazer/variações (TASK-006), timer (TASK-007).
- 2026-06-26 — Stretch (fecha pendente da TASK-004): checks reais da semana no Hoje — `weekDates()` + lê `getSessionsForPlan`, dias com sessão `done` mostram ✓. **Verificado por DOM** (sexta concluída = check aceso; screenshot do ambiente estava flaky). Ajuste: `loading="eager"` na MuscleArt (LCP, sem voltar `priority`). Gates verdes (36 testes).
- 2026-06-26 — Pedido do usuário: além dos steppers, **entrada por teclado numérico** (reps/carga viram inputs `inputMode` numeric/decimal, editáveis; `NumberStepper` mantém o valor enquanto digita e normaliza no blur) + **campo de observações por exercício** (`ExerciseLog.note`; ex.: registrar troca de exercício). **Verificado no preview**: digitar reps=12 e a nota persistem no IndexedDB. Gates verdes.
- 2026-06-26 — **revisão Codex** (`codex review --base main`): 2 P2, ambos aceitos. (1) Carga decimal colapsava `"42."` durante a digitação → o sync do `NumberStepper` agora só roda quando o input **não** está focado (foco via state, não ref — `react-hooks/refs`). (2) Treino com `exercises: []` virava tela vazia concluível → restaurado o estado "sem exercícios" (sem progresso/sem concluir). Verificado no preview (treino vazio); gates verdes (36 testes).
