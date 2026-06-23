@AGENTS.md

# Instruções específicas do Claude Code

- Antes de codar nesta base, lembre: é **Next.js 16** (App Router, breaking changes). Consulte `node_modules/next/dist/docs/` quando a API divergir do que você "sabe".
- Para tarefas de risco médio ou alto, use Plan Mode antes de editar.
- Use subagentes para exploração ampla, pesquisa e revisão isolada; mantenha o contexto principal focado.
- Use worktrees para qualquer execução paralela ou alteração que possa colidir com outra sessão.
- Quando atuar como revisor, não altere arquivos na primeira passagem.
- Quando o Codex MCP estiver configurado (`.mcp.json`), delegue só tarefas autocontidas com diretório, contrato, restrições e critério de conclusão explícitos.
- Não importe automaticamente o playbook completo (`CLAUDE_CODEX_MASTER_PLAYBOOK.md`). Leia as seções relevantes sob demanda.
- Procedimentos longos pertencem a `docs/ai/` ou skills, não a este arquivo.
- Segredos do Supabase ficam em `.env.local` (ignorado). Nunca commitar chaves; a chave `service_role` jamais vai para o cliente.
