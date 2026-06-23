# Estado atual do projeto

- Atualizado em: `2026-06-22`
- Branch estável: `main`
- Versão/release: `0.1.0` (scaffold inicial)
- Nome do produto: **Activve** (repo/pasta local já = `activve`; **repo GitHub ainda `fitapp` — renomear em Settings**).
- Objetivo atual: **TASK-001 — fundação de produto** (greenfield, Next 16 + TS + Tailwind v4 + Supabase, kit Claude+Codex). Arquitetura **plan-file driven**.
- Progresso TASK-001: ✅ `PRODUCT.md` · ✅ `PLAN_SCHEMA.md` (contrato JSON v1.0 + exemplo) · ⏳ gerador de anamnese · ⏳ ADR-001 · ⏳ benchmark/direção visual.
- Próximo passo: escrever o **gerador (prompt/artifact)** que emite planos válidos + **ADR-001** (arquitetura/dados/sync/import) + **benchmark fitness**.
- Riscos conhecidos: 2 vulnerabilidades moderadas reportadas pelo `npm` no scaffold (auditar); nenhum runner de testes configurado ainda; aliases de modelo do Codex não fixados (validar no `codex`).
- Dívidas relevantes: testes (unit/integration/e2e) `[A CONFIGURAR]`; PWA (manifest/service worker) ainda não adicionada; Supabase ainda não provisionado.

## Contexto essencial
- Produto: parceiro de treino/coach/nutri (treino, dieta, meta, peso, corpo). **Arquitetura plan-file:** gerador externo faz anamnese → emite **arquivo de plano JSON** → app importa/valida/monta/rastreia. **Sem IA de servidor.** Multiusuário com contas/sync.
- Formato do plano: **JSON + schema (Zod), versionado** — contrato em `docs/ai/PLAN_SCHEMA.md`.
- Referência de conceito (NÃO copiar código): app da Bárbara em `C:\Users\Rui Neto\Downloads\barbara-fit-pwa`.
- Stack: Next 16 + TS + Tailwind v4 + Supabase (Auth/RLS/Storage/sync, tier grátis). Detalhar em ADR-001.

## Tarefas ativas

| ID | Título | Status | Implementer | Reviewer | Branch |
|---|---|---|---|---|---|
| TASK-001 | Fundação de produto (spec + schema + gerador + ADR + direção visual) | EM ANDAMENTO | Claude (Lead) | humano | main (docs) |

## Última entrega validada

- Tarefa: Fundação (scaffold + kit Claude+Codex)
- Commit: (commit inicial deste setup)
- Validações: `create-next-app` OK; estrutura criada; `AGENTS.md`/`CLAUDE.md` mesclados; script `typecheck` adicionado.
- Observações: faltam rodar `npm run lint`/`typecheck`/`build` como gate antes de evoluir; provisionar Supabase; adicionar PWA.
