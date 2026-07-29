# TASK-023 — Arquitetura de informação da Home

## Metadados
- Status: `review` · Risco: `baixo` (remoções + reposicionamento; nenhuma lógica de dado nova)
- Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-023-home-ia-claude` · Base: `main`

## Origem
Feedback direto do usuário após usar a versão com o número-herói: *"a HOME está com muita coisa,
muita informação e acaba gerando poluição"*, com dois pedidos explícitos — tirar a lista de
exercícios (duplica outras telas) e subir o "Foco do dia" para entre o herói e o treino de hoje,
tornando-o mais elaborado do que um resumo do card que vem logo abaixo.

## Auditoria (o que foi medido, não sentido)
A Home tinha **11 blocos**. Seis eram mortos ou redundantes:

| Bloco | Diagnóstico | Ação |
|---|---|---|
| Lista "Exercícios" | Duplica o `/treino` inteiro (exercício atual, séries, variações) | **Removido** |
| Card "Corpo" | Duplica a aba Corpo do bottom nav, a centímetros de distância | **Removido** |
| Chip "Plano importado · split · Nx" | Duplica o `/mais` ("Plano ativo") e é info de configuração, não de uso diário | **Removido** |
| Card "Alimentação" | `<div>` não clicável, sem rota `/alimentacao` — **UI morta**, mesma classe do sino | **Mantido: vira feature (TASK-024)** |
| Sino de notificação | Morto, com bolinha de "não lida" fixa no CSS | Fora do escopo (TASK-025) |
| Avatar "A" no header | `<span>` decorativo com cara de botão de perfil | Fora do escopo |

**Decisão de produto do usuário sobre a Alimentação:** não remover. O coach já gera o plano
alimentar e o `PlanFile` já carrega `diet.meals`/`dailyKcal`/`macros`/`shoppingList` — o app
simplesmente nunca renderizou. Como o app é o companion do usuário e dieta é um pilar do tema,
a resposta certa é **construir a tela**, não apagar o card. Vira a TASK-024.

## Foco do dia (reposicionado e reescrito)
Sai de baixo do card do treino e vai para **entre o herói e o treino**. Deixa de ser o texto
`focus` solto e passa a **traduzir o número do herói para este treino**: quais músculos ainda estão
se recuperando e **quando ficam prontos** (`hoursToReady`, já existente).

**Limite deliberado:** aqui só se descreve o corpo, nunca se prescreve treino. Quem prescreve é o
plano gerado pelo coach (arquitetura plan-file) — por isso "pronto em ~2 dias" (fato derivado do
histórico) e nunca "hoje use carga leve". O usuário escolheu esta opção sabendo do limite.

## Duplicação que eu mesmo criei (e removi)
Na primeira versão, o herói dizia "Peito e tríceps ainda estão se recuperando" e o Foco logo abaixo
repetia os mesmos músculos com o "quando". Era a mesma falha que a task veio corrigir. Os músculos
saíram do herói: **o herói responde "quanto", o Foco responde "o quê e quando".**

## Resultado
Home passa de **11 para 6 blocos** de conteúdo, cada um com função distinta:
herói (quanto) → foco (o quê/quando) → treino (o que fazer) → ritmo da semana → alimentação → nav.

A linha "Equipamentos: …" foi **preservada** e movida para dentro do card do treino: "o que preciso
levar hoje" não está agregado em nenhuma outra tela (o `/treino` mostra equipamento exercício a
exercício, nunca a soma).

## Evidências
- Browser 390×844: hierarquia limpa, sem overflow, console limpo.
- Gates: typecheck ✓ · lint ✓ · **181/181** ✓ · build ✓.

## Pendente
- [ ] Gate visual do usuário + aprovação de merge.
