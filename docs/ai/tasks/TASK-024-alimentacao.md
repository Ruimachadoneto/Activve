# TASK-024 — Tela de Alimentação

## Metadados
- Status: `review` · Risco: `médio` (rota nova + escrita persistida; sem migration de banco)
- Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-024-alimentacao-claude` · Base: `main`

## Origem (correção de produto do usuário)
Na auditoria da TASK-023 eu classifiquei o card "Alimentação" como UI morta e propus **remover**.
O usuário corrigiu: *"o coach gera um plano alimentar e ele deveria ser possível ser visto aqui,
afinal o companion do usuário é o app e não faz sentido o cara ter que ficar sem como acompanhar a
parte da dieta que é um dos pilares deste tema"*.

Ele estava certo, e a verificação confirma: o `PlanFile` **já carrega** `diet.meals` (com horário,
itens, quantidade, unidade, kcal e observações), `dailyKcal`, `macros`, `shoppingList` e `prep`. O
coach já gera tudo isso. O app simplesmente nunca renderizou. Não era um card a apagar — era uma
tela faltando, e é a **Fase 1 do `PRODUCT_VISION`** que estava parada.

## O que foi feito
- **`/alimentacao`** (registro A, consistente com o Hoje): herói E3 "X de Y refeições" com barra
  segmentada, macros do plano, e a lista de refeições com horário, itens, observações e kcal.
- **Marcar refeição como feita**, persistido. `src/lib/storage/meals.ts` usa a store `kv`
  (sem migration — mesmo padrão do override de treino da TASK-016), com chave por `planId`+data.
  O toggle faz leitura+escrita **numa transação só**: dois toques rápidos em refeições diferentes
  não podem se sobrescrever (mesma classe de lost-update que a TASK-014 corrigiu nas medidas).
- **`src/lib/plan/diet.ts`** puro: `mealKcal` e `dietProgress`. +11 testes (191 no total).
- **Card da Home vira link real** e mostra progresso ("2 de 5 refeições hoje") em vez do total
  estático. Some quando o plano não tem refeições — sem card morto.

## Regras de honestidade
- **`kcal` ausente devolve `null`, nunca `0`.** Um plano sem contagem calórica é legítimo; exibir
  "0 kcal" afirmaria que a refeição não tem caloria, o que é diferente de "o plano não informa".
- Quando as refeições somam diferente da `dailyKcal` do plano, a tela mostra **os dois números**
  ("0 de 1.920 kcal · meta do plano: 2.200") em vez de escolher um e esconder a divergência.
- Marcações de ciclos anteriores são ignoradas na contagem (ids que não existem no plano ativo).
- **Anti-culpa:** sem streak, sem cobrança, sem destaque para o que não foi marcado. A microcopy é
  "Marque o que você comeu", não "você não registrou".

## Evidências (browser, 390×844)
- Plano semeado com 5 refeições reais: herói "0 de 5", macros 165/220/60 g, kcal por refeição.
- Marcar 2 refeições → herói "2 de 5 · 985 de 1.920 kcal"; **persiste após recarregar**.
- Card da Home reflete "2 de 5 refeições hoje" e é `<a>`, não `<div>`.
- Console limpo (verificado em aba nova — o dev server acumula chunks obsoletos do HMR).
- Gates: typecheck ✓ · lint ✓ · **191/191** ✓ · build ✓ (rota `/alimentacao` no output).

## Fora de escopo (decisão do usuário)
`shoppingList` e `prep` não entram nesta rodada — a Home acabou de ser enxugada e a tela nova não
deve nascer poluída. Ficam como candidatos.

## Pendente
- [ ] Gate visual do usuário + aprovação de merge.
