# Activve — Visão de produto e caminho de escala

> Fonte da verdade da **visão** (o "porquê" e o "para onde"). Complementa o `PRODUCT.md` (o produto
> hoje) e os contratos `PLAN_SCHEMA.md` / `REPORT_SCHEMA.md` (o "como"). Decisões dur
> registradas em `DECISIONS.md`.

## 1. O ciclo (é o coração do produto)

Dois sistemas, um contrato bidirecional de arquivos entre eles:

1. **Activve Health System (site, com conta)** — o **coach**. Faz a **anamnese guiada** (objetivo,
   dores, barreiras físicas/psicológicas, contexto de vida e de alimentação) e gera um **plano
   holístico**: treino + dieta + **plano psicológico** (leitura, meditação, lazer, filmes, jogos —
   o que sustenta o objetivo além do treino/dieta). Entrega um **documento** ao usuário (pra ter e
   acompanhar) e um **arquivo** (`PlanFile`) pra importar no app.
2. **App Activve (aparelho, local-first)** — o que já construímos. O usuário treina (dias
   flexíveis), acompanha dieta, peso, medidas, recuperação. No fim do **prazo do ciclo**, **exporta**
   um relatório (`ReportFile`) de todo o acompanhamento.
3. O usuário **leva o relatório de volta ao site**, que **analisa, entende e ajusta** → gera um
   **novo documento/plano** → sobe no app → **novo ciclo**. E assim por diante.

O contrato `PlanFile`/`ReportFile` (ADR-002) é a **ponte**: hoje manual (baixa/sobe arquivo),
amanhã uma chamada de API autenticada. O código do app quase não muda.

## 2. Por que local-first + coach na nuvem (o híbrido)

- **Dados do usuário ficam no aparelho** (treino/corpo/fotos). Não é limitação: é **privacidade
  como diferencial** ("seus dados, só seus") + infra barata (não guardamos o log de todo mundo).
- **Coach + conta + cobrança na nuvem** — a camada paga (o valor é a análise/plano personalizado).
- O rastreio individual não exige backend multi-tenant complexo; a nuvem serve só o coach e o billing.

## 3. Modelo de valor

- **App = companheiro gratuito** que fideliza e coleta o acompanhamento.
- **Site = serviço pago**: anamnese + análise + plano ajustado **a cada ciclo**. O "prazo → export →
  novo plano" é também o **motor de retenção**. O valor depende do coach entregar um plano
  genuinamente melhor a cada volta — a qualidade do coach é tudo.

## 4. Fases (não pivotar antes de validar)

- **Fase 0 — agora:** app local-first funcional (feito: TASK-004→014). Coach como **Claude Project**
  (spec em `docs/ai/coach/`), export/import **manual**. **Validar barato** se o coaching é bom o
  suficiente pra alguém pagar.
- **Fase 1 — fechar o loop no app:** export do `ReportFile`, rastreio leve de dieta (marcar
  refeição, não logar tudo), exibir o plano psicológico. Barato; completa o companheiro.
- **Fase 2 — só depois de validado:** site com contas, anamnese guiada, coach na nuvem (Agent
  SDK/API), assinatura (billing das lojas). O grande investimento, habilitado pela camada `src/lib`
  já abstraída — não é rewrite. ADR próprio quando chegar a hora.

## 5. O que já mantém a porta aberta (sem custo)

Contrato Plan/Report como interface do coach; storage isolado em `src/lib`; zero IndexedDB solto nos
componentes. É só continuar assim.
