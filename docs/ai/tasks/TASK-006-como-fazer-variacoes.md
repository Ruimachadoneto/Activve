# TASK-006 — "Como fazer" + troca de variações

## Metadados
- Status: `ready`
- Risco: `baixo` (UI sobre dados já validados; só adiciona `swappedToId` à sessão)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex` + olhos do usuário
- Branch: `ai/TASK-006-como-fazer-variacoes-claude` · Base: `origin/main`

## Objetivo
No `/treino`, tocar num exercício abre um **detalhe** com o **"Como fazer"** (passos + mídia)
e as **variações**; o usuário pode **trocar** por uma alternativa (resolve máquina ocupada /
equipamento ausente), e a escolha **persiste** na sessão. Fecha o exercício como unidade
completa: executar + aprender + adaptar.

## Contexto
- Schema (`schema.ts`): `exercise.howTo = { steps[], images?, gifUrl?, videoUrl?, mediaId? }`;
  `exercise.alternatives` (≥2) = `{ id, name, equipment?, primaryMuscles?, howTo }`.
- Plano real (`examples/plano-exemplo.json`): mídia vem por **`mediaId`** (sem URL direta).
  Sem biblioteca de mídia local → **fallback "ver vídeo"** (busca YouTube pelo nome) cobre 100%.
- Execução já existe (`/treino`, TASK-005); cada exercício tem card com séries.
- FEATURE_MAP MUST: "como fazer" em TODOS os exercícios; ≥2 variações; persistir a variação escolhida.

## Modelo de dados (incremento)
`ExerciseLog.swappedToId?: string` — id da alternativa escolhida (ausente = exercício original).
Troca é **só de movimento** (nome/equipamento/como-fazer); **séries/reps/carga continuam** do
exercício original (e os logs de série já feitos são preservados).

## Restrições
- "Como fazer" disponível em **todo** exercício e em **toda** variação (passos sempre; mídia best-effort + "ver vídeo").
- Link externo (YouTube) abre em nova aba com `rel="noopener noreferrer"`.
- Acessível: detalhe é `role="dialog"` `aria-modal`, fecha no Esc e no backdrop, foco inicial no fechar.
- Local-first; sem libs novas; o mapa muscular do Hoje segue refletindo o **plano** (não a troca).

## Fora de escopo
- Biblioteca de mídia local / resolver `mediaId` para asset real (depende de assets) → depois.
- Timer de descanso → TASK-007.
- Editar/!criar variações (só escolher entre as do plano).

## Critérios de aceite
- [x] Dado um exercício, quando toco nele, então abre o detalhe com os passos do "como fazer" e um link "ver vídeo". _(verificado no preview)_
- [x] Dado o detalhe, quando escolho uma variação, então o card passa a mostrar o nome/equipamento dela, com selo "trocado", e a escolha **persiste**. _(verificado: troca p/ halteres sobreviveu ao reload)_
- [x] Dado uma troca, quando volto ao original, então o movimento volta sem perder as séries. _(mecanismo simétrico: `onSwap(undefined)`; sets preservados — `resolveMovement` testado)_
- [x] Fechar no Esc e no backdrop; nenhuma regressão na execução (séries/persistência intactas).
- [x] Testes do resolvedor de movimento passam; typecheck/lint/build/test verdes (41 testes).

## Plano proposto
1. **Modelo + resolvedor:** `swappedToId` em `ExerciseLog`; `resolveMovement(exercise, swappedToId)` puro (retorna nome/equip/howTo/músculos + `isSwapped`). Testes.
2. **Sheet de detalhe:** `ExerciseSheet` (bottom-sheet `role=dialog`): nome, "Como fazer" (passos), mídia/"ver vídeo", lista de variações com "usar esta" + "voltar ao original".
3. **Integração `/treino`:** tocar no exercício abre o sheet; troca → `patchExercise({ swappedToId })`; card mostra o movimento efetivo + selo "trocado".
4. **Validação:** gates + preview (abrir, ver passos, trocar, reload mantém, voltar ao original).

## Riscos e mitigação
| Risco | Prob | Impacto | Mitigação | Rollback |
|---|---:|---:|---|---|
| Mídia ausente (só mediaId) | A | B | Fallback "ver vídeo" por nome (100% cobertura) | — |
| Modal sem foco-trap completo | M | B | role/aria/Esc/backdrop/foco inicial; trap completo = follow-up | — |
| Troca confundir séries | B | M | Troca só muda movimento; sets/logs preservados (por design) | Remover `swappedToId` |

## Validações obrigatórias
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução
- 2026-06-26 — contrato criado; modelo (`swappedToId`) e estratégia de mídia (fallback "ver vídeo") definidos.
- 2026-06-26 — implementado: `ExerciseLog.swappedToId`; `resolveMovement`/`videoHref` (puros, 5 testes); `labels.ts` (equip compartilhado); `ExerciseSheet` (bottom-sheet `role=dialog`, Esc/backdrop, passos + ver vídeo + variações); `/treino` com título tappável (ⓘ), selo "trocado" e troca persistida. **Verificado no preview**: abrir sheet → trocar p/ halteres → card reflete + reload mantém. Gates verdes (41 testes).
- 2026-06-26 — **revisão Codex** (`codex review --base main`): 1 **P1 de segurança** (XSS) aceito — `videoUrl` vem do plano importado (schema valida só como string); um `javascript:` URL no "Ver vídeo" executaria script na origem. Fix: `videoHref` só aceita http(s), senão cai no YouTube (`isSafeHttpUrl`); teste do bloqueio. Também `type="button"` nos botões do sheet (boa prática notada). Gates verdes (42 testes).
