# TASK-013 — Estado de erro amigável para plano corrompido

## Metadados

- Status: `in_progress`
- Risco: `médio` (várias telas, novo comportamento de leitura; sem migração de dados, sem auth)
- Lead/Planner: `Claude`
- Implementer: `Claude`
- Reviewer: `Codex` (independente — AGENTS §12)
- Branch/worktree: `ai/TASK-013-erro-plano-claude`
- Branch base: `origin/main`

## Objetivo

Um plano inválido/corrompido no IndexedDB deve produzir um **estado de erro amigável com caminho de
saída** ("reimportar plano"), nunca uma tela de crash. Resultado observável: com um plano quebrado
gravado no IndexedDB, `/`, `/treino`, `/corpo`, `/relatorios` e `/mais` renderizam a mensagem de
recuperação e o botão de reimportar; o console não acusa runtime error não tratado.

## Contexto

- **Problema atual (verificado no código, 2026-07-28):**
  - `useActivePlan` (`src/lib/storage/useActivePlan.ts:14`) devolve o `StoredPlan` **cru** do
    IndexedDB. Não há revalidação — `parsePlan` só é usado em `src/app/import/page.tsx:20`.
  - Não existe **nenhum** error boundary: `find src/app -name "error.tsx" -o -name "global-error.tsx"`
    não retorna nada.
  - Consequência: campos ausentes derrubam o render. Pontos de crash confirmados só no Hoje:
    `p.training.weekSchedule.filter` (`page.tsx:115`), `p.diet.meals.length` (`:116`),
    `getTodayWorkout` → `plan.training.weekSchedule[i]` (`today.ts:27`),
    `ex.howTo.mediaId` (`page.tsx:252`), `experienceLabel(p.profile.experience)` (`:212`).
- **Usuário/fluxo afetado:** qualquer um com plano gravado. **App está em produção**
  (`activve.vercel.app`) — um plano malformado vindo do coach quebra o app de verdade.
- **Como um plano inválido chega ao IndexedDB, se o import valida?** O import valida, mas o registro
  pode degradar depois: escrita interrompida/quota estourada, plano semeado à mão (fluxo usado nas
  próprias verificações deste projeto), DevTools, bug futuro de migração de store, ou um plano salvo
  por uma versão do app com schema mais permissivo. Validar na **leitura** é a fronteira certa
  (AGENTS §10: "valide entradas nas fronteiras").
- **Decisões anteriores relacionadas:** `VISUAL_QUALITY.md` §8 (estados completos: loading/empty/
  error/success); tom **anti-culpa** do produto; ADR-002 (continuidade por `exercise.id`).

## Restrições

- **Uma única fonte de verdade de validação.** O estado de erro precisa usar exatamente as mesmas
  regras do import — nada de um segundo validador que possa divergir. Extrair de `parsePlan` a
  parte que valida objeto já parseado e reusar nos dois caminhos.
- **Compatibilidade:** planos válidos já gravados devem continuar carregando sem diferença
  perceptível. A validação roda no cliente a cada leitura do plano ativo (custo de um `safeParse`).
- **Segurança/privacidade:** a mensagem técnica de erro é derivada de entrada não confiável — exibir
  como **texto** (nunca HTML), truncada, e sem vazar o conteúdo do plano.
- **Sem dependência nova.** Zod e o schema já existem.
- **Falha segura:** se uma tela esquecer de tratar o estado novo, ela deve cair no estado "sem
  plano" (empty state que já existe), nunca voltar a crashar.

## Fora de escopo

- Reparar/migrar automaticamente um plano inválido (só oferecemos reimportar).
- Mudar o `PLAN_SCHEMA` ou afrouxar validação para "aceitar mais".
- Validar planos **não ativos** de forma exaustiva no `/relatorios` além de não quebrar a tela.
- PWA/Service Worker (TASK-019), dieta/bem-estar (Fase 1 do PRODUCT_VISION).

## Critérios de aceite

