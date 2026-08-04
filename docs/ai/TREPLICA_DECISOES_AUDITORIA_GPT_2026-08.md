# Tréplica — revisão crítica das "Decisões após a revisão da Auditoria Estratégica"

> **Objeto:** `docs/ai/DECISOES_POS_REVISAO_AUDITORIA_GPT_2026-08.md` (522 linhas, commit
> `e120592`), na branch remota `ai/TASK-032-auditoria-gpt-activve-gpt`.
> **Documentos anteriores:** `AUDITORIA_ESTRATEGICA_GPT_ACTIVVE_2026-08.md` (mesma branch) e
> `REVISAO_AUDITORIA_GPT_2026-08.md` (commit `53f4388`, já em `main`).
> **Data:** 2026-08-04. **Nada foi implementado. Nenhum merge foi feito. Nenhum código alterado.**
>
> **Base de comparação:** `main` = `cc9a6c0` (inclui o merge `c9aa82f` da TASK-032).
> ⚠️ `main` está **10 commits à frente de `origin/main`** (`23d9cdc`) — o push não foi feito
> porque dispara o deploy do Vercel, e isso é decisão do dono do produto.
>
> ⚠️ **A branch da auditoria moveu durante esta revisão** (`e120592` → `a13ebf1`). O commit novo
> adiciona apenas `PROMPT_TREPLICA_AUDITORIA_GPT_2026-08.md`; **o documento revisado aqui não
> mudou**. Verificado com `git diff e120592..a13ebf1`.

---

## 1. Resumo executivo

A réplica do GPT é **boa e, em quase tudo, correta**. Ela aceita as correções do parecer
anterior sem resistência, e as duas qualificações que faz (PWA não é bloqueador absoluto de
piloto pequeno; risco regulatório nasce da entrega, não do nome) são **as duas melhores
contribuições do documento** — a segunda corrige o meu próprio parecer, que tratou o nome como
o problema central.

Mas o documento tem **um defeito estrutural e três falhas de conteúdo**:

**O defeito estrutural:** a réplica descreve como *plano futuro* coisas que já são *fato
consumado*. A §8 "Etapa 0" manda "corrigir os dois achados de review" e a §11 manda "Claude
Code deve terminar os dois achados" — ambos foram corrigidos, revisados em 3 ciclos, aprovados
pelo dono e **mergeados em `main` em 2026-08-03**. A §3.3 lista "renderizar títulos como
`h2`/`h3` reais" como requisito pendente: está feito. Isso não é culpa do autor (ele escreveu
antes), mas significa que **quem ler a réplica hoje como plano de ação vai refazer trabalho
pronto**. Um terço do documento é sobre um repositório que não existe mais.

**As três falhas de conteúdo:**

1. **`context` estruturado é tratado como decisão pendente. Não é.** O `context: string` foi
   publicado no schema 1.3 e está em `main`. Estruturá-lo agora é **mudar um campo publicado**,
   o que a política 1.x proíbe. A réplica não oferece caminho de migração. Há um, barato, e
   está na §10 desta tréplica.
2. **O `context` proposto colide com o `profile` que já existe.** `profile.restrictions`,
   `profile.notes`, `environment`, `daysPerWeek` e `sessionMinutes` já carregam parte do que as
   quatro listas novas carregariam. Sem uma fronteira declarada, o gerador (um LLM) vai
   distribuir o mesmo fato em lugares diferentes a cada ciclo. É a classe de bug mais cara
   deste projeto, agora no contrato — onde custa mais, porque é bidirecional.
3. **O beta pago via OAuth é caro demais para a pergunta que precisa responder.** A réplica
   admite que "um GPT não é um paywall perfeito" e mesmo assim desenha conta + entitlement +
   OAuth para o beta. Construir isso para descobrir se alguém paga um segundo ciclo é a forma
   cara de aprender o que uma chave Pix e dez conversas respondem.

**Divergência de ordem:** a réplica coloca PWA na Etapa 6, depois de claim e Action. Recomendo
**antes**, e por um motivo de evidência: notificação em segundo plano é o **único item de
demanda validada** que resta no backlog inteiro — veio do uso real, está aberto desde a
TASK-028 e exige service worker. Claim e Action resolvem uma fricção **hipotética**. Construir
o hipotético antes do validado inverte a régua que o próprio documento defende.

**E uma coisa que nenhum dos três documentos diz:** o coach que existe e funciona hoje é um
**Claude Project**, não um GPT. Toda a estratégia de plataforma da auditoria assume ChatGPT.
Isso é uma **portabilidade de spec + risco de plataforma nova**, custo que ninguém contabilizou.

---

## 2. Fatos confirmados no código

Tudo abaixo foi verificado no repositório em 2026-08-04, não em mensagem de commit.

| Afirmação a verificar | Realidade | Evidência |
|---|---|---|
| A branch `ai/TASK-032-personalizacao-visivel-claude` existe | **Não existe mais.** Foi mergeada (`c9aa82f`, `--no-ff`) e apagada em 2026-08-03. Nunca esteve no remoto. Sha preservado: `32b68ee` | `git log`, `git ls-remote` |
| Os "dois achados de review" continuam pendentes | **Não.** Ambos corrigidos, mais 3 achados novos que saíram de 3 ciclos de `codex review` | `6fabd4b`, `b511292`, `ab7f633`, `e8f06fd` |
| Quantos testes passam | **361 testes, 22 arquivos** (eram 350 quando a réplica foi escrita) | `npx vitest run` |
| O schema implementado é 1.3 | **Sim.** `examples/plano-exemplo.json` declara `1.3`; changelog em `PLAN_SCHEMA.md` §6 | `schema.ts`, `PLAN_SCHEMA.md:138` |
| `context` já foi estruturado | **Não.** Continua `z.string().max(2000).optional()` | `schema.ts:228` |
| `why` está em refeição, treino e exercício | **Sim, em quatro lugares** — exercício (`:50`), treino (`:67`), refeição (`:162`) e hábito de bem-estar (`:197`) | `schema.ts` |
| A tela "Meu Plano" existe | **Sim**, `/plano`: espelho (`context`) → bem-estar (`wellness`) → Documento (Markdown) → aviso de "formato anterior" quando o plano é 1.0–1.2 | `src/app/plano/page.tsx` |
| A acessibilidade do Markdown continua pendente | **Não.** Títulos renderizam `<h2>…<h4>` reais via `headingTag()`; a região do Documento tem `aria-label`. Medido no browser: `H1 › H2 › H3` | `markdown.ts`, `Markdown.tsx`, `6fabd4b` |
| Existe colisão entre duas TASK-032 | **Sim, e piorou.** A branch remota da auditoria ainda se chama `ai/TASK-032-auditoria-gpt-activve-gpt`, e o id TASK-032 agora pertence a uma task **mergeada** | `git ls-remote` |
| Manifest e service worker continuam ausentes | **Sim, ausentes.** Não há `manifest.ts`/`manifest.json`, não há `sw.ts`, `next.config.ts` está vazio, e `layout.tsx` declara `metadata` e `viewport.themeColor` mas **nenhum `manifest`** | `ls`, `next.config.ts`, `layout.tsx:15-24` |

**Fatos adicionais que mudam a leitura da réplica:**

| Fato | Evidência | Por que importa |
|---|---|---|
| `parse.ts` valida **apenas o MAJOR** da versão | `parse.ts:10,46` (`SUPPORTED_MAJOR = "1"`) | Um plano 1.9 de um gerador futuro é aceito silenciosamente, com os campos novos ignorados. A §10.4 da auditoria pede "alertar versão superior não suportada" — **isso não existe**, e é decisão consciente da política aditiva. Vale registrar como limite conhecido, não como bug |
| `profile.restrictions` e `profile.notes` **não são lidos por nenhum código** | `grep` em `src/`: zero consumidores fora do schema | São campos mortos do contrato que **sobrepõem** o `context.constraints` proposto. Ver §10 |
| `/alimentacao` renderiza `meal.why` com truthiness crua | `alimentacao/page.tsx:196` | A classe "campo presente não é conteúdo", fechada ontem em `/plano`, Hoje e Modo Treino, **continua aberta na Alimentação**. `meal.why = "   "` desenha um card com ícone e texto vazio |
| **ADR-006 é citado mas não existe** | `PLAN_SCHEMA.md:148` cita "(ADR-006)"; `DECISIONS.md` tem ADR-000 a ADR-005 e um template | Documentação que aponta para decisão inexistente — mesma classe da afirmação falsa de PWA. E o **1.3 não tem ADR nenhum** |
| `CONSULTA_SPEC.md` ainda fala em **1.2** e usa **`rationale`** | `CONSULTA_SPEC.md:139,149,191` | Duas defasagens, não uma. O parecer anterior só apontou a da versão |
| `GENERATOR_1.1.md` ensina o schema **1.1** | `GENERATOR_1.1.md:1` | O gerador não sabe emitir `context`, `wellness`, `document` nem `why`. **Hoje ninguém consegue produzir um plano 1.3 sem escrever JSON à mão** |
| O coach roda como **Claude Project** | `coach/ACTIVVE_HEALTH_SYSTEM.md:4` | Ver §8 |
| A suíte é node-only **e só coleta `*.test.ts`** | `vitest.config.ts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`) | Faixa D precisa mudar o `include` também — um `.test.tsx` hoje **não roda e não avisa** |
| `devDependencies` não tem jsdom, Testing Library, fake-indexeddb nem Playwright | `package.json` | Faixa D está em 0%, confirmado |

---

## 3. Pontos aprovados

| # | Ponto da réplica | Por que procede |
|---|---|---|
| 3.1 | **`why` em vez de `rationale`** (§2, §3.1) | Correto. Veredito completo na §10 |
| 3.2 | **Manter Markdown como transporte, com subconjunto documentado e sem HTML cru** (§3.3) | Correto, e verificado: **zero ocorrências de `dangerouslySetInnerHTML` em todo o `src/`** |
| 3.3 | **"O GPT não é fronteira confiável de cobrança"** (§4.1) | Rigorosamente correto, e é o ponto mais importante que a réplica fixa. Instrução de GPT não é controle de acesso |
| 3.4 | **"O risco regulatório nasce do que o produto entrega, não do nome"** (§1) | Correto, e **corrige o meu parecer anterior**, que tratou o nome como o eixo. Trocar "Consulta" por "Planejamento" sem mexer na entrega é cosmética jurídica |
| 3.5 | **Telemetria mora na camada de consulta, nunca no histórico local** (§2, §6.2) | Correto e coerente com o local-first. É a única forma de instrumentar sem contradizer a promessa de privacidade |
| 3.6 | **Transcrição integral nunca entra no `PlanFile`** (§6.1) | Correto. O `PlanFile` é exportado, versionado e trafega em backup — transcrição ali seria dado sensível vazando por design |
| 3.7 | **Histórico e backup nunca bloqueados por cancelamento** (§10, herdado) | Correto e já implementado (TASK-031) |
| 3.8 | **Não usar o GPT como paywall; não publicar Action sem política; não chamar de PWA antes de existir** (§10) | Corretos. O terceiro **já foi executado** ontem no `AGENTS.md` §2 |
| 3.9 | **Piloto pequeno no navegador não exige PWA, desde que não prometa instalação/offline** (§1) | Procede — com a ressalva da §12 |
| 3.10 | **Portal próprio como destino, não como ponto de partida** (§4.4) | Correto. Construir API antes de evidência de pagamento é o erro clássico |
| 3.11 | **Critérios de avanço numéricos** (§9) | A existência dos gates é mais valiosa que os números específicos. Manter |

---

## 4. Pontos parcialmente aprovados

### 4.1 "Corrigir os dois achados de review" (§8 Etapa 0, §11.1)

- **Afirmação analisada:** o trabalho pendente é corrigir dois achados na branch de
  personalização e apresentar diff e gates para aprovação humana.
- **Evidência:** os dois foram corrigidos em 2026-08-03 (`6fabd4b`), o review encontrou mais
  três (`b511292`, `ab7f633`, `e8f06fd`), o dono aprovou e o merge foi feito (`c9aa82f`). Gates
  revalidados na `main`: typecheck ✓ · lint ✓ · 361/361 ✓ · build ✓.
- **Conclusão:** a instrução está **cumprida e superada**. Dos cinco achados, três não estavam
  previstos por nenhum dos documentos.
- **Recomendação:** substituir a Etapa 0 da réplica por "validar com um humano real" (§14).
- **Impacto se ignorado:** retrabalho e, pior, a impressão de que a Faixa A ainda é risco aberto
  quando ela já é o alicerce das faixas seguintes.

### 4.2 "Manter a implementação como TASK-032 e renumerar a auditoria documental" (§8 Etapa 0)

- **Evidência:** correto e ainda **não executado**. A branch remota segue
  `ai/TASK-032-auditoria-gpt-activve-gpt` (`a13ebf1`), e TASK-032 já é uma task mergeada.
