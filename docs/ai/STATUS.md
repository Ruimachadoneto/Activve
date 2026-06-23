# Estado atual do projeto

- Atualizado em: `2026-06-22`
- Branch estável: `main`
- Versão/release: `0.1.0` (scaffold inicial)
- Objetivo atual: **fundação do fitapp** — projeto greenfield (Next 16 + TS + Tailwind v4 + Supabase) nascendo com o kit Claude+Codex instalado.
- Próxima tarefa prioritária: **TASK-001 — definição de produto + ADR de arquitetura + direção visual** (Lead/Planner; ainda sem código de produto).
- Riscos conhecidos: 2 vulnerabilidades moderadas reportadas pelo `npm` no scaffold (auditar); nenhum runner de testes configurado ainda; aliases de modelo do Codex não fixados (validar no `codex`).
- Dívidas relevantes: testes (unit/integration/e2e) `[A CONFIGURAR]`; PWA (manifest/service worker) ainda não adicionada; Supabase ainda não provisionado.

## Contexto essencial
- Produto: parceiro de treino/coach/personal/nutri (treino, dieta, meta, peso, corpo). Coach = conteúdo curado + regras, **sem IA de servidor**. Multiusuário com contas/sync.
- Referência de conceito (NÃO copiar código): app da Bárbara em `C:\Users\Rui Neto\Downloads\barbara-fit-pwa`.
- Decisão de stack: ver futura ADR-001 em `DECISIONS.md`. Supabase escolhido por Auth+RLS+Storage+sync no tier grátis.

## Tarefas ativas

| ID | Título | Status | Implementer | Reviewer | Branch |
|---|---|---|---|---|---|
| TASK-001 | Definição de produto + arquitetura + direção visual | A INICIAR | — | — | — |

## Última entrega validada

- Tarefa: Fundação (scaffold + kit Claude+Codex)
- Commit: (commit inicial deste setup)
- Validações: `create-next-app` OK; estrutura criada; `AGENTS.md`/`CLAUDE.md` mesclados; script `typecheck` adicionado.
- Observações: faltam rodar `npm run lint`/`typecheck`/`build` como gate antes de evoluir; provisionar Supabase; adicionar PWA.