- [ ] Dado um plano **sem `training`** no IndexedDB, quando abro `/`, então vejo o estado de erro
      amigável com botão "Reimportar plano" — e **não** a tela de crash.
- [ ] Idem para plano **sem `diet.meals`**, **sem `howTo`** num exercício e com `weekSchedule` de
      tamanho errado (os casos citados na auditoria).
- [ ] Idem em `/treino`, `/corpo`, `/relatorios` e `/mais`.
- [ ] Dado um plano **válido**, todas as telas funcionam exatamente como antes (sem regressão).
- [ ] O estado de erro oferece **detalhe técnico** (campo + motivo) sob demanda, em texto escapado.
- [ ] Um erro de render por causa **não** prevista (bug de componente) é capturado por um
      `error.tsx` e vira tela de recuperação, não tela branca/vermelha.
- [ ] Testes cobrem: validação de plano inválido na leitura, plano válido intacto, e o formato dos
      erros expostos.
- [ ] `typecheck`, `lint`, `test`, `build` verdes.

## Plano proposto

1. `src/lib/plan/parse.ts`: extrair `validatePlan(json: unknown): ParseResult` (versão + schema);
   `parsePlan(text)` passa a ser tamanho + `JSON.parse` + `validatePlan`. Comportamento idêntico.
2. `src/lib/storage/useActivePlan.ts`: validar o registro lido. API vira
   `{ loading, plan, invalid }` — **aditiva**: `plan` continua `null` quando inválido, então tela
   não atualizada cai no empty state (falha segura), não em crash.
3. `src/components/PlanErrorState.tsx`: estado de erro compartilhado (tom anti-culpa, CTA
   "Reimportar plano" → `/import`, `<details>` com os erros em texto).
4. Ligar `invalid` nas 5 telas que leem plano (`/`, `/treino`, `/corpo`, `/mais`, `/relatorios`).
5. `/relatorios`: descartar planos **históricos** inválidos vindos de `getAllPlans()` para não
   quebrar a resolução de nomes cross-plano (TASK-018).
6. `src/app/error.tsx` + `src/app/global-error.tsx`: backstop para erros de render não previstos
   (Next 16: prop `unstable_retry`, ver "Riscos").
7. Testes em `parse.test.ts`/novo arquivo cobrindo `validatePlan` com os planos quebrados da
   auditoria.
8. Gates + verificação no browser semeando cada plano quebrado no IndexedDB.

## Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação | Rollback |
|---|---:|---:|---|---|
| Validação nova rejeita plano legítimo já gravado (falso positivo) → usuário perde acesso ao app | B | A | Mesmas regras do import (que gerou o registro); testar com `examples/plano-exemplo.json` e com o plano real do usuário antes do merge | Reverter commit; `plan` volta a não ser validado |
| `unstable_retry` é API instável do Next 16.2 | M | B | Aceitar `unstable_retry` **e** `reset` (ambos passados pelo Next), preferindo o primeiro; sem quebrar se um sumir | Usar só `reset` |
| Custo de `safeParse` a cada leitura do plano | B | B | Plano é ≤512 KB e a leitura é 1x por página; medir se aparecer lentidão | — |
| Escopo acidental nas 5 telas | M | M | Diff mínimo por tela: só o early-return novo | Revisão do diff |

## Validações obrigatórias

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Verificação manual: semear plano quebrado no IndexedDB (store `plans` + `kv.activePlanId`) e abrir
cada rota; conferir console limpo de erro não tratado; 375px sem overflow.

## Evidências esperadas

- Testes: novos casos de `validatePlan` (plano sem training/diet/howTo/weekSchedule curto) + plano
  de exemplo continua válido.
- Fluxos manuais: as 5 rotas com plano quebrado e com plano válido, em 375px.
- Console: sem runtime error não tratado.

## Registro de execução

- Data: 2026-07-28
- Alterações de plano: [preencher ao final]
- Impedimentos: [preencher ao final]
- Resultado: [preencher ao final]
