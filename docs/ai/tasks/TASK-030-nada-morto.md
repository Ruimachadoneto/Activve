# TASK-030 — Nada morto na tela (marca, avisos, faixa da semana)

> **Status: IMPLEMENTADA, REVISADA (4 ciclos Codex) e VERIFICADA no browser — NÃO
> mergeada.** Branch `ai/TASK-030-nada-morto-claude`. Itens **5** e **6** do feedback de
> uso real + um pedido novo (calendário clicável).
>
> ⚠️ **4 ciclos de review, acima do limite de 3 do `AGENTS.md` §13** — o loop de
> auto-correção foi interrompido e a decisão passou ao usuário.

## O princípio, nas palavras do usuário

> *"a logo, nesse A da tela home, acho que poderia ser algo melhor; e o sino de
> notificação que fica ali como se fosse clicável mas é morto. Ah outra coisa, o
> calendário do treino na home deveria ser possível clicar nos dias, abrir os treinos
> feitos. **Ter algo em tela que é só visual, não clicável, dá impressão de produto não
> completo.**"*

Os três itens são o mesmo defeito: **afordância falsa é pior que ausência**.

## O que se descobriu antes de escrever código

**A logo não era fraca — ela nunca foi desenhada.** O `DESIGN_SYSTEM` §1 define a marca
como *"'A' estilizado (pico/seta) + wordmark"*. O wordmark (`acti·vv·e`) existia; o
símbolo, não. O header caiu no plano B: a letra "A" digitada dentro de um anel.

**O sino era pior que morto.** `<span>` com uma bolinha teal FIXA — não só inerte, mas
**afirmando que havia aviso novo** sem existir sistema de avisos nenhum. Isso é a §9
(honestidade) sendo violada, não acabamento.

**A faixa da semana mentia em dois pontos, além de não ser clicável:**
1. lia `weekSchedule[i]` como CALENDÁRIO (desenhava "A" na segunda, "B" na quarta) — a
   agenda que a TASK-029 aboliu. Era o **ripple nº 1 daquele contrato, que ficou para
   trás**: eu corrigi o "X de Y treinos" e esqueci a faixa;
2. `isDone || isToday` pintava HOJE com o mesmo preenchimento de um dia concluído —
   **o dia parecia treinado sem ter sido**.

## O que foi entregue

**Marca** — `src/components/LogoMark.tsx`. Direção "duplo pico" escolhida pelo usuário
entre 4 opções renderizadas. Dois picos ascendentes que são o **`vv` do wordmark
invertido**: símbolo e tipografia passam a derivar da mesma ideia. A hierarquia vem de
**altura, nunca de opacidade** — opacidade some em monocromático, impressão e favicon
(foi o que eliminou a direção "linha de progressão"). Testada nas 4 condições de quebra
(20px, 16px, mono, preto sobre branco) **antes** de escolher. Vira também `app/icon.svg`.

**Centro de avisos** — `/avisos`, com núcleo puro em `src/lib/plan/notices.ts` e estado de
lido em `src/lib/storage/notices.ts` (só os IDS, no `kv`). Cinco tipos, todos derivados do
que já foi registrado: recorde batido, próximo treino recuperado, semana fechada, peso
parado, idade do ciclo.

> **A regra que sustenta tudo:** os avisos são **recalculados do zero** a cada abertura —
> não existe tabela de avisos, só a de lidos. Por isso `id` e `at` têm de ser
> **determinísticos**. Um id derivado do relógio faria todo aviso já lido ressuscitar como
> novo, e o sino nunca apagaria.

Nada cobra: quem **nunca** registrou peso não recebe aviso ("não começou" ≠ "parado"), e
vermelho não aparece na tela (nenhum aviso deste app é falha).

**Faixa da semana** — badge mostra o treino que foi **feito** (fato); hoje-não-treinado é
contorno; dia com sessão vira link para `/relatorios?d=`, que **já resolve** a tela de
detalhe da sessão. Dia sem sessão não vira botão nenhum. Alvo de toque de **44×44** com
pílula visual de 32px (a TASK-026 já subira a grade do calendário de 36 para 44 pelo mesmo
motivo). `/relatorios` ganhou deep-link **validado como data real** — query string é
entrada não confiável, e "2026-02-31" casa com o regex sem existir.

## Review Codex — 4 ciclos, 8 achados reais, todos corrigidos

**Ciclo 1 — 2 [P2], mesma raiz:** passei **uma** lista de sessões para perguntas com
escopos diferentes. Semana, rotação e recuperação pertencem ao ciclo **vigente** (o resto
do app usa `getSessionsForPlan`); contar um ciclo anterior fazia o sino anunciar "semana
fechada" logo depois de importar um plano novo. O **recorde**, esse, atravessa plano de
propósito (ADR-002). → `activePlanId` obrigatório e o recorte acontece **dentro** de
`buildNotices`, para não haver como errar de fora.

