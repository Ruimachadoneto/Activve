# TASK-029 — Agenda por ROTAÇÃO (o treino deixa de ser preso ao dia da semana)

> **Status: ESPECIFICADA, não iniciada.** É o item **7** do feedback de uso real
> (2026-07-30) e o de maior impacto no dia a dia dos que restam.

## O problema, nas palavras do usuário

> *"o treino fica fixo nas datas pré-estabelecidas, nos dias da semana, acho que não é
> correto. O correto é ficar vinculado ao treino: fiz o treino A na terça e não pude ir na
> academia quarta e quinta; na sexta, quando eu for treinar, deve me sugerir o treino B, e
> não ficar preso na info de que segunda A, terça B. Perde toda a flexibilidade que o app
> deve dar, pois a vida é cheia de situações variáveis e o app deve estar pronto pra caso
> elas ocorram."*

## Causa no código

`src/lib/plan/today.ts` → `getTodayWorkout(plan, now, override)` resolve
`plan.training.weekSchedule[índiceDoDiaDaSemana]`. É calendário puro: o treino de sexta é
o que estiver na posição 4 do array, independentemente do que foi de fato treinado.

## O que muda

O `weekSchedule` deixa de ser um **calendário** e passa a ser lido como duas coisas:
1. a **ordem da rotação** (dedupe das entradas que são ids de treino, preservando a ordem);
2. a **meta semanal** (quantidade de entradas não-`rest`).

A sugestão passa a vir do que foi **efetivamente concluído**, não do dia da semana.

> Isto **não** exige bump do `PLAN_SCHEMA`: nenhum campo novo, só uma leitura diferente do
> mesmo campo. Merece **ADR** (semântica de contrato mudou) e uma nota no `PLAN_SCHEMA.md`.

## Regra de descanso — definida pelo usuário (2026-07-31)

> *"O treino é composto por 2 dias de treino (upper/lower), um descanso intercalando, e
> mais dois dias de upper/lower. O descanso deve ser sugerido se fiz um ciclo (upper-lower)
> ou se completei os dois ciclos da semana. Se eu não treinei hoje e amanhã treino, por
> mais que seja o treino B por exemplo, ele não deve sugerir o descanso — somente depois de
> 2 dias seguidos ou ciclo completo de (a-b-descanso-c-d)."*

**Traduzindo para regra executável:**

```
rotação      = dedupe(weekSchedule.filter(é id de treino))        // ex.: [A, B] ou [A,B,C,D]
metaSemanal  = count(weekSchedule.filter(é id de treino))         // ex.: 4  (fallback: profile.daysPerWeek)
próximo      = rotação[(índice(últimoConcluído) + 1) % rotação.length]

treinouHoje          = existe sessão CONCLUÍDA hoje
diasSeguidosAtéOntem = dias consecutivos com ≥1 sessão concluída, andando pra trás a partir de ONTEM
concluídosNaSemana   = sessões concluídas na semana corrente

se treinouHoje                          -> estado "treinou hoje" (mostra o feito + o próximo como informação)
senão se diasSeguidosAtéOntem >= 2      -> "descanso"     // ciclo upper-lower fechado
senão se concluídosNaSemana >= metaSemanal -> "descanso"  // os dois ciclos da semana
senão                                   -> "treino" = próximo
```

**Casos que a regra precisa acertar (viram teste):**

| Cenário | Esperado |
|---|---|
| A na terça, nada quarta/quinta, abre sexta | sugere **B** (não descanso) — o caso que originou o pedido |
| A segunda, B terça, abre quarta | **descanso** (ciclo fechado, 2 dias seguidos) |
| A segunda, nada terça, abre quarta | sugere **B** — 1 dia só não fecha ciclo |
| A, B, C, D na semana, abre o 5º dia | **descanso** (dois ciclos completos) |
| Concluiu A hoje de manhã, reabre à tarde | "treinou hoje", **não** empurra outro treino |
| Nunca treinou | primeiro da rotação |
| Último concluído não está mais na rotação (plano trocado) | primeiro da rotação |

**Invariantes que não podem cair:** a sugestão é **sugestão** — o override da TASK-016
(escolher outro treino para hoje) continua tendo precedência, e nada bloqueia treinar num
dia "de descanso". O app **não prescreve**; o mapa de recuperação em `/corpo` segue sendo o
sinal honesto de "hoje pede leveza".

## Ripples a tratar (a parte que dá trabalho)

1. **`src/app/page.tsx` (Hoje)** — a faixa da semana e o "X de Y treinos" hoje derivam do
   calendário. `Y` passa a ser a **meta semanal**; a faixa deve mostrar o que foi feito, não
   o que "estava marcado".
2. **`src/lib/plan/report.ts` → `workoutsScheduled`** — é o denominador da constância no
   relatório. Hoje conta dias agendados no `weekSchedule` dentro do período. Com rotação,
   o denominador honesto passa a ser derivado da meta semanal × semanas do período.
   ⚠️ **Cuidado:** mexer aqui muda número já exibido ao usuário; a §9 (honestidade) exige
   que o denominador continue sendo algo verificável, não estimado.
3. **`/treino`** — o treino padrão selecionado passa a ser o sugerido pela rotação.
4. **`getTodayWorkout`** continua existindo? Provável: renomear/substituir por
   `suggestWorkout(plan, sessions, now, override)`. Os chamadores são `/` e `/treino`.

## Estado de partida
`main` = `7364b93` (TASK-028 mergeada e empurrada), 257 testes verdes.
