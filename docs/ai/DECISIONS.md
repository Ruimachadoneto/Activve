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

## ADR-[ID] — [Título]

- Data:
- Status: `proposto | aceito | substituído | rejeitado`
- Contexto:
- Decisão:
- Consequências positivas:
- Consequências negativas:
- Alternativas descartadas:
- Substitui/é substituído por:
