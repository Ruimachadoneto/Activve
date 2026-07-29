# TASK-020 — Fundação do sistema visual v2

## Metadados

- Status: `review` (implementada e verificada — aguardando gate humano de merge)
- Risco: `baixo` (só adições em `globals.css`; nenhuma tela alterada, nenhum comportamento mudado)
- Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-020-fundacao-visual-claude` · Base: `main`

## Objetivo

Entregar as primitivas que o `DESIGN_SYSTEM.md` v2 define e que hoje não existem, para que as
tasks 021–026 as consumam em vez de cada uma inventar a sua. **Nenhuma tela muda nesta task** —
é fundação pura, e isso é deliberado: mudança visual sem base compartilhada é como a inconsistência
nasce.

## Contexto

Diagnóstico do `BENCHMARK_VISUAL_2026-07.md`: o app tem **2 animações no total**, **nenhum** token
de movimento, **nenhuma** hierarquia de elevação (todo card é `bg-surface` + `border-line`) e
nenhuma primitiva de dataviz. É a causa estrutural da monotonia relatada pelo usuário.

## Escopo

1. **Tokens de movimento** (§6 do design system): `--ease-out-soft`, `--ease-snap`,
   `--ease-overshoot` (no namespace `--ease-*`, viram utilitários do Tailwind v4) +
   `--dur-instant/fast/base/slow` em `:root`.
2. **Keyframes base**: `rise` (entrada), `pop` (celebração), `draw-line` (dataviz).
3. **Elevação** (§5): `.elev-focus` (E3) e `.elev-float` (E4) + `--shadow-float`.
   E1/E2 continuam sendo combinação de classes existentes — **não abstrair o que já é idiomático**
   no projeto (AGENTS §10).
4. **`.stagger`**: escada de entrada com teto de 8 passos para o atraso não virar espera.
5. **`prefers-reduced-motion`**: tudo degrada para "já no lugar".

## Fora de escopo

- Qualquer alteração de tela (é 021–026).
- Gráficos (TASK-021).
- Novas cores — a paleta v2 reusa a v1; o que muda é a **regra de uso** (§2.1), não os hexes.

## Critérios de aceite

- [x] Tokens de easing e duração resolvem no browser.
- [x] `.elev-focus` e `.elev-float` aplicam.
- [x] `prefers-reduced-motion` neutraliza as animações novas.
- [x] Nenhuma tela mudou de aparência (nenhum componente consome as primitivas ainda).
- [x] `typecheck`, `lint`, `test` (161/161), `build` verdes.
- [ ] **Gate humano de merge.**

## Evidências

Verificado no browser via DOM: `--ease-out-soft` = `cubic-bezier(.22, 1, .36, 1)`,
`--ease-overshoot` = `cubic-bezier(.34, 1.56, .64, 1)`, `--dur-base` = `.24s`; um elemento sonda com
`.elev-focus .elev-float` recebeu `box-shadow` composto corretamente. Gates: typecheck ✓ · lint ✓ ·
**161/161** ✓ · build ✓ (contagem inalterada — a task não adiciona lógica testável).

## Registro de execução

- Data: 2026-07-28
- Nota: a decisão de **não** criar classes `.e1`/`.e2` (e manter `bg-surface`+`border-line` inline)
  é consciente — o projeto já usa Tailwind inline em todas as telas, e introduzir uma segunda
  convenção para o mesmo efeito criaria duas linguagens no mesmo código.