- **Conclusão:** procede, e ficou mais urgente — a colisão não é mais entre duas branches
  abertas, é entre uma branch aberta e um id **já consumido pelo histórico**.
- **Recomendação:** renomear a branch remota para `ai/TASK-034-auditoria-gpt-activve-gpt`,
  reapontando o PR #2. Esta tréplica ocupa **TASK-035** justamente para não roubar o 034.
- **Impacto se ignorado:** o `STATUS.md` indexa por id; duas coisas diferentes com o mesmo id
  tornam o histórico ambíguo para sempre, e isso não se conserta depois.

### 4.3 `context` estruturado (§2, §3.2)

Aprovo **o princípio** (o app não deve inferir categorias lendo prosa) e **rejeito a forma como
está**, por dois motivos independentes: é mudança de campo publicado sem caminho de migração, e
colide com o `profile`. Tipo final recomendado na §10.

### 4.4 Ordem de execução (§8)

Aprovo a espinha (fechar valor → qualidade → jurídico → handoff → escala) e divirjo em três
posições. Ordem corrigida na §14.

### 4.5 "Nenhum código de resgate digitado manualmente no fluxo principal" (§4.3)

- **Afirmação analisada:** códigos curtos devem ser descartados.
- **Conclusão:** certo como **fluxo principal**, errado como **descarte total**. O documento
  quer QR para o caminho computador→celular; QR falha (câmera ruim, luz, print compartilhado,
  usuário que não sabe usar). Um código curto de 6 caracteres é o *fallback* mais barato que
  existe e não custa quase nada quando o token já existe.
- **Recomendação:** código curto **existe, mas nunca é o primeiro caminho oferecido**.
- **Impacto se ignorado:** o suporte vira manual justamente com o usuário menos tecnológico —
  exatamente o perfil que o §12 do pedido diz querer proteger.

---

## 5. Pontos rejeitados

### 5.1 Beta pago começando por conta + entitlement + OAuth (§4.3)

- **Afirmação analisada:** o beta pago deve começar no Activve, com conta mínima, pagamento e
  Action autenticada por OAuth ligando a conta Activve ao GPT.
- **Evidência no repositório:** não existe backend, conta, auth nem rota de API
  (`src/app/api/` não existe; `next.config.ts` vazio; export estático testado e funcional). O
  `AGENTS.md` §2 e o ADR-001 dizem "v1 local-first, **sem conta**". OAuth exige servidor de
  autorização, tela de consentimento, política publicada e gestão de tokens.
- **Conclusão:** **desproporcional para a pergunta do beta.** A pergunta é "alguém paga por um
  segundo ciclo?". OAuth não ajuda a respondê-la; ajuda a *cobrar em escala* depois que a
  resposta já é sim. E a própria réplica admite que a fronteira continua furada (o GPT exibe o
  plano no chat independentemente da Action) — ou seja, paga-se caro por um portão que vaza.
- **Recomendação:** para o primeiro beta, **link de sessão assinado** (§8), não OAuth. OAuth
  entra junto com o portal próprio, quando já existirem contas por outro motivo.
- **Impacto se a decisão errada for tomada:** semanas de trabalho em identidade e um ADR de
  revogação do local-first, antes de haver um único pagante. Se a hipótese central falhar, tudo
  isso é jogado fora — e a hipótese central ainda não foi testada com **nenhum** usuário além do
  dono.

### 5.2 PWA na Etapa 6, depois de claim e Action (§8)

