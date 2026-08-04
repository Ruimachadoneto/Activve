# Decisões após a revisão da Auditoria Estratégica do Activve

> Data: 2026-08-03  
> Status: decisão de produto e arquitetura para decomposição em tasks; **não autoriza implementação nem merge automático**  
> Documento original: `AUDITORIA_ESTRATEGICA_GPT_ACTIVVE_2026-08.md`  
> Revisão do Claude Code: commit `53f4388`, arquivo `REVISAO_AUDITORIA_GPT_2026-08.md`  
> Escopo: resolver divergências, corrigir o plano e determinar a próxima sequência de trabalho.

---

## 1. Veredito sobre a revisão

A revisão do Claude Code é aceita como **materialmente correta**. Ela trouxe fatos do código que a auditoria original não possuía e identificou quatro correções importantes:

1. a personalização visível e o schema 1.3 já estão majoritariamente implementados numa branch local do Claude;
2. o campo comum deve se chamar `why`, não `rationale`;
3. o transporte em Markdown pode permanecer seguro se continuar sendo interpretado por parser próprio e renderizado como elementos React;
4. um GPT público e gratuito não é, por si só, um canal de cobrança.

A revisão também está correta ao exigir:

- infraestrutura de testes de UI/ciclo de vida antes de introduzir rede e claim;
- política de privacidade antes de publicar uma GPT Action;
- ADR formal para qualquer passagem de parte do produto para a nuvem;
- correção imediata da documentação que chama o app de PWA sem haver manifest ou service worker;
- resolução da colisão semântica entre duas tasks identificadas como TASK-032.

Há, porém, duas qualificações:

- **PWA é requisito para escala e experiência instalada, mas não é bloqueador absoluto de um piloto pequeno no navegador.** Não é preciso impedir um teste com 10–30 pessoas até existir service worker; é preciso apenas não prometer instalação ou offline que ainda não existem.
- **O risco regulatório não nasce apenas do nome “Consulta”.** O risco principal está no que o produto efetivamente entrega: treino e alimentação individualizados. Trocar o nome sem revisar a função, os limites e a participação de profissionais seria cosmética jurídica.

---

## 2. Decisões consolidadas

| Tema | Decisão |
|---|---|
| Campo de justificativa | Usar **`why`** em refeição, treino e exercício. Não criar `rationale`. |
| Contexto | Tornar `context` estruturado, com `summary` obrigatório e listas opcionais. |
| Nome de `resources` | Preferir **`availability`**, descrevendo tempo, equipamento, acesso a alimentos e condições práticas. |
| Documento do plano | Manter Markdown como transporte na versão atual, limitado a um subconjunto documentado e renderizado sem HTML cru. |
| Acessibilidade do documento | Corrigir headings reais, landmarks e seções sem alterar o transporte agora. |
| GPT público | Usar primeiro como canal de validação/aquisição, não como fronteira segura de cobrança. |
| Beta pago via GPT | Iniciar a partir do Activve, com conta/entitlement e Action autenticada por OAuth. Não depender de código digitado. |
| Produto comercial definitivo | Portal próprio com API quando houver evidência de pagamento e retenção. |
| Nome técnico | **Activve Coach**. |
| Nome público provisório | **Planejamento Activve**. |
| CTA | **Montar meu plano**. |
| Resultado no app | **Meu Plano**. |
| “Consulta Activve” | Suspenso até parecer jurídico e teste de linguagem com usuários. |
| Telemetria | Apenas na camada de consulta em nuvem, mínima e sem transcrição integral; app local sem analytics de terceiros por padrão. |
| Mobile | PWA antes de lojas; Capacitor antes de rewrite; Android antes de iOS. |
| Ordem | Fechar personalização visível → testes de ciclo de vida → jurídico/privacidade/ADR → claim → GPT Action → PWA/escala → portal próprio. |

---

## 3. Contrato do schema 1.3

### 3.1 Nome único para o “porquê”

O contrato já publicou `diet.meals[].why` na versão 1.2. A versão 1.3 deve reutilizar o mesmo nome em treino e exercício:

```ts
training.workouts[].why?: string;
training.workouts[].exercises[].why?: string;
diet.meals[].why?: string;
```

Motivos:

- um conceito, um nome;
- menor carga cognitiva;
- nenhum adaptador permanente;
- compatibilidade com o schema já publicado;
- linguagem simples também no contrato.

### 3.2 `context` estruturado

A forma aprovada é conceitualmente:

```ts
type PlanContext = {
  summary: string;
  constraints?: string[];
  preferences?: string[];
  motivations?: string[];
  availability?: string[];
};
```

