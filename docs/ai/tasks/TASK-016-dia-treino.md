# TASK-016 — Selecionar/fixar treino do dia

## Metadados

- Status: `in_progress`
- Risco: `baixo` (sem migration; usa a store `kv` já existente)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-016-dia-treino-claude` · Base: `origin/main` (`c8d46d8`)

## Objetivo

Deixar o usuário trocar qual treino é o "oficial" de hoje, quando o `weekSchedule` fixo do plano
não bate com o que ele quer/consegue fazer no dia. Hoje o seletor A/B/C/D em `/treino` só muda a
**visualização local** (`useState`); a tela Hoje continua mostrando o treino do `weekSchedule`
mesmo que o usuário tenha feito (ou pretenda fazer) outro.

## Contexto

- `getTodayWorkout(plan, now)` (`src/lib/plan/today.ts`) resolve o treino de hoje **só** pelo
  `weekSchedule[todayIndex]` — puro, testado, usado em `page.tsx` (Hoje) e `treino/page.tsx`.
- O registro de progresso (`createSession(planId, workout, date)`) **já não depende** do
  `weekSchedule** — a sessão é criada pelo treino efetivamente selecionado + data de hoje. Ou seja:
  o usuário já PODE registrar um treino diferente do agendado; só falta a tela Hoje refletir essa
  escolha (hoje ela sempre mostra o que o `weekSchedule` diz, gerando a divergência relatada).
- Contagem semanal ("X de Y treinos", `doneThisWeek`) já é por **data**, não por treino — não
  precisa mudar.
- Store `kv` (`src/lib/storage/db.ts`) já existe, sem keyPath — serve bem para um override leve
  chave→valor sem exigir migration/bump de `DB_VERSION`.

## Escopo

- `src/lib/storage/overrides.ts`: `getDayOverride(planId, date)` / `setDayOverride(planId, date,
  workoutId | "rest")` / `clearDayOverride(planId, date)`, chave `dayOverride:{planId}:{date}` na
  store `kv`.
- `src/lib/plan/today.ts`: `getTodayWorkout(plan, now, override?)` ganha 3º parâmetro opcional
  (workoutId ou `"rest"`); quando presente, tem precedência sobre o `weekSchedule` (mesmo fallback
  defensivo: id desconhecido → rest). Função continua pura; +testes do override.
