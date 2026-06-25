# Handoff — TASK-002 (import do plano)

## Resumo da solução
Primeira fatia em código: importar um arquivo de plano JSON, validar com Zod (espelhando `docs/ai/PLAN_SCHEMA.md`), persistir local no IndexedDB (ADR-001) e dar erro claro por campo. Tela `/import` no estilo do `docs/DESIGN_SYSTEM.md`; home mostra o plano ativo (prova o round-trip).

## Arquivos
- `src/lib/plan/schema.ts` — schema Zod + tipos. Regras: ≥2 variações/exercício, `howTo.steps` ≥1, `primaryMuscles` ≥1, vocabulário fechado de músculos/equipamento, `weekSchedule` 7 dias referenciando treinos existentes (superRefine), ids únicos.
- `src/lib/plan/parse.ts` — `parsePlan(text)`: limite 512 KB, JSON, checagem de `schemaVersion` (só 1.x), erros `{campo, motivo}` em PT.
- `src/lib/storage/db.ts` / `plans.ts` — IndexedDB (idb): stores `plans` (keyPath planId) e `kv` (planId ativo). `saveImportedPlan`, `getActivePlan`.
- `src/app/import/page.tsx` — UI importar/colar + prévia + erros + "importar localmente" + selo de privacidade.
- `src/app/page.tsx` — home: sem plano → CTA importar; com plano → resumo.
- `src/app/globals.css` — tokens do design system (dark + teal). `layout.tsx` — metadata/lang/viewport Activve.
- `vitest.config.ts` + `src/lib/plan/schema.test.ts` — 6 testes do validador.

## Decisões / alternativas
- **zod** (validação declarativa, mensagens, tipos inferidos) e **idb** (wrapper fino sobre IndexedDB — evita boilerplate verboso e propenso a erro). **vitest** (test runner). Justificadas por necessidade real (validação de entrada não confiável + persistência local).
- Mensagens de erro em PT só nas regras críticas; mensagens default do zod (EN) nos type-mismatches — polish futuro (PT completo via errorMap).
- Import e revisão numa só tela (em vez do fluxo de 3 passos do mock) — mais simples para a primeira fatia; pode evoluir.

## Comandos e resultados
```
npm run typecheck  → OK (0)
npm run test       → 6/6 passing
npm run lint       → OK (0)
npm run build      → OK (rotas / e /import)
```

## Riscos residuais / pendências
- **Verificação no browser pendente** (import → IndexedDB → home). Storage só roda no browser; não coberto por unit test (faltaria fake-indexeddb).
- Cota/IndexedDB cheio e re-import do mesmo planId: `put` sobrescreve (idempotente) — OK, mas não testado.
- PT completo nas mensagens do zod (type-mismatch ainda em EN).
- "Sync em todos os dispositivos" NÃO existe (v1 local-first) — não prometer na UI.

## Próximos passos
1. **Revisão cruzada (Codex)** do diff `main..ai/TASK-002-import-plano-claude`.
2. Verificação manual no browser.
3. Corrigir achados P0/P1 → merge → TASK-003 (Hoje / Modo treino).

## Referência
- Branch: `ai/TASK-002-import-plano-claude` (base `origin/main`).
