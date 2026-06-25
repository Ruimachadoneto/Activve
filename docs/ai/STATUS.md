# Estado atual do projeto

- Atualizado em: `2026-06-22`
- Branch estável: `main`
- Versão/release: `0.1.0` (scaffold inicial)
- Nome do produto: **Activve** (repo/pasta local já = `activve`; **repo GitHub ainda `fitapp` — renomear em Settings**).
- Objetivo atual: **TASK-002 — import do plano** EM REVISÃO (branch `ai/TASK-002-import-plano-claude`; gates verdes). TASK-001 (fundação) concluída. v1 local-first.
- Progresso TASK-001: ✅ `PRODUCT.md` · ✅ `PLAN_SCHEMA.md` · ✅ `REPORT_SCHEMA.md` · ✅ `FEATURE_MAP.md` · ✅ `BENCHMARK.md` · ✅ `DECISIONS.md` (ADR-001/002) · ✅ **direção visual aprovada** ("Soft Tech Minimal" dark+teal, via mockups do GPT) + `docs/DESIGN_SYSTEM.md` (starter) · ⏳ gerador de anamnese.
- Próximo passo: **revisão cruzada do Codex** no diff de TASK-002 + verificação manual no browser; corrigir P0/P1; merge. Depois TASK-003 (Hoje / Modo treino). Em paralelo: gerador de anamnese; sourcing do asset do mapa muscular.
- Riscos conhecidos: 2 vulnerabilidades moderadas reportadas pelo `npm` no scaffold (auditar); nenhum runner de testes configurado ainda; aliases de modelo do Codex não fixados (validar no `codex`).
- Dívidas relevantes: testes (unit/integration/e2e) `[A CONFIGURAR]`; PWA (manifest/service worker) ainda não adicionada; Supabase ainda não provisionado.

## Contexto essencial
- Produto: parceiro de treino/coach/nutri (treino, dieta, meta, peso, corpo). **Arquitetura plan-file:** gerador externo faz anamnese → emite **arquivo de plano JSON** → app importa/valida/monta/rastreia. **Sem IA de servidor.** Multiusuário com contas/sync.
- Formato do plano: **JSON + schema (Zod), versionado** — entrada `docs/ai/PLAN_SCHEMA.md`, saída `docs/ai/REPORT_SCHEMA.md`.
- **Ciclo fechado:** `plano → executa → relatório → Artifact ajusta → novo plano`. App exporta relatório estruturado; sem backend/IA. Feature-destaque: **mapa do corpo** (músculos + recuperação).
- **Decisões do brainstorm:** v1 **local-first sem conta** (IndexedDB; contas+sync = Fase 2) · agenda **flexível** · dieta = ver + **marcar refeição** · **anti-culpa** · export/backup é MUST no v1. Ver `FEATURE_MAP.md`.
- Referência de conceito (NÃO copiar código): app da Bárbara em `C:\Users\Rui Neto\Downloads\barbara-fit-pwa`.
- Stack v1: Next 16 + TS + Tailwind v4 + IndexedDB (PWA). Supabase só na Fase 2. Detalhar em ADR-001.

## Tarefas ativas

| ID | Título | Status | Implementer | Reviewer | Branch |
|---|---|---|---|---|---|
| TASK-001 | Fundação de produto (spec + schema + ADR + direção visual) | CONCLUÍDA | Claude (Lead) | humano | main (docs) |
| TASK-002 | Import do plano (Zod + IndexedDB + tela /import) | PRONTA P/ MERGE | Claude | Codex (feito, sem P0/P1) | ai/TASK-002-import-plano-claude |

## Última entrega validada

- Tarefa: Fundação (scaffold + kit Claude+Codex)
- Commit: (commit inicial deste setup)
- Validações: `create-next-app` OK; estrutura criada; `AGENTS.md`/`CLAUDE.md` mesclados; script `typecheck` adicionado.
- Observações: faltam rodar `npm run lint`/`typecheck`/`build` como gate antes de evoluir; provisionar Supabase; adicionar PWA.
