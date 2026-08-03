# Auditoria estratégica consolidada — Activve, consulta conversacional e GPT

> Data: 2026-08-03  
> Status: proposta para revisão no Claude Code antes de qualquer implementação  
> Branch: `ai/TASK-032-auditoria-gpt-activve-gpt`  
> Escopo: produto, monetização, arquitetura, experiência de consulta, integração com IA, evolução PWA/mobile, segurança, testes, nomenclatura e plano de execução.

---

## 1. Objetivo deste documento

Consolidar as conclusões da auditoria do Activve e transformar a discussão estratégica em um plano revisável e implementável.

Este documento não autoriza implementação automática. O Claude Code deve:

1. confrontar cada recomendação com o código e a documentação atual;
2. apontar conflitos, dependências e riscos;
3. dividir o trabalho em tasks pequenas;
4. preservar os princípios não negociáveis do produto;
5. levar cada merge para aprovação humana.

A intenção não é empilhar funcionalidades. É corrigir o funil central do produto:

```text
ser entendido
→ receber um plano realmente personalizado
→ abrir o plano no Activve sem lidar com arquivo
→ executar
→ acompanhar
→ revisar o ciclo
→ receber um plano melhor
```

---

## 2. Resumo executivo

### 2.1 Diagnóstico principal

O Activve já possui uma base técnica e de produto acima da média para um projeto em estágio inicial:

- app local-first;
- treino guiado;
- histórico;
- peso e medidas;
- recuperação muscular;
- relatórios;
- alimentação consultável;
- backup completo;
- filosofia anti-culpa;
- honestidade de dados;
- contratos de plano e relatório;
- testes robustos no domínio.

O maior problema atual não é a qualidade do app depois da importação. É a porta de entrada.

Hoje, o valor depende de um fluxo externo e técnico:

```text
abrir uma IA
→ fazer anamnese
→ gerar JSON
→ salvar arquivo
→ localizar Downloads
→ abrir o Activve
→ importar
```

Isso cria alto risco de abandono, sobretudo entre usuários menos tecnológicos.

### 2.2 Decisão estratégica recomendada

O `PlanFile` deve continuar como contrato central, mas deve desaparecer da experiência comum.

Para o usuário:

```text
conversar
→ revisar o que foi entendido
→ gerar plano
→ tocar em “Abrir no Activve”
→ confirmar a prévia
→ começar
```

O arquivo permanece como:

- backup;
- portabilidade;
- integração com profissional;
- fallback;
- ferramenta avançada;
- contrato entre sistemas.

Não permanece como tarefa obrigatória do usuário.

### 2.3 Estratégia de IA recomendada

Usar duas rotas, em fases:

**Rota de validação barata:** GPT personalizado público, usando a conta e os limites do próprio usuário, com Action para entregar o plano ao Activve.

**Rota definitiva:** portal próprio com API, somente depois de validar disposição de pagamento, conclusão da consulta e retenção de ciclo.

Gemini e Claude podem existir como alternativas, mas não devem nascer como três produtos independentes. O método precisa ter uma única fonte de verdade, com adaptadores por plataforma.

### 2.4 Estratégia comercial recomendada

- app de acompanhamento: gratuito;
- consulta/plano: pago;
- renovação de ciclo: paga;
- assinatura opcional para quem deseja acompanhamento contínuo;
- histórico, backup e acesso aos dados nunca bloqueados por cancelamento.

Faixa proposta para validação:

- beta fundador: R$ 39,90 por plano inicial;
- produto consolidado: R$ 69,90 por plano inicial;
- renovação: R$ 49,90;
- assinatura: R$ 39,90/mês ou R$ 349,90/ano.

Esses preços devem ser testados. Não são dogma.

---

## 3. Princípios não negociáveis

Nenhuma implementação pode enfraquecer estes princípios.

### 3.1 Honestidade de dados

- Não inventar score, progresso, aderência, prontidão ou previsão.
- Não apresentar inferência como fato.
- Não esconder divergências entre números.
- Não gerar porcentagem de carregamento falsa.

### 3.2 Anti-culpa

- Sem streak punitivo.
- Sem linguagem de fracasso.
- Sem vermelho para desempenho.
- Retomar deve ser fácil.
- Descanso e imprevistos fazem parte da vida real.

### 3.3 O app não prescreve como profissional clínico

- Não diagnostica.
- Não substitui médico, nutricionista, psicólogo ou profissional de educação física.
- Deve reconhecer sinais de alerta e interromper o fluxo quando necessário.
- Deve explicar limites com clareza, sem linguagem alarmista.

### 3.4 Privacidade por padrão

- Dados contínuos de treino e corpo permanecem locais sempre que possível.
- A consulta em nuvem coleta somente o necessário.
- Transcrição completa não deve entrar no `PlanFile`.
- Retenção e exclusão precisam ser explícitas.

### 3.5 Portabilidade

- O usuário é dono do plano e do histórico.
- Exportação e backup são direitos do produto, não prêmio de assinatura.
- Trocar de plano não apaga ciclos anteriores.

### 3.6 Personalização verificável

Regra central:

> Toda pergunta feita deve alterar visivelmente a saída. Se uma resposta não muda o plano, a pergunta não deveria existir.

---

## 4. Posicionamento do produto

O Activve não deve competir apenas como tracker de academia.

O posicionamento recomendado é:

> Um sistema que entende a realidade da pessoa, transforma essa realidade em um plano explicável e acompanha a execução sem culpa e sem aprisionar os dados.

A diferenciação nasce da combinação:

- personalização profunda;
- plano explicável;
- treino executável;
- alimentação adaptável;
- bem-estar contextual;
- privacidade;
- continuidade entre ciclos;
- baixa fricção.

A esfera, voz, animações e IA são meios. Não são o produto.

O momento de valor é:

> “O Activve entendeu minha vida, explicou por que montou isso assim e colocou o plano no meu aparelho sem me obrigar a aprender informática.”

---

## 5. Nomenclatura da consulta e do assistente

O nome é estratégico porque algumas palavras prometem demais ou afastam parte do público.

### 5.1 Termos avaliados

#### “NutriCoach”

Problemas:

- reduz o produto à alimentação;
- pode sugerir atuação de nutricionista;
- enfraquece treino, contexto e bem-estar;
- aumenta risco regulatório e de percepção enganosa.

**Não recomendado.**

#### “Coach Activve” ou “Activve Coach”

Vantagens:

- fácil de entender;
- comunica acompanhamento;
- funciona como nome técnico e internacional.

Riscos:

- “coach” tem rejeição cultural em parte do público brasileiro;
- pode soar genérico;
- pode prometer acompanhamento humano.

**Aceitável como nome técnico interno e nome do GPT, mas não como principal expressão comercial.**

#### “Consulta Activve”

Vantagens:

- descreve a experiência;
- não exige que o usuário saiba o que é IA;
- comunica profundidade;
- funciona bem em CTAs: “Iniciar minha consulta”.

Riscos:

- “consulta” pode sugerir atendimento clínico;
- exige texto claro explicando que é planejamento de fitness e bem-estar, não consulta médica.

**Recomendado como nome do fluxo, com enquadramento adequado.**

#### “Planejamento Activve”

Vantagens:

- seguro;
- claro;
- sem promessa profissional indevida.

Riscos:

- frio;
- parece formulário ou serviço corporativo.

**Bom como subtítulo, fraco como nome de marca.**

#### “Meu Plano Activve”

Vantagens:

- orientado ao resultado;
- acessível para usuários leigos;
- não cria expectativa sobre quem atende.

Riscos:

- não nomeia a experiência conversacional.

**Recomendado como nome da área do plano no app.**

### 5.2 Arquitetura de nomes recomendada

Usar nomes diferentes para produto, fluxo e agente:

```text
Marca: Activve
Fluxo público: Consulta Activve
Resultado: Meu Plano
Agente/GPT: Activve Coach
CTA principal: Criar meu plano
```

Na interface, evitar abrir com “fale com nosso coach”. Preferir:

> Vamos montar um plano que caiba na sua vida.

Apresentação do agente:

> Sou o assistente de planejamento do Activve. Vou entender sua rotina, objetivo, treino, alimentação e limitações para organizar um plano personalizado. Não substituo avaliação de profissionais de saúde.

### 5.3 Nome de persona

Não criar uma persona humana na primeira versão. Um nome como “Auri”, “Vivi” ou semelhante pode gerar apego e identidade, mas também:

- infantilizar o produto;
- criar expectativa de companhia humana;
- dificultar tradução;
- fragmentar a marca Activve.

A esfera pode ser a presença visual sem precisar fingir ser uma pessoa.

Decisão recomendada para MVP:

- sem nome humano;
- assinatura visual forte;
- agente chamado apenas Activve Coach nos bastidores e na loja de GPTs.

---

## 6. Estrutura completa do GPT Activve

### 6.1 Papel

O GPT não é um gerador rápido de treino. Ele é o canal inicial da Consulta Activve.

Responsabilidades:

- conduzir anamnese adaptativa;
- identificar lacunas;
- aprofundar somente onde necessário;
- espelhar entendimento;
- aplicar regras de segurança;
- estruturar contexto;
- gerar plano;
- validar o plano;
- entregar o plano ao Activve;
- orientar revisão de ciclo.

