# Prompt completo para a réplica do Claude Code

Cole integralmente o conteúdo abaixo no Claude Code.

---

Quero que você faça uma segunda revisão crítica, agora sobre a resposta do ChatGPT à sua análise anterior.

IMPORTANTE:
- Não implemente nada.
- Não altere código.
- Não faça merge.
- Não crie nova task ainda.
- Não aceite as conclusões automaticamente.
- Verifique cada afirmação contra o código, histórico Git e documentação atual.
- Quando houver divergência, explique quem está certo, por quê e qual decisão recomenda ao dono do produto.
- Preserve trabalho não commitado e não troque de branch de forma destrutiva.

## Documentos que formam a discussão

### 1. Auditoria original do ChatGPT

Branch:

`ai/TASK-032-auditoria-gpt-activve-gpt`

Arquivo:

`docs/ai/AUDITORIA_ESTRATEGICA_GPT_ACTIVVE_2026-08.md`

Caso o arquivo não esteja na branch atual, leia sem trocar de branch usando:

```bash
git show origin/ai/TASK-032-auditoria-gpt-activve-gpt:docs/ai/AUDITORIA_ESTRATEGICA_GPT_ACTIVVE_2026-08.md
```

### 2. Sua primeira revisão crítica

Arquivo:

`docs/ai/REVISAO_AUDITORIA_GPT_2026-08.md`

Commit informado:

`53f43889c9f80111312ae5fd845d1a31bd4f8fe7`

Caso o arquivo não esteja disponível no worktree atual, use:

```bash
git show 53f43889c9f80111312ae5fd845d1a31bd4f8fe7:docs/ai/REVISAO_AUDITORIA_GPT_2026-08.md
```

### 3. Resposta consolidada do ChatGPT à sua revisão

Branch:

`ai/TASK-032-auditoria-gpt-activve-gpt`

Arquivo:

`docs/ai/DECISOES_POS_REVISAO_AUDITORIA_GPT_2026-08.md`

Caso não esteja na branch atual:

```bash
git show origin/ai/TASK-032-auditoria-gpt-activve-gpt:docs/ai/DECISOES_POS_REVISAO_AUDITORIA_GPT_2026-08.md
```

Esse documento foi criado no commit:

`e120592fab665bdce92e561846679ed3aa6f66bc`

## Fontes de verdade adicionais

Confronte os três documentos com:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/ai/STATUS.md`
- `docs/ai/PRODUCT.md`
- `docs/ai/PRODUCT_VISION.md`
- `docs/ai/CONSULTA_SPEC.md`
- `docs/ai/PLAN_SCHEMA.md`
- `docs/ai/REPORT_SCHEMA.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/coach/ACTIVVE_HEALTH_SYSTEM.md`
- `docs/ai/GENERATOR_1.1.md`
- `docs/ai/DESIGN_SYSTEM.md`, ou o caminho real do Design System
- `package.json`
- `vitest.config.ts`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/lib/plan/schema.ts`
- código da branch de personalização visível
- histórico recente de commits e branches

Verifique primeiro os caminhos reais. Não assuma que todo arquivo citado ainda existe com esse nome.

## Objetivo da revisão

Determine se o documento:

`docs/ai/DECISOES_POS_REVISAO_AUDITORIA_GPT_2026-08.md`

resolve corretamente os problemas que você apontou ou se ainda contém erros, contradições, decisões prematuras ou lacunas.

## Pontos obrigatórios de análise

### 1. Estado real do repositório

Confirme:

- se a branch `ai/TASK-032-personalizacao-visivel-claude` existe localmente ou remotamente;
- quais alterações ela contém;
- quais são exatamente os dois achados de review ainda pendentes;
- quantos testes realmente passam;
- se o schema implementado é de fato 1.3;
- se `context` ainda é string ou já foi estruturado;
- se `why` está aplicado em refeição, treino e exercício;
- se a tela Meu Plano existe e quais partes mostra;
- se a acessibilidade do Markdown continua pendente;
- se há realmente colisão entre duas TASK-032;
- se manifest e service worker continuam ausentes.

Não trate mensagens de commit como prova suficiente. Confira os arquivos quando possível.

### 2. Decisão `why` versus `rationale`

Avalie se a decisão de padronizar tudo em `why` é realmente a melhor.

Considere:

- compatibilidade com o schema 1.2;
- clareza semântica;
- manutenção futura;
- API pública;
- geração por LLM;
- documentação;
- possibilidade de `why` ficar informal ou ambíguo demais em um contrato técnico.

Dê um veredito explícito:

- aprovar `why`;
- preferir `rationale`;
- ou propor uma terceira solução.

Não mantenha dois nomes para o mesmo conceito sem justificativa forte.

### 3. Estrutura de `context`

Analise a proposta:

```ts
type PlanContext = {
  summary: string;
  constraints?: string[];
  preferences?: string[];
  motivations?: string[];
  availability?: string[];
};
```

Verifique:

- se as categorias são suficientes;
- se há sobreposição;
- se `availability` é realmente melhor que `resources`;
- se rotina, ambiente, orçamento, acesso a alimentos e equipamento cabem corretamente;
- se alguma informação já existe em `profile` e seria duplicada;
- se o contexto deve ser objeto único ou coleção de evidências;
- como preservar compatibilidade com planos 1.0, 1.1 e 1.2;
- como migrar de `context: string`, caso essa versão já tenha sido gerada em testes.

Proponha o tipo final recomendado.

### 4. Markdown controlado

Verifique diretamente o parser e o renderer atuais.

Confirme ou rejeite:

- que não existe HTML bruto;
- que não é usado `dangerouslySetInnerHTML`;
- que scripts e URLs perigosas viram texto literal;
- que os testes mencionados realmente existem;
- que o risco de XSS está suficientemente controlado;
- que títulos ainda são renderizados como `<p>`;
- que headings e landmarks resolvem a acessibilidade sem mudar o transporte.

Analise também:

- confiabilidade de geração de Markdown versus JSON em blocos;
- impressão;
- índice navegável;
- evolução futura;
- suporte a listas, negrito, callouts e links;
- possibilidade de parser incompleto criar interpretação errada.

Dê uma decisão clara:

- manter Markdown;
- migrar para blocos;
- ou usar uma estratégia híbrida.

### 5. Monetização com GPT público

Revise criticamente a solução proposta:

#### V0
GPT gratuito para validação.

#### V1
Usuário começa no Activve, paga ou recebe entitlement, abre o Activve Coach e autentica a Action por OAuth.

#### V2
Portal próprio com API.

Verifique:

- se GPT Actions suportam tecnicamente o fluxo OAuth necessário;
- se o entitlement pode ser validado antes de aceitar o plano;
- se o GPT ainda poderia gerar e revelar o plano completo antes da Action;
- se as instruções do GPT podem ser contornadas;
- se o plano pago deveria ser gerado somente pelo backend;
- se cobrar no claim é melhor ou pior;
- se um código curto realmente deve ser descartado;
- se o GPT deve ser aquisição gratuita, beta pago ou apenas protótipo;
- se construir OAuth para um beta não seria esforço excessivo;
- se isso aproxima demais o produto do portal próprio, anulando a economia inicial.

Compare pelo menos estas opções:

1. GPT gratuito como demonstração, cobrança apenas em revisões;
2. pagamento antes, com código ou link de sessão;
3. OAuth e entitlement;
4. cobrança no resgate do plano;
5. portal próprio desde o beta;
6. API com chave do próprio usuário;
7. nenhum pagamento até validar manualmente.

Recomende uma única estratégia para o primeiro beta, explicando custo, risco, esforço e aprendizado gerado.

### 6. PWA antes do beta

Analise a qualificação feita pelo ChatGPT:

> PWA é requisito para escala, mas não bloqueador absoluto de um piloto pequeno no navegador.

Decida se isso procede no contexto real do Activve.

Separe claramente:

- piloto interno;
- beta fechado;
- beta pago;
- lançamento público;
- migração mobile.

Diga em qual estágio manifest, service worker, instalação e offline passam a ser bloqueadores.

### 7. Ordem de execução

Revise esta ordem:

1. fechar personalização visível;
2. testes de ciclo de vida;
3. jurídico, privacidade e ADR;
4. claim;
5. GPT Action;
6. PWA para escala;
7. beta pago;
8. portal próprio;
9. Capacitor e mobile.

Identifique dependências incorretas.

Questões específicas:

- PWA deveria vir antes do claim?
- jurídico precisa bloquear um protótipo interno?
- claim pode ser testado sem conta e sem dados sensíveis?
- testes de UI precisam estar totalmente concluídos ou apenas os fluxos críticos?
- Action deve existir antes de validar manualmente o handoff?
- personalização visível deve ser validada com usuários antes das próximas faixas?

Entregue uma sequência corrigida com gates objetivos.

### 8. Nomenclatura e risco regulatório

Analise:

- Activve Coach;
- Planejamento Activve;
- Montar meu plano;
- Meu Plano;
- Revisar meu ciclo;
- Consulta Activve;
- anamnese;
- NutriCoach;
- coach de saúde;
- plano alimentar;
- plano psicológico.

