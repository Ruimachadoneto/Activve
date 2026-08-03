# Auditoria completa do Activve — 2026-08-03

> Encomendada pelo usuário com escopo aberto: *"não precisamos mais nos manter bloqueados a
> possibilidades conforme estabelecemos antes. O importante é chegar no Top Score."*
> Portanto **arquitetura, backend, nativo, schema e estética estão todos em aberto** aqui.
> Estado auditado: `main` = `2e4f0fe`, 318 testes verdes, TASK-030 em produção.

---

## 0. Sumário executivo — as cinco coisas que importam

Se só houver energia para cinco decisões, são estas, em ordem de impacto:

| # | Achado | Severidade | Por quê |
|---|---|---|---|
| 1 | **A porta de entrada é "cole um JSON"** | 🔴 Crítico | O app só tem valor depois de um arquivo que ele não sabe produzir. É o maior risco de produto que existe aqui. |
| 2 | **Não existe backup do histórico** | 🔴 Crítico | Perder o aparelho ou limpar o site apaga tudo. Num app cujo valor É o histórico acumulado, isso é perda total e irreversível. |
| 3 | **A camada de storage tem ZERO testes** | 🟠 Alto | 457 linhas sem cobertura — e é exatamente ali que quase todos os bugs caros das últimas 8 tasks nasceram. |
| 4 | **O app atende 2 das 3 necessidades da SDT** | 🟠 Alto | Autonomia ✓ e competência ✓ estão bem servidas. *Relacionamento* é zero, por consequência direta do local-first. É a explicação teórica da retenção que falta. |
| 5 | **A dieta é uma promessa não cumprida** | 🟡 Médio | `/alimentacao` existe, o schema tem refeições, o Hoje linka pra lá — e não dá pra marcar nada. Meia-funcionalidade é pior que nenhuma. |

Os achados 1 e 2 são **os únicos que eu classificaria como bloqueadores de "Top Score"**. O
resto é refinamento sobre uma base que, na maior parte, está acima da média do mercado.

---

## 1. Método

**Medição do código** (não impressão): contagem por camada, hotspots de complexidade,
cobertura de teste por módulo, conformidade com os tokens do design system, inventário de
atributos de acessibilidade, escala tipográfica real em uso, tamanho de bundle por chunk.

**Pesquisa de mercado e literatura**: estado da arte de apps de treino em 2026 (Hevy,
Strong, Fitbod, JuggernautAI, SensAI, Dr. Muscle), padrões visuais de apps premium de saúde
(WHOOP, Oura), WCAG 2.2, arquitetura local-first e sync engines, teoria de mudança de
comportamento (Self-Determination Theory), benchmarks de ativação e retenção, e o estado de
Capacitor/React Native. Fontes ao final.

---

## 2. Onde o app já está forte (e não deve ser mexido sem motivo)

Ser justo com a base é parte da auditoria. Estes pontos são **melhores que a média do
mercado** e vários são diferenciais reais:

- **Honestidade de dados como regra executável.** A §9 não é um slogan: ela derrubou o
  denominador do relatório, barrou extrapolação de ritmo em período parcial, impediu número
  de prontidão sem histórico, e mantém "sem match → nenhuma foto". Quase nenhum concorrente
  faz isso — a norma da categoria é estimar e apresentar como fato.
- **Anti-culpa consistente.** Sem streak punitivo, sem score fabricado, sem vermelho para
  performance. A pesquisa em SDT dá respaldo teórico direto a essa escolha.
- **Agenda por rotação (TASK-029).** É genuinamente melhor que Hevy/Strong, que seguem
  calendário. Fitbod adapta, mas por volume/recuperação, não por "onde você parou".
- **Núcleo de domínio puro e testado.** 3.763 linhas sem React e sem IndexedDB, 318 testes.
  É o ativo mais valioso do projeto e o que torna qualquer migração futura barata.