Não responsabilidades:

- diagnosticar;
- prescrever tratamento;
- garantir resultado;
- inventar dados;
- esconder incerteza;
- substituir profissional humano;
- manter memória fora do que foi explicitamente fornecido.

### 6.2 Fonte única de verdade

Criar uma estrutura compartilhada no repositório:

```text
docs/ai/coach/
├── ACTIVVE_COACH_CORE.md
├── SAFETY_RULES.md
├── CONSULTATION_FLOW.md
├── PLAN_GENERATION_RULES.md
├── OUTPUT_QUALITY_CHECKLIST.md
├── adapters/
│   ├── CHATGPT_GPT.md
│   ├── GEMINI_GEM.md
│   ├── CLAUDE_ARTIFACT.md
│   └── API_SYSTEM_PROMPT.md
└── examples/
    ├── beginner-home.json
    ├── intermediate-gym.json
    ├── restrictions.json
    └── cycle-review.json
```

As plataformas não devem ter métodos diferentes. Elas recebem adaptações do mesmo núcleo.

### 6.3 Blocos da consulta

#### Bloco 0 — enquadramento e consentimento

Objetivos:

- explicar o que será feito;
- explicar limites;
- informar uso dos dados;
- confirmar idade mínima;
- obter aceite.

Perguntas mínimas:

- nome preferido;
- idade;
- confirmação de que entendeu o caráter não clínico.

#### Bloco 1 — objetivo e horizonte

Coletar:

- objetivo principal;
- objetivo secundário;
- motivação;
- prazo desejado;
- como a pessoa reconheceria progresso;
- experiências anteriores.

Evitar:

- prometer prazo;
- aceitar meta extrema sem questionamento;
- transformar peso em único indicador.

#### Bloco 2 — treino e ambiente

Coletar:

- experiência;
- local;
- equipamento;
- dias disponíveis;
- duração realista;
- horário;
- exercícios conhecidos;
- preferências e aversões;
- barreiras logísticas.

#### Bloco 3 — corpo e segurança

Coletar:

- dores;
- lesões;
- cirurgias;
- limitações;
- sintomas durante esforço;
- recomendações profissionais existentes.

Aplicar red flags.

#### Bloco 4 — rotina e recuperação

Coletar:

- trabalho;
- deslocamento;
- sono;
- estresse;
- responsabilidades familiares;
- regularidade da agenda;
- períodos de maior energia.

#### Bloco 5 — alimentação e realidade material

Coletar sem constrangimento:

- quem cozinha;
- tempo de preparo;
- onde compra;
- disponibilidade regional;
- alimentos comuns;
- itens caros demais para rotina;
- restrições e alergias;
- aversões;
- padrão de refeições;
- contexto social.

Evitar pedir orçamento exato quando hábitos de compra fornecem informação melhor.

#### Bloco 6 — relação com comida, corpo e motivação

Tratar com sensibilidade:

- histórico de dietas restritivas;
- episódios de descontrole;
- culpa;
- autoimagem;
- ansiedade relacionada à alimentação ou treino.

Não diagnosticar. Encaminhar quando necessário.

#### Bloco 7 — bem-estar e sustentação

Coletar:

- hobbies;
- lazer;
- práticas que acalmam;
- atividades sociais;
- leitura, música, jogos, filmes, caminhada, natureza;
- o que ajuda a retomar depois de semanas ruins.

O resultado deve ser apoio, não mais uma lista de obrigações.

#### Bloco 8 — resumo-espelho

Antes de gerar, devolver:

- objetivo;
- disponibilidade;
- limitações;
- contexto de alimentação;
- barreiras;
- preferências;
- prioridades;
- pontos de segurança.

Perguntar:

- está correto?;
- o que ficou errado?;
- falta algo importante?;

A geração só começa após confirmação.

#### Bloco 9 — geração e revisão

Gerar:

- contexto estruturado;
- documento do plano;
- treino;
- alimentação;
- bem-estar;
- justificativas;
- metadados;
- avisos e limites.

Executar checklist de qualidade antes da entrega.

### 6.4 Regras de conversa

- Uma pergunta ou pequeno conjunto por vez.
- A próxima pergunta depende da resposta anterior.
- Não repetir pergunta respondida.
- Aceitar “não sei” e “prefiro não responder”.
- Explicar por que uma pergunta sensível é necessária.
- Não despejar questionário completo.
- Não usar barra “12 de 40”.
- Usar etapas humanas: “Agora sobre sua rotina”.
- Permitir pausa e retomada.
- Corrigir entendimento sem penalizar.

