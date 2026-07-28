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

## Decisão registrada durante a implementação (2026-07-27)

Depois do 4º ciclo de review (achados P1/P2 sobre reimportação do mesmo plano), o usuário pediu
uma mudança de direção no export: **"o relatório não deve ser em json, afinal o usuário pode
acompanhar seu progresso. o ideal é uma imagem ou pdf com observações de progressão de carga,
comparativos e tudo mais, isso sim é um relatório."** — o export deixou de ser o `ReportFile` JSON
baixado como arquivo (pensado só pro coach re-ingerir) e virou um **relatório visual** (gráficos de
progressão de peso e carga por exercício, comparativos, observações do usuário) renderizado na tela
e exportável como **PDF via `window.print()`** (sem lib nova — impressão nativa do browser).
`buildReport`/`reportToMarkdown` continuam existindo e testados (o `ReportFile` ainda é a estrutura
de dados interna, e o resumo Markdown virou uma opção secundária "Texto p/ coach" pra colar no chat
do Claude Project) — só a **saída primária pro usuário** mudou de "arquivo pra baixar" pra
"relatório pra ler/imprimir".

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
- **Review Codex (ciclo 3, 2026-07-27) — 3 achados [P2] aceitos e corrigidos (3º ciclo, dentro do
  limite normal do AGENTS §13):**
  - **`reportId` podia colidir** — dependia só de `period.from/to`; exportar a mesma semana/mês
    duas vezes gerava o mesmo id, violando "id único" do `REPORT_SCHEMA.md`. → inclui
    `now.getTime()` (base36) no id.
  - **Período podia inverter (`from > to`)** — recortar só `period.from` pela data de importação
    não bastava: visualizar um mês **inteiro anterior** ao plano (ex.: navegou pro mês passado e
    clicou "Este mês") produzia um período impossível, exportando um JSON sem sentido. → guarda
    antes de construir o relatório: se `from > to` após o recorte, mostra uma mensagem explicativa
    em vez de gerar/baixar dado inválido. Verificado no browser: navegado pra junho (antes do plano
    de julho existir), "Este mês" → "Nenhum dado neste período — o plano atual só existe a partir
    de 2026-07-27." (sem download disparado).
  - **Página ficava interativa antes do IndexedDB responder** — `sessions`/`bodyEntries`/`plans`
    carregam à parte do `plan` (`useActivePlan`); clicar exportar antes de resolver geraria
    relatório vazio silenciosamente. → novo `dataLoading`, gate de "Carregando…" combinado com o
    `loading` do plano.
  - Gates: typecheck ✓ · lint ✓ · **129/129** ✓ · build ✓.

