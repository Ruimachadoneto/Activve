# TASK-007 — Corpo / evolução (peso + tendência, anti-culpa)

## Metadados
- Status: `ready`
- Risco: `médio` (novo store IndexedDB + migração v2→v3; tela nova)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex` + olhos do usuário
- Branch: `ai/TASK-007-corpo-evolucao-claude` · Base: `origin/main`

## Objetivo
Tela **/corpo**: mostrar a **meta do plano**, registrar **peso** (e medidas, stretch) ao longo do
tempo, e ver o **progresso por tendência** — com enquadramento **anti-culpa** (oscilação é normal,
sem BMI/% gordura em destaque, sem cobrança). Destrava o card "Corpo" do Hoje e a aba Corpo da nav.

## Contexto
- Plano fornece (`schema.ts`): `profile.weight_kg` (peso inicial), `goal.type`, `goal.targetWeight_kg?`, `goal.targetDate?`, `goal.summary?`.
- Storage atual: `db.ts` (idb v2: `plans`/`kv`/`sessions`); padrão de store em `sessions.ts`.
- Hoje tem card "Corpo (Em breve)" e a nav tem "Corpo" inativo (TASK-004/005) — destravar.
- FEATURE_MAP: registrar peso e medidas; progresso visual (tendência); **princípio anti-culpa**
  (proíbe streak punitivo, "você falhou", BMI/% gordura em destaque, anéis de meta).
- Continuidade: peso/medidas formam **timeline contínua** (não reseta ao trocar de plano).

## Modelo de dados (novo)
Store `bodylog` (keyPath `date`), DB **v2 → v3** (aditiva). Timeline contínua (não escopada a `planId`):
```
BodyEntry {
  date: string                       // yyyy-mm-dd (1 registro/dia; re-pesar atualiza)
  weight_kg?: number
  measures?: Record<string, number>  // cm (cintura, quadril… — stretch)
  note?: string
  recordedAt: string                 // ISO
}
```

## Restrições
- Anti-culpa: tendência (não cobrança); oscilação enquadrada como normal; **sem BMI/% gordura em destaque**.
- Direção do progresso respeita `goal.type` (perder/ganhar/manter).
- Peso por input numérico (`inputMode=decimal`) + passos opcionais; sem teclado obrigatório.
- Local-first; sem libs novas (gráfico em SVG na mão); migração não corrompe dados.

## Fora de escopo
- Fotos de progresso (tamanho no IndexedDB) → depois.
- Medidas detalhadas além de peso podem ir como stretch/v1.1.
- Relatório/export (TASK futura) — mas o modelo já serve de fonte.

## Critérios de aceite
- [x] Dado um plano, quando abro /corpo, então vejo a meta (tipo + alvo/data) e o peso atual/inicial. _(verificado)_
- [x] Quando registro um peso hoje, então ele persiste e aparece na tendência. _(verificado: 82,5→82,1 atualizou no IndexedDB, sem duplicar)_
- [x] Dado ≥2 registros, então vejo o gráfico de tendência e a variação anti-culpa ("oscilação é normal"). _(verificado)_
- [x] A aba Corpo e o card "Corpo" do Hoje levam a /corpo (sem "Em breve").
- [x] Migração v3 abre bases v2 sem perda; gates verdes (47 testes); testes da tendência passam.

## Plano proposto
1. **Modelo + storage:** `body.ts` (BodyEntry + `trend()`/formatação puros, testes); `bodylog.ts` (store, migração v3, `getBodyLog`, `saveBodyEntry`). 
2. **Tela /corpo:** card de meta; registrar peso (input); `WeightChart` (SVG) da tendência; estado vazio.
3. **Ativar navegação:** BottomNav `corpo → /corpo` (ativo); card Corpo do Hoje vira link; nav Corpo active na tela.
4. **Validação:** gates + preview (registrar → tendência → reload mantém).

## Riscos e mitigação
| Risco | Prob | Impacto | Mitigação | Rollback |
|---|---:|---:|---|---|
| Migração IndexedDB v3 | B | A | Aditiva (só `createObjectStore`), testar abrir v2 | Reverter DB_VERSION |
| Anti-culpa mal calibrado | M | M | Tendência + linguagem neutra; revisar com usuário | Ajustar cópia |
| Gráfico SVG na mão (edge: 0/1 ponto) | M | B | Estados p/ 0/1 registro; sem lib | — |

## Validações obrigatórias
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução
- 2026-06-26 — contrato criado; modelo `BodyEntry` (store `bodylog`, DB v3) e estratégia anti-culpa definidos.
- 2026-06-26 — implementado: `body.ts` (BodyEntry + `weightSeries`/`computeTrend`, 5 testes) + `bodylog.ts` (store) + migração v2→v3; tela `/corpo` (meta, peso+tendência anti-culpa, `WeightChart` SVG, registrar peso); nav Corpo ativada (BottomNav + card do Hoje viram link p/ /corpo). Corrigido bug de fuso no `formatDate` (data-only parseada como local). **Verificado no preview**: meta+gráfico, registrar 82,1 atualiza sem duplicar, alvo 01/08/2026. Gates verdes (47 testes). Pendente: revisão Codex; medidas (cintura etc.) como stretch.
