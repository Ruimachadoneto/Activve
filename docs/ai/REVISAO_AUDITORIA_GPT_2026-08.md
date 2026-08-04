# Revisão crítica da Auditoria Estratégica (GPT) — 2026-08-03

> **Objeto:** `docs/ai/AUDITORIA_ESTRATEGICA_GPT_ACTIVVE_2026-08.md` (1.586 linhas), que vive
> na branch `ai/TASK-032-auditoria-gpt-activve-gpt` (PR #2, draft, não mergeada).
> **Nada foi implementado.** Este documento é parecer, conforme a §24 do próprio auditado.
>
> **Base de comparação:** `main` = `a1c41a2`; `AGENTS.md`, `CLAUDE.md`, `STATUS.md`,
> `CONSULTA_SPEC.md`, `PRODUCT_VISION.md`, `PLAN_SCHEMA.md`,
> `coach/ACTIVVE_HEALTH_SYSTEM.md`, `DESIGN_SYSTEM.md` e o código.

---

## 0. Avisos de estado que mudam a leitura do documento

Três fatos que o auditor não tinha, e que alteram o valor de parte das recomendações.

**0.1 — Colisão de ID de task.** Existem **duas branches distintas chamando-se TASK-032**:
`ai/TASK-032-auditoria-gpt-activve-gpt` (o documento) e
`ai/TASK-032-personalizacao-visivel-claude` (implementação). O `AGENTS.md` §14 define
`ai/<task-id>-<descrição>-<agente>`, e o `STATUS.md` indexa por id. **Uma das duas precisa
ser renumerada antes de qualquer merge**, senão o histórico fica ambíguo para sempre.

**0.2 — A "Faixa A" já está implementada, e não em `main`.** O schema 1.3 com `context`,
`wellness`, `document` e o porquê nas telas existe na branch
`ai/TASK-032-personalizacao-visivel-claude` (350 testes verdes, verificado no browser),
**aguardando correção de 2 achados de review e aprovação de merge**. Ver §3.

**0.3 — O `AGENTS.md` §2 afirma algo falso.** Diz que o app é *"como **PWA** instalável"*.
Não existe `manifest`, não existe service worker — verificado. É a mesma classe de erro da
afirmação sobre backup que foi corrigida na TASK-031. **Deve ser corrigido independentemente
de qualquer decisão deste parecer**, porque documentação que mente é pior que documentação
ausente.

---

## 1. Recomendações CORRETAS

| # | Recomendação | Por que procede |
|---|---|---|
| 1.1 | **Schema 1.3, não 1.2** (§10.1) | Correto e não trivial: o 1.2 já foi consumido por `diet.meals[].why` e `items[].alternatives` (ADR-006, 2026-07-29). Reusar 1.2 tornaria a versão ambígua. |
| 1.2 | **O `PlanFile` some da experiência, permanece como contrato** (§2.2) | É a formulação mais precisa do problema já produzida neste projeto. Supera a minha própria auditoria, que receitou templates. |
| 1.3 | **Personalização verificável** (§3.6) | Idêntica à regra de ouro do `CONSULTA_SPEC.md` §2. Convergência independente reforça a regra. |
| 1.4 | **PWA antes de mobile, e "local-first não é automaticamente PWA offline"** (§16.1) | Rigorosamente correto e é o ponto que mais gente erra. Confirmado: não há manifest nem SW. |
| 1.5 | **Capacitor antes de rewrite; Android primeiro; iOS exige macOS** (§16.2) | Bate com o que medi: domínio puro de 3.763 linhas, export estático testado e funcional, ~15 pontos de API de browser com equivalente nativo. |
| 1.6 | **Não reescrever por moda** (§16.3) | Correto, e a lista de gatilhos (background, sensores, políticas de loja) é a certa. |
| 1.7 | **Déficit de teste é DOM/efeitos/StrictMode/IndexedDB** (§18.1) | Exato. É a dívida mais antiga do projeto (desde a TASK-008) e a de maior retorno: os últimos ~10 achados de review foram de ciclo de vida, que a suíte node-only não alcança por construção. |
| 1.8 | **Minimização: transcrição completa fora do `PlanFile`** (§3.4, §17.2) | Correto e importante. O `PlanFile` é exportado, versionado e trafega; transcrição de anamnese ali dentro seria dado sensível vazando por design. |
| 1.9 | **Histórico e backup nunca bloqueados por cancelamento** (§14.4) | Coerente com o produto e com a TASK-031 já entregue. |
| 1.10 | **Red flags interrompem a geração** (§6.5) | Já previsto no `ACTIVVE_HEALTH_SYSTEM.md`, aqui melhor detalhado. |
| 1.11 | **Fora de escopo imediato** (§21) | A lista está certa, inclusive rede social — o que confirma a análise de SDT da `AUDITORIA_2026-08` §3.2. |
| 1.12 | **Ditado antes de voz bidirecional** (§7.3) | Correto por custo, acessibilidade e correção de entendimento. |

---

## 2. Recomendações PARCIALMENTE corretas

### 2.1 `rationale` como nome do campo (§10.2) — **conceito certo, nome errado**

O documento propõe `rationale` em treino/exercício e, no mesmo parágrafo, *"rationale de
refeição mantendo compatibilidade com `why`"*. Isso institucionaliza **dois nomes para um
conceito**.

O código já resolveu: `why` em refeição (1.2), e o mesmo `why` em treino e exercício (1.3).
**Recomendo manter `why`** — um conceito, um nome. É mais curto, já está no contrato
publicado e evita um adaptador eterno.

### 2.2 `context` estruturado (§10.2) — **o documento está certo e minha implementação está mais fraca**

Proposta do auditor:
```ts
type PlanContext = { summary: string; constraints?: string[]; preferences?: string[];
                     motivations?: string[]; resources?: string[] };
```
Implementado hoje: `context: string`.

A §11 do próprio documento pede seções separadas ("Minha rotina considerada", "Limitações e
adaptações"). **Com uma string só, essas seções não podem existir sem o app reinterpretar
texto livre** — que é exatamente o tipo de inferência que a §9 do projeto proíbe.

**Aceito a correção.** `summary` obrigatório (o espelho) + arrays opcionais. Nota: `resources`
é ambíguo — sugiro `availability` (o que a pessoa tem acesso: equipamento, mercado, tempo).

### 2.3 Documento estruturado em blocos (§10.3) — **um argumento certo, um errado**

| Argumento do auditor | Veredito |
|---|---|
| "menor risco de XSS" | ❌ **Não se aplica.** A implementação atual não usa `dangerouslySetInnerHTML`: o parser devolve dados e o componente monta elementos React. Injeção não é bloqueada — é impossível por construção. 13 testes fixam isso (script/img/`javascript:` viram texto literal). |
| "acessibilidade" | ✅ **Procede, e é defeito confirmado.** O review pegou: títulos renderizam como `<p>`, então leitor de tela perde a estrutura numa tela cuja tarefa é LER. |
| "navegação por seções, impressão" | ✅ Procede. |
| "renderização previsível" | 🔶 Parcial — o parser atual já é determinístico. |

**Contra-argumento que o documento não considera:** blocos aninhados aumentam
significativamente a chance de **falha de geração**. Markdown é o formato que um LLM produz
com mais confiabilidade; JSON aninhado com união discriminada é onde a geração quebra. E a
§12.3 do próprio documento admite que plano inválido exige "correção automatizada limitada"
— ou seja, o custo já é reconhecido.

**Recomendação:** manter Markdown como formato de transporte e **corrigir a acessibilidade**
(headings reais, `<section>` por título). Reavaliar blocos só se o índice navegável provar
ser necessário — decisão barata de adiar, cara de antecipar.

### 2.4 "Custo de modelo não recai sobre o Activve" no GPT público (§9.1) — **verdadeiro e incompleto**

Verdadeiro para tokens. Mas o mesmo documento propõe **app gratuito + consulta paga** (§14) e
**GPT público na loja** (§9.5 Fase 1). Ver §5.1 deste parecer: essas duas coisas colidem.

### 2.5 Métricas de produto (§19) — **corretas e em tensão com a privacidade**

A lista é boa. Mas o §3.4 promete "privacidade por padrão" e o §19 pede funil completo
(origem, abandono por bloco, satisfação). **O documento não resolve onde essa telemetria
mora.** Instrumentar o app local-first com analytics contradiz a promessa; instrumentar só o
serviço de consulta é coerente e provavelmente suficiente. Precisa ser dito explicitamente.

### 2.6 "Consulta Activve" (§5.2) — **melhor nome de UX, maior risco regulatório**

Ver §5.2 deste parecer. Não é decisão de engenharia.

---

## 3. Recomendações SUPERADAS pelo código

⚠️ Tudo abaixo está em `ai/TASK-032-personalizacao-visivel-claude`, **não em `main`**.

| Item do documento | Estado real |
|---|---|
| §20 Faixa A.1 — "corrigir `CONSULTA_SPEC.md` para 1.3" | ✅ O `CONSULTA_SPEC.md` **já diz 1.2 apenas como histórico**; o schema implementado é 1.3. Resta alinhar o texto do spec. |
| §20 Faixa A.3 — "adicionar context, wellness, document, rationale" | ✅ Implementado (`context`, `wellness`, `document`, `why`), com as ressalvas §2.1 e §2.2. |
| §20 Faixa A.5 — "criar Meu Plano" | ✅ `/plano` existe: espelho → bem-estar → documento. Registro C (editorial). |
| §20 Faixa A.6 — "mostrar rationale nas telas" | 🔶 Parcial: Hoje e Modo Treino sim; **Alimentação e Relatórios ainda não**. |
| §20 Faixa A.4 — "atualizar parse, testes e documentação" | ✅ `PLAN_SCHEMA.md` em 1.3, 350 testes. |
| §2.1 — "backup completo" listado como já existente | ✅ Correto, TASK-031 em `main`. |
| §11 — reutilização do porquê no Modo Treino | ✅ Com uma regra que o documento não previu: **o porquê some quando o usuário troca a variação**, porque foi escrito para o movimento original. |

**Consequência prática:** a Faixa A não é trabalho novo — é **terminar e mergear o que existe**,
com 3 ajustes (§2.1, §2.2, §2.3) e 2 correções de review pendentes.

---

## 4. Conflitos com decisões existentes

### 4.1 🔴 `AGENTS.md` §2 — "Sem IA de servidor (sem chave de API, sem custo)"

As Faixas B, C e F **exigem servidor, chave e custo recorrente**. Isto não é ajuste: é
revogação de uma decisão fundadora.

**Exige ADR formal** (`DECISIONS.md`) que: registre a revogação, delimite o que continua
local-first (execução, histórico, corpo, backup) e o que passa à nuvem (só a consulta), e
defina o plano de reversão. Sem ADR, o `AGENTS.md` passa a mentir — de novo.

### 4.2 🔴 `AGENTS.md` §2 — "v1 = LOCAL-FIRST, SEM CONTA. Sem Supabase/auth/sync no v1"

Cobrança implica identidade e direito de acesso. O documento tenta evitar contas com
claim anônimo, o que funciona para a **entrega**, mas não para **renovação, suporte,
reembolso ou histórico de compra**. O conflito é adiado, não resolvido.

### 4.3 🟠 `ACTIVVE_HEALTH_SYSTEM.md` vs. a nova estrutura `coach/` (§6.2)

A proposta cria 5 arquivos + adaptadores + exemplos, substituindo de fato o spec atual (110
linhas, funcional, em uso). **Decidir explicitamente: migrar (e apagar o antigo) ou
duplicar.** Duplicar produz duas fontes de verdade — exatamente o que a §6.2 diz querer
evitar.

### 4.4 🟠 `PRODUCT_VISION.md` — "Fase 2 depois de validar"

O documento **é** a Fase 2, chegando antes da validação da Fase 1. Pode estar certo (a Fase 1
não tem como validar sem a porta de entrada funcionar), mas a inversão precisa ser assumida
por escrito, não deduzida.

### 4.5 🟡 `DESIGN_SYSTEM.md` §0 — três registros, sem um quarto

A "esfera energética pulsante" (§7.1) não existe em nenhum dos registros A/B/C. Ela é
plausível como registro do **fluxo de consulta** (superfície nova, fora do app), mas o
design system precisa dizer isso — senão é decoração, e a §0.1 proíbe decoração sem propósito.

---

## 5. Decisões que exigem juízo humano (jurídico / comercial / arquitetural)

### 5.1 🔴 COMERCIAL — o furo do GPT público pago

**Este é o achado mais importante deste parecer.**

O documento recomenda, ao mesmo tempo:
- §9.5 Fase 1: **GPT público na loja**, distribuído por link;
- §14: **consulta paga** (R$ 39,90–69,90).

**Um GPT público na loja da OpenAI não tem como cobrar.** Qualquer pessoa abre e usa. A §20
Faixa C lista "pagamento" como item, mas **nenhuma seção descreve como um GPT público
verifica pagamento antes de gerar o plano.**

Saídas possíveis, todas com custo não avaliado no documento:
1. **Código de resgate**: paga na landing → recebe código → informa ao GPT → a Action valida.
   Funciona, mas adiciona um passo justamente no fluxo que existe para *remover* passos.
2. **Gate no claim, não no GPT**: o GPT gera de graça, e o *resgate no app* exige pagamento.
   Melhor UX, mas vende algo que a pessoa já viu — e o conteúdo já está na tela dela.
3. **GPT como isca gratuita** e cobrança só na renovação/acompanhamento. Coerente, mas muda
   o modelo do §14.

**Sem escolher uma destas, a Faixa C não é implementável.** Recomendo decidir isto **antes**
da Faixa B, porque muda o desenho da Action e do claim.

### 5.2 🔴 JURÍDICO — "Consulta" e o risco regulatório no Brasil

O documento reconhece o risco (§5.1) e recomenda o nome mesmo assim. **Não é decisão de
engenharia.** No Brasil, prescrição de dieta é privativa de nutricionista (CFN) e prescrição
de exercício de profissional de educação física (CREF). Um produto chamado **"Consulta"**,
que entrega **plano alimentar e de treino individualizados**, é o perfil que atrai atenção
regulatória — por mais que os disclaimers digam o contrário.

Há tensão interna no próprio documento: a §3.3 promete "não prescreve como profissional
clínico" e a §14.2 vende "plano personalizado" com "anamnese" (termo clínico) e
"interpretação".

**Recomendo parecer de advogado antes de fixar o nome público**, e considerar alternativas
que descrevem sem invocar consultório: *"Meu plano Activve"*, *"Montar meu plano"*,
*"Planejamento Activve"*. Enquanto não houver parecer, **"Activve Coach" como nome técnico é
seguro; "Consulta Activve" como nome público não é uma decisão que eu possa chancelar.**

### 5.3 🔴 JURÍDICO/LGPD — dado de saúde é categoria especial

A consulta coleta dor, lesão, cirurgia, gestação, relação com comida, sofrimento psíquico.
Na LGPD isso é **dado pessoal sensível** (art. 5º, II), com base legal mais estrita —
consentimento específico e destacado. O §17 do documento cobre bem o *técnico*, mas o
enquadramento legal precisa de profissional. Some-se: enviar a OpenAI é **transferência
internacional** e exige informar o operador.

### 5.4 🟠 ARQUITETURAL — onde roda o serviço

Não decidido no documento. Alternativas com implicações distintas de custo, latência e
LGPD (região de processamento). O `AGENTS.md` cita Vercel como hospedagem provável, o que
sugere Route Handlers no mesmo projeto — mas isso mistura o app local-first com o serviço,
e a §12.1 pede separação explícita.

### 5.5 🟠 COMERCIAL — preços e investimento

R$ 39,90–69,90; reserva de R$ 50–80 mil. **Fora do meu escopo opinar**, e o documento
acerta ao dizer que não são dogma. Registro apenas: os gates da §15.6 (100 pagantes,
R$ 5 mil/mês por 3 meses) são critérios saudáveis e **devem ser fixados antes** de liberar
verba, não depois.

---

## 6. Decomposição em tasks

Cada uma cabe num review e tem valor isolado.

| Task | Escopo | Depende de | Esforço |
|---|---|---|---|
| **T-A0** | Renumerar branches (colisão TASK-032) + corrigir a afirmação de PWA no `AGENTS.md` | — | XS |
| **T-A1** | Fechar a branch de personalização: 2 achados de review (headings reais; `wellness` vazio) | — | S |
| **T-A2** | `context` estruturado (§2.2) + manter `why` (§2.1) + `meta.consultationId`/`generatorVersion`/`issuedBy` | T-A1 | S |
| **T-A3** | Porquê em **Alimentação** e **Relatórios** (completa a §11) | T-A1 | S |
| **T-A4** | Atualizar o gerador para 1.3 (`GENERATOR_1.1.md` → `1.3`) + exemplos | T-A2 | M |
| **T-D1** | Infra de teste: jsdom + Testing Library + fake-indexeddb | — | M |
| **T-D2** | Testes de ciclo de vida dos fluxos críticos já existentes | T-D1 | M |
| **T-E1** | PWA real: manifest, ícones, SW, shell offline, atualização segura | — | M |
| **T-B0** | **ADR revogando "sem IA de servidor"** + decisão do §5.1 (como cobrar) | decisão humana | S (doc) |
| **T-B1** | `ACTIVVE_COACH_CORE.md` + adaptador ChatGPT (migração, não duplicação) | T-B0 | M |
| **T-B2** | Serviço de claim: `POST /api/gpt/claims`, validação Zod, token de uso único | T-B0 | M |
| **T-B3** | `/claim/[token]`: prévia → confirmação → IndexedDB → invalidação | T-B2 | M |
| **T-B4** | QR + código curto (computador → celular) | T-B3 | S |
| **T-C1** | Termos, política de privacidade, consentimento versionado | jurídico | M |
| **T-C2** | Pagamento + gate escolhido no §5.1 | T-C1, T-B3 | L |
| **T-F1** | Capacitor + Android | T-E1 | M |

---

## 7. Ordem recomendada

```text
T-A0  → destrava o histórico e para de mentir na documentação
T-A1  → fecha o que já está pronto (maior valor por esforço do backlog)
T-A2, T-A3, T-A4 → completam o "cano"
   ── PONTO DE DECISÃO: §5.1 (como cobrar) e §5.2 (nome/jurídico) ──
T-D1, T-D2 → antes de qualquer código de servidor
T-B0 → ADR
T-B1..B4 → GPT + claim
T-E1 → PWA
T-C1, T-C2 → beta pago
T-F1 → Capacitor
```

**Duas divergências deliberadas em relação à §20 do documento:**

1. **Testes (Faixa D) sobem para antes do servidor.** O documento os coloca em quarto lugar.
   Mas a Faixa B introduz rede, tokens, expiração e um caminho de importação novo — a classe
   exata de bug que a suíte atual não pega. Construir claim sem teste de ciclo de vida é
   repetir, com dado de terceiro, o erro que custou caro nas TASK-016/028/029.
2. **PWA (Faixa E) sobe para antes do beta pago.** Se o plano chega por link e o app não é
   instalável, o usuário paga e fica no navegador — e a §8.5 diz que o link deve "oferecer
   instalação depois". Não dá para oferecer o que não existe.

---

## 8. Riscos e dependências

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Cobrar num GPT público (§5.1) | **Alta** | **Bloqueia a Faixa C** | Decidir antes da B; a escolha muda a Action |
| Nome "Consulta" atrair questionamento regulatório | Média | Alto | Parecer jurídico antes do público |
| LGPD em dado sensível + transferência internacional | Média | Alto | Base legal, consentimento destacado, retenção curta |
| Plataforma mudar regras de GPT/Action | Média | Alto | Núcleo agnóstico + claim próprio (o documento já mitiga) |
| Blocos estruturados aumentarem falha de geração | Média | Médio | Manter Markdown; validar em duas camadas |
| Token de claim vazar por link compartilhado | Média | Alto | Uso único, expiração curta, revogação, sem PII na URL |
| Custo de API sem teto | Baixa | Alto | Fase 1 usa a conta do usuário; alertas antes da Fase 2 |
| Complexidade antes de receita | **Alta** | Alto | Gates da §15.6 fixados **antes** da verba |
| Duas fontes de verdade no `coach/` | Média | Médio | Migrar e apagar o antigo, não duplicar |

**Dependência crítica não declarada no documento:** a Action de um GPT público exige **URL
pública de política de privacidade** e endpoint acessível. Ou seja, **T-C1 (jurídico) é
pré-requisito de T-B2**, não item posterior. A §20 coloca na ordem inversa.

---

## 9. Critérios de aceite (por task, verificáveis)

- **T-A0** — Nenhuma branch duplica id; `AGENTS.md` §2 descreve o estado real do PWA.
- **T-A1** — Títulos do documento renderizam como `<h1..h3>` reais; `wellness: {}` e
  `{habits: []}` caem no estado "formato anterior"; gates verdes; verificado em 390×844.
- **T-A2** — `context.summary` obrigatório; arrays opcionais; plano 1.0–1.2 continua válido;
  ausência de campo degrada sem quebrar (teste explícito).
- **T-A3** — Toda tela que exibe item do plano exibe o porquê quando existe, e **não inventa
  quando não existe**.
- **T-A4** — Um plano gerado pelo coach atualizado valida contra 1.3 sem edição manual.
- **T-D1/D2** — Testes cobrem: montagem com storage vazio, StrictMode 2×, troca de plano com
  fetch em voo, restauração de sessão.
- **T-B2/B3** — Token de uso único expira e é invalidado após resgate; token inválido/expirado
  tem estado próprio; log não contém conteúdo do plano; plano inválido nunca é salvo.
- **T-B3** — Prévia mostra o que será importado **antes** de gravar; recusar não deixa resíduo.
- **T-E1** — Instalável; shell abre offline; atualização não quebra sessão em andamento.
- **Transversal** — Nenhuma task pode introduzir número estimado apresentado como fato,
  linguagem de culpa, ou afirmação clínica.

---

## 10. Arquivos afetados (previsão)

**Faixa A:** `src/lib/plan/schema.ts`, `markdown.ts`, `src/components/Markdown.tsx`,
`src/app/plano/page.tsx`, `src/app/alimentacao/page.tsx`, `src/app/relatorios/page.tsx`,
`src/components/ReportView.tsx`, `docs/ai/PLAN_SCHEMA.md`, `docs/ai/GENERATOR_1.1.md`,
`docs/ai/CONSULTA_SPEC.md`, `examples/plano-exemplo.json`.

**Faixa D:** `vitest.config.ts`, `package.json`, `src/**/*.test.tsx` (novos).

**Faixa E:** `src/app/manifest.ts`, `public/icons/*`, `src/app/sw.ts`, `next.config.ts`.

**Faixa B:** `docs/ai/coach/*` (reestruturação), `src/app/api/gpt/claims/route.ts`,
`src/app/claim/[token]/page.tsx`, `src/lib/claim/*`, `AGENTS.md` §2, `docs/ai/DECISIONS.md`.

**Faixa C:** landing, `src/app/api/checkout/*`, `docs/legal/*`.

---

## 11. Testes necessários

Além dos gates atuais (typecheck, lint, vitest, build):

**Unitários (node)** — `context` estruturado ausente/parcial; `parseMarkdown` com heading
aninhado; validação de `PlanFile` 1.3 vindo de fonte externa; token: geração, expiração,
uso único, revogação.

**Integração (jsdom + fake-indexeddb)** — resgate grava exatamente o previsto na prévia;
recusa não deixa resíduo; resgate duplicado é rejeitado; restauração com plano ativo
existente não apaga histórico.

**E2E (Playwright)** — GPT → claim → prévia → importação → primeiro treino; computador → QR →
celular; link expirado; app não instalado → web → instalação.

**Acessibilidade** — navegação por teclado no fluxo de claim; anel de foco (já global desde a
TASK-031); documento navegável por headings; `prefers-reduced-motion` na esfera.

**Com usuários** — as metas da §18.5 são boas; a mais importante é *"ninguém vê JSON no fluxo
principal"*, porque é a falsificável.

---

## 12. Menor fatia vertical que prova valor

O documento propõe (§24): `plano 1.3 → Meu Plano → rationale visível`.

**Isso já existe e está a dois defeitos de distância do merge.** Como fatia mínima, portanto,
é a resposta certa — mas o trabalho não é construir, é **fechar**:

```text
T-A1 (2 correções de review)
  → merge da branch de personalização
  → o usuário abre um plano real do coach e responde UMA pergunta:
    "parece que alguém me ouviu, ou parece um app com mais texto?"
```

**Por que esta é a fatia certa:** ela testa a hipótese central de todo o documento — que
personalização *visível* é o diferencial — **usando o coach manual, sem servidor, sem
pagamento, sem risco jurídico e sem gastar um centavo**. Se a resposta for "app com mais
texto", toda a Faixa B perde a premissa, e descobrimos isso antes de decidir sobre backend.

Se o auditor estiver certo (e eu acho que está), a mesma fatia vira a prova que justifica o
investimento das faixas seguintes.

---

## 13. Veredito

O documento é **sólido, e melhor que a minha própria auditoria em dois pontos**: nomeia o
`PlanFile` como algo que deve sumir da experiência sem sumir do contrato, e propõe `context`
estruturado onde eu implementei uma string.

Três ressalvas pesam:

1. **O furo de cobrança no GPT público** (§5.1) — é um problema de modelo de negócio, não de
   implementação, e bloqueia a Faixa C como está escrita.
2. **O nome público** (§5.2) precisa de advogado, não de designer.
3. **A ordem** subestima testes e PWA, que são pré-requisitos do que vem depois, não
   acabamento.

**Recomendação:** aprovar as Faixas A, D e E como escritas (com os ajustes deste parecer),
e **condicionar as Faixas B e C** às decisões §5.1, §5.2 e §5.3.

Nada aqui foi implementado. Nenhum merge foi feito.
