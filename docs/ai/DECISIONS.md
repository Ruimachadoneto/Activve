# Decisões arquiteturais e operacionais

Registre somente decisões duráveis. Use uma entrada por decisão.

## ADR-000 — Adoção do protocolo multiagente

- Data: 2026-06-22
- Status: aceito
- Contexto: Claude Code e Codex serão usados no mesmo repositório.
- Decisão: usar `AGENTS.md` como fonte compartilhada, `CLAUDE.md` como importador, worktrees por tarefa e revisão cruzada em risco médio/alto.
- Consequências positivas: isolamento, rastreabilidade, menor dependência de memória de sessão.
- Consequências negativas: mais disciplina de Git e documentação.
- Alternativas descartadas: dois agentes editando o mesmo diretório; arquivo único gigantesco; papel fixo por fornecedor.

---

## ADR-001 — v1 local-first, sem conta (Supabase = Fase 2)

- Data: 2026-06-22
- Status: aceito
- Contexto: a visão é multiusuário com sync, mas o usuário real de curto prazo é individual. Contas + sync + RLS + LGPD são o maior multiplicador de complexidade e atrasam um app utilizável. O benchmark mostra que **posse de dados e privacidade** são muito desejados e que apps morrem por **fricção/complexidade** (80% abandonam em 30 dias).
- Decisão: **v1 é local-first, sem login.** Dados em IndexedDB, 100% offline, por aparelho. Backup/restauração via **export/import JSON**. Sem Supabase no v1. **Contas + sync + multiusuário = Fase 2**, atrás de uma camada de repositório (`src/lib`) para não reescrever o v1.
- Consequências positivas: entrega rápida; **privacidade por padrão** (dado de corpo/foto não sai do aparelho); zero custo de infra; pouca superfície de segurança/LGPD no v1; export vira cidadão de 1ª classe (e feature de marca "leve seu coach").
- Consequências negativas: sem sync entre aparelhos no v1 (mitigado por export/import); risco de perda ao limpar o navegador (mitigado por export + avisos); a camada de dados precisa nascer abstraída para permitir a nuvem na Fase 2.
- Alternativas descartadas: Supabase + contas desde o v1 (caro/lento, mata o foco); persistência não estruturada.
- Substitui/é substituído por: —

---

## ADR-002 — Arquitetura plan-file de ciclo fechado (contrato JSON bidirecional)

- Data: 2026-06-22
- Status: aceito
- Contexto: o "coach" (treino/dieta/meta) é gerado por anamnese. Queremos inteligência **sem IA no servidor nem custo**, e acompanhamento contínuo que ajuste o plano ao longo do tempo.
- Decisão: a inteligência mora num **gerador externo (artifact)**. Contrato **bidirecional em JSON versionado**: entrada = `PlanFile` (`PLAN_SCHEMA.md`), saída = `ReportFile` (`REPORT_SCHEMA.md`). O app **importa/valida/monta/rastreia/exporta**. Ciclo: `plano → executa → relatório → ajuste → novo plano`. Continuidade por `exercise.id`; `schemaVersion` governa compatibilidade. Obrigações de schema reforçam qualidade: **≥2 variações por exercício**, **`howTo` obrigatório**, **músculos** por exercício.
- Consequências positivas: **zero IA/custo no app**; desacoplamento gerador↔app (evoluem separados); **portabilidade/posse** dos dados (marca); **humano no loop sem backend** (um personal/nutri real pode gerar/ajustar o arquivo).
- Consequências negativas: depende do gerador emitir arquivos válidos (mitigado por **validação estrita** na importação); a UX de "exportar/subir arquivo" tem fricção (resolver no design); evoluir exige versionar os **dois** contratos juntos.
- Alternativas descartadas: IA no servidor/app (custo, chave, complexidade); plano em Markdown solto (parse frágil); app gerando o plano (recria o problema que evitamos).
- Substitui/é substituído por: —

---

## ADR-003 — `react-muscle-highlighter` para o mapa muscular de recuperação (TASK-009)

- Data: 2026-06-29
- Status: aceito
- Contexto: a tela Corpo precisa de um mapa anatômico (frente+costas) colorido por estado de recuperação. O mockup pede um 3D fotorrealista; construir/manter SVGs anatômicos à mão é caro e fora do nosso foco.
- Decisão: usar **`react-muscle-highlighter`** (v1.2.0, **MIT**, zero deps além de React) para desenhar o corpo. A inteligência (heurística de recuperação) é **nossa** e fica em `src/lib/plan/recovery.ts` (puro/testado); a lib é só camada de desenho. Ponte `Muscle→Slug` explícita em `src/lib/plan/muscleSlug.ts`. Carregada via `next/dynamic` (`ssr:false`) — dados vêm do IndexedDB no cliente.
- Consequências positivas: entrega rápida do "uau" visual; licença permissiva; sem custo; lógica de recuperação desacoplada da lib (trocável); type-safe.
- Consequências negativas: estilo **vetorial**, não o 3D fotorrealista do mockup (aceito para o v1, reavaliar depois); o vocabulário `MUSCLES` (20) não casa 1:1 com os 23 slugs (vários→mesma região; agregação pelo estado mais fatigado); +1 dependência de UI.
- Alternativas descartadas: SVG anatômico à mão (caro/lento); imagem estática (sem por-músculo); manter só peso/tendência (não bate o mockup).
- Substitui/é substituído por: —
- Nota de segurança: 2 vulnerabilidades moderadas no `npm audit` são do `postcss` (transitivo do **Next**), **pré-existentes** e não introduzidas por esta lib; fix exige upgrade major do Next (fora do escopo da TASK-009).

---

## ADR-[ID] — [Título]

- Data:
- Status: `proposto | aceito | substituído | rejeitado`
- Contexto:
- Decisão:
- Consequências positivas:
- Consequências negativas:
- Alternativas descartadas:
- Substitui/é substituído por:
