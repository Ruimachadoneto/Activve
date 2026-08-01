# TASK-029 — Agenda por ROTAÇÃO (o treino deixa de ser preso ao dia da semana)

> **Status: IMPLEMENTADA, REVISADA (3 ciclos Codex) e VERIFICADA no browser — NÃO
> mergeada.** Branch `ai/TASK-029-agenda-rotacao-claude`. Item **7** do feedback de uso
> real (2026-07-30).
>
> **Faltam DUAS decisões humanas** (nenhuma é bug esquecido): o denominador de
> `workoutsScheduled` no relatório e o `CICLO_EM_DIAS = 2` fixo. Ver as duas seções no
> fim deste arquivo. Depois delas: gate visual + aprovação de merge.

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

## O que foi entregue

**`src/lib/plan/rotation.ts`** (puro, **24 testes** em `rotation.test.ts`):
`rotationOf`, `nextInRotation`, `consecutiveDaysUntilYesterday`, `completedThisWeek`,
`suggestWorkout` e o adaptador `resolveToday` (devolve o `TodayResult` que as telas já
consomem).

**`getTodayWorkout` foi REMOVIDA** de `today.ts`, junto com os testes dela — eles
codificavam a regra antiga. Manter as duas faria a mesma pergunta ter duas respostas.

**Telas ligadas:** `/` (Hoje) e `/treino` chamam `resolveToday`. O `TodayResult` ganhou
`doneToday` no ramo `workout` e `reason`/`nextWorkoutId`/`nextWorkoutName` no ramo `rest`.

**Cuidados de carregamento (a parte que dá bug):**
- a rotação lê só as sessões **deste plano** — um ciclo anterior contaria dias seguidos que
  não são deste programa;
- `/treino` **espera o histórico carregar** (`historyLoading`): resolver com a lista vazia
  sugeriria o primeiro treino por um render e poderia abrir rascunho de sessão no treino
  errado. É a corrida que a TASK-016 já pagou caro para aprender;
- num dia de descanso, `/treino` abre no **próximo da rotação**, não no primeiro do plano.

## Bug meu, pego inspecionando o storage (não por teste)

O efeito de ancoragem do `RestTimer` roda na montagem, então **só abrir a tela de treino já
gravava um descanso no disco** — e na montagem seguinte esse registro fantasma era revivido
e **o overlay abria sozinho**, sem o usuário ter concluído série nenhuma. Corrigido com
`if (!open) return;` no efeito. A suíte não pegaria: ela sempre inicia o descanso pelo
botão, o único caminho em que `open` já é `true`.

## Verificação no browser — feita em 31/07, que é uma SEXTA (o cenário exato do pedido)
| Cenário semeado | Resultado |
|---|---|
| A na terça, nada quarta/quinta | Hoje sugere **"Treino B"** (a regra antiga diria A) ✅ |
| A na quarta + B na quinta | **"Dia de descanso"**, com "Quero treinar mesmo assim" ✅ |
| B na quarta + A na quinta | `/treino` abre em **B**, não no primeiro do plano ✅ |
| Só montar `/treino` | não grava descanso nem abre overlay fantasma ✅ |
Console limpo em todos.

## Gates
`typecheck` ✓ · `lint` ✓ · **282/282** testes ✓ · `build` ✓ (eram 257 antes da task).

## Review Codex — 3 ciclos, 6 achados reais, todos corrigidos

**Ciclo 1 — 1 [P1] + 1 [P2].**
- **[P1] `/` resolvia a sugestão antes do histórico carregar.** Desde a rotação, lista
  vazia não é "menos informação", é **outra resposta**: `resolveToday` sugeria o primeiro
  da rotação até o fetch chegar. O `/treino` já pagava o guard `historyLoading`; o `/`
  ficou sem ele no mesmo patch. Corrigido com o mesmo estado derivado.
  ⚠️ **Recusei a consequência que o revisor descreveu**, não o achado: ele afirmou que o
  usuário podia "ser levado ao treino errado" ao tocar em *Começar treino*. Não procede —
  o CTA é `<Link href="/treino">` **sem id**, e o `/treino` resolve a própria sugestão
  depois de esperar o histórico. O dano real é a tela de DECISÃO afirmar um treino e
  trocar depois.
  ⚠️ **Não consegui reproduzir o flash**: 5 execuções com `MutationObserver` sobre
  navegação client-side, inclusive com **603 sessões semeadas** pra encarecer o
  `getAllFromIndex` — a leitura de sessões venceu a do override em todas. A ordem é
  **incidental** (microtasks + duas transações readonly em stores distintos), não
  garantida. O guard troca sorte por invariante.
- **[P2] `report.ts` → `workoutsScheduled`** — é a decisão pendente já registrada abaixo.
  **Não corrigido de propósito.**

**Ciclo 2 — 3 [P2], todos reais.**
- **Mistura de unidades na meta semanal.** `completedThisWeek` contava DIAS com treino;
  `weeklyTarget` conta TREINOS (4 num upper/lower 2×). Quem juntasse A+B na segunda e
  A+B na quarta somava 2 contra meta 4 e a semana nunca fechava — apesar dos 4 feitos.
  Juntar treinos no mesmo dia é justamente o que a rotação passou a permitir.
