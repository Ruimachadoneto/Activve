# TASK-009 — Mapa muscular de recuperação no Corpo

## Metadados

- Status: `in_progress`
- Risco: `médio` (nova dependência de UI + nova lógica de domínio; sem dados/contratos/segurança)
- Lead/Planner: `Claude`
- Implementer: `Claude`
- Reviewer: `Codex`
- Branch/worktree: `ai/TASK-009-mapa-recuperacao-claude`
- Branch base: `origin/main` (`9a0d464`)

## Objetivo

Na tela **Corpo**, mostrar um **mapa muscular** (frente + costas) colorido por **estado de
recuperação** de cada grupo muscular, calculado a partir das sessões de treino concluídas.
Resultado observável: ao concluir séries de um treino, os músculos trabalhados aparecem
"trabalhados" (laranja) e migram para "recuperando" → "pronto" conforme o tempo passa; músculos
sem estímulo recente aparecem "descansados".

## Contexto

- Problema atual: a tela Corpo só tem peso/tendência. Falta o 3º "uau" do mockup (mapa anatômico).
- Usuário/fluxo afetado: aba Corpo; lê sessões (`getSessionsForPlan`) + músculos do plano.
- Arquivos e módulos relevantes:
  - `src/lib/plan/schema.ts` — `MUSCLES` (20), `Muscle`, `primaryMuscles`/`secondaryMuscles`.
  - `src/lib/plan/session.ts` — `WorkoutSession`/`ExerciseLog`/`SetLog` (done, rpe).
  - `src/lib/storage/sessions.ts` — `getSessionsForPlan(planId)`.
  - `src/app/corpo/page.tsx` — tela atual.
  - `src/app/globals.css` — tokens `--color-ready/recovering/worked/rested`.
- Decisões anteriores: assets open-source resolvidos (ver STATUS): `react-muscle-highlighter` (MIT).

## Restrições

- Requisitos: lógica de recuperação **pura e testável** (infra de teste é node-only); estados
  mapeados aos 4 tokens existentes; sem culpa (vocabulário neutro/positivo).
- Compatibilidade: não alterar contrato do plano nem do `WorkoutSession`. Local-first (sem rede).
- Segurança/privacidade: nenhum dado sai do dispositivo.
- Desempenho: cálculo O(sessões×exercícios), trivial; memoizar no componente.
- Dependências: permitida `react-muscle-highlighter` (MIT) — registrar em DECISIONS. Proibido
  qualquer asset/lib que exija rede em runtime ou licença restritiva.

## Fora de escopo

- Aba "Fotos" do mockup (fica para depois).
- Imagem real do exercício no Modo Treino (`free-exercise-db`) — é o passo 2 da próxima ação,
  tarefa separada se crescer.
- Mapa 3D fotorrealista do mockup (usamos o vetorial da lib por ora).

## Critérios de aceite

- [ ] Dado um conjunto de sessões concluídas, quando calculo a recuperação, então cada músculo
      recebe estado `worked|recovering|ready|rested` segundo a janela 48–72h escalada por
      volume/esforço (coberto por testes unitários).
- [ ] Músculo sem estímulo na janela de lookback → `rested`.
- [ ] Músculo primário fadiga mais que secundário; mais séries/RPE alto → janela maior.
- [ ] A tela Corpo renderiza frente+costas coloridos pelos tokens, com legenda dos 4 estados.
- [ ] Nenhuma regressão no peso/tendência da tela Corpo.
- [ ] `typecheck`, `lint`, `test`, `build` verdes.

## Plano proposto

1. **Núcleo de domínio (este passo):** `src/lib/plan/recovery.ts` puro —
   `stimuliFromSessions(sessions, getMuscles, now)` e `computeRecovery(stimuli, now)` →
   `Record<Muscle, MuscleRecovery>`. Tokens via helper. + `recovery.test.ts`.
2. **UI:** `npm i react-muscle-highlighter`; componente `RecoveryMap` mapeando `Muscle`→slug da lib,
   cor por estado; integrar na tela Corpo com legenda e abas (Visão geral / Medições).
3. **Verificar** no browser com plano+sessões semeados; **revisão Codex**; merge sob gate humano.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação | Rollback |
|---|---:|---:|---|---|
| Vocabulário `MUSCLES` não casa 1:1 com slugs da lib | M | M | Mapa explícito + fallback "agrupado"; músculos sem slug ficam fora do desenho mas contam na lógica | Remover componente, manter peso |
| Heurística "errada"/arbitrária | M | B | Parametrizada e testada; números no topo do arquivo; ajustável | Trocar constantes |
| Lib pesa no bundle / SSR | B | M | `dynamic import` client-only se preciso | Remover dep |

## Validações obrigatórias

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Evidências esperadas

- Testes: `recovery.test.ts` cobrindo os 4 estados + escala por volume/esforço + lookback.
- Manual: screenshot da tela Corpo com mapa colorido após semear sessões.

## Registro de execução

- Data: 2026-06-29
- Alterações de plano: —
- Impedimentos: —
- Resultado: passo 1 (núcleo de domínio) em andamento.