### 6.5 Red flags

O GPT deve interromper ou limitar a geração diante de sinais como:

- dor aguda ou progressiva;
- desmaio;
- falta de ar incomum;
- dor no peito;
- sinais de transtorno alimentar;
- recuperação cirúrgica sem liberação;
- gestação com risco ou sem acompanhamento quando necessário;
- conflito com recomendação médica;
- sofrimento psíquico relevante;
- pedido de dieta extrema;
- pedido de uso de substância ou medicamento.

O comportamento esperado:

1. explicar que não é seguro prosseguir naquela parte;
2. orientar busca de profissional adequado;
3. permitir continuar somente com conteúdo seguro e genérico, quando aplicável;
4. registrar no plano apenas o necessário.

### 6.6 Saídas do GPT

#### Saída humana

Documento legível, com:

- ponto de partida;
- objetivo;
- contexto considerado;
- estratégia do ciclo;
- estrutura de treino;
- estratégia alimentar;
- substituições;
- bem-estar;
- prioridades em semanas difíceis;
- sinais para revisar o plano;
- limites e observações.

#### Saída técnica

`PlanFile` validado.

#### Saída de entrega

Link de resgate:

```text
https://activve.app/claim/<token>
```

Nunca expor JSON como ação principal.

### 6.7 Checklist antes de entregar

O GPT deve verificar:

- todos os campos obrigatórios;
- ids únicos;
- semana válida;
- exercícios compatíveis com equipamento;
- restrições respeitadas;
- tempo de sessão plausível;
- quantidade de exercícios plausível;
- alternativas presentes;
- racional coerente com respostas;
- alimentação compatível com rotina e disponibilidade;
- nenhuma promessa clínica;
- nenhum dado inventado;
- schema suportado;
- documento e JSON consistentes.

---

## 7. Experiência visual da consulta

### 7.1 Papel da esfera

A esfera energética pulsante é recomendada como assinatura visual, não como única interface.

Estados possíveis:

- repouso;
- ouvindo;
- processando;
- confirmando entendimento;
- atenção;
- plano pronto.

A esfera deve:

- responder à fala;
- reduzir movimento quando há texto longo;
- respeitar `prefers-reduced-motion`;
- nunca carregar informação essencial apenas por cor ou movimento;
- permitir pausa de animação;
- não competir com a pergunta.

### 7.2 Controles sempre visíveis

- pergunta escrita;
- responder falando;
- responder digitando;
- transcrição editável;
- não sei;
- prefiro não responder;
- voltar;
- pausar;
- continuar depois.

### 7.3 Modo voz

Para MVP, priorizar ditado e transcrição, não voz bidirecional contínua.

Motivos:

- menor custo;
- menor complexidade;
- maior acessibilidade;
- melhor correção de entendimento;
- menor risco de sessão longa e cara;
- menor dependência de streaming.

A conversa de voz em tempo real pode entrar depois de validar o fluxo por texto.

---

## 8. Handoff do plano para o app

### 8.1 Fluxo principal

```text
GPT/portal
→ gera PlanFile
→ envia para endpoint Activve
→ servidor valida
→ cria token temporário
→ retorna link
→ usuário abre
→ Activve mostra prévia
→ usuário confirma
→ plano é salvo localmente
→ token é invalidado
→ dado temporário é apagado
```

### 8.2 Requisitos do token

- alta entropia;
- curto prazo de expiração;
- uso único;
- sem dados sensíveis na URL;
- associação a versão do schema;
- invalidado após resgate;
- possibilidade de revogação;
- rate limit;
- logs sem conteúdo do plano.

### 8.3 Mesmo aparelho

CTA:

> Abrir no Activve

### 8.4 Computador para celular

Exibir:

- QR Code;
- código curto;
- envio opcional por e-mail.

### 8.5 App não instalado

O link deve abrir a web app e oferecer instalação depois.

Não bloquear o início do plano por ausência de instalação.

### 8.6 Fallback

- baixar cópia;
- copiar conteúdo;
- importar manualmente;
- enviar a profissional.

Fallback não pode ocupar a ação principal.

---

## 9. Estratégia de plataformas de IA

### 9.1 ChatGPT GPT

Uso recomendado para MVP de validação.

Vantagens:

- distribuição por link;
- usuário utiliza a própria conta;
- custo de modelo não recai diretamente sobre o Activve;
- possibilidade de Action;
- prova de mercado semelhante ao fluxo do Hevy.

Limitações:

- dependência da conta e limites do usuário;
- experiência controlada pela plataforma;
- memória entre novas conversas limitada;
- necessidade de política de privacidade para Actions;
- risco de mudança de regras da plataforma.

### 9.2 Gemini Gem

Uso recomendado como alternativa futura, não como equivalente inicial.

Vantagens:

- forte presença em contas Google;
- baixo atrito para usuários Android;
- conversa personalizada.

Limitações:

- handoff direto ao Activve pode não ter a mesma simplicidade de Actions públicas;
- risco de fluxo manual;
- duplicação de manutenção.

### 9.3 Claude

Claude Project não é canal público ideal.

Claude Artifact pode ser excelente para prototipar a interface da esfera, mas não deve ser assumido como canal universal de entrega.

### 9.4 Portal próprio com API

Destino recomendado depois da validação.

Vantagens:

- controle total;
- marca própria;
- acessibilidade;
- métricas;
- cobrança;
- retenção;
- pausa e retomada;
- handoff nativo;
- escolha de modelo;
- troca de fornecedor.

Desvantagens:

- custo de API;
- backend;
- segurança;
- suporte;
- observabilidade;
- responsabilidade sobre dados sensíveis.

### 9.5 Decisão recomendada

```text
Fase 1: GPT público + Action + claim
Fase 2: portal próprio em texto
Fase 3: voz e esfera completa
Fase 4: adaptadores Gemini/Claude conforme demanda medida
```

---

## 10. Evolução do schema

### 10.1 Correção de versão

O schema 1.2 já foi utilizado para campos da dieta. Portanto, a evolução de contexto, bem-estar, documento e rationale deve usar **1.3**, não 1.2.

### 10.2 Campos propostos

```ts
type PlanContext = {
  summary: string;
  constraints?: string[];
  preferences?: string[];
  motivations?: string[];
  resources?: string[];
};

type WellnessAnchor = {
  id: string;
  title: string;
  rationale: string;
  trigger?: string;
  fallback?: string;
};

type WellnessPlan = {
  anchors: WellnessAnchor[];
};

type PlanDocument = {
  format: "blocks-v1";
  sections: Array<{
    id: string;
    title: string;
    blocks: Array<
      | { type: "paragraph"; text: string }
      | { type: "list"; items: string[] }
      | { type: "callout"; text: string }
    >;
  }>;
};
```

Adicionar opcionalmente:

- `context`;
- `wellness`;
- `document`;
- `training.workouts[].rationale`;
- `training.workouts[].exercises[].rationale`;
- rationale de refeição mantendo compatibilidade com `why`;
- `meta.consultationId`;
- `meta.generatorVersion`;
- `meta.issuedBy`;
- `meta.claimVersion`.

### 10.3 Documento estruturado

Preferir blocos estruturados em vez de Markdown cru.

Benefícios:

- renderização previsível;
- menor risco de XSS;
- acessibilidade;
- impressão consistente;
- navegação por seções;
- evolução futura.

Se Markdown permanecer, sanitização rígida é obrigatória.

### 10.4 Compatibilidade

- planos 1.0–1.2 continuam válidos;
- campos novos opcionais;
- ausência de rationale degrada sem quebrar;
- app deve alertar versão superior não suportada;
- gerador e app precisam compartilhar contrato versionado.

---

## 11. Área “Meu Plano”

A personalização deve aparecer no uso diário.

Estrutura proposta:

```text
Meu ponto de partida
Por que este plano foi montado assim
Minha rotina considerada
Limitações e adaptações
Estrutura do treino
Estratégia alimentar
Bem-estar e sustentação
O que observar neste ciclo
Quando revisar
```

Reutilização do rationale:

- Hoje: por que este treino se encaixa;
- Modo Treino: por que o exercício foi escolhido;
- Alimentação: por que a refeição e as trocas fazem sentido;
- Relatórios: o que observar antes do próximo ciclo;
- Corpo: interpretação sem dramatização.

---

## 12. Arquitetura técnica recomendada

### 12.1 Separação de sistemas

```text
Activve App
- local-first
- IndexedDB
- execução
- histórico
- backup
- relatório

Activve Consultation Service
- sessão de consulta
- autenticação opcional
- modelo de IA
- geração
- validação
- cobrança
- claim temporário
- retenção mínima
```

### 12.2 API mínima

Endpoints candidatos:

```text
POST /api/consultations
GET  /api/consultations/:id
POST /api/consultations/:id/messages
POST /api/consultations/:id/confirm
POST /api/consultations/:id/generate
POST /api/claims
GET  /api/claims/:token/preview
POST /api/claims/:token/redeem
DELETE /api/consultations/:id
```

Para o GPT Action, expor apenas o mínimo:

```text
POST /api/gpt/claims
```

