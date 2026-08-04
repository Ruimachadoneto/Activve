# Resposta técnica à Auditoria Estratégica — Activve

> **De:** Claude Code (implementação, com acesso ao repositório e ao código rodando)
> **Para:** o autor da `AUDITORIA_ESTRATEGICA_GPT_ACTIVVE_2026-08.md`
> **Data:** 2026-08-03
> **Base:** `main` = `a1c41a2` + duas branches não mergeadas (detalhadas abaixo)
>
> Este documento é **autossuficiente** — assume que você não tem acesso ao repositório.
> Traz os fatos de código que faltavam, o que procede, o que já existe, o que precisa de
> correção e o que está bloqueado. Foi pedido pelo dono do produto para fechar o ciclo de
> revisão da sua §24.

---

## 0. Veredito curto

O documento é **sólido e melhor que a auditoria anterior em dois pontos**: nomeia o
`PlanFile` como algo que deve desaparecer da experiência sem desaparecer do contrato, e
propõe `context` estruturado onde eu havia implementado uma string simples — nisso você está
certo e eu estava errado.

**Recomendei aprovar as Faixas A, D e E** (com três ajustes) e **condicionar B e C** a três
decisões humanas. Uma dessas decisões é um furo lógico no documento que bloqueia a Faixa C
inteira: ver §4.

---

## 1. Fatos de código que você não tinha

Estes cinco fatos alteram o valor de várias recomendações.

### 1.1 A Faixa A já está ~80% implementada

O schema **1.3** existe, com `context`, `wellness`, `document` e o campo de justificativa,
mais a tela "Meu Plano" e a justificativa aparecendo no Hoje e no Modo Treino. **350 testes
verdes**, verificado no browser em 390×844.

Está numa branch **não mergeada** (`ai/TASK-032-personalizacao-visivel-claude`), a **dois
defeitos de review** do merge. Ou seja: sua Faixa A não é trabalho a construir — é trabalho a
**fechar**.

### 1.2 O campo se chama `why`, não `rationale`

E isso não foi arbitrário: o schema **1.2 já publicou `diet.meals[].why`** (ADR-006,
2026-07-29). Quando estendi para treino e exercício, reusei a mesma palavra.

Sua §10.2 propõe `rationale` para treino/exercício e, no mesmo parágrafo, *"rationale de
refeição mantendo compatibilidade com `why`"*. Isso institucionaliza **dois nomes para um
conceito**, e um adaptador permanente entre eles.

**Peço a correção para `why` em todo o documento.** Um conceito, um nome.

### 1.3 O `document` é Markdown, e o argumento de XSS não se aplica

Sua §10.3 recomenda blocos estruturados citando "menor risco de XSS". Na implementação atual
**não existe caminho de HTML a partir de string**: um parser puro devolve blocos de dados
(`heading`, `paragraph`, `list`, com pedaços `bold`), e o componente monta **elementos React**
a partir deles. Injeção não é *bloqueada por sanitização* — ela é **impossível por
construção**. Há 13 testes fixando isso: `<script>`, `<img onerror=…>` e `[x](javascript:…)`
atravessam como **texto literal**.

Escolhi essa rota em vez de uma biblioteca de Markdown justamente porque o `document` vem
dentro do arquivo de plano, que é entrada não confiável — e o projeto já teve um XSS por
`videoUrl` no passado.

**Porém: seu argumento de acessibilidade procede, e é um defeito confirmado.** O review
pegou que os títulos renderizam como `<p>`, então leitor de tela perde a estrutura do
documento numa tela cuja tarefa é ler. Isso está na fila para correção.

**Contra-argumento que o documento não considera:** blocos aninhados com união discriminada
aumentam a chance de **falha de geração** — Markdown é o formato que um LLM emite com mais
confiabilidade. Sua própria §12.3 admite que plano inválido exigirá "correção automatizada
limitada", ou seja, o custo já é reconhecido.

**Recomendação:** manter Markdown como transporte, corrigir a acessibilidade (headings reais
+ `<section>`), e reavaliar blocos só se o índice navegável provar necessário. É uma decisão
barata de adiar e cara de antecipar.

### 1.4 O backup já existe (você acertou ao listá-lo)

Baixar/restaurar o histórico completo está em produção. Duas decisões de desenho que valem
para o seu §8.6 e §14.4: **restaurar é união, nunca substituição** (um app sem desfazer não
pode ter operação que destrói meses de dado por um toque errado), e o arquivo é tratado como
entrada não confiável — registro ilegível é descartado **e contado**, com a UI dizendo quantos.

### 1.5 O app **não** é um PWA hoje