- **Review Codex (ciclo 4, 2026-07-27) — 2 achados, decisão levada ao usuário (acima do limite
  normal de 3 do AGENTS §13):**
  - **[P1] aceito e corrigido** — reimportar o MESMO `planId` (correção no ciclo, já suportado por
    `saveImportedPlan`) sobrescrevia `importedAt` com o timestamp novo; o recorte do período
    (ciclo 2) cortava sessões válidas registradas ANTES da correção. → `saveImportedPlan` agora
    **preserva o `importedAt` original** ao reimportar o mesmo planId (semântica: "início do
    ciclo", não "última escrita") — lê o registro existente antes de sobrescrever. Efeito colateral
    positivo: "importado em" em `/mais` agora também reflete quando o ciclo realmente começou.
  - **[P2] registrado como dívida técnica, não corrigido** — reimportar o mesmo planId com ids de
    treino/exercício renomeados faz `movementName`/`workoutName` caírem no id bruto pras sessões
    ANTIGAS daquele ciclo, porque `saveImportedPlan` **sobrescreve** o registro por planId — a
    revisão anterior do plano é apagada de verdade do IndexedDB, não é um problema de lookup da
    tela de relatórios. Corrigir de verdade exigiria guardar histórico de revisões do plano (nova
    store ou chave composta `planId+importedAt`) — mudança de arquitetura, não um ajuste pontual.
    **Decisão do usuário**: registrar como dívida técnica (ver `STATUS.md` §Dívida Técnica) e
    seguir; decidir depois se vale a pena resolver.
  - Gates: typecheck ✓ · lint ✓ · **129/129** ✓ · build ✓.

- **Pivô de produto (2026-07-27, pedido explícito do usuário):** o export deixou de ser
  `ReportFile` JSON baixado como arquivo e virou um **relatório visual** — gráficos de progressão
  (peso, carga por exercício), constância, medidas, observações do usuário — renderizado na tela e
  exportável como **PDF via `window.print()`** (zero dependência nova; impressão nativa do
  browser). Detalhes da decisão na seção "Decisão registrada durante a implementação" acima.
  - `report.ts`: `training.exercises[].series` (carga média por visita) e `body.weight.series`
    (peso completo no período) — alimentam os gráficos; antes só existiam agregados
    (start/latest). +2 asserções nos testes existentes.
  - `src/components/ReportLineChart.tsx` — gráfico de linha genérico (SVG puro, mesmo padrão do
    `WeightChart.tsx` já usado em Corpo — sem lib nova).
  - `src/components/ReportView.tsx` — o relatório visual completo (constância, peso, medidas,
    progressão de carga por exercício, observações). Classe `.report-print`: os tokens de cor viram
    print-safe (tinta escura em fundo branco) só dentro dela via `@media print` em `globals.css`
    (sobrescreve as CSS custom properties do tema — **todas** as classes existentes, tipo
    `text-ink`/`bg-surface`, ficam corretas pra impressão automaticamente, sem duplicar `print:` em
    cada elemento).
  - `relatorios/page.tsx`: calendário/detalhe do dia/nav ganham `print:hidden` (só o relatório
    imprime); textarea de observações (opcional) antes de gerar; botão primário "Baixar PDF"
    (`window.print()`) + secundário "Texto p/ coach" (mantém `reportToMarkdown` pra colar no chat
    do Claude Project — não removido, só deixou de ser a opção principal).
  - **Verificado no browser**: relatório gerado com 2+ pontos de dados (peso 83→82,2 kg, carga do
    agachamento 55→70 kg) — ambos os gráficos desenham corretamente, tendência "subindo"/queda
    coerente com os números. Simulação das cores de impressão (override temporário fora do
    `@media print`, sem abrir o diálogo do SO): fundo branco, texto escuro, totalmente legível —
    confirma que `.report-print` funciona antes de confiar no `window.print()` real (que abre um
    diálogo nativo do SO, fora do alcance da automação de browser). "Texto p/ coach" copia
    corretamente ("Copiado"). Console limpo em todos os passos.
  - Gates: typecheck ✓ · lint ✓ · **129/129** ✓ · build ✓.

- **Review Codex (ciclo 5, 2026-07-27) — 2 achados [P1]/[P2] aceitos e corrigidos (review do
  relatório visual recém-implementado, não uma correção-de-correção):**
  - **[P1] variação trocada misturada com o exercício original** — `training.exercises` agrupava só
    por `exerciseId` base; uma sessão com `swappedToId` (ex.: agachamento → leg press) entrava no
    MESMO grupo, misturando cargas de movimentos diferentes no mesmo gráfico/`bestSet`/`trend`.
    → agrupamento agora é por **movimento efetivo** (`exerciseId::swappedToId`), mesmo critério já
    usado em `previousPerformance` (`session.ts`) pra continuidade — cada variação vira uma entrada
    separada, com nome resolvido via `exerciseName(plan, exerciseId, swappedToId?)` (busca dentro
    de `alternatives`, mesma lógica de `movementName` já corrigida na UI do calendário). +1 teste
    dedicado.
  - **[P2] período contava dias futuros** — `exportPeriod` só recortava `period.from` (dívida da
    TASK-018 anterior); "Esta semana"/"Este mês" gerado no início do período ainda incluíam dias
    QUE NÃO CHEGARAM como "agendados e não feitos", subestimando a constância (ex.: gerar na
    segunda já mostrava "0 de 4" pra semana inteira). → `period.to` também recortado pra nunca
    passar de hoje; mensagem de período vazio diferenciada (plano não existia vs. período no
    futuro).
  - **Efeito colateral encontrado e corrigido durante a verificação** (não veio do review, achado
    verificando os 2 acima): `todayStr` ficou duplicado por um instante entre edições (erro de
    sintaxe transitório, resolvido antes do commit) e `ReportView` usava só `exerciseId` como
    `key` do `.map()` — agora que o mesmo `exerciseId` base pode aparecer em **duas** entradas
    (original + variação), a chave colidia (React warning real, não cosmético: risco de
    duplicar/sumir item na lista). → chave passou a `${exerciseId}-${name}`.
  - Verificado no browser (aba nova, sem resíduo de Fast Refresh): "Esta semana" gerado numa
    segunda-feira → período "27 de jul. — 27 de jul." (não a semana inteira); "Este mês" →
    "Agachamento" (55 kg) e "Leg press" (70 kg) como entradas **separadas** na progressão de carga;
    console limpo.
  - Gates: typecheck ✓ · lint ✓ · **130/130** ✓ · build ✓.

- **Review Codex (ciclo 6, 2026-07-27) — 1 achado [P1], corrigido com mudança estrutural (pedido
  explícito do usuário — perguntei antes de mexer, dado que exigia mudar a assinatura de
  `buildReport`):** o export continuava escopado ao plano ATIVO (herança do ciclo 2) — se o usuário
  trocasse de plano e pedisse um período **anterior** à troca, vinha vazio, mesmo o calendário
  mostrando essas sessões normalmente. Contraditório com o pivô: o relatório agora é
  "acompanhe seu progresso", não um hand-off de UM ciclo pro coach.
  - **Decisão do usuário: corrigir agora.** `buildReport` ganhou um 2º parâmetro `knownPlans:
    KnownPlan[]` (todos os planos já importados, com `importedAt`) — `planForDate`/`planForSession`
    resolvem, pra cada data/sessão, **qual plano valia naquele momento** (o mais recente com
    `importedAt <= data`), usado pra: agenda (`workoutsScheduled`), nome de exercício/variação, e
    mapeamento de músculos (`volumeByMuscle`, cache por planId). `goal`/`refersToPlanId` continuam
    vindo do plano **ativo** (`activePlan`, 1º parâmetro) — é o ciclo vigente que importa pra meta.
  - `relatorios/page.tsx`: removido o filtro por `planId` e o recorte de `period.from` em
    `exportPeriod` (não são mais necessários — `buildReport` resolve certo por conta própria);
    `knownPlans` montado a partir de `plans` (todos) + o plano ativo. Mantido: recorte de
    `period.to` em hoje (achado independente do ciclo 5).
  - +2 testes: agenda/nome resolvidos pelo plano de cada sessão numa troca no meio do período
    (com um 2º plano fixture só de teste, `pl_test2`, weekSchedule totalmente diferente).
  - Todos os testes existentes migrados pra nova assinatura (`buildReport(plan, knownPlans, ...)`).
  - **Verificado no browser** com um cenário real de troca de ciclo (2 planos distintos no
    IndexedDB, `pl_ciclo1` importado 01/06 e `pl_ciclo2` importado 20/07 como ativo; 1 sessão em
    cada ciclo, dentro do mesmo mês): "Este mês" mostrou **as duas sessões juntas** ("2 de 14
    treinos concluídos"), **peso cruzando os dois ciclos** (85→83 kg, 2 registros), e os dois
    exercícios como entradas separadas com o nome certo de cada plano ("Supino reto (ciclo 1)" e
    "Supino inclinado (ciclo 2)" — o plano ativo nem tem o exercício do ciclo 1 no catálogo, e
    mesmo assim resolveu certo). Objetivo mostrado ("Recomposição") é do plano ativo. Clique no dia
    do ciclo antigo no calendário mostra "Treino A — Ciclo 1" corretamente. Console limpo.
  - Gates: typecheck ✓ · lint ✓ · **131/131** ✓ · build ✓.
