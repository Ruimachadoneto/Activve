# TASK-018 — Calendário de treinos + export semanal/mensal

## Metadados

- Status: `in_progress`
- Risco: `médio` (feature nova, sem tocar em fluxo existente; usa `REPORT_SCHEMA.md` já
  especificado — implementação nova, contrato de dados já revisado antes)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-018-calendario-relatorio-claude` · Base: `origin/main` (`6eca414`)

## Objetivo

Pedido do usuário: "deveria existir uma opção tipo calendário onde eu clico no dia e consigo
visualizar um relatório do treino feito com os detalhes, tipo, série, peso, quantidade. Assim como
uma opção de extrair relatório semanal, mensal." Fecha também o "elo faltante" já mapeado em
`PRODUCT_VISION.md` (Fase 1: export do `ReportFile`) — a mesma peça resolve os dois.

## Contexto

- Dados já existem: `sessions` (IndexedDB) tem série/peso/reps/RPE por dia, via `getAllSessions()`
  (`src/lib/storage/sessions.ts`). **Precisa ser `getAllSessions`, não `getSessionsForPlan`** —
  achado da TASK-015: histórico filtrado pelo `planId` ativo some visualmente a cada novo ciclo do
  coach; o calendário/relatório deve atravessar planos.
- `docs/ai/REPORT_SCHEMA.md` já especifica o `ReportFile` (JSON versionado + resumo Markdown) que o
  coach (Claude Project) re-ingere — é o formato do export semanal/mensal desta task.
- Reuso: `body.ts` (`weightSeries`, `computeTrend`) pro bloco `body` do relatório;
  `recovery.ts` (`buildExerciseMuscles`) pra resolver músculos por exercício (`volumeByMuscle`).

## Escopo

- `src/lib/plan/report.ts` (puro, testado): `ReportFile` (tipo, espelha `REPORT_SCHEMA.md`),
  `buildReport(plan, sessions, bodyEntries, period, userNotes?)`, `reportToMarkdown(report)`.
  - `adherence`: `workoutsScheduled` via `weekSchedule` (semana-padrão, **sem** considerar
    overrides da TASK-016 — simplificação documentada); `workoutsCompleted`/`workoutsPartial` por
    `status`; `activeDays`/`totalDays` por data no período.
  - `training.exercises`: agrupado por `exerciseId` (só sets `done`); `bestSet`/`lastSet`/`trend`
    (heurística simples: média de carga por visita, 1ª vs última).
  - `training.volumeByMuscle`: via `buildExerciseMuscles(plan)` (primário peso 1, secundário 0.5 —
    mesma convenção do `recovery.ts`).
  - `training.flags`: **vazio no v1** (detecção de dor por texto livre = NLP, fora de escopo;
    honestidade > inventar).
  - `body`: peso + medidas dentro do período (`weightSeries`/`computeTrend` filtrados).
  - `goal`: `paceVsTarget` **sempre `"na"` no v1** (documentado — é um julgamento; sem cálculo
    ainda, evita afirmar isso errado; anti-culpa não é só sobre linguagem, é sobre não julgar sem
    embasar).
  - `diet`: `adherencePct: 0` + nota explícita ("sem rastreio de refeições no app ainda") — o app
    não rastreia dieta (Fase 1 do `PRODUCT_VISION.md`, ainda não implementada).
- **UI — página `/relatorios`** (linkada em `/mais`, novo item "Relatórios de treino"):
  - Calendário do mês (navegação mês anterior/seguinte); dias com sessão marcados; toque no dia
    mostra o detalhe: nome do treino, por exercício → séries (peso × reps, RPE), observações,
    indicação de variação trocada.
  - Export: botões "Esta semana" / "Este mês" → gera o `ReportFile`, baixa o `.json` e mostra/copia
    o resumo Markdown.

## Fora de escopo

- Editar sessões passadas pelo calendário (só visualização).
- `flags` (detecção de dor/pulado por texto), `paceVsTarget` calculado, `mealsCheckedPct` real —
  todos exigem rastreio/lógica que não existe ainda; ficam honestamente vazios/neutros no v1.
- Período customizado (só semana atual / mês atual no v1; período arbitrário é extensão natural
  futura, não pedida).

## Critérios de aceite

- [ ] `buildReport` cobre os campos do `REPORT_SCHEMA.md` (com as simplificações documentadas
      acima) e é testado (adherence, exercícios, volumeByMuscle, corpo).
- [ ] Calendário lista sessões de **todos os planos** (não só o ativo); clicar no dia mostra
      série/peso/reps/RPE.
- [ ] Export semanal/mensal baixa um `.json` válido conforme `REPORT_SCHEMA.md` e mostra um resumo
      legível.
- [ ] Gates verdes; 375px ok; console limpo; sem regressão nas telas existentes.

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-27 · Implementado:
  - `src/lib/plan/report.ts` (puro): `ReportFile` (espelha `REPORT_SCHEMA.md` 1.0), `buildReport`,
    `reportToMarkdown`. Simplificações honestas do v1 documentadas no topo do arquivo (`flags`
    vazio, `paceVsTarget` sempre `"na"`, `diet.adherencePct` sempre 0). +8 testes
    (adherence/exercícios/volumeByMuscle/corpo/honestidade/markdown) — **128 no total**.
  - `src/lib/storage/plans.ts`: `getAllPlans()` (resolve nome de exercício/treino de sessões de
    ciclos anteriores no calendário).
  - `src/app/relatorios/page.tsx`: calendário do mês (navegação, dias com sessão marcados/
    clicáveis) + detalhe do dia (treino, por exercício: série/peso/reps/RPE, observações) + export
    "Esta semana"/"Este mês" (baixa `.json` + mostra/copia resumo Markdown).
  - `src/app/mais/page.tsx`: novo item "Relatórios de treino" → `/relatorios`.
  - **Usa `getAllSessions()` (todos os planos)**, não `getSessionsForPlan` — aplica o achado da
    TASK-015 (histórico não pode sumir a cada novo ciclo do coach).
- Gates: typecheck ✓ · lint ✓ (2 ajustes: `prefer-const` no loop de datas do calendário,
  `react/no-unescaped-entities` nas aspas da observação) · **128/128** ✓ · build ✓.
- **Verificado no browser** (375px + desktop): calendário mostra só dias com sessão como
  clicáveis (confirmado via DOM: só 27/07 habilitado no mês de teste); clique no dia mostra
  treino + séries com peso/reps/RPE corretos; navegação de mês (anterior/próximo) funciona; export
  "Este mês" baixa o JSON e mostra o resumo Markdown correto (inclusive **mês vazio** — sem
  sessões — renderiza "0 concluídos de 13 agendados" sem crashar, nada inventado); "Copiar" escreve
  na área de transferência. Link "Relatórios de treino" em `/mais` navega corretamente. Console
  limpo em todos os passos.
- **Estado**: CONCLUÍDO.
- **Review Codex (ciclo 1, 2026-07-27) — 2 achados aceitos e corrigidos:**
  - **[P1] Export misturava planos** — `exportPeriod` passava TODAS as sessões do período pro
    `buildReport`, mesmo as de um `planId` **anterior** ao ativo; a agregação (weekSchedule, nomes
    de exercício, músculos, `refersToPlanId`) usava só a definição do plano ATIVO, então um período
    que atravessa uma troca de ciclo gerava um relatório incoerente pras sessões antigas. → o
    export agora filtra `sessions.filter(s => s.planId === plan.planId)` antes de chamar
    `buildReport` — o `ReportFile` é por natureza escopado a UM `refersToPlanId`
    (`REPORT_SCHEMA.md`); sessões de ciclos anteriores continuam visíveis no **calendário**
    (que não tem esse escopo), só não entram no export. Documentado no código.
  - **[P2] Nome da variação trocada não resolvia** — o detalhe do dia passava `swappedToId` direto
    pro lookup de exercícios de topo do treino; ids de variação são escopados ao exercício base
    (mesma pegadinha do `recovery.ts`), então caía no id bruto (ex.: "machine"). → novo
    `movementName(planId, exerciseId, swappedToId?)` busca dentro de `alternatives` do exercício
    base. Verificado no browser: trocado "Agachamento" → "Leg press" em `/treino`, o detalhe do dia
    em `/relatorios` agora mostra "Leg press" corretamente (antes mostraria o id bruto).
  - Gates: typecheck ✓ · lint ✓ · **128/128** ✓ · build ✓.
- **Review Codex (ciclo 2, 2026-07-27) — 2 achados aceitos e corrigidos:**
  - **[P1] Período do export não recortava pela vida do plano** — filtrar as sessões pelo `planId`
    ativo (fix do ciclo 1) não bastava: o `period` continuava indo até o início do mês/semana
    pedido, então dias **antes do plano existir** contavam como "agendados" pelo `weekSchedule` do
    plano novo, inflando a sensação de treino pulado. → `exportPeriod` recorta `period.from` pra
    nunca ser anterior a `plan.importedAt`. Verificado no browser: plano importado hoje (27/07),
    "Este mês" → período exportado vira **"2026-07-27 a 2026-07-31"** (não mais o mês inteiro),
    "3 agendados"/"5 dias" batendo com a janela real de vida do plano.
  - **[P2] Lápide de medida ignorada no relatório** — `report.ts` filtrava fora os toques com
    `null` (lápide — medida apagada, ver `body.ts`) antes de pegar `latest_cm`, então apagar uma
    medida dentro do período fazia o relatório mostrar o **valor antigo** como se ainda fosse
    atual. → `latest_cm`/`start_cm` agora consideram o toque mais recente (número OU lápide);
    lápide vira "sem valor" (`undefined`), nunca o número anterior. +1 teste.
  - Gates: typecheck ✓ · lint ✓ · **129/129** ✓ · build ✓.
