# Decisão de entrega — Abrir no Activve + PDF do usuário

> Data: 2026-08-04  
> Status: decisão aprovada para o beta fechado, corrigida após revisão técnica  
> Escopo: entrega do plano pelo GPT Activve Health Coach e entrada no app  
> Esta decisão substitui, no fluxo principal, qualquer orientação de manipulação manual de JSON pelo participante.

---

## 1. Decisão central

O plano terá três representações, cada uma com uma função diferente:

1. **Abrir no Activve** — experiência final desejada para o usuário;
2. **PDF gerado pelo Activve** — cópia humana permanente;
3. **PlanFile/JSON** — contrato técnico invisível entre coach, ponte de entrega e app.

O usuário comum não deve conhecer, editar, localizar ou interpretar JSON.

A experiência-alvo é:

```text
conversa concluída
→ entendimento confirmado
→ plano gerado e validado
→ plano entregue ao Activve
→ prévia no app
→ usuário confirma
→ plano fica ativo
→ usuário pode baixar o PDF pelo próprio Activve
```

Esta experiência exige uma ponte mínima de handoff. Ela não acontece apenas com instruções do GPT.

---

## 2. Separação entre experiência-alvo e beta inicial

### 2.1 Experiência-alvo do beta

Ao concluir o plano, o usuário recebe uma ação principal:

> **Seu plano está pronto.**  
> [ Abrir no Activve ]

Ao tocar:

1. o Activve abre no navegador, PWA ou app disponível;
2. recupera o plano por um token temporário;
3. valida o PlanFile no schema real;
4. mostra uma prévia amigável;
5. o usuário toca em **Adicionar ao Activve**;
6. o plano é salvo localmente;
7. o token é invalidado;
8. o usuário segue para `Meu Plano` ou `Hoje`;
9. dentro do Activve, pode tocar em **Baixar meu plano em PDF**.

O link não deve expor conteúdo do plano nem dados pessoais na URL.

### 2.2 O que isso exige tecnicamente

“Abrir no Activve” exige uma ponte mínima com:

- endpoint de envio do PlanFile;
- armazenamento temporário;
- token aleatório e de uso único;
- expiração;
- recuperação pelo app;
- validação no schema real;
- exclusão ou invalidação após resgate;
- tratamento de erro e repetição segura.

Isso é uma infraestrutura de **claim/handoff**, ainda que pequena. Não é uma API comercial completa, não exige conta, OAuth, cobrança ou portal, mas exige servidor e armazenamento temporário.

### 2.3 Beta antes da ponte

Enquanto a ponte não estiver pronta, o fluxo será assistido:

1. o GPT gera o PlanFile internamente;
2. o dono ou responsável técnico valida o plano;
3. o plano é carregado no Activve do participante com assistência;
4. o participante nunca precisa abrir ou editar o JSON;
5. depois de ativado, o próprio Activve gera o PDF.

O objetivo deste estágio é validar coach, plano, app e revisão de ciclo sem obrigar o participante a executar tarefa técnica.

---

## 3. PDF obrigatório, gerado pelo Activve

O PDF é um artefato oficial do ciclo, mas **não deve ser gerado pelo GPT**.

O app já possui o `document` dentro do PlanFile 1.3 e capacidade de impressão. Portanto, o Activve é a fonte correta para gerar o PDF, porque:

- usa exatamente o plano que foi validado e ativado;
- evita divergência entre texto do coach e dados do app;
- não depende de capacidade de criação de PDF da plataforma conversacional;
- mantém identidade visual consistente;
- pode gerar novamente o arquivo a qualquer momento;
- funciona tanto no primeiro ciclo quanto em ciclos futuros.

O usuário deve encontrar no app:

> **Baixar meu plano em PDF**

O botão pode usar o fluxo de impressão existente, aprimorado com layout próprio para PDF.

### 3.1 Para que o PDF existe

- guardar uma cópia do ciclo;
- consultar fora do app;
- imprimir;
- compartilhar com profissional ou pessoa de confiança;
- acompanhar durante indisponibilidade temporária do app;
- comparar ciclos anteriores;
- manter registro pessoal independente da plataforma conversacional.

O PDF não é mecanismo de importação e não precisa carregar estrutura técnica.

### 3.2 Estrutura mínima do PDF

1. capa com nome do usuário, nome do ciclo e data;
2. resumo do que foi entendido;
3. objetivo e horizonte do ciclo;
4. prioridades e limitações consideradas;
5. estratégia de treino;
6. treinos completos;
7. exercícios, séries, repetições, descansos e esforço;
8. alternativas e observações de segurança;
9. estratégia alimentar;
10. refeições, porções e substituições;
11. opções econômicas e regionais;
12. preparo e lista de compras, quando aplicável;
13. plano de bem-estar;
14. versão mínima para semanas difíceis;
15. como acompanhar o ciclo;
16. quando revisar;
17. identificação discreta do plano e da versão;
18. link curto ou QR Code para abrir a página correspondente no Activve, quando a ponte existir.

### 3.3 Qualidade mínima

O PDF deve:

- ser confortável de ler no celular;
- ter hierarquia visual clara;
- evitar tabelas largas;
- não conter JSON;
- não conter instruções técnicas;
- refletir exatamente o plano ativo no app;
- usar linguagem humana e personalizada;
- permitir impressão sem quebras absurdas;
- usar nome de arquivo legível, por exemplo:

```text
Activve_Rui_Ciclo_01_2026-08.pdf
```

---

## 4. Papel do PlanFile/JSON

O JSON continua existindo porque o app precisa de estrutura, IDs, relações e dados validáveis.

Ele serve para:

- transportar treino, alimentação, bem-estar e documento;
- preservar IDs entre ciclos;
- validar referências;
- alimentar o IndexedDB;
- manter continuidade histórica;
- permitir suporte técnico e backup.

Regra de produto:

> O PlanFile é infraestrutura. O PDF é documento. O link é experiência.

O PlanFile deve permanecer invisível ao participante sempre que o fluxo assistido ou a ponte puderem resolver a entrega.

---

## 5. QR Code e limitações reais

Um PlanFile completo não cabe de forma segura e confiável em um QR Code comum.

Portanto:

- o QR Code não transporta o plano;
- o QR Code transporta apenas um link ou token curto;
- esse link consulta o plano na ponte temporária;
- sem a ponte, não existe QR Code funcional para o plano completo.

Não documentar QR Code como solução independente de servidor.

---

## 6. Fallbacks por estágio

### Antes da ponte

1. entrega assistida pelo dono;
2. validação e carga do PlanFile no Activve;
3. participante usa apenas o app;
4. PDF gerado pelo app;
5. suporte técnico manipula o JSON quando necessário.

### Depois da ponte

1. **Abrir no Activve**;
2. QR Code ou link curto para outro aparelho;
3. prévia e confirmação;
4. PDF gerado pelo app;
5. assistência somente em caso de falha.

Removidos da experiência normal do participante:

- copiar JSON;
- salvar bloco de código;
- localizar arquivo `.json`;
- interpretar erro de schema;
- usar PDF como arquivo de importação.

---

## 7. Entrega final do GPT

### Antes da ponte

O GPT informa:

> **Seu plano está pronto para validação no Activve.**  
> A equipe do beta fará a ativação no app. Depois disso, você poderá consultar tudo no Activve e baixar sua cópia em PDF por lá.

O GPT entrega o PlanFile apenas ao fluxo técnico responsável, não como tarefa do participante.

### Depois da ponte

O GPT informa:

> **Seu plano está pronto.**  
> [ Abrir no Activve ]

Depois de ativar o plano, o app oferece:

> [ Baixar meu plano em PDF ]

A ação de PDF pertence ao Activve, não ao GPT.

---

## 8. Retorno do app para o coach

O fim do ciclo segue o mesmo princípio:

- o Activve gera o relatório estruturado para análise do coach;
- o Activve também gera uma versão legível em PDF para o usuário;
- o usuário pode anexar o PDF ao GPT quando necessário;
- para revisão precisa, o ReportFile estruturado continua sendo a fonte técnica;
- no beta assistido, o responsável pode ajudar no envio do ReportFile sem exigir domínio técnico.

O relatório em PDF deve incluir:

- identificação do ciclo;
- treinos planejados e realizados;
- aderência;
- cargas e progressões;
- esforço;
- exercícios trocados ou evitados;
- notas;
- recuperação;
- peso e medidas quando disponíveis;
- dados ausentes explicitamente indicados;
- resumo visual da evolução;
- principais pontos para revisão.

O usuário deve conseguir guardar tanto o plano inicial quanto o relatório final de cada ciclo.

---

## 9. Critérios de aceite

### PDF

- gerado pelo Activve;
- corresponde ao plano ativo;
- abre bem no celular;
- pode ser salvo, impresso e compartilhado;
- pode ser gerado novamente;
- não contém payload técnico.

### Beta assistido

- participante não manipula JSON;
- responsável consegue validar e ativar o plano;
- participante encontra plano, treino, alimentação e bem-estar;
- participante consegue baixar PDF;
- dificuldades são registradas.

### Ponte de handoff

- link abre a prévia correta;
- token é temporário e de uso único;
- plano não aparece na URL;
- schema é validado no app;
- resgate repetido é tratado corretamente;
- QR Code abre o mesmo link em outro aparelho;
- falha do handoff não destrói o plano nem o histórico local.

---

## 10. Impacto sobre os demais documentos

As seções de entrega em `FOCO_BETA_FECHADO_ACTIVVE_2026-08.md` e `GPT_ACTIVVE_HEALTH_COACH_SPEC_2026-08.md` devem ser interpretadas com estas correções:

- JSON nunca é experiência de usuário;
- PDF é obrigatório, mas gerado pelo app;
- “Abrir no Activve” exige claim/handoff mínimo;
- antes do claim, o beta é assistido;
- QR Code contém link/token, nunca o plano completo;
- o app é a fonte final do documento e do PDF;
- o GPT gera conteúdo e PlanFile, mas não é responsável pelo PDF final.

Esta decisão é vinculante para o beta fechado.