Semântica:

- `summary`: espelho curto e humano do que foi entendido;
- `constraints`: dores, limitações, horários, restrições e barreiras que alteraram o plano;
- `preferences`: escolhas, aversões e formas de treino/alimentação que aumentam aderência;
- `motivations`: objetivos e razões pessoais que sustentam o ciclo;
- `availability`: tempo, equipamento, local, preparo, acesso a alimentos e demais condições práticas.

O app não deve inferir essas categorias lendo prosa livre. O gerador precisa entregá-las explicitamente.

### 3.3 Documento em Markdown controlado

A versão atual pode manter o documento como Markdown porque:

- LLMs geram Markdown com maior confiabilidade que árvores JSON profundamente aninhadas;
- o parser próprio não converte a entrada em HTML arbitrário;
- o React escapa o conteúdo textual por padrão;
- a implementação já possui testes contra script, atributos perigosos e URLs `javascript:`.

Requisitos para aceitar essa decisão:

1. documentar o subconjunto suportado;
2. não usar `dangerouslySetInnerHTML`;
3. renderizar títulos como `h2`/`h3` reais;
4. agrupar seções semanticamente;
5. preservar ordem e hierarquia na impressão;
6. testar conteúdo malicioso como texto literal;
7. reavaliar blocos estruturados somente quando índice navegável, edição por bloco ou interoperabilidade comprovarem necessidade.

---

## 4. Resolução do conflito de monetização do GPT

### 4.1 O conflito

Um GPT publicado livremente pode ser usado por qualquer pessoa com acesso ao ChatGPT. Ele não constitui, sozinho, uma fronteira confiável de cobrança. Instruções do GPT ajudam a controlar o fluxo, mas não devem ser tratadas como mecanismo antifraude ou autorização financeira.

Portanto, a recomendação original “GPT público + consulta paga” não pode permanecer sem distinguir **validação**, **beta pago** e **produto comercial**.

### 4.2 Fase V0 — validação sem cobrança

Objetivo: provar qualidade da conversa, personalização visível e handoff.

- GPT compartilhado por link ou público;
- grupo limitado de testadores;
- um plano experimental por participante;
- Action de claim sem cobrança, mas com token de uso único;
- métricas de conclusão e abertura no app;
- nenhuma promessa comercial definitiva;
- nenhum investimento relevante em aquisição.

Esta fase aceita que o custo do modelo recaia sobre a conta do usuário. O Activve paga apenas infraestrutura mínima do claim.

### 4.3 Fase V1 — beta pago com entitlement

O beta pago **não deve começar pela GPT Store**. O fluxo começa no Activve:

```text
Landing/Activve
→ conta mínima
→ pagamento ou entitlement de beta
→ abrir Activve Coach
→ Action OAuth conecta a conta Activve
→ conversa
→ Action envia o plano
→ claim validado
→ prévia
→ adicionar ao app
```

Regras:

- a Action usa OAuth quando depender de conta;
- o endpoint confirma entitlement antes de aceitar a entrega;
- o claim também valida entitlement e uso único;
- o GPT nunca é a única fronteira de autorização;
- o plano completo no app é o produto pago;
- nenhum código de resgate digitado manualmente no fluxo principal;
- a política de privacidade precisa existir antes da Action pública/compartilhada em escala.

Limitação assumida: um GPT não é um paywall perfeito. Essa arquitetura serve ao **beta**, não ao produto comercial definitivo.

### 4.4 Fase V2 — portal próprio

Quando pagamento e retenção estiverem demonstrados:

- conversa dentro do domínio Activve;
- API controlada pelo produto;
- experiência visual completa;
- cobrança integrada;
- retomada entre dispositivos;
- observabilidade;
- independência de fornecedor;
- GPT público reposicionado como demonstração, aquisição ou suporte.

A API própria é o destino comercial porque controla experiência, autorização, dados e cobrança. Não deve ser construída antes de existir evidência de que o ciclo merece o investimento.

---

## 5. Nomenclatura

### 5.1 Arquitetura de nomes aprovada provisoriamente

| Uso | Nome |
|---|---|
| Sistema/produto | Activve |
| Agente técnico | Activve Coach |
| Experiência pública | Planejamento Activve |
| Ação principal | Montar meu plano |
| Artefato no app | Meu Plano |
| Revisão posterior | Revisar meu ciclo |

### 5.2 Termos a evitar no lançamento inicial

Até revisão jurídica e profissional:

- Consulta Activve;
- anamnese como rótulo público;
- prescrição;
- diagnóstico;
- tratamento;
- nutricionista virtual;
- NutriCoach;
- personal virtual;
- plano psicológico;
- promessa terapêutica.

O sistema pode internamente usar conceitos técnicos de coleta estruturada, mas a interface deve descrever o que ocorre sem simular consultório.

### 5.3 Observação regulatória

O parecer não deve se limitar a validar o nome. Precisa revisar:

- se e como treino individualizado pode ser gerado e comercializado;
- se e como alimentação individualizada, kcal, macros e refeições podem ser oferecidas;
- quais saídas exigem participação ou responsabilidade de profissional habilitado;
- como separar conteúdo educacional de serviço profissional;
- como comunicar limites sem usar disclaimer como substituto de conformidade;
- responsabilidade por red flags e encaminhamento.

A camada alimentar é o ponto de maior sensibilidade e não deve ser comercializada em escala antes dessa revisão.

---

## 6. Privacidade, LGPD e telemetria

### 6.1 Dados mínimos

Nunca incluir no `PlanFile`:

- transcrição integral;
- conversa bruta;
- dados descartados pelo usuário;
- hipóteses clínicas;
- detalhes sensíveis que não alteram o plano;
- logs de raciocínio do modelo.

Enviar ao app somente:

- resumo confirmado;
- contexto estruturado necessário;
- limitações relevantes;
- decisões do plano;
- justificativas;
- alertas que o usuário precisa conhecer.

### 6.2 Telemetria permitida

A telemetria deve morar na camada de consulta, não no histórico local de treino.

Eventos aceitáveis, sem conteúdo sensível:

- consulta iniciada;
- bloco iniciado/concluído;
- pausa e retomada;
- resumo confirmado/corrigido;
- geração iniciada/concluída/falhou;
- claim criado/resgatado/expirado;
- plano aberto no app;
- tempo agregado por etapa;
- avaliação voluntária.

Não registrar por padrão:

- resposta textual;
- áudio;
- transcrição;
- lesão específica;
- diagnóstico relatado;
- refeição detalhada;
- peso ou medidas;
- relatório corporal.

### 6.3 Pré-requisitos legais e operacionais

Antes de Action pública ou beta pago:

- política de privacidade;
- termos de uso;
- consentimento específico e destacado para dados sensíveis, quando essa for a base aplicável;
- descrição de fornecedores e tratamento internacional;
- retenção e descarte;
- canal de acesso, correção e exclusão;
- registro de consentimento;
- avaliação jurídica do produto e dos nomes;
- plano de incidente.

---

## 7. ADR obrigatório para a camada de nuvem

A criação de consulta em nuvem altera decisões fundadoras. Deve existir um ADR antes da implementação do servidor.

O ADR precisa declarar:

### Continua local

- sessões;
- séries, cargas, repetições e RPE;
- peso e medidas;
- fotos;
- histórico completo;
- backup;
- execução do treino;
- relatórios locais.

### Pode ir à nuvem

- autenticação mínima;
- entitlement/pagamento;
- sessão temporária de planejamento;
- respostas necessárias à geração;
- plano temporário aguardando claim;
- métricas operacionais sem conteúdo;
- consentimentos.

### Não deve permanecer na nuvem por padrão

- transcrição após o prazo necessário;
- plano resgatado, salvo apenas pelo tempo definido;
- histórico contínuo do app;
- dados corporais não necessários ao planejamento atual.

O ADR deve incluir rollback para o fluxo manual e independência do provedor de modelo.

---

## 8. Ordem revisada de execução

### Etapa 0 — resolver o estado do repositório

1. confirmar a branch local `ai/TASK-032-personalizacao-visivel-claude`;
2. corrigir os dois achados de review;
3. resolver a colisão de ID entre a implementação e a auditoria;
4. manter a implementação como TASK-032 e renumerar a auditoria documental antes do merge;
5. não reimplementar o que já existe.

### Etapa 1 — fechar a menor fatia de valor

- schema 1.3;
- `why` consistente;
- `context` estruturado;
- Meu Plano;
- bem-estar;
- justificativa no Hoje e Modo Treino;
- headings acessíveis;
- testes e documentação;
- verificação 390×844;
- revisão e merge humano.

Essa etapa testa se a personalização visível é percebida como diferencial, sem servidor nem custo de modelo para o Activve.

### Etapa 2 — infraestrutura de qualidade

Antes do claim em rede:

- `jsdom`;
- Testing Library;
- `fake-indexeddb`;
- testes em StrictMode;
- Playwright para fluxos críticos;
- CI independente do deploy;
- cobertura de importação, troca de plano, restauração e reidratação.

### Etapa 3 — jurídico, privacidade e arquitetura

- parecer jurídico/profissional;
- nomes públicos;
- política de privacidade;
- termos;
- consentimento;
- ADR da camada de nuvem;
- retenção;
- transferência de dados;
- desenho de entitlement.

### Etapa 4 — protótipo do handoff

Sem GPT e sem pagamento inicialmente:

- endpoint de claim;
- token aleatório, temporário e de uso único;
- prévia;
- confirmação;
- resgate;
- expiração;
- remoção após uso;
- link mesmo aparelho;
- QR para outro aparelho;
- testes de concorrência e repetição.

### Etapa 5 — Activve Coach experimental

- adaptar a fonte de verdade do coach;
- Action OpenAPI;
- política publicada;
- geração do schema 1.3;
- entrega ao claim;
- grupo controlado;
- medir conclusão, correção e abertura no app.

### Etapa 6 — PWA

Antes de lançamento público em escala:

- manifest;
- ícones;
- instalação;
- service worker;
- shell offline;
- estratégia de atualização;
- recuperação após versão antiga;
- teste de descarte de página;
- teste em Android real.

Um piloto pequeno pode ocorrer antes, desde que não prometa PWA ou offline inexistentes.

### Etapa 7 — beta pago

Somente com:

- experiência validada;
- política e jurídico concluídos;
- entitlement;
- OAuth da Action;
- claim confiável;
- suporte;
- métricas mínimas;
- preço e reembolso definidos.

### Etapa 8 — portal próprio e mobile

Portal/API quando houver retenção e pagamento. Capacitor/Android quando a ausência de instalação/loja estiver limitando crescimento. iOS depois de capacidade operacional em macOS.

---

## 9. Critérios de avanço

### Personalização visível → handoff

- usuário identifica pelo menos duas decisões ligadas às próprias respostas;
- Meu Plano não parece texto genérico anexado;
- planos 1.2 continuam válidos;
- nenhuma inferência de contexto feita pelo app;
- acessibilidade do documento aprovada.

### Handoff → GPT experimental

- claim resgatado uma única vez;
- plano inválido nunca entra no app;
- link não expõe conteúdo sensível;
- expiração funciona;
- fluxo mesmo aparelho e computador→celular testados;
- restore/backup continuam alcançáveis.

### GPT experimental → beta pago

- conclusão da conversa ≥ 70%;
- abertura no Activve sem ajuda ≥ 85%;
- correções de entendimento disponíveis e utilizadas corretamente;
- nenhuma transcrição integral persistida;
- política e termos publicados;
- parecer jurídico/profissional concluído;
- willingness-to-pay validada manualmente.

### Beta pago → portal próprio

- usuários comprando ou renovando segundo ciclo;
- custo de suporte conhecido;
- falhas de geração mensuradas;
- custo por plano conhecido;
- retenção suficiente para justificar API própria;
- GPT demonstrou limite concreto de experiência ou monetização.

---

## 10. O que não deve ser feito agora

- não reescrever em React Native;
- não construir iOS antes do Android;
- não criar rede social;
- não implementar voz bidirecional antes de texto/ditado;
- não colocar transcrição no PlanFile;
- não criar dois specs de coach concorrentes;
- não usar o GPT como paywall;
- não publicar Action sem política;
- não chamar de PWA antes de existir manifest/service worker;
- não criar analytics de comportamento dentro do histórico local;
- não vender plano alimentar individualizado antes da revisão jurídica/profissional;
- não mergear a auditoria como se fosse implementação aprovada.

---

## 11. Próxima ação exata

1. Claude Code deve terminar os dois achados de review da personalização visível.
2. Deve apresentar o diff e os gates para aprovação humana.
3. A auditoria documental deve ser renumerada para evitar colisão com a implementação.
4. Após merge da personalização, criar uma task exclusiva para infraestrutura de testes DOM/IndexedDB.
5. Em paralelo, iniciar parecer jurídico/profissional e preparar política de privacidade.
6. Só depois criar o contrato técnico do claim.

O projeto não precisa decidir hoje entre “GPT para sempre” e “API própria”. Precisa provar, na ordem correta, três coisas:

```text
personalização visível gera valor
→ o handoff funciona sem arquivo
→ usuários pagam e voltam para outro ciclo
```

Somente então a arquitetura comercial definitiva deixa de ser opinião e passa a ser uma decisão baseada em evidência.
