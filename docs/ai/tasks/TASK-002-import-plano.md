# TASK-002 — Import do plano (parse + validação + storage local)

## Metadados
- Status: `review`
- Risco: `médio` (keystone: todas as telas dependem do plano importado; entrada não confiável)
- Lead/Planner: `Claude`
- Implementer: `Claude`
- Reviewer: `Codex` (revisão cruzada do diff — não foi o implementador)
- Branch: `ai/TASK-002-import-plano-claude`
- Branch base: `origin/main`

## Objetivo
Primeira tela em código: importar um arquivo de plano JSON, **validar com Zod** (espelhando `docs/ai/PLAN_SCHEMA.md`), **persistir no IndexedDB** (local-first, ADR-001) e dar erro claro quando inválido/incompatível. Tela "Importar" no estilo do `docs/DESIGN_SYSTEM.md`.

## Escopo
- `src/lib/plan/schema.ts` — schema Zod + tipos (profile, goal, training c/ exercícios: músculos, howTo, ≥2 variações; diet).
- `src/lib/plan/parse.ts` — parse + validação + erros em PT (campo + motivo) + checagem de `schemaVersion` (1.x) + limite de tamanho.
- `src/lib/storage/` — IndexedDB (idb): salvar plano + marcar ativo; ler plano ativo.
- `src/app/import/page.tsx` — tela importar/colar + prévia + erros + "importar localmente" (selo privacidade).
- `src/app/page.tsx` — home: sem plano → leva ao import; com plano → resumo (prova o round-trip).
- Tokens do design system em `globals.css`.
- Teste (vitest) do validador.

## Fora de escopo
- Telas Hoje/Treino/Corpo completas; gerador; contas/sync.

## Critérios de aceite
- [x] Plano válido (exemplo do PLAN_SCHEMA) valida (teste). Persistência/render: round-trip no browser pendente de verificação manual.
- [x] Plano inválido (versão incompatível, exercício sem 2 variações, idade fora da faixa, weekSchedule órfão) → erro por campo (coberto por testes).
- [x] `npm run typecheck`, `lint`, `build`, `test` verdes.
- [x] Revisão cruzada (Codex) sem P0/P1. (2 achados P2: #2 `exercise.id` único — CORRIGIDO + teste; #1 visual obrigatório — DECLINADO com motivo, contrato clarificado.)
- [ ] Verificação manual no browser (import → persiste → home mostra resumo).

## Validações
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução
- 2026-06-22 — deps zod/idb/vitest; schema, parse, storage, telas e teste. Gates verdes (typecheck/lint/build/test 6/6). Branch `ai/TASK-002-import-plano-claude` pushed. Handoff em `docs/ai/handoffs/TASK-002-handoff.md`. Aguarda revisão Codex + verificação manual no browser.
