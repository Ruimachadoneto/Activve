# TASK-012 — Como fazer v2 (chips de músculos, dicas técnicas, alternativas ricas, mediaId)

## Metadados

- Status: `in_progress`
- Risco: `médio-alto` (evolui o CONTRATO do plan-file — minor bump; UI da sheet)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-012-como-fazer-v2-claude` · Base: `origin/main` (`1a444c1`)

## Objetivo

Elevar a sheet "Como fazer" ao painel 03 do mockup v2: **chips de músculos** (dado já existe),
**DICAS TÉCNICAS** (checks) + **DICA RÁPIDA** (lâmpada) — novos campos opcionais no contrato —,
**alternativas com thumbnail**, e integrar o campo `mediaId` órfão como **override explícito de
mídia** do gerador.

## Mudança de contrato (PLAN_SCHEMA minor bump 1.0 → 1.1, backward-compatible)

- `howTo.tips?: string[]` — dicas técnicas (execução fina).
- `howTo.quickTip?: string` — dica rápida (1 frase).
- `howTo.mediaId` (já aceito, órfão) ganha semântica: **id exato do exercício no free-exercise-db**;
  quando presente, tem prioridade sobre o dicionário PT→id. Falha de carga → fallback normal.
- Campos opcionais ⇒ planos 1.0 continuam válidos. Gerador (artifact) deve ser atualizado junto
  (contrato bidirecional — ADR-002). Registrar em `PLAN_SCHEMA.md` + ADR-005.

## Fora de escopo

- Tela cheia "Como fazer" (continua bottom-sheet); fotos custom; badges Semelhante/Alternativa do
  mockup (exigiria classificação semântica que o schema não tem — usamos equipamento + thumb).

## Critérios de aceite

- [ ] Schema aceita `tips`/`quickTip` (testes) e planos sem eles seguem válidos (exemplo 1.0 passa).
- [ ] `resolveExerciseMedia(name, mediaId?)`: mediaId presente → URLs dele (verbatim); ausente →
      dicionário; testes.
- [ ] Sheet mostra: chips de músculos (primários + sinergistas, rótulos PT), COMO FAZER, DICAS
      TÉCNICAS (quando houver), DICA RÁPIDA (quando houver), variações com thumbnail.
- [ ] `muscleLabel` cobre os 20 músculos (teste de completude).
- [ ] Exemplo embarcado atualizado (1.1, com tips/quickTip/mediaId corrigido) e validando.
- [ ] Gates verdes; 375px ok; console limpo.

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-03 · Resultado: em andamento.