Payload:

- `planFile`;
- `document` se separado;
- `consentVersion`;
- `generator`;
- checksum.

Resposta:

- `claimUrl`;
- `expiresAt`;
- `claimCode`.

### 12.3 Validação em duas camadas

1. o modelo gera;
2. o servidor valida com Zod;
3. se inválido, correção automatizada limitada;
4. após limite de tentativas, falha clara;
5. nunca salvar plano inválido.

### 12.4 Independência de fornecedor

Criar interface:

```ts
interface ConsultationModel {
  ask(input: ConsultationInput): Promise<ConsultationTurn>;
  summarize(state: ConsultationState): Promise<ConsultationSummary>;
  generatePlan(state: ConfirmedConsultation): Promise<PlanGenerationResult>;
}
```

Adaptadores futuros:

- OpenAI;
- Anthropic;
- Gemini;
- modo manual.

---

## 13. Custos e controle financeiro

### 13.1 Premissa

O custo de uma consulta depende mais da arquitetura de contexto que do nome do modelo.

Evitar:

- reenviar catálogo inteiro a cada turno;
- reenviar exemplos completos;
- manter áudio bruto no contexto;
- regenerar plano inteiro para correção pequena;
- usar modelo caro para perguntas simples.

### 13.2 Arquitetura econômica

- estado estruturado da consulta;
- resumos incrementais;
- modelo econômico para condução;
- modelo mais forte apenas para geração/revisão;
- cache de instruções;
- validação local;
- correção apenas de trechos inválidos;
- limite de geração por compra.

### 13.3 Orçamento de validação

- créditos de API para protótipo: R$ 50–100;
- piloto: R$ 300–500;
- teto inicial comercial: R$ 1.000/mês;
- alertas de gasto em 50%, 75% e 90%;
- limite por usuário;
- bloqueio de abuso.

Valores precisam ser recalculados no momento da contratação, pois preços de modelos e câmbio mudam.

---

## 14. Modelo de negócio

### 14.1 Gratuito

O app gratuito inclui:

- execução;
- histórico;
- timer;
- carga, reps e RPE;
- peso e medidas;
- recuperação;
- relatórios;
- backup;
- importação;
- funcionamento offline.

### 14.2 Pago

O usuário paga por:

- anamnese;
- interpretação;
- plano personalizado;
- justificativas;
- ajustes de ciclo;
- entrega automática;
- continuidade do acompanhamento.

### 14.3 Preços para teste

#### Beta fundador

- plano inicial: R$ 39,90;
- renovação: R$ 29,90;
- anual fundador: R$ 199,90.

#### Preço-alvo

- plano inicial: R$ 69,90;
- renovação: R$ 49,90;
- assinatura: R$ 39,90/mês;
- anual: R$ 349,90.

### 14.4 Regras comerciais

- não vender vitalício;
- não bloquear histórico após cancelamento;
- não esconder renovação;
- permitir compra avulsa;
- mostrar o que cada ciclo entrega;
- reconsulta deve ser menor que a consulta inicial;
- preço deve refletir valor da análise, não custo de token.

---

## 15. Investimento recomendado

### 15.1 Reserva total

Reserva indicativa: R$ 50 mil a R$ 80 mil.

Não liberar tudo de uma vez.

### 15.2 Etapa 1 — beta comercial

R$ 12 mil a R$ 20 mil.

Inclui:

- schema 1.3;
- Meu Plano;
- GPT;
- Action;
- claim;
- pagamento;
- LGPD e termos;
- testes com usuários;
- observabilidade.

### 15.3 Etapa 2 — portal próprio/PWA

Adicional de R$ 12 mil a R$ 25 mil.

### 15.4 Etapa 3 — mobile

Adicional de R$ 20 mil a R$ 40 mil.

### 15.5 Marketing

Reserva de R$ 10 mil a R$ 20 mil, liberada gradualmente após retenção.

### 15.6 Critérios para iniciar mobile

- 100 usuários pagantes;
- R$ 5 mil de receita mensal por 3 meses;
- 70% das consultas iniciadas concluídas;
- 85% dos planos abertos sem ajuda;
- 25% comprando segundo ciclo;
- CAC abaixo de R$ 40;
- evidência de que loja limita crescimento.

---

## 16. PWA e migração mobile

### 16.1 Antes do mobile

Fechar PWA real:

- manifest;
- ícones;
- instalação;
- service worker;
- shell offline;
- atualização segura;
- cache de assets críticos;
- página offline;
- testes de retomada.

Local-first não é automaticamente PWA offline.

### 16.2 Estratégia mobile

Preferir Capacitor antes de considerar rewrite.

