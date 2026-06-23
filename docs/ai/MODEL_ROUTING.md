# Roteamento de modelos e papéis

**Snapshot:** 22 de junho de 2026. Modelos, aliases e disponibilidade mudam; valide no seletor e na documentação oficial antes de fixar configurações.

## Estado atual relevante

- O Codex recomenda `gpt-5.5` para a maioria das tarefas complexas.
- `gpt-5.4` é alternativa forte para trabalho profissional de código e agentes.
- `gpt-5.4-mini` serve para tarefas leves, rápidas e subagentes.
- `gpt-5.3-codex-spark` é preview voltado a iteração quase instantânea e está limitado a usuários Pro.
- Claude Opus 4.8 é o principal modelo Anthropic disponível para raciocínio complexo e coding agentic de longo horizonte.
- Claude Sonnet 4.6 oferece boa relação capacidade/velocidade para implementação comum e agentes.
- Claude Haiku 4.5 é indicado para trabalho simples, classificação, pesquisa curta e subagentes baratos.
- Claude Fable 5 foi lançado em 9 de junho de 2026, mas a Anthropic suspendeu o acesso em 12 de junho de 2026. Portanto, este playbook **não depende dele** enquanto a suspensão permanecer.

## Matriz recomendada

| Situação | Lead/Planner | Implementer | Reviewer | Observação |
|---|---|---|---|---|
| Arquitetura ambígua, root cause difícil, refatoração transversal | Claude Opus 4.8, esforço alto/xhigh quando disponível | Codex GPT-5.5 por slices ou Claude Opus 4.8 | Modelo diferente do implementador | Use propostas independentes em alto risco |
| Feature bem especificada com bons testes | Codex GPT-5.5 | Codex GPT-5.5 | Claude Sonnet 4.6 ou Opus 4.8 | Fluxo eficiente e objetivo |
| Implementação comum com custo moderado | Claude Sonnet 4.6 ou GPT-5.4 | mesmo modelo ou GPT-5.5 | modelo de outra família | Meça no seu repo |
| Bug local reproduzível | GPT-5.4 / Sonnet 4.6 | GPT-5.4 / Sonnet 4.6 | revisão focal do outro agente | Evite arquitetura desnecessária |
| Bug sem reprodução ou causa obscura | Opus 4.8 ou GPT-5.5 | modelo que produziu melhor hipótese validada | outro modelo | Exija teste de regressão |
| Migração de dados | análises independentes Opus 4.8 + GPT-5.5 | slices pequenos, preferencialmente GPT-5.5 | outro modelo + humano | Backup, dry run, rollback |
| Segurança/auth/pagamento | Opus 4.8 + GPT-5.5 em análise separada | modelo designado após plano aprovado | revisão cruzada + ferramenta especializada + humano | Nenhum merge automático |
| UI a partir de Figma/screenshot | Claude para brief/UX ou design source | Codex GPT-5.5 com Playwright ou Claude Sonnet/Opus | Claude para crítica visual + testes automáticos | Critérios visuais explícitos |
| Boilerplate/documentação mecânica | Haiku 4.5 ou GPT-5.4-mini | Haiku 4.5 ou GPT-5.4-mini | amostragem por modelo maior | Não use frontier para trocar três strings |
| Exploração ampla do repo | subagentes Haiku/Sonnet ou GPT-5.4-mini | nenhum | Lead sintetiza | Somente leitura |
| Revisão de PR | GPT-5.5 `/review` para defeitos e testes | nenhum | Opus 4.8 para arquitetura/UX em PR crítico | Fresh context |
| Iteração instantânea curta | GPT-5.3-codex-spark, quando disponível | Spark | revisão posterior em GPT-5.5/Claude | Preview, texto apenas |

## Heurística de decisão

Some um ponto para cada condição:

- tarefa ambígua;
- mais de cinco módulos afetados;
- duração provável superior a uma sessão;
- risco de dados/segurança;
- necessidade de múltiplas ferramentas;
- ausência de testes;
- decisão arquitetural difícil de reverter.

### 0–1 ponto

Modelo rápido/eficiente. Um agente e revisão focal.

### 2–3 pontos

Modelo frontier para planejamento ou implementação; revisão cruzada obrigatória.

### 4+ pontos

Análises independentes, plano versionado, slices, worktrees, CI, revisão cruzada e decisão humana.

## Como avaliar no próprio repositório

Não trate benchmarks públicos como destino final. Crie um conjunto de 10 a 20 tarefas históricas representativas e compare:

- taxa de conclusão aceita sem retrabalho;
- bugs encontrados após a entrega;
- diffs fora de escopo;
- tempo e custo;
- qualidade dos testes;
- aderência às instruções;
- clareza do handoff.

Atualize esta matriz com evidência local. O melhor modelo “na internet” pode ser apenas o melhor modelo no repositório de outra pessoa, com outro prompt e uma quantidade surpreendente de fé.

## Perfis sugeridos

### Perfil máximo rigor

- Planejamento: Opus 4.8 ou GPT-5.5.
- Implementação: GPT-5.5 ou Opus 4.8.
- Revisão: modelo frontier da outra família.
- Gates: todos os testes, segurança e revisão humana.

### Perfil equilibrado

- Planejamento: Sonnet 4.6 ou GPT-5.4.
- Implementação: GPT-5.5 para tasks difíceis, Sonnet/GPT-5.4 para comuns.
- Revisão: modelo diferente e focal.

### Perfil econômico

- Exploração e boilerplate: Haiku 4.5/GPT-5.4-mini.
- Escalada para frontier apenas em ambiguidade, falha repetida ou alto risco.
- Revisão por amostragem em baixo risco; obrigatória em médio/alto.
