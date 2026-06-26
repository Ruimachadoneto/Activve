# TASK-008 — Overhaul visual (design system + branding)

## Metadados
- Status: `in_progress`
- Risco: `baixo` (UI/tokens) · Lead: `Claude` · Reviewer: `Codex`/`product-design-director` + usuário
- Branch: `ai/TASK-008-design-system-claude` · Base: `origin/main`

## Objetivo
Elevar a barra visual ao nível do mockup aprovado ("Calm Coach"), tratando visual como
**workstream de primeira classe** (política `VISUAL_QUALITY.md`). Foundation que se espalha por
todas as telas + os componentes-destaque que faltam.

## Contexto
- Mockup de alta fidelidade aprovado pelo usuário = norte (materializa o `DESIGN_BRIEF`).
- `docs/DESIGN_SYSTEM.md` já existe e está alinhado — tokens agora **vivos** em `globals.css`.
- App já está na direção certa (dark + teal), falta **acabamento** + componentes-destaque.

## Fases
1. **Foundation (esta passada):** tokens de recuperação (`ready/recovering/worked/rested`),
   `Logo` (wordmark `acti·vv·e`), polish do Hoje (barra de progresso da semana "X de Y treinos"
   usando dados reais de sessões concluídas; logo no estado vazio).
2. **Modo Treino** (maior salto): execução focada (1 exercício/vez) + **timer de descanso em anel**
   + tabela de séries + navegação anterior/próximo.
3. **Mapa muscular de recuperação** (Corpo): asset anatômico frente+costas + heat (4 estados) + legenda.
4. **Medições + fotos** (Corpo) e polish transversal (densidade, estados, responsivo).

## Critérios de aceite (fase 1)
- [x] Tokens de recuperação no `globals.css` (alinhados ao DESIGN_SYSTEM §2).
- [x] `Logo` aplicado no estado vazio do Hoje.
- [x] Barra de progresso da semana + "X de Y treinos" (dado real). _(verificado por DOM: 3 de 5, barra 60%)_
- [x] Gates verdes; sem regressão.

## Validações
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro
- 2026-06-26 — Fase 1: tokens de recuperação; `Logo`; Hoje com barra da semana + "X de Y treinos".
  Verificado por DOM (screenshot do ambiente intermitente). Gates verdes. Próximo: Modo Treino (timer em anel).