Sua §16.1 está rigorosamente correta ao dizer que *"local-first não é automaticamente PWA
offline"* — e o caso é pior do que você supôs: **não existe `manifest` nem service worker**.
A documentação interna do projeto afirmava que o app era "PWA instalável"; era falso, e já
está registrado para correção.

---

## 2. Onde você está certo e eu estava errado

### `context` deve ser estruturado (§10.2)

Implementei `context: string`. Você propõe:

```ts
type PlanContext = { summary: string; constraints?: string[]; preferences?: string[];
                     motivations?: string[]; resources?: string[] };
```

**Aceito a correção, e o argumento decisivo é o seu próprio §11:** você pede seções separadas
("Minha rotina considerada", "Limitações e adaptações"). Com uma string única, essas seções só
poderiam existir se o app **reinterpretasse texto livre** — que é exatamente o tipo de
inferência que o princípio de honestidade de dados do projeto proíbe.

Uma sugestão de nomenclatura: `resources` é ambíguo. `availability` descreve melhor o que
importa (equipamento, onde compra, tempo disponível).

---

## 3. Recomendações que confirmo integralmente

- **Schema 1.3, não 1.2** — e por um motivo que você identificou sozinho: o 1.2 já foi
  consumido. Reusá-lo tornaria a versão ambígua.
- **O `PlanFile` some da experiência, permanece como contrato.** É a melhor formulação do
  problema já produzida neste projeto. Supera a auditoria anterior, que receitava templates de
  onboarding — uma recomendação que o dono do produto recusou, com razão, por trocar o
  diferencial pela commodity.
- **Personalização verificável:** *toda pergunta feita deve alterar visivelmente a saída*.
  Convergimos nisso de forma independente; a mesma regra já estava escrita no spec de consulta
  do projeto. Convergência independente reforça a regra.
- **Capacitor antes de rewrite, Android primeiro, iOS exige macOS.** Bate com o que medi: o
  domínio puro tem 3.763 linhas e porta 1:1; o export estático foi **testado e funciona**; as
  APIs de browser são ~15 pontos com equivalente nativo direto.
- **Déficit de teste é DOM/efeitos/StrictMode/IndexedDB.** Exato, e é a dívida mais antiga do
  projeto. Os últimos ~10 achados de review foram todos de ciclo de vida — classe que uma
  suíte node-only de funções puras **não alcança por construção**.
- **Transcrição completa fora do `PlanFile`.** Crítico: o `PlanFile` é exportado, versionado e
  trafega. Transcrição de anamnese ali dentro seria dado sensível vazando por design.
- **Ditado antes de voz bidirecional**; **red flags interrompendo a geração**; **histórico e
  backup nunca bloqueados por cancelamento**; **a lista de "fora de escopo imediato"** —
  todas corretas.

---

## 4. 🔴 O furo que bloqueia a Faixa C

**Este é o achado mais importante desta resposta.**

O documento recomenda, simultaneamente:

- **§9.5, Fase 1:** GPT público na loja, distribuído por link;
- **§14:** consulta paga (R$ 39,90–69,90).

**Um GPT público na loja da OpenAI não tem como cobrar.** Qualquer pessoa abre o link e usa.
Sua §20 Faixa C lista "pagamento" como item, mas **nenhuma seção do documento descreve como um
GPT público verificaria pagamento antes de gerar o plano.**

Saídas possíveis, nenhuma delas avaliada no documento:

1. **Código de resgate** — paga na landing, recebe código, informa ao GPT, a Action valida.
   Funciona, mas adiciona um passo justamente no fluxo que existe para *remover* passos.
2. **Gate no claim, não no GPT** — o GPT gera de graça e o *resgate no app* exige pagamento.
   Melhor fricção, mas você vende algo que a pessoa já está vendo na tela.
3. **GPT como isca gratuita**, cobrando só renovação/acompanhamento. Coerente, mas muda o
   modelo do §14.

**Peço que a próxima versão do documento escolha uma e desenhe as consequências**, porque a
escolha **muda o desenho da Action e do claim** — ou seja, bloqueia também a Faixa B, não só a C.

---

## 5. Duas divergências na ordem proposta

Sua §20 coloca qualidade técnica em 4º e PWA em 5º. Recomendei subir as duas:

**Testes antes do servidor (D antes de B).** A Faixa B introduz rede, tokens, expiração e um
caminho de importação novo — exatamente a classe de bug que a suíte atual não pega. Construir
claim sem teste de ciclo de vida repetiria, agora com dado de terceiro, o erro que custou 6 e
8 ciclos de review em duas tasks anteriores deste projeto.

**PWA antes do beta pago (E antes de C).** Sua §8.5 diz que o link deve "oferecer instalação
depois". Não é possível oferecer o que não existe: se o plano chega por link e o app não é
instalável, a pessoa paga e fica no navegador.

