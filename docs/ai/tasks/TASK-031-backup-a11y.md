# TASK-031 — Backup completo + foco visível (Faixa 1 da auditoria)

> **Status: IMPLEMENTADA, REVISADA (3 ciclos Codex) e VERIFICADA no browser — NÃO
> mergeada.** Branch `ai/TASK-031-backup-a11y-claude`. Vem da `AUDITORIA_2026-08.md`.

## Por que estes dois juntos

São os dois itens de **Faixa 1** mais baratos e mais urgentes. O terceiro (onboarding que
gera plano no app) é maior e vai em task própria, para não misturar risco de dados com
mudança de produto no mesmo review.

## Achado nº2 da auditoria — não existia backup (CRÍTICO)

Nenhum caminho de UI tirava o histórico do aparelho. O `AGENTS.md` §2 afirmava *"backup via
export/import JSON"* — verdade só para o **plano**. Sessões, cargas, RPE, peso e medidas não
saíam por via nenhuma, então trocar de celular, limpar dados do site ou um navegador
reciclando storage apagava meses **sem aviso e sem recuperação**.

**Entregue:** `lib/plan/backup.ts` (puro) + `lib/storage/backup.ts` (IO) + `BackupCard` em
`/mais`. O `AGENTS.md` §2 foi corrigido — agora a afirmação é verdadeira.

### As duas decisões que governam o formato

1. **Restaurar NUNCA apaga.** É união, não substituição. Um app sem desfazer não pode ter
   uma operação que destrói meses de dado por um toque errado, e o cenário real (aparelho
   novo, app vazio) funciona igual nos dois modelos. Em conflito de chave o backup vence,
   porque foi ele que o usuário mandou restaurar. A tela **diz isso antes** de agir.
2. **O arquivo é entrada não confiável.** Leitura total; registro ilegível é descartado *e
   contado*, e a UI mostra quantos. Escolher o arquivo do **plano** por engano — o erro mais
   provável — é reconhecido e explicado, em vez de "formato inválido".

### O texto assume o custo do local-first

> *"Nada do Activve sai do seu aparelho — e por isso ninguém guarda uma cópia por você."*

Vender o benefício escondendo a contrapartida seria a mesma desonestidade que a §9 barra nos
números.

## Achado de acessibilidade — nenhuma regra de foco

O projeto não tinha **nenhuma** regra de foco em ~10.400 linhas: a navegação por teclado
dependia do anel padrão do navegador, quase invisível sobre tema escuro (WCAG 2.2 §2.4.11,
nível AA).

**Anel duplo**, e a medição provou que era necessário: no botão de acento o anel teal
sozinho mede **1,00:1** contra o próprio botão — o foco seria invisível justamente no CTA
principal. O anel interno (cor do fundo) resolve com **9,87:1**.

## Correção da própria auditoria

O achado "3 `<img>` sem `alt`" era **falso positivo da minha medição** — o grep olhava só a
mesma linha, e no JSX multi-linha o atributo está abaixo. Verificados um a um: os três estão
corretos. Corrigido no documento da auditoria.

## Review Codex — 3 ciclos, 4 achados reais

**Ciclo 1 — [P1] + [P2].**
- **[P1] Sessão sem `exercises` derrubaria a tela de treino.** Eu apliquei a sessões a
  postura da TASK-013 (*"só a chave importa, o leitor se defende"*), que foi criada para
  **planos**. A diferença é a **fronteira de confiança**: os leitores de plano FORAM
  endurecidos naquela task; os de sessão nunca precisaram, porque até aqui sessão só nascia
  dentro do app. O backup é o primeiro caminho em que ela entra vinda de fora — a fronteira
  se moveu e eu levei junto uma regra do contexto errado. → validação na PORTA, que fecha a
  classe num ponto em vez de endurecer cada leitor e esquecer um.
- **[P2] A tela não refletia a restauração.** `useActivePlan` lê uma vez na montagem, então
  restaurar num aparelho novo deixava o `/mais` dizendo "Nenhum plano importado ainda" com o
  plano já no disco. Como a restauração reescreve o banco inteiro por baixo de telas já
  montadas, atualizar só este card corrigiria ele e deixaria o resto mentindo → recarga da
  página, com atraso para a confirmação ser lida e timer cancelado na desmontagem.

**Ciclo 2 — [P1], e dos bons.** O backup existe **para recuperação**, e o cenário em que
mais importa — plano corrompido — era exatamente onde a tela o escondia (`return
PlanErrorState` antes do cartão). A única saída oferecida era reimportar um plano, o que não
devolve sessões nem medidas. → `PlanErrorState` ganhou um slot, preenchido só pelo `/mais`.
A navegação também voltou: o usuário ficava encurralado numa tela sem nav.

**Ciclo 3 — [P2].** Sessão sem `workoutId` era aceita. Não quebra — `order.indexOf(undefined)`
= -1 cai no ramo "treino saiu da rotação" — e é **pior que quebrar**: o histórico restaurado
passa a mentir sobre qual é o próximo treino. Idem `exerciseId` no log, que sumiria da
progressão e do recorde. → ambos exigidos; sessão legítima sempre os tem.

⚠️ **3 ciclos = limite do `AGENTS.md` §13.** Loop de auto-correção encerrado aqui.

## Gates
`typecheck` ✓ · `lint` ✓ · **337/337** ✓ · `build` ✓ (eram 318 antes da task).

## Verificação no browser (390×844, aba nova)
**Ida e volta completa, duas vezes** (antes e depois do endurecimento): exportei
interceptando o Blob, **apaguei os 4 stores**, confirmei a tela dizendo "Nenhum plano
importado ainda", restaurei pelo caminho real da UI (`File` → `input` → confirmar) e conferi
que voltaram as cargas, a cintura, o `importedAt` original e o plano ativo — com a tela
mostrando "PLANO ATIVO · Recomposição · AB · 2 treinos" após a recarga.

| Cenário | Resultado |
|---|---|
| Card com dados reais | "Neste aparelho: 3 treinos · 2 registros de corpo · 1 plano" ✅ |
| Arquivo não-JSON | "Este arquivo não é um JSON válido." ✅ |
| Arquivo de PLANO por engano | reconhecido, com o caminho certo apontado ✅ |
| Backup vazio | recusado ✅ |
| **Plano corrompido no disco** | erro + backup alcançável + navegação ✅ |
| Foco por teclado real (Tab) | anel duplo, 9,87:1 contra o fundo ✅ |
Console limpo e `overflow 0` em todas.

⚠️ **Gate visual pendente** — screenshot da pane segue falhando; verificação por DOM.