Não emita parecer jurídico definitivo. Separe:

- avaliação técnica;
- risco de percepção;
- risco de marketing;
- questão que exige advogado;
- questão que exige nutricionista ou profissional de educação física.

Avalie se “Planejamento Activve” é claro ou genérico demais para o usuário.

Proponha até três arquiteturas de nomenclatura, com prós e contras, sem escolher nome de mascote ou persona humana neste momento.

### 9. Alimentação e exercício individualizados

Analise a afirmação:

> O risco regulatório nasce do que o produto entrega, não apenas do nome.

Diga quais partes da visão atual precisam ficar condicionadas a parecer profissional ou jurídico:

- kcal e macros;
- cardápio individual;
- substituições equivalentes;
- treino por lesão;
- prescrição de séries, cargas e progressão;
- recomendações de bem-estar;
- saúde mental;
- red flags;
- gestação;
- condições clínicas.

Diferencie:

- conteúdo educacional;
- organização de informações;
- recomendação automatizada;
- personalização;
- atuação profissional regulada.

Não altere o produto com base em suposição jurídica. Mapeie as decisões bloqueadas.

### 10. LGPD e arquitetura de dados

Revise:

- dados que permanecem locais;
- dados temporários na nuvem;
- transcrição;
- retenção;
- consentimento;
- transferência internacional;
- plano aguardando claim;
- logs;
- telemetria;
- exclusão;
- backup;
- anonimização versus pseudonimização.

Verifique se a telemetria proposta realmente evita conteúdo sensível.

Avalie se eventos como “bloco sobre lesões concluído” já podem revelar indiretamente dados sensíveis.

Proponha uma política mínima de eventos e retenção para um piloto.

### 11. ADR da nuvem

Diga se um único ADR é suficiente ou se devem existir decisões separadas para:

- camada de consulta em nuvem;
- identidade e cobrança;
- claim e armazenamento temporário;
- telemetria;
- provedor de modelo;
- PWA/mobile.

Proponha títulos e limites dos ADRs necessários, mas não os escreva ainda.

### 12. Custos e viabilidade

Revise se a estratégia ainda preserva o objetivo de evitar custo de API inicialmente.

Compare:

- GPT gratuito;
- GPT com OAuth;
- portal próprio com API;
- API usando modelo econômico;
- Claude Artifact;
- Gem do Gemini;
- importação manual temporária.

Avalie custo técnico, custo financeiro, dependência de plataforma e fricção para usuários menos tecnológicos.

### 13. Próxima ação

Determine qual deve ser a próxima ação exata depois desta revisão.

Não responda apenas “terminar os dois defeitos”.

Diga:

- qual branch usar;
- como resolver a colisão de TASK;
- quais arquivos alterar;
- quais testes executar;
- qual validação no browser fazer;
- qual documento atualizar;
- qual tarefa deve vir depois;
- o que depende de decisão humana do dono do produto.

## Formato obrigatório da resposta

Crie um documento chamado:

`docs/ai/TREPLICA_DECISOES_AUDITORIA_GPT_2026-08.md`

Estrutura:

1. Resumo executivo
2. Fatos confirmados no código
3. Pontos aprovados
4. Pontos parcialmente aprovados
5. Pontos rejeitados
6. Erros ou lacunas novas
7. Decisões humanas pendentes
8. Veredito sobre monetização do GPT
9. Veredito sobre nomenclatura
10. Veredito sobre schema 1.3
11. Veredito sobre Markdown
12. Veredito sobre PWA e mobile
13. Veredito sobre privacidade e telemetria
14. Ordem final recomendada
15. Gates de passagem entre fases
16. Próxima ação exata
17. Perguntas ao dono do produto

Para cada divergência relevante, use:

- afirmação analisada;
- evidência no repositório;
- conclusão;
- recomendação;
- impacto caso a decisão esteja errada.

## Restrições finais

- Não implemente nenhuma das recomendações.
- Não modifique a branch de personalização.
- Não mergeie PR.
- Não marque PR como pronto.
- Não crie backend, PWA, Action, OAuth ou schema novo.
- Não faça alterações silenciosas em documentação existente.
- Crie apenas o documento de réplica, em branch documental separada ou na branch documental já existente, sem contaminar a implementação.
- Antes de gravar, informe em qual branch está e confirme que não há alterações locais não commitadas que possam ser afetadas.
- Ao terminar, apresente:
  - caminho do documento;
  - branch;
  - commit;
  - resumo das principais divergências;
  - decisões que ainda precisam do dono do produto.
