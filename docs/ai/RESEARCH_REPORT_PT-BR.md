# Claude Code + Codex: pesquisa e modelo operacional conjunto

**Data de corte:** 22 de junho de 2026  
**Escopo:** Claude Code, OpenAI Codex CLI/App/IDE, Git worktrees, MCP, revisão cruzada, seleção de modelos, segurança, documentação e governança.

## 1. Resumo executivo

A melhor forma de usar Claude Code e Codex juntos não é fazê-los conversar livremente enquanto ambos alteram o mesmo diretório. Esse arranjo parece futurista até o primeiro conflito de merge, a primeira migração duplicada e o primeiro agente “corrigir” o trabalho do outro antes de ele terminar.

O modelo mais robusto possui cinco pilares:

1. **Fonte de instruções compartilhada e curta:** `AGENTS.md`, importada pelo `CLAUDE.md`.
2. **Contrato de tarefa versionado:** objetivo, contexto, restrições, critérios de aceite, risco, rollback e validação.
3. **Isolamento por worktree:** um escritor por tarefa/diretório.
4. **Revisão independente:** outro modelo, em sessão limpa, revisa o diff contra a especificação.
5. **Gates determinísticos:** build, lint, typecheck, testes, segurança e aprovação humana para merge/produção.

A divisão de papéis deve ser dinâmica. Em geral, Claude Opus 4.8 é uma boa opção para problemas ambíguos, arquitetura e trabalhos longos; Codex GPT-5.5 é uma boa opção para implementação complexa, execução de ferramentas, testes e revisão de diff. Mas o fluxo também deve permitir a inversão. A única regra realmente durável é: **quem escreve não deve ser o único juiz da própria obra em tarefas relevantes**.

## 2. O que as documentações oficiais estabelecem

### 2.1 Memória e instruções

Claude Code inicia cada sessão com contexto novo e usa `CLAUDE.md` como instrução persistente. A documentação recomenda conteúdo específico e conciso, com alvo inferior a cerca de 200 linhas por arquivo principal. Arquivos grandes consomem contexto e reduzem a chance de as regras serem seguidas.

Claude Code não lê `AGENTS.md` automaticamente, mas suporta importação por `@path`. A própria documentação sugere criar um `CLAUDE.md` contendo `@AGENTS.md` quando o repositório já usa o padrão de outros agentes. Isso elimina duplicação e divergência.

Codex usa `AGENTS.md` como guia durável. A documentação recomenda que o arquivo contenha layout, comandos, convenções, restrições e definição de pronto; também recomenda mantê-lo curto e mover procedimentos detalhados para documentos separados.

**Consequência:** a arquitetura correta é uma fonte comum curta, não dois manuais duplicados. `CLAUDE.md` serve como adaptador e contém apenas exceções específicas do Claude.

### 2.2 Planejamento e contexto

As orientações de ambos convergem em quatro elementos para tarefas confiáveis:

- objetivo;
- contexto relevante;
- restrições;
- definição verificável de conclusão.

Claude recomenda explorar antes de alterar, planejar mudanças relevantes e delegar pesquisa ampla a subagentes para preservar o contexto principal. Codex recomenda Plan Mode em tarefas complexas e solicitações estruturadas.

**Consequência:** o plano não deve viver somente no chat. Deve ser um artefato versionado que outro agente consegue ler sem herdar toda a conversa.

### 2.3 Worktrees

Git worktree cria diretórios separados, cada um com sua própria branch, mas compartilhando o histórico do repositório. Claude Code possui suporte nativo com `claude --worktree <nome>` e cria, por padrão, diretórios sob `.claude/worktrees/`. O Codex App também possui worktrees e handoff entre ambiente local e isolado; no CLI, worktrees Git comuns atendem ao mesmo objetivo.

**Consequência:** paralelismo seguro é paralelismo de diretórios e branches, não apenas de janelas de terminal.

### 2.4 Teste e revisão

Codex recomenda explicitamente escrever/atualizar testes, executar checks, confirmar comportamento e revisar o diff. O comando `/review` pode comparar contra base, mudanças não commitadas ou commit específico. Claude recomenda separar implementação e revisão, inclusive com contexto independente.

**Consequência:** revisão cruzada não é decoração. Ela deve comparar a entrega ao contrato e gerar achados reproduzíveis.

### 2.5 Hooks e enforcement

As regras em Markdown são contexto consultivo. Claude documenta hooks como forma determinística de executar ou bloquear ações. No Codex, sandbox, políticas de aprovação, configuração e CI exercem papel semelhante de controle.

**Consequência:** toda regra crítica que puder ser automatizada deve migrar de texto para teste, hook, CI, proteção de branch ou permissão. Pedir educadamente para um agente nunca quebrar a build é inferior a impedir merge com build quebrada. A humanidade descobriu isso com pessoas e, por algum motivo, precisou redescobrir com robôs.

## 3. O que as comunidades mostram

Reddit, Hacker News e relatos de ferramentas multiagente mostram padrões recorrentes:

- “Claude implementa, Codex revisa, Claude corrige” é comum.
- O fluxo inverso também funciona: Codex planeja/implementa, Claude revisa arquitetura e produto.
- Usuários com resultados consistentes adotam especificação, branches isoladas, testes e handoffs.
- Worktrees reduzem colisão, mas não resolvem integração sem contratos claros.
- O gargalo muda da produção de código para revisão humana e validação.
- Muitas sessões paralelas geram mais output do que um humano consegue avaliar.
- Loops subjetivos do tipo “continue até 9/10” podem virar repetição sem critério objetivo.

Relatos comunitários são úteis para descobrir padrões, não para definir ranking universal. Repositórios, versões, prompts, planos, custos e habilidade do operador variam demais.

## 4. Modelos de colaboração comparados

### 4.1 Dois agentes no mesmo diretório

**Vantagem:** setup quase zero.  
**Problemas:** colisão, contexto inconsistente, mudanças sobrescritas, commits misturados e revisão impossível.  
**Veredito:** aceitável apenas quando um agente está estritamente em modo leitura. Nunca para dois escritores simultâneos.

### 4.2 Alternância manual na mesma branch

**Vantagem:** simples para tarefa pequena.  
**Problemas:** cada agente herda alterações não commitadas; autoria e causalidade ficam nebulosas.  
**Veredito:** use apenas em baixo risco e faça commit antes da troca.

### 4.3 Branches/worktrees separadas e PR

**Vantagem:** isolamento, diffs limpos, rollback, CI e revisão.  
**Problemas:** requer disciplina e setup por worktree.  
**Veredito:** melhor padrão geral.

### 4.4 Um agente orquestra o outro por MCP

**Vantagem:** handoffs automáticos, repetibilidade e possibilidade de pipeline.  
**Problemas:** permissões, tracing, loops, custo, perda de supervisão e maior superfície de falha.  
**Veredito:** segundo estágio, depois de o processo manual estar comprovado.

### 4.5 Orquestrador customizado com SDK

**Vantagem:** estados explícitos, guardrails, logs, evals e escala.  
**Problemas:** você passa a manter uma plataforma de agentes além do produto real.  
**Veredito:** justificado apenas com volume, repetição e métricas.

## 5. Divisão por situação

### 5.1 Arquitetura e problemas ambíguos

Use um modelo frontier para investigação e síntese. Claude Opus 4.8 é particularmente adequado para longo horizonte e coerência transversal; GPT-5.5 deve produzir uma crítica independente e procurar premissas não testadas. Não peça que um único modelo decida e valide a própria decisão.

### 5.2 Feature bem especificada

Codex GPT-5.5 pode liderar implementação quando há contrato, arquivos relevantes e comandos claros. Claude Sonnet 4.6 ou Opus 4.8 pode revisar impacto arquitetural e experiência. Em features simples, GPT-5.4 ou Sonnet 4.6 podem reduzir custo.

### 5.3 Refatoração ampla

O Lead deve construir mapa de dependências, invariantes e slices. Implementações devem ser pequenas, cada uma com testes e compatibilidade. Um revisor separado verifica se o refactor preservou comportamento e não virou reescrita disfarçada.

### 5.4 Bug sem causa conhecida

Dê o mesmo bug a ambos em modo investigação e sem compartilhar hipóteses iniciais. Exija reprodução, causa, experimento e teste de regressão. Só implemente depois que uma hipótese for confirmada.

### 5.5 UI/UX

Separe direção de produto de implementação. Um brief visual deve conter hierarquia, estados, comportamento responsivo, acessibilidade, referências e critérios observáveis. Codex ou Claude implementa; Playwright, screenshots e inspeção humana verificam. A revisão visual deve acontecer em ambiente renderizado, não somente lendo JSX como se beleza fosse propriedade emergente do TypeScript.

### 5.6 Testes

Para mudanças críticas, o autor dos testes de aceitação pode ser diferente do autor da implementação. Isso reduz o risco de escrever testes que apenas confirmam a interpretação do implementador. Testes devem representar contrato, casos de borda e regressão real.

### 5.7 Segurança, pagamentos e dados

Use análises independentes, menor escopo, sandbox, revisão de dependências, logs, rollback e gate humano. Agentes não devem executar produção, apagar dados ou mudar permissões sem autorização explícita.

## 6. Seleção de modelos em 22/06/2026

### OpenAI Codex

A documentação atual recomenda GPT-5.5 para a maioria dos trabalhos complexos de código, ferramentas, conhecimento e pesquisa. GPT-5.4 é alternativa forte; GPT-5.4-mini atende tarefas rápidas e subagentes; GPT-5.3-codex-spark é preview de iteração rápida para Pro.

### Anthropic Claude

Opus 4.8 é o principal modelo disponível para raciocínio complexo e coding agentic de longo horizonte. Sonnet 4.6 atende coding e agentes com melhor economia; Haiku 4.5 atende trabalho simples e rápido.

Fable 5 foi anunciado em 9 de junho de 2026, mas o acesso foi suspenso em 12 de junho de 2026. Como o usuário está fora dos Estados Unidos e a suspensão oficial permanece, o playbook usa Opus 4.8 como topo prático da Anthropic. Qualquer alias deve ser validado no ambiente; provedores terceiros podem atrasar versões.

## 7. Estrutura recomendada do repositório

```text
repo/
├── AGENTS.md
├── CLAUDE.md
├── CLAUDE_CODEX_MASTER_PLAYBOOK.md
├── .codex/
│   └── config.toml
├── .claude/
│   ├── settings.json
│   ├── rules/
│   └── skills/
├── docs/
│   └── ai/
│       ├── OPERATING_MODEL.md
│       ├── MODEL_ROUTING.md
│       ├── CODE_REVIEW.md
│       ├── TASK_TEMPLATE.md
│       ├── HANDOFF_TEMPLATE.md
│       ├── DECISIONS.md
│       ├── LESSONS.md
│       ├── STATUS.md
│       └── tasks/
└── [código]
```

### Por que não atualizar CLAUDE.md a cada task

O histórico transitório deve ficar em `STATUS`, contratos e `LESSONS`. Apenas uma regra recorrente e durável deve subir para `AGENTS.md`. A instrução anterior de registrar toda finalização, correção e lição diretamente no `CLAUDE.md` parece organizada, mas degrada o contexto com o tempo. A correção estrutural é preservar aprendizado sem carregá-lo inteiro em todas as sessões.

## 8. Protocolo de implementação

### Etapa 1: intake

Transforme o pedido em objetivo, contexto, restrições e “done when”. Classifique risco.

### Etapa 2: investigação

Leia código, documentação, logs e testes. Não edite durante a exploração inicial em tarefas médias/altas.

### Etapa 3: contrato

Crie o arquivo da task. Liste fora de escopo e comandos de validação.

### Etapa 4: escolha de papéis

Escolha Lead, Implementer e Reviewer. Para alto risco, obtenha duas propostas independentes.

### Etapa 5: worktree

Crie branch/worktree. Configure dependências e arquivos locais. Um único escritor recebe permissão de edição.

### Etapa 6: implementação incremental

Faça commits pequenos. Rode testes focais cedo. Não espere o final para descobrir que o projeto nem instala.

### Etapa 7: self-check

Revise diff, escopo, logs, erros, contratos e dependências.

### Etapa 8: revisão cruzada

O outro agente lê contrato e diff em sessão limpa. Reporta P0–P3 com evidência.

### Etapa 9: correção

O implementador responde a cada achado e repete checks.

### Etapa 10: aprovação humana

Humano avalia intenção, UX, risco, custo e merge. CI não entende estratégia; modelo não assume responsabilidade; o adulto da sala continua sendo você. Meus sentimentos.

## 9. Revisão cega e redução de ancoragem

Para decisões críticas, o revisor não deve começar lendo a longa defesa do implementador. Primeiro:

1. contrato;
2. diff;
3. testes;
4. achados independentes.

Depois, lê handoff e compara razões. Isso reduz a tendência de aceitar a narrativa original e ajuda a descobrir requisitos esquecidos.

## 10. Limites de paralelismo

O paralelismo deve ser determinado pela capacidade de integrar e revisar, não pela quantidade de terminais que a máquina suporta.

Comece com duas tasks independentes. Aumente apenas se:

- conflitos forem raros;
- cobertura de testes for boa;
- PRs permanecerem pequenos;
- revisão humana não acumular;
- custo e retrabalho forem aceitáveis.

Quatro agentes não produzem automaticamente quatro vezes mais valor. Frequentemente produzem quatro vezes mais diffs e uma reunião de integração com clima de velório.

## 11. MCP e automação

O Codex CLI expõe `codex mcp-server`, que pode ser conectado a clientes MCP. Esse recurso permite que Claude ou um orquestrador invoque Codex em tarefas delimitadas.

A delegação deve incluir:

- cwd/worktree;
- papel;
- contrato;
- arquivos permitidos;
- restrições;
- comandos;
- formato de saída;
- timeout/cancelamento;
- política de aprovação.

O MCP não substitui Git, testes ou revisão. Ele só automatiza a transferência da tarefa.

## 12. Segurança e permissões

Use `workspace-write` e aprovação sob demanda no Codex como início prudente. Habilite rede apenas quando necessária. No Claude, mantenha sandbox/permissions e revise hooks. Scripts de hook rodam comandos reais e devem ser tratados como código de infraestrutura.

Proteja:

- `.env` e credenciais;
- chaves de deploy;
- migrações e bancos;
- branches principais;
- comandos de package publishing;
- produção e cloud.

A ausência de intenção maliciosa não impede um agente competente de executar uma instrução ambígua com entusiasmo destrutivo.

## 13. Antipadrões

### “Os dois mexem juntos e depois a gente vê”

Resultado: autoria misturada, conflitos e validação impossível.

### “Claude sempre arquiteta, Codex sempre codifica”

Resultado: desperdício de capacidade e rigidez diante de tarefas diferentes.

### “Atualize CLAUDE.md com tudo”

Resultado: contexto inchado e regras importantes enterradas.

### “Continue revisando até dar nota 10”

Resultado: loop subjetivo. Use severidade, critérios de aceite e no máximo três ciclos.

### “A IA testou porque disse que testou”

Resultado: crença. Exija comandos e logs resumidos.

### “Vários agentes = mais velocidade”

Resultado: somente se integração, testes e revisão acompanham.

### “MCP resolve coordenação”

Resultado: MCP transporta mensagens; não define responsabilidade nem impede colisões.

## 14. Plano de adoção em quatro fases

### Fase 1: uma semana

- instalar `AGENTS.md` + `CLAUDE.md`;
- preencher comandos;
- usar template de task;
- limitar a uma task por vez;
- medir retrabalho.

### Fase 2: duas a quatro semanas

- adotar worktrees;
- revisão cruzada em médio/alto risco;
- proteger `main` com CI;
- registrar decisões e aprendizados.

### Fase 3: depois de estabilidade

- adicionar hooks/skills para erros recorrentes;
- automatizar reviews de PR;
- criar benchmark local de tasks históricas;
- ajustar roteamento de modelo.

### Fase 4: somente com necessidade comprovada

- ativar Codex MCP;
- criar orquestração e tracing;
- adicionar evals e limites de custo;
- automatizar tasks repetíveis.

## 15. Critérios para saber se o sistema está funcionando

Após 20 a 30 tasks, o processo deve demonstrar:

- menos regressões pós-merge;
- menor retrabalho por requisito mal entendido;
- PRs menores e mais fáceis de revisar;
- redução de conflitos;
- handoffs que permitem retomar após `/clear`;
- regras principais estáveis e curtas;
- escalada de modelo apenas quando necessária;
- humanos gastando mais tempo em decisões e menos em reconstruir contexto.

Se o tempo de governança superar o ganho em tarefas pequenas, reduza o ritual. Processo é ferramenta, não altar.

## 16. Recomendação final

Para um desenvolvedor individual ou pequeno time, comece com o **Nível 1/2**:

- `AGENTS.md` compartilhado;
- `CLAUDE.md` importador;
- contratos de task;
- worktrees;
- um escritor;
- revisão cruzada;
- CI;
- merge humano.

Use Claude Opus 4.8 como Lead em problemas ambíguos ou transversais e Codex GPT-5.5 como Implementer/Reviewer em tarefas técnicas complexas, mas permita inversão baseada em evidência local. Use Sonnet 4.6, GPT-5.4, Haiku 4.5 e GPT-5.4-mini para economizar em tarefas menores.

Somente depois de esse fluxo funcionar manualmente, conecte Codex via MCP ou construa um orquestrador. A automação deve cristalizar um processo bom, não encobrir um processo confuso.

## 17. Fontes

Consulte `docs/ai/SOURCES.md` para a bibliografia completa, com documentação oficial, Git, Reddit e Hacker News.
