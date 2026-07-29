# TASK-022 — Hoje v3 (registro A: Instrumento)

## Metadados
- Status: `review` · Risco: `médio` (tela principal; núcleo puro novo, sem mudança de dado)
- Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-022-hoje-v3-claude` · Base: `main`

## Objetivo
A tela Hoje passa a **responder antes de detalhar**: um número-herói diz como o corpo está
para o treino de hoje, acima do card do treino.

## O que foi feito
- **`todayReadiness(exercises, recovery)`** em `recovery.ts` — puro. Média ponderada
  (primário 1, secundário 0,5 — os mesmos pesos do estímulo) de `min(fraction, 1)` dos músculos
  que o treino de hoje exige. Devolve `pct` + `limiting` (os que mais seguram, do pior ao menos).
- **`readinessLabel(pct)`** — leitura qualitativa + `tone` mapeado na semântica de cor (§2.1).
- **`ReadinessHero`** — eyebrow + numeral 52px (proporcional, não `tabular-nums`, §3.2) + rótulo
  na cor semântica + barra segmentada + explicação nomeando os músculos. Contagem de entrada
  respeitando `prefers-reduced-motion`.
- É o **único E3 da tela** (§5): o card do treino segue em E1, senão dois blocos disputariam foco.

## Regras de honestidade aplicadas (§9)
- **Sem histórico → não exibe número.** Sem sessões, todo músculo é "descansado" e o cálculo daria
  100% — literalmente verdadeiro, mas seria um número de aparência científica sobre um corpo do
  qual nada foi medido. Verificado no browser: 0 heróis nesse caso.
- **Sem treino hoje → não exibe** (`todayReadiness` devolve `null` sem músculos exigidos).
- **Nunca é nota do usuário.** Teste garante que nenhum rótulo menciona o usuário ou falha.
- Saturação em 1: um músculo parado há semanas não compensa outro em recuperação.

## Decisão registrada
Usa `getSessionsForPlan` (mesma fonte da tela Corpo), **não** `getAllSessions`. As duas telas
precisam concordar sobre o estado do corpo — um número aqui e um mapa lá discordando seria pior
que a limitação já conhecida do ADR-002 (sessões de ciclos anteriores ficam de fora quando o plano
troca). Se incomodar na prática, a correção é conjunta para as duas telas.

## Evidências
- Núcleo: **9 testes novos** (181 no total) — pesos, saturação, ordem dos limitantes, `null` sem
  músculos, mapa parcial, anti-culpa nos rótulos.
- Browser (390×844), sessão de supino 20h atrás: herói lê **32%**, "Corpo ainda se recuperando",
  "Peito e tríceps ainda estão se recuperando"; `aria-label` completo; **1** elemento `.elev-focus`
  na tela; sem overflow; console limpo.
- Gates: typecheck ✓ · lint ✓ · **181/181** ✓ · build ✓.

## Pendente
- [ ] Gate visual do usuário + aprovação de merge.