- **Mapa de recuperação.** Poucos apps na faixa de preço têm isso; Fitbod tem e cobra por.
- **Disciplina de tokens.** Só 9 cores hardcoded em ~10.400 linhas.

---

## 3. Conceito e modelo de produto

### 3.1 🔴 O problema nº 1: time-to-value

A primeira tela útil do app pede **"Escolher arquivo"** ou **"Cole aqui o conteúdo do seu
plano (JSON)"**. Para chegar nela, o usuário precisa: sair do app → abrir um Claude Project
→ fazer uma anamnese → gerar um JSON → salvar → voltar → importar.

Os números do mercado explicam a gravidade: a ativação D1 em saúde/fitness é de **26%**, e
cai para **10% no D28**; **72% de churn nos 3 primeiros dias**; e o ponto de queda mais
íngreme é exatamente o *time to first value*. Um app cuja primeira ação exige uma
ferramenta externa e um arquivo não tem TTFV — tem uma lição de casa.

Isso é invisível hoje porque **o usuário é o próprio autor** e já tem o plano. Para
qualquer outra pessoa, é uma parede.

> ⚠️ **RECOMENDAÇÃO RECUSADA PELO USUÁRIO (2026-08-03), e ele estava certo.** Templates
> trocariam o diferencial pela commodity: *"a personalização máxima é o maior diferencial, é
> aquilo que faz o usuário entender que o plano não é um plano padrão, mas um plano para ele
> especificamente."* O diagnóstico (TTFV quebrado) estava certo; a cura, errada.
>
> **A investigação seguinte achou a causa real:** o `PLAN_SCHEMA` não tem campo para
> bem-estar, contexto de vida nem para o Documento do coach — a anamnese profunda que já
> existe chega ao app como treino + dieta + meta. **A personalização morre na porta**, e é
> por isso que o plano importado parece template. Desenho completo em
> `docs/ai/CONSULTA_SPEC.md`.

**Recomendação original (SUPERADA) — "plano em 60 segundos":** um onboarding que produz um `PlanFile` válido
**dentro do app**, a partir de 4 perguntas (objetivo, experiência, dias por semana,
equipamento disponível), escolhendo entre um punhado de templates curados. A arquitetura
plan-file **não muda** — o template gera exatamente o mesmo contrato que o coach gera. O
coach deixa de ser a *porta* e passa a ser o *upgrade* ("quer um plano feito pra você?"),
que é o papel certo dele e ainda melhora a conversão para a Fase 2 paga.

> Isto não fere nenhum intocável: o app continua não prescrevendo — ele oferece um ponto de
> partida explícito e editável, e diz de onde ele veio.

### 3.2 🟠 SDT: falta o terceiro pilar

A literatura de mudança de comportamento converge em três necessidades: **autonomia,
competência e relacionamento**. Mapeando:

| Necessidade | Como o Activve atende | Nota |
|---|---|---|
| **Autonomia** | Rotação flexível, override do dia, "quero treinar mesmo assim", app não prescreve | Muito forte — melhor que a média |
| **Competência** | Progressão de carga, recordes, prontidão, relatório visual | Forte |
| **Relacionamento** | — | **Ausente** |

O relacionamento é zero *por consequência do local-first*, não por descuido. Hevy cresceu
exatamente nesse eixo (perfis, seguir, compartilhar).