- **Evidência:** o item 2 do feedback de uso real ("contador/notificação com o app em segundo
  plano") está aberto desde a TASK-028, é o **último item não resolvido dos sete**, e o
  `STATUS.md` registra que só um service worker (ou Capacitor) resolve.
- **Conclusão:** a réplica adia a única demanda **validada** para depois de duas construções
  **hipotéticas**. Inverte a régua de evidência que o próprio documento defende na §9.
- **Recomendação:** PWA logo depois da infraestrutura de testes, antes de claim e Action.
- **Impacto se ignorado:** os testadores do piloto vão reportar exatamente o mesmo problema que
  o dono já reportou — gastando a boa vontade de um beta para reconfirmar um bug conhecido.

### 5.3 "GPT público" tratado como canal de aquisição gratuito (§4.2, herdado da auditoria §9.1)

- **Afirmação analisada:** o GPT distribui por link, o usuário usa a própria conta, e o custo do
  modelo não recai sobre o Activve.
- **Evidência:** verdadeiro quanto ao custo de token. Mas o coach que existe **é um Claude
  Project** (`coach/ACTIVVE_HEALTH_SYSTEM.md:4`), não um GPT — a migração é trabalho não
  contabilizado. E ambas as plataformas (GPTs personalizados e Claude Projects) são recursos de
  **assinatura de consumidor**; a política de acesso de cada uma muda com frequência e **não é
  verificável a partir deste repositório**.
- **Conclusão:** "aquisição gratuita" pode ser falso na prática — o funil começaria atrás da
  assinatura de outra empresa, e a decisão de comprá-la não é sua.
- **Recomendação:** antes de investir na porta do GPT, **confirmar na documentação da plataforma
  quem consegue abrir um GPT com Action sem pagar assinatura**. Se a resposta for "só assinantes",
  o GPT serve para validar com early adopters, nunca como canal de aquisição de massa — e o salto
  para o portal próprio deve ser antecipado.
- **Impacto se errado:** construir um estágio inteiro (GPT + Action + OAuth) que é descartado ao
  chegar no portal, tendo alcançado só o público que já paga ChatGPT.

### 5.4 "Planejamento Activve" como nome público (§2, §5.1)

Rejeito como escolha, não como direção. Detalhe na §9.

---

## 6. Erros ou lacunas novas

**6.1 — `context` estruturado sem caminho de migração (lacuna crítica).** A réplica decide
estruturar um campo que **já foi publicado como string** e está em `main`. Não menciona
compatibilidade nem migração. Solução na §10.

**6.2 — Colisão `context` × `profile` (lacuna crítica).** `profile.restrictions: string[]` e
`profile.notes: string(1000)` já existem e **nenhum código os lê**. Somar `context.constraints`
e `context.preferences` cria três lugares plausíveis para "não posso fazer supino com barra".
Um LLM vai escolher diferente a cada geração. A fronteira precisa ser declarada **antes** do
bump, não depois.

**6.3 — O gerador não sabe emitir 1.3 (lacuna operacional).** `GENERATOR_1.1.md` ensina 1.1.
Sem atualizá-lo, **nenhum plano 1.3 pode ser produzido sem edição manual de JSON** — e a Faixa A
inteira fica invisível na prática. A réplica lista "geração do schema 1.3" só na Etapa 5, depois
de jurídico e claim. É a dependência mais barata e mais bloqueante do backlog inteiro.

**6.4 — A classe de campo vazio continua aberta na Alimentação.** `meal.why` com espaços
desenha um card vazio. Não é achado da réplica nem da auditoria; é a mesma classe fechada ontem
nas outras três telas. Correção trivial (`textoVisivel`), candidata a entrar junto com a Faixa D.

**6.5 — `ADR-006` citado e inexistente; o 1.3 não tem ADR.** Mesma classe da afirmação falsa de
PWA já corrigida: documentação apontando para decisão que não existe.

**6.6 — `CONSULTA_SPEC.md` está defasado em dois eixos**, não um: versão (1.2) **e** nome do
campo (`rationale`). Como é o documento que descreve a consulta, ele é a fonte que o coach lê.

**6.7 — Nenhum dos documentos define o que acontece com um plano 1.4+ .** `parse.ts` só valida o
MAJOR. É coerente com a política aditiva, mas significa que um gerador à frente do app produz
degradação silenciosa. Decisão consciente a registrar, não bug a corrigir.

**6.8 — A réplica não trata o custo de manter DUAS fontes de verdade do coach.** Ela repete
"não criar dois specs de coach concorrentes" (§10) mas a §8 Etapa 5 manda "adaptar a fonte de
verdade do coach" sem dizer se `ACTIVVE_HEALTH_SYSTEM.md` é substituído ou virado adaptador.
A ambiguidade é a origem exata do problema que ela quer evitar.

---

## 7. Decisões humanas pendentes

Continuam as cinco do checkpoint, **duas mudaram de forma**, e entram três novas.

| # | Decisão | Estado | Quem decide |
|---|---|---|---|
| 1 | Como cobrar | **Reformulada.** A pergunta deixa de ser "como cobrar num GPT público" e passa a ser "**qual o portão mais barato que responde se alguém paga um segundo ciclo**" | Dono |
| 2 | Nome público | Aberta. "Consulta" suspenso (consenso). "Planejamento Activve" **não recomendado** (§9) | Dono + advogado |
| 3 | LGPD / dado sensível | Aberta, e **maior que o nome**: alcança a entrega, não só a coleta | Advogado |
| 4 | Onde roda o serviço | Aberta. Só vira urgente na Etapa "claim" | Dono + eu |
| 5 | Revogar `AGENTS.md` §2 / ADR-001 | Aberta. **Não é mais um ADR só** (§11) | Dono |
| 6 | **Fronteira `profile` × `context`** | **Nova.** Bloqueia o bump 1.4 | Dono + eu |
| 7 | **Plataforma do coach: Claude Project (hoje) ou GPT** | **Nova.** Muda custo, público alcançável e portabilidade | Dono |
| 8 | **Validar a hipótese central com um humano real** | **Nova, e é a que destrava tudo** | Dono |

---

## 8. Veredito sobre monetização do GPT

### As sete opções, comparadas

| # | Opção | Custo técnico | Custo financeiro | Risco | Aprendizado que gera |
|---|---|---|---|---|---|
| 1 | GPT/coach gratuito como demonstração; cobrar só revisões | ~zero (o coach já existe) | zero | baixo | **Alto** — testa personalização percebida e disposição a voltar |
| 2 | Pagar antes; link de sessão assinado | baixo (1 endpoint + token) | infra mínima | baixo | Alto — testa disposição a pagar de verdade |
| 3 | OAuth + entitlement | **alto** (auth, contas, consentimento, política) | infra + tempo | **alto** (revoga ADR-001) | Baixo — resolve escala, não hipótese |
| 4 | Cobrar no resgate | médio | baixo | **alto de percepção** — vende o que a pessoa já leu no chat | Médio, mas ensina errado (frustração ≠ falta de valor) |
| 5 | Portal próprio desde o beta | **muito alto** | API por plano | alto | Alto, mas caro demais para agora |
| 6 | API com chave do próprio usuário | médio | zero para você | alto de fricção | Baixo — filtra só quem é técnico |
| 7 | Nenhum pagamento até validar manualmente | zero | zero | ~zero | **Alto** — mas só se você perguntar o preço em voz alta |

### Recomendação para o primeiro beta: **opção 1 + 7, combinadas**

Coach gratuito (o Claude Project que já existe), handoff manual, **nenhum pagamento no
produto** — e a disposição a pagar testada **por conversa**: ao fim do primeiro ciclo, você
oferece o segundo ciclo por um preço e cobra por Pix. Sem paywall, sem conta, sem OAuth, sem
Action, sem backend.

**Por que esta e não a da réplica:**

1. **A hipótese central ainda não foi testada com ninguém além de você.** Toda a arquitetura de
   cobrança pressupõe que "personalização visível gera valor". Se isso for falso, opções 2 a 5
   viram prejuízo integral.
2. **O portão mais caro não é o que decide a venda.** Ninguém deixa de pagar por falta de
   OAuth; deixa de pagar porque não viu valor. Você está a **dez conversas** de saber isso.
3. **Preserva a decisão fundadora.** Nenhum item das opções 1/7 revoga o local-first, o
   "sem conta" ou obriga a ADR de nuvem. As decisões travadas 4 e 5 continuam adiáveis.
4. **Custo de reversão zero.** Se der certo, nada do que foi feito é jogado fora — porque quase
   nada foi feito.

**Quando subir para a opção 2 (e não para a 3):** quando 5+ pessoas tiverem pago o segundo ciclo
por Pix. Aí o gargalo passa a ser operacional (você cobrando na mão), e um link de sessão
assinado resolve — com uma fração do custo do OAuth e o mesmo grau de proteção contra um GPT
que vaza conteúdo, **porque o portão real nunca foi o GPT: é a entrega no app**.

**Sobre gerar o plano só no backend:** correto em teoria (o conteúdo só existe depois do
pagamento), e é o único desenho que fecha o vazamento de fato. Mas exige o portal — ou seja, é
a opção 5. **É o destino, não o começo.** Registrar como o motivo pelo qual o estágio GPT é
provisório por construção.

---

## 9. Veredito sobre nomenclatura

### Separação exigida

| Camada | O que é | Quem responde |
|---|---|---|
| **Técnica** | `Activve Coach` como nome interno; `PlanFile`, `claim`, `entitlement` | Eu. **Aprovado, sem ressalva** |
| **Percepção** | O usuário entende o que vai acontecer ao clicar? | Designer + teste com 5 pessoas |
| **Marketing** | O nome diferencia e é memorável? | Dono |
| **Advogado** | O nome + a entrega configuram serviço regulado? | **Advogado.** Não opino |
| **Nutricionista / prof. de ed. física** | O conteúdo entregue exige responsável técnico? | **Profissional habilitado.** Não opino |

### "Planejamento Activve" — não recomendo

É seguro e claro, e por isso mesmo **inerte**. Em português, "planejamento" carrega registro
corporativo (planejamento estratégico, financeiro, tributário) e descreve a *atividade da
empresa*, não o benefício da pessoa. Ele evita o risco sem ganhar nada — e existe alternativa
que evita o mesmo risco **e** significa algo.

O CTA **"Montar meu plano"** está certo: verbo + posse, diz exatamente o que acontece.
**"Meu plano"** como nome do artefato no app: certo, e já implementado.

### Três arquiteturas de nomenclatura

**A — O nome é a ação** (menor superfície regulatória)
Não existe substantivo-produto. Só verbo: *"Montar meu plano"* → *"Meu plano"* → *"Revisar meu
ciclo"*.
*Prós:* nenhum termo clínico; nada a traduzir; nada a defender juridicamente; a interface
descreve o que faz. *Contras:* não há unidade comercial nomeável ("comprar o quê?"); difícil de
falar em marketing; sem palavra para o boca a boca.

**B — O nome é o ciclo** (recomendada)
A unidade é o **ciclo**: *"Ciclo Activve"*, com *"Montar meu ciclo"* e *"Revisar meu ciclo"*.
*Prós:* nomeia o que o produto realmente é (8 semanas + revisão), o que **já está no
documento e no plano**; cria unidade comercial natural para compra e renovação — que é
exatamente o modelo de preço da auditoria; zero vocabulário clínico; e educa o usuário sobre a
periodicidade, que é o comportamento que você quer. *Contras:* exige uma linha de explicação na
primeira vez; "ciclo" tem outro significado para parte do público feminino, o que pede cuidado
de copy.

**C — O nome é o assistente**
*"Activve Coach"* como nome público.
*Prós:* familiar, amigável, alinhado com a expectativa de mercado. *Contras:* personifica quem
recomenda, o que **aumenta** a percepção de aconselhamento profissional justamente na camada
alimentar, que é a mais sensível. Não recomendo como nome público enquanto não houver parecer.

**Recomendação:** **B para o comercial, A para a interface.** Nenhum nome de mascote ou persona
humana agora — a réplica está certa em suspender isso.

---

## 10. Veredito sobre o schema 1.3

### 10.1 `why` versus `rationale` — **aprovar `why`**, sem hesitação

| Critério | Veredito |
|---|---|
| Compatibilidade 1.2 | `diet.meals[].why` está publicado desde 2026-07-29 e **existe em planos reais no aparelho do dono**. Renomear quebra dado real |
| Política de versão | `PLAN_SCHEMA` §6: "1.x = adições retrocompatíveis". Renomear campo publicado exige **2.0**. Desproporcional |
| Clareza semântica | `why` diz o que o campo contém: a resposta à pergunta que o usuário faz olhando a tela. `rationale`, em contexto de engenharia, já significa outra coisa (justificativa de decisão de arquitetura, como nos ADRs) — **manter `rationale` fora do schema evita confusão com `DECISIONS.md`** |
| Geração por LLM | Ambos funcionam. `why` é uma palavra a menos para errar |
| API pública | O contrato já é público (o gerador é externo). Estabilidade > elegância |
| "Informal demais" | Risco real, e a mitigação não é o nome: é a **semântica documentada**. Já está no changelog do 1.3 ("escreva na segunda pessoa, citando o que a pessoa disse"). Reforçar no `GENERATOR` |

**Custo de trocar hoje:** 4 pontos no schema, 4 telas, `PLAN_SCHEMA`, `CONSULTA_SPEC`,
`GENERATOR`, o spec do coach, `examples/` e **todo plano já gerado**. **Benefício:** zero
funcional. **Decisão: `why`, encerrado.** Se um dia aparecer necessidade de uma justificativa
de natureza diferente (clínica, por exemplo), ela é um **campo novo com nome próprio** — nunca
um segundo nome para o mesmo conceito.

### 10.2 `context` estruturado — aprovar o princípio, **corrigir a forma**

**Problema 1 — é mudança de campo publicado.** `context: string` está em `main` e nos planos
do dono. As saídas:

| Caminho | Veredito |
|---|---|
| Trocar `string` → objeto no 1.4 | ❌ Quebra plano 1.3 existente. A política 1.x proíbe |
| Criar `contextDetail` ao lado de `context` | ❌ Dois nomes para um conceito — o erro que acabamos de rejeitar no `why` |
| **`context` aceita string OU objeto; a fronteira normaliza** | ✅ **Recomendado** |
| Bump 2.0 | ❌ Desproporcional para um campo opcional |

```ts
// 1.4 — união na entrada, forma única no resto do app
const contextSchema = z.union([
  z.string().max(2000),                    // 1.3: continua válido para sempre
  z.object({
    summary: z.string().min(1).max(600),   // obrigatório na forma estruturada
    constraints:  z.array(z.string().max(240)).max(20).optional(),
    preferences:  z.array(z.string().max(240)).max(20).optional(),
    motivations:  z.array(z.string().max(240)).max(20).optional(),
    availability: z.array(z.string().max(240)).max(20).optional(),
  }),
]);
```

Com **uma regra inegociável**: a normalização (`string → { summary: string }`) acontece **num
lugar só**, na fronteira de leitura do plano — nunca na tela. Se duas telas perguntarem "isto é
string ou objeto?", reabrimos a classe de bug que custou os cinco achados de ontem.

**Problema 2 — colisão com `profile`.** Antes do bump, declarar a fronteira:

> **`profile` guarda o que o app CALCULA. `context` guarda o que o app só EXIBE.**

Consequências diretas:
- `profile.daysPerWeek` e `sessionMinutes` ficam onde estão — a rotação e a estimativa de
  minutos os leem de verdade (`rotation.ts:76`, `page.tsx:276`). Os campos do `profile` que o
  app realmente consome hoje são só seis: `name`, `sex`, `weight_kg`, `experience`,
  `daysPerWeek`, `sessionMinutes`. `age`, `height_cm` e `environment` existem para o
  **gerador** calcular, não para o app — o que é legítimo, mas vale estar escrito.
- `profile.restrictions` e `profile.notes` **não são lidos por nada**. Com `context`
  estruturado, viram legado: marcar como *deprecated* no `PLAN_SCHEMA` e instruir o gerador a
  parar de emiti-los. Não remover (planos antigos continuam válidos), mas **parar de alimentar
  dois lugares com a mesma verdade**.
- Nada em `context` pode virar entrada de cálculo. Se um dia precisar, vira campo tipado em
  `profile` — não string interpretada.

**Problema 3 — `availability` versus `resources`.** Mantenho `availability` (foi a minha
proposta e a réplica aceitou), **com a definição escrita no contrato**, porque sozinho o nome
puxa só para tempo:

> `availability` — o que a pessoa **tem à disposição** para executar o plano: tempo, local,
> equipamento, onde compra, orçamento e preparo.

Se um dia orçamento precisar de tratamento próprio (ex.: o app filtrar substituições por
preço), ele vira **campo próprio em `profile`** — não uma quinta lista.

**Sobreposição entre as quatro listas:** existe e é irredutível ("não tenho tempo de manhã" é
constraint e availability). Mitigação: **uma regra de desempate no `GENERATOR`** — *"se o fato
LIMITA o plano, é `constraint`; se ele HABILITA, é `availability`"* — e aceitar que a
classificação imperfeita é cosmética, porque nenhuma delas alimenta cálculo.

**Objeto único ou coleção de evidências?** Considerei `Array<{kind, text, quote}>`, com a
citação literal do que a pessoa disse — seria a personalização verificável no grau máximo.
**Rejeito por privacidade:** o `PlanFile` é exportado e vai no backup; citação literal de fala
sobre dor, lesão ou sofrimento psíquico é dado sensível viajando em arquivo. As quatro listas
nomeadas dão o mesmo resultado na tela com menos exposição.

### 10.3 Compatibilidade 1.0–1.2 — já é estrutural

`parse.ts` valida só o MAJOR e todos os campos novos são opcionais: planos 1.0, 1.1 e 1.2
continuam válidos por construção, e a tela `/plano` já tem o estado "este plano não trouxe o
texto completo". **Nada a fazer** — só documentar que a compatibilidade é por opcionalidade, não
por enumeração de versões.

---

## 11. Veredito sobre Markdown

### O que foi verificado diretamente

| Afirmação | Veredito | Evidência |
|---|---|---|
| Não existe HTML bruto | ✅ Confirmado | O parser devolve `Block[]`; o componente monta elementos React |
| Não usa `dangerouslySetInnerHTML` | ✅ Confirmado | `grep` em todo o `src/`: zero ocorrências |
| Script e URL perigosa viram texto literal | ✅ Confirmado | 4 testes dedicados (`<script>`, `<img onerror>`, `javascript:`, documento gigante) |
| Os testes citados existem | ✅ **19 testes** em `markdown.test.ts` (4 de segurança, 9 de estrutura, 6 de hierarquia de títulos) | `npx vitest run` |
| Risco de XSS controlado | ✅ **Mais que controlado: inexistente por construção.** Não há caminho de string→HTML. O argumento de XSS da auditoria §10.3 não se aplica | — |
| Títulos ainda renderizam como `<p>` | ❌ **Não.** `<h2>…<h4>` reais desde `6fabd4b` | `Markdown.tsx` |
| Headings resolvem a acessibilidade sem trocar o transporte | ✅ Confirmado no browser | `H1 › H2 › H3` medido no DOM |

### Decisão: **manter Markdown.** Não migrar para blocos.

**Motivo principal, que os dois documentos anteriores não formularam assim:** o único argumento
sobrevivente a favor de blocos era acessibilidade, e ele foi **resolvido sem tocar no
transporte**. O que restou a favor de blocos (índice navegável, edição por bloco) **também já
está resolvido de graça**: com `<h2>…<h4>` reais no DOM, um índice navegável é derivável do
próprio documento renderizado, sem mudar o contrato.

Contra blocos, um custo que a auditoria subestima: **JSON aninhado com união discriminada é
onde a geração por LLM quebra**, e a §12.3 da própria auditoria admite que plano inválido só
tem "correção automatizada limitada".

### Mas há uma lacuna real, e não é segurança — é **cobertura**

O subconjunto suportado é: títulos `#`/`##`/`###`, parágrafos, listas (`-`, `*`, `1.`) e
negrito `**`. **Tudo o mais atravessa como texto literal.** Isso é seguro e é a decisão certa,
mas tem consequência estética: se o coach escrever `> citação`, uma tabela, um link
`[texto](url)` ou um callout, o usuário vê **os caracteres crus na tela** — não um erro, não um
branco: markdown feio. E o coach não tem como saber disso hoje, porque o subconjunto **não está
documentado em lugar nenhum que o coach leia**.

**Recomendação (barata, doc-only, sem tocar em código):**
1. documentar o subconjunto em `PLAN_SCHEMA.md`, na descrição de `document`;
2. repetir no `GENERATOR` atualizado para 1.3, como restrição de escrita;
3. **só depois**, se o coach insistir em citações/callouts, avaliar adicionar `>` ao parser —
   um bloco novo, não um transporte novo.

**Impressão:** `/plano` não está no caminho de impressão hoje (o PDF sai de `/relatorios`). Se
o Documento entrar no PDF, a hierarquia real de títulos é justamente o que faz a impressão
funcionar. Mais um ponto a favor de ter feito headings de verdade.

---

## 12. Veredito sobre PWA e mobile

A qualificação da réplica **procede**, e refino por estágio:

| Estágio | Manifest/SW são bloqueadores? | Por quê |
|---|---|---|
| **Piloto interno** (só o dono) | **Não** | É o estado de hoje. Já funciona |
| **Beta fechado gratuito** (10–30) | **Não, com uma condição** | Nada pode prometer instalação ou offline. Mas **espere receber o mesmo relato do item 2** — é a demanda validada que segue aberta |
| **Beta pago** | **Sim, bloqueador** | Cobrar por um "parceiro de treino" que não avisa o fim do descanso com a tela apagada é problema de suporte e de reembolso. E o link do plano deveria "oferecer instalação depois" — não se oferece o que não existe |
| **Lançamento público** | **Sim** | Consenso entre os três documentos |
| **Mobile (Capacitor)** | PWA **primeiro** | Manifest e ícones são reaproveitados; e o `STATUS` já registra que Capacitor resolve o item 2 melhor (notificação local agendada no SO), sem servidor |

**Divergência de posição, não de conteúdo:** concordo que não é bloqueador de piloto, e mesmo
assim recomendo **fazer cedo** — porque é a única demanda validada do backlog e porque service
worker mexe em cache, ciclo de vida e atualização, exatamente o que a infra de testes da Faixa D
existe para cobrir. Fazer E logo depois de D é o momento mais barato que vai existir.

---

## 13. Veredito sobre privacidade e telemetria

### A pergunta afiada do pedido: "bloco sobre lesões concluído" já revela dado sensível?

**Depende de uma coisa só, e é decidível:**

- Se o bloco é exibido a **todo mundo**, "bloco 4 concluído" não revela nada — é estrutura de
  questionário, igual para todos.
- Se o bloco só aparece **porque a pessoa disse que tem dor**, então a *existência do evento* é
  a revelação. Nenhum conteúdo vazou e mesmo assim você sabe que aquela pessoa relatou dor.

**Regra mínima, verificável:** *nome de evento deriva da estrutura fixa do questionário, nunca
das respostas.* Corolários: sem eventos condicionais; sem contadores que funcionam como proxy
("3 lesões registradas"); sem duração por bloco sensível isolada (tempo longo no bloco de dor é
sinal).

### Política mínima para o piloto

| Evento | Campos | Proibido |
|---|---|---|
| `consulta_iniciada` | id opaco de sessão, origem | qualquer resposta |
| `bloco_concluido` | índice fixo (1..n) | rótulo derivado de resposta |
| `resumo_confirmado` / `resumo_corrigido` | booleano | o texto da correção |
| `geracao_*` | resultado, classe de erro | prompt, plano, transcrição |
| `claim_*` | id do token, resultado | conteúdo do plano |
| `plano_aberto_no_app` | id opaco | qualquer dado do plano |
| `avaliacao` | 1–5 | comentário livre (só com consentimento próprio) |

**Retenção:** bruto 30 dias; agregado 90; a chave opaca é **apagada no resgate**, quebrando a
ligação entre consulta e plano.

**Uma correção de vocabulário que importa juridicamente:** id opaco ligável a uma compra é
**pseudonimização**, não anonimização — continua dado pessoal sob a LGPD. Chamar de "anônimo"
em política de privacidade é declaração falsa. A réplica não comete o erro, mas também não
fecha a porta.

**O que a réplica acerta e vale repetir:** telemetria **nunca** no histórico local de treino.
Instrumentar o app local-first contradiz a promessa que é o diferencial.

### Sobre a entrega regulada (a parte maior que o nome)

| Camada | Natureza | Gate |
|---|---|---|
| Como executar um exercício, dicas técnicas | Conteúdo educacional | Livre |
| Registrar séries, peso, medidas, relatórios, backup | Organização de informação | Livre |
| Sugerir qual treino hoje, sugerir descanso | Recomendação automatizada, já enquadrada como sugestão e anti-culpa | Livre |
| **kcal, macros, cardápio individual, substituições** | **Personalização alimentar individualizada** | 🔴 **Parecer de nutricionista + advogado antes de COMERCIALIZAR** |
| **Séries, cargas e progressão individualizadas** | **Prescrição de exercício** | 🔴 **Parecer de prof. de ed. física + advogado antes de comercializar** |
| **Adaptação por dor/lesão, gestação, condição clínica** | **Atuação profissional regulada** | 🔴 **Bloqueado até parecer.** É o item mais sensível dos três |
| Bem-estar / sono / âncoras de hábito | Fronteira. Vira sensível se falar de sofrimento psíquico | 🟠 Revisar redação; evitar promessa terapêutica |
| Red flags e encaminhamento | **Responsabilidade**, não conteúdo | 🔴 Definir quem responde quando o sistema vê um sinal e erra |

**Fato que muda o enquadramento e nenhum documento registra:** o app **já entrega tudo isso
hoje** — para um único usuário, o próprio dono, sem cobrança e sem terceiros. Uso pessoal não é
o cenário regulado. **A régua muda no dia em que um terceiro paga.** Consequência prática: não
há nada a mudar no produto agora; o gate é sobre **vender**, e ele cai exatamente entre "beta
gratuito" e "beta pago" — que é onde o parecer jurídico já estava previsto.

---

## 14. Ordem final recomendada

```text
0. ✅ FEITO — Faixa A mergeada (c9aa82f)

1. VALIDAR COM HUMANO REAL          ← gate de tudo; custo zero; nenhuma linha de código
2. GERADOR 1.3                      ← doc; sem isso o item 1 não é executável
3. D — infra de teste + fluxos críticos
4. E — PWA (manifest, ícones, SW, shell offline, atualização)
   ‖ (em paralelo, desde já) jurídico + política + termos: é espera, não engenharia
5. Claim protótipo                  ← sem GPT, sem pagamento, sem dado real
6. Coach adaptado + Action          ← só se o item 1 tiver dado "sim"
7. Beta pago                        ← link de sessão assinado, NÃO OAuth
8. Portal próprio / Capacitor
```

**Quatro divergências deliberadas em relação à §8 da réplica:**

1. **Inserir a validação humana como etapa 1.** A réplica pula direto para infraestrutura. Mas
   a fatia mínima que ela mesma defende (§12 do meu parecer anterior) **já está pronta e não
   foi testada com ninguém**. É a etapa mais barata e mais informativa do backlog inteiro.
2. **Subir o `GENERATOR` 1.3 para a posição 2.** A réplica o coloca na Etapa 5. Sem ele
   **não existe plano 1.3 gerável**, e sem plano 1.3 o item 1 não pode acontecer. É a
   dependência mais barata e mais bloqueante que existe hoje.
3. **PWA antes de claim e Action** (§5.2).
4. **Jurídico em paralelo, não em série.** A réplica o põe como Etapa 3, bloqueando o resto.
   Parecer de advogado é **tempo de espera de terceiro**, não trabalho de engenharia: começa
   agora e corre junto. O que ele bloqueia é específico — Action pública, cobrança e dado de
   terceiro — não um protótipo interno com dado sintético.

### Respostas diretas às perguntas do pedido

| Pergunta | Resposta |
|---|---|
| PWA deveria vir antes do claim? | **Sim** — é a única demanda validada; claim resolve fricção hipotética |
| Jurídico bloqueia protótipo interno? | **Não.** Bloqueia Action pública, cobrança e dado de terceiro |
| Claim pode ser testado sem conta e sem dado sensível? | **Sim, e deve.** Plano sintético, token aleatório, uso único, expiração, zero PII na URL |
| Testes de UI: completos ou críticos? | **Só os críticos:** importar→plano ativo, trocar plano preservando histórico, restaurar sessão sob StrictMode, backup/restore. Cobertura total é armadilha |
| Action antes de validar o handoff manualmente? | **Não.** Mande um arquivo para uma pessoa real e assista ela importar. O que travar ali é o que a Action precisa resolver |
| Personalização visível deve ser validada antes das faixas seguintes? | **Sim.** É a premissa de tudo o que vem depois |

---

## 15. Gates de passagem entre fases

| Passagem | Gate objetivo |
|---|---|
| **1 → 3** (validação → testes) | Uma pessoa **que não é o dono** conclui um ciclo com o coach, abre o app e aponta **≥2 decisões do plano ligadas a algo que ela disse**, sem ajuda. Se ela disser "é um app com mais texto", **pare e reveja a tese antes de gastar mais** |
| **2 → 1** (gerador → validação) | Um plano gerado pelo coach atualizado valida contra 1.3 **sem edição manual de JSON** |
| **3 → 4** (testes → PWA) | Os 4 fluxos críticos cobertos; suíte roda `.tsx`; StrictMode 2× coberto; CI independente do deploy |
| **4 → 5** (PWA → claim) | Instalável em Android real; shell abre offline; atualização não quebra sessão em andamento; **o item 2 do feedback de uso real fecha** |
| **5 → 6** (claim → Action) | Token de uso único expira e é invalidado; plano inválido nunca entra; recusar não deixa resíduo; computador→celular testado; backup segue alcançável |
| **6 → 7** (Action → beta pago) | Política e termos publicados; parecer jurídico **e** profissional concluídos; ≥5 pessoas pagaram um segundo ciclo **na mão**; nenhuma transcrição persistida |
| **7 → 8** (beta → portal) | Retenção medida; custo por plano conhecido; limite concreto do GPT documentado |

**Regra que atravessa todos:** nenhuma fase pode introduzir número estimado apresentado como
fato, linguagem de culpa, afirmação clínica, ou reprovar contraste/acessibilidade.

---

## 16. Próxima ação exata

> Sem criar task ainda — conforme o pedido. Isto é o **conteúdo** da próxima task, para o dono
> aprovar ou reordenar.

**Branch:** esta, `ai/TASK-035-treplica-auditoria-gpt-claude` (documental). O merge dela é
gate humano, como todos.

**Colisão de TASK:** renomear a branch remota `ai/TASK-032-auditoria-gpt-activve-gpt` →
`ai/TASK-034-auditoria-gpt-activve-gpt` e reapontar o PR #2. Feito pelo autor da auditoria ou
pelo dono no GitHub — **não faço isso sem autorização**, porque mexe em branch de terceiro.

**Arquivos que a próxima task (documental) deve alterar** — nenhum código:
- `docs/ai/GENERATOR_1.1.md` → `GENERATOR_1.3.md`: `context`, `wellness`, `document`, `why`,
  **e o subconjunto de Markdown suportado**;
- `docs/ai/CONSULTA_SPEC.md`: 1.2 → 1.3 e `rationale` → `why`;
- `docs/ai/DECISIONS.md`: escrever o **ADR-006 que é citado e não existe**, e o ADR do 1.3;
- `docs/ai/STATUS.md`: checkpoint.

**Primeira task de código depois dela (Faixa D):** `vitest.config.ts` (incluir `.tsx`, ambiente
por arquivo), `package.json` (jsdom, Testing Library, fake-indexeddb), os 4 fluxos críticos, e
**de carona, o `textoVisivel` que falta em `/alimentacao:196`**.

**Testes a executar:** `npm run typecheck && npm run lint && npm run test && npm run build` —
com o dev server **parado** (rodar build com ele vivo corrompeu o cache do Turbopack ontem).

**Validação no browser:** 390×844, **aba nova**.

**Documento a atualizar ao final:** `STATUS.md`, sempre.

**O que depende do dono:** as 8 decisões da §7 — e, entre elas, **a de número 8 é a única que
destrava as outras sete**.

---

## 17. Perguntas ao dono do produto

1. **Você já rodou um ciclo real com o coach depois do merge de ontem?** Se não, essa é a
   próxima coisa a acontecer — antes de qualquer código. E a pergunta a responder é uma só:
   *"parece que alguém me ouviu, ou parece um app com mais texto?"*
2. **Existe alguém além de você disposto a testar?** Uma pessoa basta. A resposta muda a ordem
   inteira do backlog.
3. **O coach continua no Claude Project ou migra para GPT?** Migrar custa portar a spec e
   assumir plataforma nova; ficar custa não ter Action. **Não decida isso antes da pergunta 1.**
4. **Você aceita testar preço por conversa, sem paywall no produto** (oferecer o segundo ciclo
   por Pix), em vez de construir cobrança?
5. **Empurro a `main` para o `origin`?** Estão 10 commits parados aqui, e o push dispara o
   deploy do Vercel. A Faixa A só chega em `activve.vercel.app` depois disso.
6. **Quando você quer acionar o advogado?** É espera de terceiro: começar agora custa nada e
   destrava a faixa mais lenta.
7. **Sobre a fronteira `profile` × `context`** (§10.2): aprova a regra *"`profile` é o que o app
   calcula, `context` é o que o app só exibe"*, com `profile.restrictions`/`notes` marcados como
   legado?
8. **`Ciclo Activve`** (arquitetura B da §9) te parece melhor que "Planejamento Activve"?

---

## 18. Veredito final

A réplica **resolve corretamente** os problemas apontados no parecer anterior: aceita `why`,
aceita Markdown, reconhece que o GPT não é fronteira de cobrança, exige ADR e política, e
corrige o meu erro de tratar o nome como o eixo do risco regulatório.

**Não resolve** três coisas, e uma delas é cara: `context` estruturado sem caminho de migração
nem fronteira com `profile` (§10.2), o beta pago desenhado com OAuth antes de existir um
pagante (§8), e o PWA adiado para depois de duas construções hipotéticas (§12).

E o documento inteiro precisa ser lido com uma correção de data: **a Faixa A não é trabalho
pendente, é alicerce.** O que trava o projeto hoje não é engenharia — é **uma conversa com uma
pessoa real**, que custa zero e responde a pergunta que sustenta todas as outras.

**Nada aqui foi implementado. Nenhum merge foi feito. Nenhum código foi alterado.**