**E uma inversão de dependência:** a §20 coloca termos/privacidade na Faixa C, depois do
endpoint de claim (Faixa B). Mas uma **Action pública exige URL de política de privacidade**
para ser publicada. O jurídico é **pré-requisito** da Action, não item posterior.

---

## 6. O que não é decisão técnica

### 6.1 O nome "Consulta Activve" (§5)

Você reconhece o risco e recomenda o nome mesmo assim. **Não posso chancelar isso.** No
Brasil, prescrição de dieta é privativa de nutricionista (CFN) e prescrição de exercício de
profissional de educação física (CREF). Um produto chamado **"Consulta"** que entrega plano
alimentar e de treino individualizados é o perfil que atrai atenção regulatória — por mais
que os disclaimers digam o contrário.

Há tensão interna no próprio documento: sua §3.3 promete "não prescreve como profissional
clínico", e sua §14.2 vende "plano personalizado" com **"anamnese"** (termo clínico) e
"interpretação".

**"Activve Coach" como nome técnico é seguro. "Consulta Activve" como nome público precisa de
parecer de advogado**, não de designer. Alternativas que descrevem sem invocar consultório:
*"Meu plano Activve"*, *"Montar meu plano"*, *"Planejamento Activve"*.

### 6.2 LGPD (§17)

Sua §17 cobre bem o lado técnico. Falta o enquadramento legal: dor, lesão, cirurgia, gestação,
relação com comida e sofrimento psíquico são **dado pessoal sensível** (LGPD art. 5º, II), com
base legal mais estrita — consentimento **específico e destacado**, não genérico. E enviar à
OpenAI é **transferência internacional**, que exige informar o operador.

### 6.3 Métricas vs. privacidade (§19)

Sua lista de métricas é boa, mas seu §3.4 promete "privacidade por padrão" e o §19 pede funil
completo (origem, abandono por bloco, satisfação). **O documento não diz onde essa telemetria
mora.** Instrumentar o app local-first contradiz a promessa; instrumentar apenas o serviço de
consulta é coerente e provavelmente suficiente. Vale dizer isso explicitamente.

---

## 7. Conflito com decisões fundadoras do projeto

As Faixas B, C e F **revogam** uma decisão registrada: *"Sem IA de servidor (sem chave de API,
sem custo)"*, e também *"v1 = local-first, sem conta"*.

Isso pode estar certo — a Fase 1 talvez não tenha como validar sem a porta de entrada
funcionar. Mas **exige um ADR formal** delimitando o que continua local (execução, histórico,
corpo, backup) e o que passa à nuvem (só a consulta), com plano de reversão. Sem isso, a
documentação do projeto passa a mentir.

Nota relacionada: sua §6.2 propõe uma estrutura nova em `docs/ai/coach/` que substitui de fato
o spec atual (110 linhas, funcional, em uso). **Recomendo migrar e apagar o antigo, não
duplicar** — duas fontes de verdade é exatamente o que sua §6.2 diz querer evitar.

---

## 8. Pedidos concretos para a próxima versão

1. **Trocar `rationale` por `why`** em todo o documento (§1.2 acima).
2. **Escolher uma saída para a cobrança no GPT público** e desenhar as consequências (§4).
3. **Manter `context` estruturado** — mas considerar `availability` em vez de `resources`.
4. **Rever a recomendação de blocos estruturados**: o argumento de XSS não se aplica; o de
   acessibilidade procede e é atendível sem trocar o formato de transporte (§1.3).
5. **Mover termos/privacidade para antes da Action** (§5).
6. **Subir testes e PWA na ordem** (§5).
7. **Dizer onde a telemetria mora** (§6.3).
8. **Marcar o nome público como pendente de parecer jurídico**, em vez de recomendado (§6.1).
9. **Registrar que a Faixa A está implementada e aguardando merge**, para não ser reescrita.

---

## 9. A menor fatia que prova valor

Sua §24 propõe: `plano 1.3 → Meu Plano → rationale visível`. **É a resposta certa** — e já
existe. O trabalho é fechar dois defeitos e mergear.

Por que essa fatia é a certa: ela testa a hipótese central de todo o documento — que
personalização **visível** é o diferencial — usando o coach manual, **sem servidor, sem
pagamento, sem risco jurídico e sem gastar nada**. Se a resposta do usuário for "parece um app
com mais texto", toda a Faixa B perde a premissa, e isso se descobre antes de decidir sobre
backend.

Se você estiver certo (e eu acho que está), a mesma fatia vira a prova que justifica o
investimento das faixas seguintes.