**Opções, agora que o escopo está aberto:**
- **(a) Assumir e não competir aí.** Posicionar privacidade como o produto ("seu treino não
  é conteúdo"). Compensar o pilar com *relacionamento assíncrono*: o coach humano/IA como o
  "outro" da relação. É coerente e defensável.
- **(b) Compartilhamento pontual, sem rede social.** Exportar um card visual de sessão ou de
  recorde — relacionamento sem feed, sem seguidores, sem métrica de vaidade.
- **(c) Fase 2 com contas.** Aí sim rede opcional.

Recomendo **(a) + (b)**: preserva o diferencial e cobre o pilar sem construir uma rede
social, que seria uma guerra perdida contra o Hevy.

### 3.3 🟡 A dieta é meia-funcionalidade

`/alimentacao` existe e o Hoje linka para lá, mas não há como marcar refeição. O
`PRODUCT_VISION` prevê isso na Fase 1 e nunca foi feito. Enquanto isso, a tela promete algo
que não entrega — a mesma classe de defeito que a TASK-030 acabou de eliminar no sino.

**Recomendação:** ou entregar o marcar-refeição (é pequeno: um toggle por refeição por dia,
mesma malha do `sessions`), ou **remover o link do Hoje** e deixar a dieta como conteúdo de
leitura. Não deixar no meio.

### 3.4 🟡 O loop com o coach é frágil

O ciclo depende do usuário transportar arquivos à mão nas duas direções, e o
`REPORT_SCHEMA` acabou de ir a 1.1 sem que o coach saiba. Já existe dívida registrada de
que o gerador precisa aprender o schema 1.1.

**Recomendação:** versionar o contrato de verdade — o app deve **detectar e avisar** quando
o plano importado for de uma versão que ele não entende por completo, e o export deve
carregar a versão de forma visível. É barato e evita a classe inteira de "o coach gerou algo
que o app ignora em silêncio".

---

## 4. Arquitetura

### 4.1 🔴 Não existe backup

Confirmado por inspeção: **nenhum caminho de UI exporta o histórico**. O `AGENTS.md` §2
afirma *"backup via export/import JSON"* — isso é verdade só para o **plano**. Sessões,
cargas, medidas e peso não saem do aparelho por nenhuma via.

Consequência: trocar de celular, limpar dados do site ou um navegador reciclando storage sob
pressão **apaga meses de histórico, sem aviso e sem recuperação**. Num produto cujo valor é
justamente o acúmulo, isso é a falha mais severa do sistema.

✅ **RESOLVIDO na TASK-031:** "Baixar backup" e "Restaurar backup" em `/mais`, com o
conteúdo do aparelho declarado antes de exportar e o do arquivo antes de restaurar.
Restaurar é **união, nunca substituição** — um app sem desfazer não pode ter uma operação
que destrói meses de dado por um toque errado.
**Recomendação seguinte:** lembrete periódico de backup no centro de avisos (que já existe e
já sabe falar de condições persistentes).

### 4.2 🟠 Storage sem teste, e é onde os bugs moram

457 linhas em `src/lib/storage/` com **cobertura zero**. Cruzando com o histórico de review:
as corridas de carregamento (TASK-016 ciclos 1 e 4, TASK-029 ciclo 1), o descanso fantasma
gravado na montagem, a restauração com menos contexto — **todos** na fronteira storage↔UI.

O `STATUS` já registra a lição: *"os bugs mais caros não vieram de lógica, e sim de ciclo de
vida"*. A conclusão que falta tirar é que **a suíte atual é estruturalmente incapaz de pegar
essa classe** — ela é node-only e testa funções puras, que é exatamente onde os bugs *não*
estão.

**Recomendação:** configurar `jsdom` + Testing Library + `fake-indexeddb` e cobrir: montagem
com storage vazio, troca de plano com fetch em voo, StrictMode invocando efeito 2×, e
restauração de sessão. É a dívida de teste mais antiga do projeto (desde a TASK-008) e a de
maior retorno.

### 4.3 🟡 God component

`src/app/treino/page.tsx` tem **1.159 linhas** — 3× o segundo maior. Concentra execução de
série, timer, swap de variação, auto-avanço, recordes, conclusão e restauração. Toda task
recente tocou nele, e é o arquivo com mais achados de review do projeto.

**Recomendação:** extrair o estado da sessão para um hook (`useWorkoutSession`) e a máquina
de descanso/auto-avanço para outro. Não é estética — é reduzir a superfície onde os bugs de
ciclo de vida nascem.

### 4.4 Mobile: a decisão que destrava o resto

Medido nesta sessão: o domínio (3.763 linhas) é puro e porta 1:1; o storage (457) precisa de
adaptador; as APIs de browser são ~15 pontos com equivalente nativo direto. **O export
estático foi testado e funciona de primeira** — sem rotas de API, sem server actions.

Isso torna **Capacitor** viável em dias, e ele resolve de uma vez três coisas que a web não
resolve: notificação local agendada pelo SO (o item 2 do feedback, hoje sem solução
honesta), presença em loja, e **integração com HealthKit / Health Connect** — que abriria
peso, sono e frequência cardíaca sem o usuário digitar nada, atacando o TTFV do §3.1 por
outro ângulo.

Bloqueio honesto: **iOS exige Mac**; Android sai do Windows hoje.

### 4.5 Fase 2 (nuvem), quando chegar

O mercado de local-first amadureceu: PowerSync, ElectricSQL, Zero e Triplit (comprado pela
Supabase em 2025) permitem sync com esforço comparável a um app cliente-servidor comum.
Para este caso — dados estruturados por usuário, sem colaboração multi-usuário — **PowerSync
ou ElectricSQL** são o encaixe; CRDT (Yjs/Automerge) seria over-engineering.

---

## 5. Design system e UI

### 5.1 🟠 A escala tipográfica está comprimida embaixo e tímida em cima

Uso real medido: **42 ocorrências de 11px e 31 de 10px** — 73 usos de texto minúsculo — e o
maior herói é 56px, com a prontidão em 44px.

O benchmark premium vai na direção oposta: a WHOOP renderiza a métrica principal em torno do
equivalente a **72pt**, com o texto de apoio pequeno e claramente secundário. A tese visual
do próprio `DESIGN_SYSTEM` ("premium por exatidão e legibilidade") pede a mesma coisa.

Além disso, **10px é pequeno demais para texto em produção mobile** — é aceitável para
rótulo de eixo, não para informação que se lê.

**Recomendação:** aumentar o topo (herói para 64–72px) e **eliminar o degrau de 10px**,
promovendo tudo para 11–12px. Isso aumenta contraste hierárquico e legibilidade ao mesmo
tempo — os dois na direção do "instrumento de precisão".

### 5.2 🟡 O mapa muscular está fora do sistema

`RecoveryMap.tsx` tem **8 cores hexadecimais hardcoded** — são 8 das 9 do app inteiro. Elas
não são tokens, então o mapa não acompanha nenhuma mudança de tema ou de paleta, e a
validação de daltonismo feita na TASK-021 não o cobre.

**Recomendação:** mover para tokens. É pequeno e fecha a última brecha de conformidade.

### 5.3 🟡 Não existe tema claro

Zero ocorrências de `prefers-color-scheme`. O app é dark-only por decisão de direção — o que
é legítimo — mas em 2026 isso tem dois custos: usuários com sensibilidade a contraste alto
em ambiente claro, e uso na academia sob luz forte, onde tela escura reflete.

**Recomendação:** não é urgente, mas deveria entrar no radar. A base de tokens já está
pronta para suportar; o trabalho é definir a paleta clara e revalidar contraste.

### 5.4 O que o benchmark de 2026 sugere adotar

- **Storytelling de dado acima de densidade.** WHOOP e Oura convergiram em "calmo,
  significativo, com uma métrica protagonista". O Activve já vai nessa direção — o gauge de
  prontidão é exatamente isso — mas ainda tem telas onde tudo tem o mesmo peso.
- **Movimento que preserva contexto espacial.** Transições que mantêm o usuário orientado na
  hierarquia de dados, em vez de cortes secos.
- **Redução de imagens.** O redesign recente do Oura foi na direção de *menos* imagem e mais
  tipografia/estrutura. Vale reavaliar o peso das fotos de exercício fora do Modo Treino.

---

## 6. Acessibilidade

Medição: 35 `aria-label`, 86 `aria-hidden`, 8 `role=`, e **`focus-visible` aparece só 8
vezes** em todo o projeto.

| Critério WCAG 2.2 | Estado | Observação |
|---|---|---|
| 2.5.8 Target Size (AA, 24px) | ✅ Passa | O projeto adota 44px, bem acima do mínimo |
| 1.4.3 Contraste (AA) | ✅ Passa | Validado por script e medido no browser em várias tasks |
| 2.4.11 **Focus Appearance (AA)** | 🟠 **Provável falha** | Só 8 referências a foco em ~10.400 linhas; navegação por teclado provavelmente sem indicador consistente |
| 1.1.1 Conteúdo não textual | ✅ Passa | *(Correção: a auditoria apontou "3 `<img>` sem alt" — era **falso positivo da medição**. O grep olhava só a mesma linha, e no JSX multi-linha o `alt` está abaixo. Verificado um a um: os três estão corretos — `alt=""` em imagem decorativa e `alt` real no primeiro quadro do card.)* |
| 2.5.7 Dragging (AA) | ✅ N/A | O scrub do gráfico tem alternativa (tabela oculta) |
| Reduced motion | ✅ Passa | 9 referências, respeitado nas animações |

**Recomendação:** um passe de foco visível global (um anel `focus-visible` no CSS base cobre
quase tudo de uma vez). Trabalho de horas, fecha o gap de AA.
✅ **FEITO na TASK-031.** Anel duplo (interno na cor do fundo, externo no acento), medido no
browser com navegação real por teclado: 9,87:1 contra o fundo da página. O anel duplo se
provou necessário — no botão de acento o anel teal sozinho mede **1,00:1**, ou seja, o foco
seria invisível justamente no CTA principal.

> Acessibilidade continua sendo intocável mesmo com o escopo aberto — e é o único item desta
> auditoria que eu recomendaria tratar como bloqueador de release.

---

## 7. UX e fluxos

- 🟡 **Nada é buscável.** Sem busca ou filtro em lugar nenhum. Com um ano de histórico,
  `/relatorios` vira uma parede de meses. Buscar por exercício ("quando foi meu melhor
  supino?") é a pergunta mais natural do usuário e não tem resposta.
- 🟡 **Não existe desfazer.** Apagar uma medida, trocar de plano, concluir um treino sem
  querer — nenhum tem volta.
- 🟡 **Falta edição retroativa.** Não dá para registrar um treino de ontem que foi esquecido.
  Isso força o usuário a mentir para o app ou deixar buraco no histórico — e o app inteiro é
  construído sobre a veracidade desse histórico.
- 🟢 **A navegação está boa.** 4 abas + sub-telas coerentes, sem labirinto.

---

## 8. Recomendações priorizadas

**Faixa 1 — bloqueadores de "Top Score" (fazer primeiro)**
1. ✅ **Exportar/importar backup completo** (§4.1) — **FEITO na TASK-031.**
2. **Onboarding que gera plano no app** (§3.1) — destrava qualquer usuário que não seja você. *Esforço: médio.*
3. ✅ **Passe de foco visível** (§6) — **FEITO na TASK-031.**

**Faixa 2 — alto retorno**
4. **Capacitor + Android** (§4.4) — resolve o item 2 de verdade, abre loja e HealthKit/Health Connect. *Esforço: médio.*
5. **Testes de UI com jsdom + fake-indexeddb** (§4.2) — ataca a classe de bug que mais custou. *Esforço: médio.*
6. **Escala tipográfica: subir o herói, matar o 10px** (§5.1). *Esforço: baixo.*
7. **Resolver a dieta** — entregar ou remover o link (§3.3). *Esforço: baixo a médio.*

**Faixa 3 — refinamento**
8. Busca por exercício no histórico (§7).
9. Registro retroativo de treino (§7).
10. Quebrar o `treino/page.tsx` (§4.3).
11. Tokens no mapa muscular (§5.2).
12. Card compartilhável de recorde/sessão (§3.2b).
13. Tema claro (§5.3).

---

## 9. O que eu recomendo NÃO mudar

Mesmo com o escopo aberto, três coisas seriam um erro trocar por "modernidade":

1. **Honestidade de dados.** É o diferencial mais raro que o app tem. Todo concorrente
   estima e apresenta como fato; a disciplina de não fazer isso é o que dá autoridade.
2. **Anti-culpa.** Tem respaldo teórico (SDT) e é o oposto do padrão da categoria. Streak
   punitivo aumenta engajamento de curto prazo e destrói motivação autônoma.
3. **O app não prescreve.** É o que mantém a arquitetura plan-file honesta e o risco
   regulatório baixo.

**Local-first**, por outro lado, eu trataria como **decisão revisável, não dogma** — desde
que a revisão preserve as três acima. Ela é hoje a causa direta do achado nº 2 (sem backup)
e do pilar de relacionamento ausente.

---

## 10. Fontes

- [Best Strength Training Apps 2026 — Hevy vs Strong vs Fitbod](https://www.findyouredge.app/news/best-strength-training-apps-2026)
- [Best Workout Apps for Strength Training 2026 — Built](https://www.builtworkout.com/blog/best-workout-apps-for-strength-training)
- [Adaptive AI Workout Apps in 2026: Four Levels of Fatigue-Aware Training — SensAI](https://www.sensai.fit/blog/adaptive-ai-workout-apps-fatigue-rationale)
- [Guidance on Applying WCAG 2.2 to Mobile Applications — W3C](https://www.w3.org/TR/wcag2mobile-22/)
- [WCAG 2.2 New Success Criteria: Implementation Guide — TestParty](https://testparty.ai/blog/wcag-22-new-success-criteria)
- [What WCAG 2.2 Means for Native Mobile Accessibility — Deque](https://www.deque.com/blog/what-wcag-2-2-means-for-native-mobile-accessibility/)
- [Apps That Motivate: a Taxonomy of App Features Based on Self-Determination Theory — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1071581920300513)
- [The impact of fitness app need support on exercise adherence — Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1752995/full)
- [Health & Fitness App Benchmarks 2026 — Business of Apps](https://www.businessofapps.com/data/health-fitness-app-benchmarks/)
- [Mobile App Retention Benchmarks 2026 — Snoopr](https://www.snoopr.co/blog/mobile-app-retention-benchmarks-2026-what-good-looks-like-for-fitness-ecommerce-gaming-and-more)
- [Mobile App Onboarding Metrics — Digia](https://www.digia.tech/post/mobile-app-onboarding-metrics/)
- [WHOOP Design Breakdown: Data-Dense UI That Feels Simple — 925 Studios](https://www.925studios.co/blog/whoop-design-breakdown)
- [Oura home screen redesign — Crausser](https://www.crausser.com/oura-redesign)
- [Healthcare App UI/UX Design Best Practices 2026 — Fuselab](https://fuselabcreative.com/healthcare-app-ui-ux-design-best-practices/)
- [ElectricSQL vs PowerSync vs Zero: Best Local-First Sync Engine 2026 — BuildPilot](https://trybuildpilot.com/648-electric-sql-vs-powersync-vs-zero-2026)
- [Local-First Software in 2026 — Verity Research](https://verity.salient.community/research/local-first-software-in-2026.html)
- [React Native vs Expo vs Capacitor 2026 — PkgPulse](https://www.pkgpulse.com/guides/react-native-vs-expo-vs-capacitor-cross-platform-mobile-2026)
- [Convert Your Next.js App to iOS & Android with Capacitor — Capgo](https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/)
- [capacitor-health (HealthKit / Health Connect) — Cap-go](https://github.com/Cap-go/capacitor-health)
