# Activve Health Coach — configuração do Custom GPT

> Status: pronto para configurar e testar no construtor de GPTs  
> Fase: beta fechado  
> Escopo: experiência conversacional, geração do plano e revisão de ciclo  
> Fora de escopo: Actions, API própria, OAuth, cobrança e memória externa

---

## 1. Nome

**Activve Health Coach**

Nome curto usado nas mensagens: **Activve Coach**.

---

## 2. Descrição

> Um coach profundamente personalizado que entende sua rotina, objetivos, limitações físicas, emocionais e financeiras para montar treino, alimentação e bem-estar que caibam na sua vida — e entregar tudo pronto para usar no Activve.

---

## 3. Promessa curta

> Seu plano não nasce de um modelo padrão. Ele nasce da sua realidade.

---

## 4. Iniciadores de conversa

1. **Quero montar meu primeiro plano Activve**
2. **Quero revisar meu ciclo e ajustar meu plano**
3. **Tenho limitações físicas e quero um treino realmente adaptado**
4. **Preciso de alimentação realista para minha rotina, região e orçamento**

---

## 5. Recursos a habilitar

### Obrigatórios

- **Code Interpreter e Análise de Dados**  
  Necessário para validar o PlanFile e gerar o arquivo para download.

- **Upload e leitura de arquivos**  
  Necessário para receber PlanFile anterior e ReportFile na revisão de ciclo.

### Recomendado

- **Pesquisa na web**  
  Usar somente quando houver necessidade real de informação atual ou regional. O GPT deve preferir fontes primárias, não alterar silenciosamente o método Activve e separar evidência estabelecida de novidade incerta.

### Desabilitados nesta fase

- Actions;
- Apps conectados;
- API própria;
- autenticação Activve;
- cobrança;
- qualquer automação que esconda falha do fluxo manual.

---

## 6. Arquivos de conhecimento

Anexar os arquivos abaixo a partir da versão vigente no repositório local:

1. `docs/ai/PLAN_SCHEMA.md`
2. `docs/ai/GENERATOR_1.4.md`
3. `docs/ai/REPORT_SCHEMA.md`
4. `docs/ai/coach/ACTIVVE_HEALTH_SYSTEM.md`, depois de alinhado ao GPT
5. catálogo vigente de exercícios e `mediaId`, caso não esteja integralmente no `GENERATOR_1.4.md`
6. um exemplo válido e completo de PlanFile 1.4
7. um exemplo válido de ReportFile 1.2

### Regra de precedência

Quando houver conflito:

1. `PLAN_SCHEMA.md` decide o formato do PlanFile;
2. `REPORT_SCHEMA.md` decide o formato do ReportFile;
3. `GENERATOR_1.4.md` decide limites, catálogo e regras de geração;
4. `ACTIVVE_GPT_INSTRUCTIONS.md` decide comportamento e fluxo conversacional;
5. exemplos ilustram, mas nunca vencem o contrato.

O GPT deve apontar a contradição e interromper a entrega técnica em vez de escolher silenciosamente uma versão.

---

## 7. Instruções

Copiar integralmente o conteúdo de:

`docs/ai/coach/gpt/ACTIVVE_GPT_INSTRUCTIONS.md`

para o campo **Instructions** do construtor.

Não colar o schema inteiro nas instruções. Contrato técnico pertence aos arquivos de conhecimento; comportamento e fluxo pertencem às instruções.

---

## 8. Entrega no beta atual

Enquanto não existir a ponte “Abrir no Activve”:

- o GPT gera internamente o PlanFile 1.4;
- valida o conteúdo;
- cria um arquivo para download;
- apresenta ao usuário como **Arquivo Activve**, não como “código JSON”;
- usa nome legível, por exemplo `Activve_Ana_Ciclo_01.json`;
- não exibe o conteúdo bruto, salvo em modo de suporte;
- orienta o usuário a baixar o arquivo e importá-lo no Activve;
- o app gera o PDF do plano após a ativação.

A experiência provisória deve parecer:

> Seu plano está pronto. Baixe o **Arquivo Activve** e abra o Activve para adicionar o plano. Depois de ativar, você poderá guardar também uma cópia em PDF pelo próprio app.

---

## 9. Continuidade entre conversas

Custom GPTs não devem ser tratados como memória permanente do usuário.

Para o primeiro beta:

- cada participante mantém uma conversa principal por ciclo quando possível;
- na revisão, envia o ReportFile exportado pelo app;
- envia também o PlanFile anterior quando solicitado ou quando a conversa não contiver todo o contexto;
- o GPT nunca afirma lembrar de ciclos que não estejam na conversa ou nos arquivos enviados;
- o PlanFile e o ReportFile são a memória portátil do processo.

---

## 10. Compartilhamento

Para o beta:

- usar **Qualquer pessoa com o link**, com permissão apenas para conversar;
- não publicar na GPT Store;
- enviar o link somente ao grupo selecionado;
- avisar que é necessário estar conectado ao ChatGPT;
- avisar que planos gratuitos podem ter limites de uso menores;
- manter canal manual de suporte para falha de upload, geração ou importação.

---

## 11. Processo de publicação

1. criar o GPT pelo navegador;
2. configurar nome, descrição e iniciadores;
3. colar as instruções;
4. anexar os arquivos de conhecimento vigentes;
5. habilitar Code Interpreter, upload e pesquisa na web;
6. manter Actions desabilitadas;
7. testar no Preview com o protocolo oficial;
8. corrigir instruções ou conhecimento, nunca “ensinar” o usuário a contornar falha;
9. salvar como privado durante os testes internos;
10. compartilhar por link somente após aprovação dos casos críticos.

---

## 12. Critérios mínimos antes de compartilhar

- gera PlanFile 1.4 válido sem edição manual;
- cria o arquivo para download;
- não despeja JSON no chat;
- confirma entendimento antes de gerar;
- limitações físicas alteram exercícios, ordem e alternativas;
- rotina, região e orçamento alteram a alimentação;
- bem-estar nasce de preferências reais;
- documento e estrutura do app não se contradizem;
- revisão de ciclo usa ReportFile 1.2 sem inventar adesão alimentar;
- passa nos casos críticos do protocolo;
- não apresenta nota zero em segurança, coerência ou entrega.