**Ciclo 2 — 2 [P2]:**
- **Recorde comparado com o FUTURO.** `buildSessionSummary` foi escrita para a tela de
  conclusão, onde o histórico é tudo que existe no instante em que o treino acaba — nada
  do futuro — e exclui apenas a própria sessão, por `sessionId`. Reproduzi-la sobre a
  lista inteira comparava cada treino com o melhor de **todos os tempos**: numa progressão
  60 → 65 → 70, o dia de 65 deixava de ser recorde assim que o de 70 existisse. → régua de
  cada sessão passou a ser `slice(0, i)`, só o que existia antes dela.
- **Janela de relevância aplicada a nada.** `desde` era calculado e só recorde/recuperação
  o usavam. **Divergi em parte do revisor**, que sugeriu aplicar a janela a tudo: isso
  sumiria com "peso parado" e "ciclo com 8 semanas" justamente de quem está há mais tempo
  naquela situação — corrigir um ruído criando um silêncio. A janela poda **eventos**;
  **condições** persistem enquanto forem verdade (e já param de incomodar por ficarem lidas).

**Ciclo 3 — 1 [P2] + 1 [P3], mesma classe:** o disco de lidos é **global**, então id único
dentro de um plano não basta. `week_done:<segunda>` colidia entre ciclos importados na
mesma semana; `ready:<workoutId>:<hora>` colidia porque ids de treino (`A`, `B`) se
repetem entre planos. → ambos ganharam o plano no id. *Mesma lição da colisão de ids de
variação da TASK-009: id único num escopo, persistido num namespace global, deixa de ser
único.*

**Ciclo 4 (confirmação) — 2 [P2]:**
- **Fuso.** O limiar do peso usava `T12:00:00.000Z` sobre uma data **local**, deslocando o
  corte em horas. A convenção do resto do app é meio-dia local.
- **Nome do recorde resolvido no plano errado.** `movementName` resolvia sempre contra o
  plano **ativo**, mas o recorde atravessa ciclos: um `exerciseId` reaproveitado com outro
  significado fazia o aviso anunciar o **movimento errado**. → `knownPlans`, mesmo remédio
  do `planForSession` do `report.ts`.

**Padrão dos 8 achados:** três eram *a mesma função usada num contexto diferente daquele
para o qual foi escrita* (`buildSessionSummary` com futuro, `movementName` com plano
alheio, ids únicos num escopo indo para um namespace global). É a mesma família da
TASK-013 e da TASK-027.

## Erro meu no processo (registrado para não repetir)

Rodei `npx prettier --write` em dois arquivos. **Este projeto não usa prettier** — sem
config, fora das `devDependencies` — e o comando reformatou os arquivos inteiros com
defaults alheios, inflando o diff de 30 para 125 linhas. Revertido e reaplicado à mão.
*Ferramenta de formatação que não está no `package.json` não é "inofensiva": ela é
refatoração oportunista fora do escopo (AGENTS §9).*

## Gates
`typecheck` ✓ · `lint` ✓ · **318/318** testes ✓ · `build` ✓ (eram 292 antes da task).

## Verificação no browser (390×844, aba nova)
| Cenário | Resultado |
|---|---|
| Marca no header | SVG de 2 traços, `currentColor`, sem overflow ✅ |
| Sino | link real, alvo 44px, `aria-label` com a contagem ✅ |
| Bolinha | acende só com não lido; some quando tudo é lido ✅ |
| Primeira visita a `/avisos` | 6 avisos, todos com badge "novo", que **persiste** na visita ✅ |
| Ids no disco | determinísticos e com o plano dentro ✅ |
| Progressão 60→65→70 | **dois** recordes ("70 contra 65" e "65 contra 60") ✅ |
| Faixa da semana | 4 dias clicáveis com `aria` completo, 3 não clicáveis, alvo 44×44 ✅ |
| Deep-link `?d=2026-07-29` | abre julho, seleciona o dia, mostra a série ✅ |
| Deep-link `?d=2026-02-31` | ignorado, cai no mês atual ✅ |
Console limpo e `overflow 0` em todas.

⚠️ **Gate visual pendente:** o screenshot da pane segue falhando nesta máquina; a
verificação foi por DOM, que prova estrutura, contraste e alvo — **não** composição.

## Estado de partida
`main` = `aad8fef` (TASK-029 mergeada e em produção), 292 testes verdes.
