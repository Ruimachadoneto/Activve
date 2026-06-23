# Checklist de adoção

## Preparação

- [ ] Repositório está em Git e `main` está estável.
- [ ] `AGENTS.md` foi preenchido com stack, arquitetura e comandos reais.
- [ ] `CLAUDE.md` contém `@AGENTS.md`.
- [ ] `.claude/worktrees/` e `CLAUDE.local.md` estão no `.gitignore`.
- [ ] Segredos estão protegidos por permissões e não versionados.
- [ ] CI executa ao menos build/testes relevantes.

## Primeiro piloto

- [ ] Escolher tarefa média, reversível e representativa.
- [ ] Criar contrato em `docs/ai/tasks/`.
- [ ] Designar Lead, Implementer e Reviewer.
- [ ] Criar worktree e branch.
- [ ] Implementar em um único escritor.
- [ ] Executar validações e produzir handoff.
- [ ] Fazer revisão cruzada em contexto limpo.
- [ ] Corrigir achados e repetir validações.
- [ ] Obter aprovação humana e merge.

## Após cinco tarefas

- [ ] Medir retrabalho, conflitos, bugs e custo.
- [ ] Identificar instruções ignoradas ou ambíguas.
- [ ] Remover texto redundante de `AGENTS.md`.
- [ ] Converter problemas recorrentes em testes/hooks/CI.
- [ ] Comparar pelo menos dois roteamentos de modelos.

## Antes de ativar MCP/orquestração

- [ ] Fluxo manual é repetível.
- [ ] Contratos e handoffs têm formato estável.
- [ ] Worktrees são criadas e limpas corretamente.
- [ ] Permissões e segredos estão delimitados.
- [ ] Há logging/tracing e cancelamento.
- [ ] Existe limite de custo e de ciclos.
- [ ] Merge e produção permanecem sob gate humano.
