<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras compartilhadas para agentes de desenvolvimento
> Fonte comum de instruções para Codex e Claude Code. Claude Code recebe via `CLAUDE.md` (`@AGENTS.md`).

## 1. Missão
Entregar alterações corretas, verificáveis, pequenas o suficiente para revisão e coerentes com a arquitetura e o produto. Qualidade não é "parece funcionar"; qualidade exige evidência.

## 2. Contexto do projeto
- **Produto:** fitapp — parceiro de treino/coach/personal/nutri na palma da mão. Cobre treino (academia/casa), dieta, acompanhamento de meta, peso e medidas corporais. **Greenfield**, do zero, mirando produto superior. Não é evolução de app anterior.
- **Coach:** conteúdo curado + regras no cliente. **Sem IA de servidor** (sem chave de API, sem custo por uso).
- **Usuários:** multiusuário com **contas e sync** entre aparelhos.
- **Stack principal:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase (Postgres, Auth, Row-Level Security, Storage). PWA instalável, **local-first** (IndexedDB) com sincronização quando online.
- **Diretórios críticos:** `src/app` (rotas/telas), `src/components` (UI — a criar), `src/lib` (domínio, supabase, storage local — a criar), `supabase/` (schema/migrations — a criar), `docs/ai/` (governança e contratos).
- **Arquitetura relevante:** dados isolados por usuário via RLS no Postgres; cópia local em IndexedDB; sync idempotente. Detalhe em `docs/ai/DECISIONS.md` quando houver ADR.
- **Ambiente suportado:** Node 22, npm. Windows (dev). Hospedagem alvo a definir (Vercel provável).

### Comandos obrigatórios
- Instalação: `npm install`
- Desenvolvimento: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Testes unitários: `[A CONFIGURAR — ainda não há runner de testes]`
- Testes de integração: `[A CONFIGURAR]`
- Testes E2E: `[A CONFIGURAR — Playwright candidato]`

Não invente comandos. Se um campo estiver `[A CONFIGURAR]`, configure-o em uma tarefa própria e atualize esta fonte antes de declarar testes como gate.

## 3. Hierarquia de instruções
1. Pedido explícito e atual do usuário.
2. Contrato da tarefa em `docs/ai/tasks/`.
3. Este `AGENTS.md` e regras locais mais específicas.
4. Decisões em `docs/ai/DECISIONS.md`.
5. Convenções inferidas do código existente.

Em conflito: pare a parte conflitante, documente a divergência e siga a instrução de maior prioridade que seja segura.

## 4. Classificação da tarefa
- **Baixo risco:** mudança local, reversível, sem alteração de contrato, dados, auth ou segurança.
- **Médio risco:** vários arquivos, novo comportamento, alteração de API interna, estado ou dependências.
- **Alto risco:** auth, autorização, RLS, migração de dados, segurança, infraestrutura, produção, contratos públicos ou refatoração transversal.

Risco médio/alto exige contrato de tarefa preenchido antes da implementação.

## 5. Papéis dinâmicos
- **Lead/Planner:** investiga, define escopo, riscos, plano e critérios de aceite.
- **Implementer:** escreve código e testes no worktree designado.
- **Reviewer:** analisa o diff em contexto separado e não altera arquivos na primeira passagem.

Claude e Codex podem exercer qualquer papel. O papel é escolhido pelo formato da tarefa, não pela marca. Em trabalho crítico, quem implementou não é o único revisor.

## 6. Regra de autoria
- **Um escritor ativo por worktree.** Agentes diferentes não editam o mesmo worktree ao mesmo tempo.
- Revisão inicial é somente leitura.
- Correções são feitas pelo implementador original ou por novo escritor designado.

## 7. Fluxo obrigatório
1. Ler este arquivo, o contrato da tarefa e `docs/ai/STATUS.md`.
2. Inspecionar o código relevante antes de propor solução.
3. Confirmar escopo, fora de escopo, riscos e critérios de aceite.
4. Plano curto para tarefas médias/altas.
5. Trabalhar em branch/worktree isolado.
6. Menor alteração coerente que resolva o problema.
7. Escrever/atualizar testes proporcionais ao risco.
8. Rodar validações relevantes.
9. Revisar o próprio diff por regressões e escopo acidental.
10. Produzir handoff (`docs/ai/HANDOFF_TEMPLATE.md`).
11. Revisão independente para tarefas médias/altas.
12. Corrigir achados válidos e repetir validações.

## 8. Contrato de tarefa
Use `docs/ai/TASK_TEMPLATE.md`. Deve conter: objetivo e resultado observável; contexto e arquivos; restrições e fora de escopo; critérios de aceite verificáveis; riscos e rollback; comandos de validação; responsável por implementação e revisão.

## 9. Limites de mudança
- Sem refatoração oportunista fora do escopo.
- Sem trocar libs/arquitetura/padrões sem justificativa registrada.
- Sem alterar contratos públicos silenciosamente.
- Sem remover validações, logs, testes ou controles de segurança para "fazer passar".
- Sem dependência nova sem verificar existência, manutenção, licença e necessidade.
- **Nunca** expor segredos, tokens, chaves Supabase de serviço ou dados pessoais.
- Sem operações destrutivas (migrations, reset de dados) sem autorização e plano de recuperação.

## 10. Qualidade de implementação
Preserve padrões locais antes de abstrair. Mudanças pequenas e coesas. Trate erros explicitamente. Valide entradas nas fronteiras. Evite duplicação relevante sem criar abstração prematura. Comentários explicam o não óbvio. Código gerado deve permanecer legível por humanos.

## 11. Testes e evidência
A conclusão informa: comandos executados e resultado de cada um; testes adicionados/modificados; verificações manuais; o que não pôde ser validado e por quê. Nunca declare sucesso sem rodar a validação. "Deve funcionar" é hipótese, não evidência.

## 12. Revisão independente
Para risco médio/alto: revisor em sessão separada; compara contra a branch base; lê o contrato antes do diff; procura correção, regressão, segurança, dados, concorrência, desempenho e ausência de testes; reporta só achados acionáveis. Severidades em `docs/ai/CODE_REVIEW.md`.

## 13. Limite de ciclos
Máximo três ciclos de revisão+correção automática. Se o problema reaparecer ou houver divergência arquitetural, pare e registre decisão humana necessária.

## 14. Git e worktrees
- Branches: `ai/<task-id>-<descricao>-<agente>`.
- Commits pequenos, descritivos, ligados ao contrato.
- Não reescrever histórico compartilhado sem autorização.
- Não fazer merge em `main` automaticamente.
- `.claude/worktrees/` está no `.gitignore`.

## 15. Documentação e memória
Atualize `docs/ai/STATUS.md` (estado + próximo passo), `docs/ai/LESSONS.md` (aprendizado recente), `docs/ai/DECISIONS.md` (decisão durável) e o contrato da tarefa. Atualize `AGENTS.md` só quando a regra for durável, recorrente e curta. Não use este arquivo como diário.

## 16. Política de qualidade visual
Toda task/feature com interface segue `docs/ai/VISUAL_QUALITY.md` (benchmark antes de desenhar, design system documentado, estados completos, auditoria PASS/NEEDS/FAIL por revisor que não implementou). Não pular sem justificativa registrada.

## 17. Definição de pronto
Critérios de aceite atendidos; escopo respeitado; validações relevantes passaram; testes cobrem o comportamento; revisão independente sem P0/P1; gate visual atendido quando houver UI; riscos residuais documentados; handoff e STATUS atualizados; humano aprovou merge/produção/decisão irreversível.