- `src/app/page.tsx` (Hoje): lê o override do dia (efeito paralelo ao de `doneDates`), passa pro
  `getTodayWorkout`; quando há override ativo, mostra indicador discreto ("Você trocou o treino de
  hoje" + link "Voltar ao planejado").
- `src/app/treino/page.tsx`: ao lado do seletor A/B/C/D, ação **"Definir como treino de hoje"**
  quando o treino visualizado ≠ o oficial de hoje (grava o override); e **"Voltar ao planejado"**
  quando já há override ativo.

## Fora de escopo

- Reagendar/editar dias além de hoje (isso é navegação de calendário — território da TASK-018).
- Editar o `weekSchedule` do plano em si (o override é uma camada por cima, não muta o plano).
- Marcar "hoje é descanso" a partir de `/treino` (o fluxo existente "Quero treinar mesmo assim" já
  cobre o caso inverso; sem pedido explícito do usuário para o caso "descanso forçado").

## Critérios de aceite

- [ ] `getTodayWorkout` com override retorna o treino/estado do override, ignorando o `weekSchedule`
      quando o override existe; sem override, comportamento idêntico ao atual (testes).
- [ ] Hoje reflete o treino trocado (nome, badge, exercícios) e mostra que foi trocado.
- [ ] Em `/treino`, dá pra fixar o treino visualizado como o de hoje e reverter.
- [ ] Override é por data — não se aplica a outros dias, não sobrevive amanhã.
- [ ] Gates verdes; 375px ok; console limpo; sem regressão no fluxo de sessão/progresso existente.

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-27 · Implementado: `src/lib/storage/overrides.ts` (get/set/clear na store `kv`,
  sem migration); `getTodayWorkout(plan, now, override?)` ganhou 3º parâmetro opcional (+4 testes);
  Hoje mostra banner "Você trocou o treino de hoje" + "Voltar ao planejado" quando há override;
  `/treino` ganhou "Definir [treino] como treino de hoje" (quando o treino visualizado ≠ o oficial)
  e "Voltar ao planejado" (quando já há override ativo).
- Gates: typecheck ✓ · lint ✓ · **120/120** ✓ (+4) · build ✓.
- **Verificado no browser** (plano semeado com 2 treinos A/B): trocar pra B em `/treino` → botão
  "Definir Treino B — Puxar como treino de hoje" → clique → Hoje passa a mostrar Treino B (nome,
  foco, exercícios) + banner de aviso; "Voltar ao planejado" reverte para o Treino A original em
  ambas as telas. Sem crash, sem regressão no fluxo de sessão/progresso.
- **Achado colateral (não é bug desta task):** durante a verificação, `/treino` crashava
  ("This page couldn't load", sem log de erro do servidor) por causa de uma sessão **malformada**
  que eu mesmo tinha semeado manualmente no IndexedDB durante a verificação da TASK-015 (usei o
  formato errado — `session.sets` em vez de `session.exercises[].sets`). `previousPerformance`
  (`session.ts`) não trata sessão corrompida e quebra a página inteira sem boundary. Removida a
  sessão de teste; **registrado como achado para a TASK-013** (robustez/erro amigável, ainda
  pendente) — o app real nunca escreve sessão nesse formato errado, mas qualquer corrupção de dado
  no IndexedDB (real ou de terceiros) crasha `/treino` hoje sem tela de erro.
- **Estado**: CONCLUÍDO.
- **Review Codex (ciclo 1, 2026-07-27) — 1 achado [P2] aceito e corrigido:** `/treino` derivava
  `activeId`/`workout`/`draft session` do `weekSchedule` **antes** da leitura assíncrona do override
  resolver — numa abertura fria, o usuário podia logar série na sessão errada por um instante até a
  tela trocar. → override tratado como 3 estados (`overrideLoading`), página mostra "Carregando…"
  até resolver (mesmo padrão do `loading` do plano). Aplicado também na Hoje, por consistência
  (evita "piscar" o nome do treino errado). Gates: **120/120** ✓ · typecheck/lint ✓ · build ✓.
- **Review Codex (ciclo 2, 2026-07-27) — 1 achado [P2] aceito e corrigido:** com override ativo, ao
  pré-visualizar outro treino (ex.: override=B, clica em A pra olhar), o botão "Voltar ao planejado"
  sumia — a lógica era if/else-if, então só um dos dois controles aparecia por vez. Ficava sem
  como limpar o override sem sair da tela. Os dois controles agora são independentes: "Definir
  como treino de hoje" aparece quando o treino visualizado difere do oficial; "Voltar ao planejado"
  aparece sempre que há override ativo, não importa o que está sendo pré-visualizado. Verificado no
  browser: override=B, clique em A → ambos os botões aparecem juntos. Gates: **120/120** ✓ · build ✓.
- **Review Codex (ciclo 3, 2026-07-27) — 1 achado [P2] aceito e corrigido:** `voltarAoPlanejado`
  limpava o override no storage mas não resetava `selected` — como `activeId = selected ??
  today.workoutId`, se o usuário tinha clicado explicitamente na pill do treino trocado (setando
  `selected`), a tela ficava presa nele mesmo depois de "Voltar ao planejado" (o override sumia do
  storage, mas a UI mentia). → `voltarAoPlanejado` agora também `setSelected(null)` +
  `setCurrent(0)`. Verificado no browser reproduzindo o cenário exato do achado: override=B, clique
  na pill B (fixa `selected`), "Voltar ao planejado" → volta pro Treino A corretamente.
  ⚠️ **Limite de ciclos (AGENTS §13): 3 ciclos completos de correção nesta task.** Gates:
  **120/120** ✓ · typecheck/lint ✓ · build ✓.
