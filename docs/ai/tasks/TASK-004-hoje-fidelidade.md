# TASK-004 — Hoje com fidelidade ao mockup

## Metadados
- Status: `in_progress`
- Risco: `baixo` (UI; sem dados destrutivos)
- Lead/Implementer: `Claude` · Reviewer: `Codex` + olhos do usuário (auditoria visual)
- Branch: `ai/TASK-004-hoje-fidelidade-claude` (base `origin/main`)

## Objetivo
Reconstruir a tela Hoje para **bater a referência canônica** (`docs/ai/UI_REFERENCE.md`): header (badge A + sino), saudação, card de treino de hoje (com slot da ilustração do grupo muscular), card "ritmo da semana", cards Corpo e Alimentação, bottom nav (Hoje·Treino·Corpo·Mais).

## Entregue nesta passada
- Layout/componentes batendo a referência; tokens do design system; lucide.
- Verificado por screenshot no preview (disco liberado destravou o capturador).

## Pendências p/ ficar idêntico
- [ ] **Ilustração do grupo muscular** no card (hoje há placeholder) — depende das imagens geradas por grupo (usuário gera; encaixar via `workout.primaryMuscles`/`focus`).
- [ ] **Checks de conclusão** na semana — hoje mostra ids A/B (honesto; sem dados falsos). Vira check real quando houver **tracking de conclusão** (task futura).
- [ ] Polish: profundidade do fundo (leve gradiente), barra de progresso da semana, micro-ajustes de espaçamento — refinar com comparação ao mockup.

## Critérios de aceite
- [x] `typecheck`, `lint`, `build`, `test` verdes.
- [x] Estrutura/0layout batendo a referência (verificado no preview).
- [ ] Ilustrações de grupo muscular encaixadas.
- [ ] Aprovação visual do usuário (comparação com o mockup).
- [ ] Revisão cruzada (Codex).

## Registro
- 2026-06-25 — disco C: estava 100% cheio (causava falha de branch e do screenshot); liberados ~2,1 GB (npm-cache + .next). Reconstrução do Hoje + nav 4 itens. Gates verdes; screenshot OK.
