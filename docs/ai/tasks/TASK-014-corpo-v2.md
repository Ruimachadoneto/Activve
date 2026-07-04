# TASK-014 — Corpo v2 (tendência com delta, medidas principais, histórico)

## Metadados

- Status: `in_progress`
- Risco: `médio` (reestrutura a tela Corpo; sem migration — `BodyEntry.measures` já existe)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-014-corpo-v2-claude` · Base: `origin/main` (`b767183`)

## Objetivo

Aproximar a tela Corpo do mockup base: **peso em número grande + chip de delta** ("↓ 1,8 kg últ.
30 dias") na tendência; **abas Visão geral / Medidas / Histórico**; **medidas principais**
(cintura/peito/coxa/braço) editáveis. Reusa o mapa de recuperação (TASK-009) e o `bodylog`.

## Contexto

- `BodyEntry` já tem `measures?: Record<string, number>` (cm) e o store `bodylog` já existe
  (keyPath `date`) — **sem migration/bump de DB**.
- `p.goal.targetWeight_kg`, `p.profile.weight_kg`; `p.targets?[]` traz alvos de medida (`waist` etc.).
- Arquivos: `src/lib/plan/body.ts` (+ test), `src/app/corpo/page.tsx`, `src/lib/storage/bodylog.ts`.

## Fora de escopo

- Aba **Fotos** (progresso antes/depois) — sem captura/armazenamento de imagem no v1.
- Fase 2 realista do mapa (assets) — continua backlog.

## Critérios de aceite

- [ ] `weightDelta(entries, days, now)`: último − mais antigo na janela; null se <2 na janela (testes).
- [ ] `latestMeasures(entries)`: valor mais recente por medida ao longo do tempo (testes).
- [ ] Visão geral: mapa + meta + **tendência** (número grande + chip delta 30d + gráfico) + resumo
      de medidas (read-only).
- [ ] Medidas: registrar peso + editar cintura/peito/coxa/braço (salva no `bodylog` do dia, merge).
- [ ] Histórico: lista dos registros (peso por data, mais recente no topo).
- [ ] Delta anti-culpa (só número + direção; sem juízo). Estados vazios tratados.
- [ ] Gates verdes; 375px ok; console limpo; sem regressão no mapa/peso.

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-03 · Resultado: em andamento.