- **Duas leituras de "a última sessão" na mesma função.** `nextInRotation` ordenava e
  pegava a última; `suggestWorkout` usava `find`, que para na PRIMEIRA do dia. Com A e B
  no mesmo dia a função dizia "você fez A" e "o próximo é A", e o `/treino` reabria o
  treino já encerrado. → fonte única `concluidasEmOrdem`.
- **`doneToday` era escrito e nunca lido.** O próprio JSDoc do tipo prometia *"a tela
  mostra fechamento, não convite"* e o Hoje seguia com o CTA cheio "Começar treino" um
  minuto depois de o usuário terminar. → card vira fechamento (rótulo, "Treino
  concluído", o próximo da rotação como informação, botão secundário). **Não virou
  celebração**: comemorar é um MOMENTO (tela de conclusão da TASK-026), nunca um estado
  rederivado a cada reabertura (§0.2 do design system).

**Ciclo 3 — 1 [P1] levado à decisão humana + 2 [P2] corrigidos.**
- **[P2] o `override` resolvia antes da checagem de "feito hoje"** — concluir o treino
  escolhido à mão deixava o card em "Começar treino" para sempre. O override diz QUAL é o
  treino de hoje, não que ele siga pendente.
- **[P2] o contador "X de Y treinos" do Hoje** contava DIAS com check contra um
  denominador que conta TREINOS. Mesmo defeito de unidade do ciclo 2, na camada de UI —
  e o comentário do próprio arquivo já avisava que duas contas separadas para o mesmo
  conceito divergem. → numerador passou a vir de `completedThisWeek`.
- **[P1] `CICLO_EM_DIAS = 2` fixo** — levado à decisão humana (§13). Ver abaixo.

**Padrão dos 6 achados:** nenhum era erro de cálculo. Cinco eram **a mesma pergunta
respondida em dois lugares com réguas diferentes** (dias × treinos, primeira × última
sessão, tela que espera × tela que não espera, campo escrito × campo lido). A lição da
TASK-013 e da TASK-027 de novo: fechar a classe é ter **uma fonte só**, não acertar cada
ponto.

**Verificação no browser (390×844, aba nova a cada rodada):**
| Cenário semeado | Resultado |
|---|---|
| B concluído hoje | "VOCÊ TREINOU HOJE" · "Treino concluído" · "A seguir na rotação: Treino A" · botão secundário 46px ✅ |
| A+B na quarta e A+B na sexta | **"4 de 4 treinos"** + "Dia de descanso" (antes diria "2 de 4") ✅ |
| A na terça, nada quarta/quinta, sexta | "Treino B — Puxar e pernas" ✅ |
| Sessões com logs reais de série | prontidão cai a **5%**, "Corpo ainda se recuperando" ✅ |
Console limpo e `overflowPx: 0` em todas. ⚠️ O screenshot da pane segue falhando nesta
máquina; a verificação foi por DOM. **Nenhuma composição nova foi introduzida** — o
fechamento reusa tipografia, ícone e espaçamento do card que já passou pelo gate visual —
mas o gate visual de olho humano continua pendente.

## ⚠️ DECISÃO HUMANA 2 — `CICLO_EM_DIAS = 2` fixo (achado [P1] do ciclo 3)

A regra de descanso foi ditada pelo usuário para o **próprio plano** (upper/lower):
*"somente depois de 2 dias seguidos ou ciclo completo de (a-b-descanso-c-d)"*. A constante
está correta para esse plano.

O revisor apontou que ela **não generaliza**: `rotationOf` já suporta planos com 3–4
treinos distintos (tem teste), e num split A/B/C o app passaria a sugerir descanso depois
de A+B, na quarta, em vez de C — o usuário teria de dar override toda semana.

Alternativa: derivar o ciclo do próprio `weekSchedule` — a maior sequência de entradas de
treino consecutivas. Para o plano do usuário (`A,B,rest,A,B,rest,rest`) isso dá **2**, ou
seja, **o comportamento atual não muda**; para `A,B,C,rest,…` daria 3.

**Não mexi:** é regra de produto ditada à mão, e §13 manda parar no 3º ciclo.

## ⚠️ RIPPLE AINDA NÃO TRATADO — decidir antes de fechar a task

**`report.ts` → `workoutsScheduled`** continua contando dias agendados no `weekSchedule`
dentro do período. É o **denominador da constância** no relatório ("8 de 17 treinos
concluídos"). Com a agenda solta do calendário, esse denominador virou uma promessa que o
app não faz mais.

Opções: (a) derivar de `rotationOf(plan).weeklyTarget × semanas do período`; (b) trocar a
métrica por algo que não precise de denominador (ex.: "8 treinos em 4 semanas"). A §9
(honestidade) exige um denominador **verificável**, não estimado. **Não mexi** — muda um
número já exibido ao usuário e merece decisão consciente.

## Estado de partida
`main` = `7364b93` (TASK-028 mergeada e empurrada), 257 testes verdes.