Motivos:

- preserva Next/React;
- reduz custo;
- permite deep links;
- notificações;
- câmera;
- compartilhamento;
- Health Connect/HealthKit futuramente.

Começar por Android. iOS exige ambiente macOS e operação adicional.

### 16.3 Quando considerar React Native

Somente se Capacitor demonstrar limites reais em:

- desempenho;
- background;
- integração com sensores;
- UX de treino;
- políticas de loja;
- manutenção.

Não reescrever por moda.

---

## 17. Segurança, privacidade e LGPD

### 17.1 Dados sensíveis

A consulta pode envolver:

- saúde;
- peso;
- dores;
- restrições;
- alimentação;
- aspectos psicológicos;
- rotina familiar;
- realidade financeira indireta.

### 17.2 Minimização

- não guardar transcrição completa por padrão;
- gerar resumo estruturado;
- apagar sessão após prazo definido;
- permitir exclusão imediata;
- separar dado operacional de conteúdo sensível;
- nunca registrar plano completo em logs.

### 17.3 Consentimento

Registrar:

- versão do consentimento;
- data;
- finalidade;
- política de retenção;
- fornecedor de IA;
- transferência necessária para geração;
- opção de apagar.

### 17.4 Segurança técnica

- TLS;
- criptografia em repouso;
- CSP;
- rate limit;
- validação de tamanho;
- sanitização;
- tokens de uso único;
- segredo apenas no servidor;
- segregação de ambientes;
- rotação de chaves;
- logs sem PII;
- monitoramento de abuso;
- dependabot;
- CI.

### 17.5 Transparência

O usuário deve saber:

- o que é enviado;
- por quanto tempo fica;
- quem processa;
- como apagar;
- o que fica somente no aparelho;
- o que não é substituição profissional.

---

## 18. Testes necessários

### 18.1 Déficit atual

A suíte de domínio é forte, mas o ambiente node-only não cobre adequadamente:

- DOM;
- efeitos;
- Strict Mode;
- IndexedDB;
- troca de plano;
- restauração;
- foco;
- navegação;
- claim.

### 18.2 Infra recomendada

- jsdom;
- Testing Library;
- fake-indexeddb;
- Playwright;
- testes em aparelho real.

### 18.3 Fluxos críticos

```text
GPT → claim → prévia → importação
consulta → pausa → retomada
resumo errado → correção → geração
plano inválido → correção controlada
computador → QR → celular
app não instalado → web → instalação
importação → primeiro treino
sair durante descanso → voltar
backup → apagar → restaurar
plano corrompido → recuperar
cancelar assinatura → manter histórico
apagar consulta → confirmar exclusão
```

### 18.4 Testes com usuários

Incluir:

- usuários avançados;
- pouco tecnológicos;
- maiores de 50;
- uso somente celular;
- computador para celular;
- dificuldade de digitação;
- baixa visão;
- reduced motion.

### 18.5 Metas

- 90% abrem o plano sem ajuda;
- mesmo aparelho: até 30 segundos entre plano pronto e aberto;
- computador para celular: até 90 segundos;
- 100% conseguem corrigir entendimento;
- ninguém precisa localizar Downloads;
- ninguém vê JSON no fluxo principal;
- consulta pode ser retomada;
- usuário explica por que ao menos duas decisões foram tomadas.

---

## 19. Métricas de produto

### 19.1 Aquisição

- origem;
- clique em Criar meu plano;
- início da consulta.

### 19.2 Ativação

- consentimento concluído;
- primeiro bloco concluído;
- resumo confirmado;
- plano gerado;
- plano resgatado;
- primeiro treino iniciado;
- primeiro treino concluído.

### 19.3 Retenção

- retorno em 7 dias;
- treinos concluídos;
- relatório aberto;
- ciclo concluído;
- reconsulta iniciada;
- renovação comprada.

### 19.4 Qualidade da IA

- correções de entendimento;
- planos inválidos;
- regenerações;
- red flags acionadas;
- abandono por bloco;
- satisfação com personalização;
- “este plano parece feito para mim”.

### 19.5 Financeiro

- custo por consulta;
- custo por plano válido;
- CAC;
- margem de contribuição;
- conversão para segundo ciclo;
- receita por usuário;
- reembolso.

---

## 20. Backlog recomendado

### Faixa A — corrigir o cano

1. Corrigir `CONSULTA_SPEC.md` para schema 1.3.
2. Criar contrato da task.
3. Adicionar context, wellness, document e rationale.
4. Atualizar parse, testes e documentação.
5. Criar Meu Plano.
6. Mostrar rationale nas telas.
7. Atualizar gerador.

