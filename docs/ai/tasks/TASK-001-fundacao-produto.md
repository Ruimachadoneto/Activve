# TASK-001 — Definição de produto + arquitetura + direção visual

## Metadados

- Status: `ready`
- Risco: `alto` (decisões fundacionais difíceis de reverter: modelo de dados, auth/RLS, identidade visual)
- Lead/Planner: `Claude`
- Implementer: `—` (sem código nesta task)
- Reviewer: `humano` (+ Codex como crítico independente do plano/ADR, opcional)
- Branch/worktree: `docs apenas em main` (sem código)
- Branch base: `origin/main`

## Objetivo

Produzir a base de decisão do **Activve** — **sem implementar telas** — para que a primeira feature já nasça certa. Entregáveis verificáveis:
1. `docs/ai/PRODUCT.md` — spec: público, objetivos, **não-objetivos**, user stories, recorte do MVP.
2. **`docs/ai/PLAN_SCHEMA.md` + schema JSON versionado** — o contrato do arquivo de plano (treino/dieta/meta/métricas) que o gerador produz e o app importa. Artefato CENTRAL do projeto.
3. **Gerador (prompt/artifact) de anamnese** que emite arquivos compatíveis com o schema — projetado junto com o schema (dois lados do mesmo contrato).
4. `docs/ai/DECISIONS.md` (ADR-001) — arquitetura: Next 16 + Supabase, modelo de dados, RLS, import/validação do plano, offline/sync, continuidade entre planos (histórico).
5. Direção visual: benchmark do segmento fitness + esboço de `docs/DESIGN_SYSTEM.md` com **identidade própria** (conforme `VISUAL_QUALITY.md §3-5`).

## Contexto

- Problema: produto greenfield ambicioso (treino, dieta, meta, peso, corpo) que precisa de fundação sólida antes de código.
- **Arquitetura "plan-file driven":** um gerador externo (artifact) faz a anamnese e emite um **arquivo de plano JSON**; o Activve loga o usuário, importa/valida o arquivo e monta+rastreia tudo. Logo o app não tem IA — a curadoria é o output do gerador.
- Coach = conteúdo curado via gerador, **sem IA de servidor**. Multiusuário com contas/sync.
- Formato do plano decidido: **JSON validado por schema (Zod), com `schemaVersion`**.
- Referência de conceito (NÃO copiar): `C:\Users\Rui Neto\Downloads\barbara-fit-pwa`.

## Restrições

- Sem chave de API de IA; inteligência = output do gerador (arquivo de plano).
- Segredos do Supabase só em `.env.local`; `service_role` nunca no cliente.
- Local-first (IndexedDB) + sync idempotente; RLS isola dados por usuário.
- **Upload = entrada não confiável:** validar contra o schema, checar ranges sãos (peso/reps/calorias), escapar texto renderizado (anti-XSS), limitar tamanho do arquivo, e dar erro claro em plano inválido/versão incompatível.
- Schema do plano **versionado**; o app rejeita/migra versões que não entende.

## Fora de escopo

- Qualquer código de tela/feature (vai para TASK-002+).
- Provisionar Supabase de produção / aplicar migrations.
- Deploy/hospedagem.

## MVP proposto (a confirmar com o usuário)

**Incluir no v1:** Auth/contas (Supabase) · Treino (planos curados + execução: registro série a série + timer de descanso) · Corpo (peso + medidas + histórico) · Meta (definir e acompanhar). **Dieta no v1:** apenas plano curado *visualizável*. **v2:** tracking completo de dieta, fotos de progresso, analytics, sugestão de progressão de carga.

Justificativa: foca o loop diário de maior valor (treinar + acompanhar progresso) sem afundar na complexidade de tracking nutricional logo de cara.

## Critérios de aceite

- [ ] `PRODUCT.md` define público, objetivos, não-objetivos, ≥6 user stories e o recorte de MVP aprovado.
- [ ] ADR-001 registra a stack, o modelo de dados e a estratégia offline/sync com alternativas e consequências.
- [ ] Benchmark de ≥4 produtos do segmento registrado; direção visual com identidade própria definida.
- [ ] Usuário aprovou o MVP antes de abrir a TASK-002.

## Plano proposto

1. Confirmar recorte de MVP com o usuário.
2. Escrever `PRODUCT.md`.
3. Escrever ADR-001 (arquitetura + dados + sync).
4. Benchmark fitness + direção visual + esboço do design system.
5. Handoff e atualização do `STATUS.md`; definir TASK-002 (primeira feature).

## Validações obrigatórias

```bash
# sem código nesta task — validação é revisão humana dos documentos
```

## Registro de execução

- Data: 2026-06-22 — contrato criado (Lead/Planner). Aguardando confirmação do MVP.
