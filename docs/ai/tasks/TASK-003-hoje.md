# TASK-003 — Tela "Hoje"

## Metadados
- Status: `in_progress`
- Risco: `baixo` (render a partir do plano ativo; sem dados destrutivos)
- Lead/Planner: `Claude`
- Implementer: `Claude`
- Reviewer: `Codex`
- Branch: `ai/TASK-003-hoje-claude` (base `origin/main`)

## Objetivo
Substituir o stub da home pela tela **Hoje** real, no estilo do `docs/DESIGN_SYSTEM.md`: lê o plano ativo do IndexedDB e mostra o **treino de hoje** (a partir do `weekSchedule`), visão da semana e navegação inferior. Sem plano → CTA de importar.

## Escopo
- `src/lib/plan/today.ts` — `getTodayWorkout(plan)` (mapeia dia da semana → treino/descanso) + saudação por horário.
- `src/components/BottomNav.tsx` — navegação inferior (Hoje ativo; demais inativos até existirem).
- `src/app/page.tsx` — tela Hoje (saudação, card do treino de hoje com foco/nº exercícios/duração/intensidade + CTA, visão da semana, atalhos).
- Teste de `getTodayWorkout`.

## Fora de escopo
- Modo treino / execução (TASK-004). Rotas Treino/Corpo/Dieta/Progresso. Tracking de conclusão (não inventar "concluído" sem dado).

## Critérios de aceite
- [x] Com plano ativo, Hoje mostra o treino do dia correto (ou descanso). ✅ Verificado no preview: hoje (quinta) = descanso conforme weekSchedule.
- [x] Sem plano, mostra CTA de importar.
- [x] Visão da semana reflete o `weekSchedule` real (sem "concluído" falso).
- [x] `typecheck`, `lint`, `build`, `test` (13/13) verdes.
- [ ] Revisão cruzada (Codex) sem P0/P1.

## Escopo entregue
- Hoje (saudação por horário, card treino-de-hoje/descanso, CTA, visão da semana) + `/treino` (chips de treinos + lista de exercícios read-only, agenda flexível) + BottomNav (Hoje/Treino ativos; demais inativos) + `lucide-react`.
- Verificado por DOM no preview (`/` e `/treino`). Modo treino com steppers/timer = TASK-004.

## Validações
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução
- 2026-06-22 — início; lucide-react adicionado (sistema de ícones). (em andamento)
