# TASK-010 — Modo Treino: mídia real do exercício + foco na série atual

## Metadados

- Status: `in_progress`
- Risco: `médio` (UI central do app + integração com fonte externa de mídia; sem dados/contratos/segurança sensíveis)
- Lead/Planner: `Claude`
- Implementer: `Claude`
- Reviewer: `Codex`
- Branch/worktree: `ai/TASK-010-treino-media-claude`
- Branch base: `origin/main` (`d1a0d05`)

## Objetivo

Fechar os maiores gaps do Modo Treino vs. mockups (auditoria `VISUAL_GAP_AUDIT_2026-06-30.md`):
o slot de mídia mostra **foto real do exercício**; a **série atual** vira o foco (steppers grandes);
variações aparecem **inline com thumbnails**; header ganha progresso; rodapé ganha card
PRÓXIMO EXERCÍCIO. Resultado observável: `/treino` visualmente comparável ao painel 02 dos mockups.

## Contexto

- Fonte de mídia (pesquisa 2026-07-02): **`free-exercise-db`** (github.com/yuhonas/free-exercise-db)
  — **Unlicense (domínio público)**, 873 exercícios, 2 fotos JPG/exercício (posição inicial/final),
  URL determinística `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<id>/{0,1}.jpg`.
  Rejeitados: ExerciseDB (licença da mídia duvidosa/scraping), exercises-dataset (mídia excluída
  por disputa de posse), everkinetic/opentraining (ilustrações CC-BY-SA, não fotos).
- Matching: nomes do plano são PT-BR ("Puxada frontal") e o dataset é EN ("Wide-Grip Lat Pulldown")
  → **dicionário curado PT-BR→id** (módulo puro) com nome normalizado (sem acento/caixa/pontuação).
  **Sem match confiável → placeholder atual** (não mostrar exercício errado).
- Arquivos: `src/app/treino/page.tsx`, novo `src/lib/plan/exerciseMedia.ts` (+ test),
  `src/components/RestTimer.tsx` (rótulo/tempos), `ExerciseSheet` (link mantido).
- Local-first: imagem é **melhoria progressiva** — `onError`/offline → placeholder com "Ver vídeo".

## Restrições

- Sem dependência nova (imagens por URL + `next/image` ou `<img>` com lazy).
- Não alterar contrato do plano (schema intocado nesta task; `media.imageUrl` explícito fica p/ TASK-012).
- Não regredir: persistência de sessão, RPE (fica na tabela colapsável), overlay de descanso
  (decisão aprovada — overlay permanece; só rótulo SUGESTÃO + tempos padrão do exercício).
- Fotos do dataset têm fundo claro → **tratamento dark** (moldura escura + overlay/gradiente + leve
  dessaturação) para não estourar no navy.

## Fora de escopo

- Tela "Como fazer" rica (TASK-012); Home v2 (TASK-011); Corpo v2 (TASK-014).
- Fotos premium custom (usuário/GPT) — camada futura sobre o mesmo módulo.
- Vídeo embutido (mantém link externo).

## Critérios de aceite

- [ ] `resolveExerciseMedia("Puxada frontal")` → URLs válidas do free-exercise-db; nome com
      acentos/caixa diferente resolve igual; desconhecido → `null` (testes unitários).
- [ ] `/treino` mostra a foto do exercício atual com tratamento dark; sem match → placeholder atual.
- [ ] Série atual em destaque: badge "SÉRIE X DE N", steppers grandes de carga/reps; tabela completa
      (com RPE e ✓) disponível (colapsável), sem perda de função.
- [ ] Header com progresso do treino (barra "i/N").
- [ ] Card PRÓXIMO EXERCÍCIO (nome + séries + thumb quando houver).
- [ ] Variações inline no fim da tela com thumbnails + seleção (reusa swap existente).
- [ ] CTA "Concluir série ✓". Descanso com rótulo SUGESTÃO e tempo padrão do `rest_s` do exercício.
- [ ] Gates verdes (typecheck/lint/test/build); zero erros no console; 375px sem overflow.

## Plano proposto

1. Módulo puro `exerciseMedia.ts` (dicionário ~60 exercícios BR + normalização) + testes.
2. UI `/treino`: mídia, série-foco + tabela colapsável, header, próximo, variações inline, CTA.
3. Verificação no browser (plano semeado) + screenshots; gates; review Codex; gate visual do usuário.

## Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação | Rollback |
|---|---:|---:|---|---|
| GitHub raw fora do ar/offline | M | B | onError → placeholder; lazy load | Remover img, placeholder volta |
| Match errado (foto de outro exercício) | B | M | Dicionário curado explícito; sem fuzzy agressivo; sem match → placeholder | Corrigir entrada do dicionário |
| Foto fundo claro destoa do dark | A | M | Moldura + gradiente + dessaturação; aval visual do usuário | Ajustar tratamento |
| Reestruturar série quebra persistência | B | A | `patchSet`/sessão intocados; só apresentação | Reverter UI |

## Validações obrigatórias

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Evidências esperadas

- Testes do `exerciseMedia`; screenshots 375px antes/depois; console limpo.

## Registro de execução

- Data: 2026-07-02
- Resultado: em andamento (passo 1).
