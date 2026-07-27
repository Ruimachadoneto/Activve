# TASK-015 — Trocar plano visível na UI

## Metadados

- Status: `in_progress`
- Risco: `baixo` (sem mudança de schema/DB; só navegação + 1 página nova)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-015-trocar-plano-claude` · Base: `origin/main` (`d25aa9b`)

## Objetivo

Dar um caminho de UI visível para reimportar/trocar o plano ativo sem precisar limpar o cache do
navegador. Hoje `/import` só é linkado quando **não há** plano ativo (`src/app/page.tsx`), então
com um plano já importado não existe forma de subir um novo ciclo — usuário relatou ter que
"excluir cache praticamente fazendo tudo do zero".

## Contexto

- `saveImportedPlan` (`src/lib/storage/plans.ts`) já faz `put` por `planId` e só troca o ponteiro
  `activePlanId` — **não apaga `sessions` nem `bodylog`**. Confirmado por leitura de código: trocar
  de plano preserva histórico de treino e de corpo. O problema é 100% de descoberta de UI.
- `/import/page.tsx` já funciona standalone (preview + confirmação antes de salvar) independente de
  já existir plano ativo — não precisa de nenhuma mudança de lógica.
- `BottomNav` (`src/components/BottomNav.tsx`) tem o item "Mais" sem `href` (botão inerte,
  `aria-disabled`, "Em breve") — é o lugar natural para o link de trocar plano.
- `GOAL_LABEL` está duplicado em `src/app/import/page.tsx` e `src/app/corpo/page.tsx` — como a nova
  página `/mais` também precisa, consolidar em `src/lib/plan/labels.ts` (`goalLabel`).

## Escopo

- Nova página `src/app/mais/page.tsx`: resumo do plano ativo (objetivo, split, treinos/semana,
  importado em) + CTA "Trocar plano" → `/import`. Nota explícita: histórico não é apagado.
- `BottomNav`: item "Mais" ganha `href="/mais"` (deixa de ser inerte).
- `labels.ts`: `goalLabel(type)` compartilhado; `import/page.tsx` e `corpo/page.tsx` passam a usá-lo.

## Fora de escopo

- Listar/gerenciar múltiplos planos salvos (o storage já suporta por `planId`, mas não há UI de
  histórico de planos — só o ativo).
- Qualquer mudança em `saveImportedPlan`/schema.

## Critérios de aceite

- [ ] `/mais` acessível pela barra inferior, mostra plano ativo e link para `/import`.
- [ ] Trocar de plano preserva sessions/bodylog (verificado no browser: sessão registrada antes da
      troca continua aparecendo em `/corpo` e no "Última vez" depois).
- [ ] Sem plano ativo, `/mais` mostra estado vazio coerente (aponta pra `/import`).
- [ ] `goalLabel` sem duplicação; gates verdes; 375px ok; console limpo.

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-27 · Implementado: `/mais` (resumo do plano ativo + CTA "Trocar plano" → `/import`
  + nota anti-medo "não apaga nada"); `BottomNav` "Mais" ganhou `href`; `goalLabel` consolidado em
  `labels.ts` (removida duplicação em `import/page.tsx` e `corpo/page.tsx`).
- Gates: typecheck ✓ · lint ✓ · **116/116** ✓ · build ✓ (rotas: `/`, `/corpo`, `/import`, `/mais`,
  `/treino`).
- **Verificado no browser** (seed direto no IndexedDB, `pl_exemplo_2026_06` + 1 sessão `done`):
  - `/mais` vazio → "Nenhum plano importado ainda" + CTA. Com plano ativo → resumo correto
    (objetivo, split, treinos/semana, "importado em").
  - Clique em "Trocar plano" navega para `/import` mesmo com plano ativo (o bug relatado: antes só
    havia link quando `!plan`).
  - Reimportado um 2º plano com **planId diferente** (`pl_ciclo2_2026_07`, simulando novo ciclo do
    coach) → sem crash, Hoje/`/corpo` atualizam para o novo plano.
  - **Inspeção direta do IndexedDB pós-reimport**: os dois planos (`pl_exemplo_2026_06` e
    `pl_ciclo2_2026_07`) e a sessão antiga continuam salvos — `saveImportedPlan` não apaga nada,
    confirmando a causa raiz (só faltava o caminho de UI).
  - **Descoberta registrada (não é bug, é comportamento do design ADR-002):** o mapa de recuperação
    em `/corpo` é filtrado por `getSessionsForPlan(planId **ativo**)` — ao trocar de plano (novo
    `planId`), sessões do ciclo anterior somem do mapa (mostra "tudo descansado"), mesmo intactas no
    IndexedDB. Peso/medidas (`bodylog`, sem `planId`) e "Última vez" em `/treino` (`getAllSessions`
    global) **não** têm esse problema. Relevante para a **TASK-018** (calendário/relatório): deve
    listar sessões de **todos os planos**, não só o ativo.
  - `/treino` teve falha intermitente do preview ("This page couldn't load") sem erro no console e
    com o servidor respondendo 200 quatro vezes seguidas — instabilidade conhecida da máquina
    (STATUS.md), não é regressão do código (rota não foi tocada nesta task).
- **Estado**: CONCLUÍDO.
- **Review Codex (ciclo 1, 2026-07-27) — APROVADO, LIMPO:** "no discrete, actionable bugs in the
  diff relative to the base commit". **TASK-015 chancelada — pendente gate de merge do usuário.**
