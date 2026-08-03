# Portal de Consulta — especificação de desenho

> Encomendado depois de o usuário recusar, com razão, a recomendação de onboarding da
> `AUDITORIA_2026-08.md`: *"Não podemos ter um onboarding padrão, superficial, como
> praticamente todo app faz. A personalização máxima é o maior diferencial — é aquilo que
> faz o usuário entender que o plano não é um plano padrão, mas um plano para ele."*
>
> **Este documento é desenho, não implementação.** A decisão de arquitetura vem depois, com
> o desenho na mão.

---

## 1. O diagnóstico corrigido

A auditoria disse que o problema era time-to-value e recomendou templates. Estava errado —
templates trocariam o diferencial pela commodity. Mas o diagnóstico substituto também não é
"a consulta precisa ser mais profunda". Ela já é profunda: o
`docs/ai/coach/ACTIVVE_HEALTH_SYSTEM.md` já pede orçamento, quem cozinha, o que é fácil de
encontrar na região, hobbies e refúgios mentais.

**O problema real, medido no código:**

| Camada | Estado |
|---|---|
| A consulta (spec do coach) | Profunda — pergunta tudo o que importa |
| O Documento gerado | Rico — carrega o "porquê" em linguagem humana |
| **O `PLAN_SCHEMA`** | **Não tem campo para bem-estar, contexto de vida, nem para o Documento** |
| O app | Recebe treino + dieta + meta. Nada mais. |

> **A personalização morre na porta.** Uma anamnese de 30 minutos sobre a vida da pessoa
> chega ao app como um plano de treino que poderia ser de qualquer um. Não é a consulta que
> é genérica — é o **cano** entre ela e o produto.

Isso reordena tudo: **antes de melhorar a consulta, é preciso o app ser capaz de mostrar
que ela aconteceu.** Caso contrário, aprofundar a anamnese é pedir mais informação para
jogar fora com mais requinte.

---

## 2. A regra que impede virar formulário de 40 campos

O modo de falha da "personalização" é conhecido: um wizard longo, barra de progresso, e uma
saída que ignora 35 das 40 respostas. O usuário nomeou exatamente isso.

> ### REGRA DE OURO
> **Toda pergunta feita tem de mudar visivelmente a saída. Se a resposta não aparece em
> lugar nenhum do plano, a pergunta não deve ser feita.**

É verificável, e por isso é uma regra e não uma intenção: dá para pegar a transcrição de uma
consulta, listar o que foi perguntado, e conferir item a item onde aquilo apareceu. Se
perguntamos sobre hobby e o plano não menciona hobby, perguntamos por nada — e pior:
ensinamos a pessoa que responder não adianta.

É a §9 (honestidade) aplicada à entrada, e não só à saída.

---

## 3. O que separa uma consulta de um formulário

Seis propriedades. Um formulário não tem nenhuma delas.

**3.1 Uma coisa por vez, e a próxima depende da anterior.**
Quem responde *"moro sozinho e trabalho 12 horas"* não deve ouvir em seguida "quantas
refeições você faz por dia?". Deve ouvir *"quem cozinha aí? dá pra adiantar alguma coisa no
domingo?"*. Formulário pergunta tudo a todo mundo.

**3.2 Aprofunda onde importa, pula onde não importa.**
Quem diz "nunca treinei" não precisa responder sobre preferência de periodização. Quem diz
"meu ombro incomoda" merece três perguntas de seguimento, não um checkbox.

**3.3 Espelha antes de decidir.**
*"Então: você treina de manhã antes do trabalho, tem uns 45 minutos, ombro reclama em
supino, e só consegue cozinhar no domingo. É isso?"* — este é o momento em que a pessoa se
sente ouvida, e é a última chance de corrigir antes de gerar. O spec do coach já exige isso;
o app precisa **preservar esse resumo**, porque ele é a prova de que a consulta existiu.

**3.4 A saída cita a entrada.**
Não *"Café da manhã: 3 ovos"*, mas *"Café da manhã: 3 ovos — você disse que sempre tem ovo
em casa e que a manhã é corrida; isso sai em 5 minutos"*.
**Este é o maior sinal de "foi feito para mim" que existe**, e é barato: é só não jogar fora
o porquê. Hoje o app joga.

**3.5 Admite o que não sabe e o que não pode.**
"Isso é com médico" é sinal de competência, não de limitação. O spec já tem.

**3.6 Pode ser pausada e retomada.**
Consulta real tem pausa. Um wizard que perde tudo ao fechar a aba não é consulta.

---

## 4. Estrutura da anamnese

Os 8 blocos do `ACTIVVE_HEALTH_SYSTEM.md` §ETAPA 1 já estão certos e **não precisam
mudar**. O que falta é como eles se comportam:

- **Adaptativa, não linear.** Cada bloco pode expandir ou encolher conforme as respostas.
- **Sem barra de progresso numérica.** "Pergunta 12 de 40" transforma conversa em
  formulário. Marcadores de etapa em linguagem ("agora sobre comida") preservam o registro
  de conversa.
- **Direito de não responder.** Toda pergunta aceita "prefiro não dizer" / "não sei" — e a
  saída tem de degradar com honestidade, dizendo o que assumiu na ausência do dado.

### O bloco que mais diferencia: realidade material

O usuário destacou este, e ele é onde quase todo app falha (todos entregam salmão e quinoa).
Perguntar bem importa mais que perguntar muito:

| Em vez de | Perguntar |
|---|---|
| "Qual seu orçamento mensal?" | "Onde você faz compras — mercado grande, mercadinho, feira?" |
| "Quantas calorias?" | "Tem algum item que você acha caro demais pra virar rotina?" |
| "Você cozinha?" | "Num dia normal, quanto tempo dá pra dedicar à comida?" |

Orçamento perguntado de frente constrange e vem impreciso. Perguntado por **hábito de
compra**, vem verdadeiro — e é mais útil, porque o plano precisa saber *onde* a pessoa
compra, não só quanto gasta.

**Consequência na saída:** substituições por disponibilidade real, não por tabela de macro.

### O bloco de refúgio mental

Vale como **apoio, nunca como mais uma cobrança** (o spec já enquadra assim, e é anti-culpa
aplicado). A diferença entre "medite 10 minutos" e "você disse que ler antes de dormir te
desliga — protege esses 20 minutos, principalmente nos dias de treino pesado" é a diferença
entre um app e um plano.

---

## 5. O que o app precisa receber — a mudança de contrato

Aqui está o trabalho estrutural. **Sem isto, nada acima chega ao usuário.**

### 5.1 O Documento precisa entrar no app

Hoje ele é um markdown que a pessoa lê uma vez no chat e perde. Ele deveria ser **uma tela
do app** — o "meu plano, por extenso", sempre disponível. É o artefato que mais comunica
personalização, e é o único que hoje não atravessa.

### 5.2 Campos novos no `PLAN_SCHEMA` (bump para 1.2)

- **`wellness`** — o plano de bem-estar: hábitos sugeridos, ancorados no que a pessoa gosta.
  Já previsto na visão, nunca implementado.
- **`context`** — o resumo-espelho da anamnese (§3.3), em texto. É o que permite a qualquer
  tela dizer "isto foi montado assim porque você disse aquilo".
- **`rationale` opcional em treino, exercício e refeição** — o *porquê* daquele item, na
  linguagem da pessoa. É o mecanismo do §3.4.
- **`document`** — o Markdown completo, para a tela do §5.1.

> Todos **opcionais e aditivos**: um plano 1.1 continua válido, e um plano sem `rationale`
> apenas não mostra o porquê — degrada, não quebra. Mesma compat por major que o schema já
> pratica.

### 5.3 Onde a personalização aparece em uso

Não basta guardar; tem de ser visível **no dia a dia**, não só no dia da importação:

| Tela | O que passa a mostrar |
|---|---|
| Hoje | Uma linha do `context` ou do `rationale` do treino do dia |
| Modo Treino | O porquê do exercício, ao lado do "Como fazer" |
| Alimentação | A substituição ancorada no que é fácil na região da pessoa |
| **Meu plano** (nova) | O Documento inteiro |
| Bem-estar (nova ou dentro do Mais) | O plano de refúgio/lazer |

---

## 6. O que a arquitetura exige

Uma anamnese **adaptativa** (§3.1, §3.2) é um LLM em tempo de execução — não há tabela de
decisão que faça isso. Isso implica chave de API, que não se embarca em cliente, que implica
servidor. Colide com o `AGENTS.md` §2 (*"Sem IA de servidor"*).

**O que NÃO precisa mudar:** a consulta é uma transação pontual (manda anamnese → recebe
plano). O dado contínuo — sessões, cargas, peso, medidas — continua 100% local. A
arquitetura vira **app local-first + serviço fino de consulta**, e a privacidade segue real.

**Onde a chave mora é decisão de implantação, não de arquitetura.** O código da consulta é o
mesmo; só muda a origem da credencial. Daí ser possível validar com a chave do próprio
usuário e trocar por um serviço depois, sem reescrever.

**Consequência de negócio:** se a consulta custa tokens, é ela o produto pago. App gratuito
e privado / consulta paga. Você paga pelo pensamento, não pelo rastreador.

---

## 7. Sequência proposta

O §5 (o cano) **não depende** da decisão de arquitetura do §6 e destrava valor imediato —
inclusive para o fluxo manual de hoje, com o Claude Project.

1. **`PLAN_SCHEMA` 1.2 + tela "Meu plano" + bem-estar + `rationale` nas telas.**
   Independe de backend. Faz a personalização que **já é produzida hoje** finalmente chegar
   ao usuário. Provavelmente o maior salto de percepção por esforço de todo o projeto.
2. **Atualizar o coach** para emitir os campos novos (o `GENERATOR_1.1.md` já é o material
   de handoff; vira 1.2).
3. **Decidir a arquitetura da consulta** (§6) e construir o portal.

O passo 1 tem um efeito colateral valioso: ele **testa a hipótese** de que a personalização
visível é o diferencial — usando o coach manual, sem gastar nada, antes de decidir sobre
servidor.

---

## 8. Perguntas em aberto para o usuário

1. **A tela "Meu plano" (o Documento) é a peça central?** É a hipótese deste desenho.
2. **O bem-estar entra como aba própria ou dentro do Mais?** Ele é o pilar de "relacionamento
   e sentido" que a auditoria apontou como ausente (SDT).
3. **A consulta é refeita a cada ciclo, ou há uma "reconsulta" curta** que só pergunta o que
   mudou? A segunda é mais respeitosa com quem já respondeu tudo uma vez.
