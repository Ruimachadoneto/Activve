# TASK-011 — Hoje v2 (fidelidade aos mockups reconciliados)

## Metadados

- Status: `in_progress`
- Risco: `médio` (reestrutura a tela principal; sem dados/contratos/segurança)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-011-hoje-v2-claude` · Base: `origin/main` (`9da39dc`)

## Objetivo

Fechar os gaps da home vs. mockups (auditoria `VISUAL_GAP_AUDIT_2026-06-30.md`, tela 1):
saudação com nome em teal + tagline; chip "Plano importado"; hero com **nome do treino** +
metadados ricos; card **FOCO DO DIA**; **lista numerada de EXERCÍCIOS com thumb de foto real**;
linha de equipamentos. Resultado observável: home comparável ao painel 01 dos mockups.

## Contexto

- Arquivos: `src/app/page.tsx`, `src/lib/plan/today.ts` (+ test), reusa `ExerciseThumb` +
  `resolveExerciseMedia` (TASK-010) e `experienceLabel`/`sessionMinutes` já existentes.
- Decisões herdadas: manter hero com asset 3D (`MuscleArt`), ritmo da semana, cards Corpo/Alimentação.

## Restrições / Fora de escopo

- CTA continua no hero (mockup base); sem CTA duplicado no rodapé.
- Chip "Plano importado" é informativo (sem "Ver plano" — não existe tela de plano; sem botão morto).
- **Anel 3/4 da Dieta fica FORA** — não rastreamos refeições; progresso fake violaria a política
  visual ("conteúdo fictício como real"). Vira feature futura (meal tracking).
- Sem dependências novas; sem mudança de schema.

## Critérios de aceite

- [ ] Saudação "{Bom dia|Boa tarde|Boa noite}, {nome}." com nome em teal + "Foco agora, resultados sempre."
- [ ] Chip "Plano importado · {split} · {N}x por semana".
- [ ] Hero: título = nome do treino; ícones N exercícios · ~min (sessionMinutes ou estimativa) · experiência.
- [ ] Card FOCO DO DIA (quando o treino tem focus).
- [ ] Lista EXERCÍCIOS numerada: thumb de foto real (fallback ícone), nome, séries × reps, → /treino.
- [ ] Linha "Equipamentos: …" derivada do plano.
- [ ] `estimateWorkoutMinutes` puro + teste. Dia de descanso continua anti-culpa (inalterado).
- [ ] Gates verdes; 375px sem overflow; console limpo; sem regressão no ritmo/Corpo/Alimentação.

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-02 · Resultado: em andamento.