### Faixa B — GPT e claim

1. Criar `ACTIVVE_COACH_CORE.md`.
2. Criar adaptador ChatGPT.
3. Definir OpenAPI da Action.
4. Criar endpoint de claim.
5. Validar com Zod.
6. Criar `/claim/[token]`.
7. Criar prévia.
8. Resgatar para IndexedDB.
9. Expirar e apagar.
10. Criar QR e código curto.

### Faixa C — beta pago

1. Landing page.
2. Pagamento.
3. Limite de uso.
4. Termos e privacidade.
5. Suporte.
6. Analytics de funil.
7. Convite de fundadores.

### Faixa D — qualidade técnica

1. jsdom.
2. Testing Library.
3. fake-indexeddb.
4. Playwright.
5. CI.
6. Refatorar god component de treino.
7. Testes de ciclo de vida.

### Faixa E — PWA

1. Manifest.
2. Service worker.
3. Instalação.
4. Offline shell.
5. Atualizações.
6. Testes de descarte.

### Faixa F — portal próprio

Somente após validação paga.

---

## 21. Fora de escopo imediato

- rede social;
- feed;
- rankings;
- competição;
- marketplace de profissionais;
- diagnóstico;
- prescrição médica;
- voz contínua em tempo real;
- integração completa com wearables;
- rewrite React Native;
- múltiplos provedores lançados simultaneamente;
- plano vitalício;
- gamificação punitiva.

---

## 22. Riscos principais

### Risco 1 — parecer formulário longo

Mitigação:

- adaptação;
- uma pergunta por vez;
- espelhamento;
- etapas humanas;
- pausa.

### Risco 2 — parecer atendimento clínico

Mitigação:

- linguagem;
- limites;
- nome;
- disclaimers;
- red flags;
- revisão jurídica.

### Risco 3 — dependência do ChatGPT

Mitigação:

- núcleo agnóstico;
- claim próprio;
- schema próprio;
- adaptadores.

### Risco 4 — custo de API crescer

Mitigação:

- validação via GPT primeiro;
- estado estruturado;
- modelos em camadas;
- limites;
- observabilidade.

### Risco 5 — plano tecnicamente válido e humanamente ruim

Mitigação:

- checklist;
- exemplos;
- rationale obrigatório em pontos-chave;
- teste com usuários;
- revisão de amostras.

### Risco 6 — complexidade antes de receita

Mitigação:

- gates de investimento;
- MVP com GPT;
- sem voz contínua;
- sem mobile precoce.

---

## 23. Decisões recomendadas para aprovação humana

1. Nome público do fluxo: **Consulta Activve**.
2. CTA: **Criar meu plano**.
3. Nome da área: **Meu Plano**.
4. Nome técnico do GPT: **Activve Coach**.
5. Sem persona humana no MVP.
6. GPT como canal inicial de validação.
7. Portal próprio somente após prova paga.
8. PlanFile invisível no fluxo comum.
9. Handoff por claim, link e QR.
10. Schema novo: 1.3.
11. Documento estruturado, não Markdown cru.
12. App gratuito; análise/plano pagos.
13. Beta fundador a R$ 39,90.
14. Mobile somente após gates de receita e retenção.
15. Capacitor antes de rewrite.

---

## 24. Instrução de revisão para o Claude Code

Antes de implementar, o Claude Code deve produzir uma revisão escrita contendo:

1. quais recomendações concordam com o estado real do código;
2. quais estão superadas;
3. quais conflitam com ADRs;
4. quais exigem decisão jurídica ou comercial;
5. quais dependem de backend;
6. proposta de tasks em ordem;
7. riscos por task;
8. critérios de aceite;
9. plano de rollback;
10. estimativa relativa de esforço;
11. arquivos que seriam alterados;
12. gates de teste;
13. qual é a menor fatia vertical que prova valor.

A primeira implementação recomendada deve ser pequena o bastante para validar:

```text
plano 1.3
→ Meu Plano
→ rationale visível
```

antes de construir o portal inteiro.

---

## 25. Conclusão

O Activve não precisa de mais um gerador de treino. Precisa transformar sua personalização profunda em algo visível, fácil de receber e valioso a cada ciclo.

A direção recomendada é:

```text
método próprio
→ GPT para validação barata
→ entrega invisível por claim
→ app gratuito e local-first
→ plano e revisão pagos
→ portal próprio após prova
→ mobile após retenção
```

A esfera pulsante pode se tornar uma assinatura memorável. Mas a vantagem competitiva continuará sendo outra: entender a vida real, explicar decisões e remover atrito sem tratar o usuário como incapaz nem como culpado.
