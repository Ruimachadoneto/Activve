# Modelo operacional Claude Code + Codex

## Princípio central

A unidade de trabalho é **uma tarefa com contrato, uma branch/worktree e um escritor ativo**. A unidade de confiança é **evidência**, não eloquência do agente.

## Topologia recomendada

```text
Humano / Product Owner
        |
        v
Contrato da tarefa
        |
        +--> Lead/Planner em contexto de análise
        |
        +--> Implementer em worktree isolado
        |
        +--> CI: build, lint, typecheck, testes
        |
        +--> Reviewer em contexto limpo
        |
        +--> Correções + nova validação
        |
        v
Revisão humana e merge
```

## Por que papéis, não marcas

Claude e Codex evoluem rapidamente. Fixar responsabilidades eternas por marca envelhece mal. O sistema deve escolher o papel conforme:

- ambiguidade do problema;
- tamanho e duração;
- quantidade de ferramentas;
- necessidade de julgamento de produto/UX;
- necessidade de precisão mecânica e testes;
- risco e reversibilidade;
- custo e latência disponíveis.

## Protocolos por tamanho

### Tarefa pequena e de baixo risco

Exemplos: typo, alteração local de texto, teste simples, ajuste de estilo isolado.

Fluxo:

1. Um agente implementa na branch atual ou worktree curto.
2. Executa validação focal.
3. Revisa o próprio diff.
4. Humano confere antes do merge.

A revisão cruzada é opcional. Criar um conselho deliberativo de duas IAs para renomear uma variável seria um uso criativo de eletricidade.

### Tarefa média

Exemplos: feature delimitada, endpoint, tela, correção com vários arquivos.

Fluxo:

1. Lead cria contrato e plano.
2. Implementer trabalha em worktree.
3. CI executa gates.
4. Outro agente revisa em sessão nova.
5. Implementer corrige.
6. Humano revisa e faz merge.

### Tarefa alta/crítica

Exemplos: autenticação, pagamento, migração, segurança, infraestrutura, grande refatoração.

Fluxo:

1. Claude e Codex produzem análises independentes.
2. Lead humano ou modelo designado sintetiza uma especificação.
3. O plano é dividido em slices pequenos e reversíveis.
4. Cada slice tem worktree, testes e rollback.
5. Implementação e revisão são feitas por modelos diferentes.
6. Security review e validação de dados são executados separadamente.
7. Humano aprova arquitetura, migração, produção e merge.

## Padrões de colaboração

### Padrão A: Claude planeja, Codex implementa, Claude revisa

Use quando:

- problema é ambíguo ou transversal;
- arquitetura e produto exigem síntese;
- implementação pode ser dividida em escopo objetivo;
- Codex dispõe de bom ambiente de testes.

Risco: Claude pode ancorar a revisão no próprio plano. Mitigação: peça também uma revisão cega do diff ou use Codex para revisar o plano antes da execução.

### Padrão B: Codex planeja e implementa, Claude revisa

Use quando:

- tarefa é técnica e bem delimitada;
- há comandos e critérios claros;
- o principal risco é integração arquitetural, UX ou manutenção.

### Padrão C: Codex planeja, Claude implementa, Codex revisa

Use quando:

- Codex compreende bem a superfície técnica e os testes;
- implementação exige navegação ampla, adaptação contínua ou longo horizonte;
- deseja-se revisão mecânica e rigorosa do resultado.

### Padrão D: propostas independentes, síntese humana

Use em decisões irreversíveis ou caras:

1. ambos recebem o mesmo problema sem ver a resposta do outro;
2. cada um produz plano, riscos e alternativas;
3. humano compara pressupostos;
4. uma especificação final é criada;
5. execução segue fluxo normal.

Esse padrão reduz ancoragem e revela premissas compartilhadas erradas. Dois modelos concordando não transforma uma suposição em lei da física.

### Padrão E: divisão por domínio

Use quando tarefas são realmente independentes:

- Codex: backend/API/testes;
- Claude: UI/UX, integração e documentação;
- ou o inverso, conforme o repositório e os resultados medidos.

Cada domínio usa worktree própria e contrato de interface explícito. Integração ocorre somente após testes de contrato.

## Paralelismo

Paralelize apenas quando:

- tarefas têm baixa sobreposição de arquivos;
- interfaces estão definidas;
- cada branch pode ser testada isoladamente;
- existe capacidade humana de revisar a produção gerada.

Comece com no máximo duas tarefas simultâneas. Aumente somente se taxa de revisão, conflito e retrabalho permanecer saudável.

### Métricas úteis

- tempo do contrato ao merge;
- percentual de PRs com retrabalho;
- bugs encontrados por revisor humano depois dos agentes;
- conflitos de merge por tarefa;
- testes falhos na primeira validação;
- diffs fora de escopo;
- custo por tarefa aceita;
- incidência de regras repetidamente violadas.

## Estados de uma tarefa

```text
DRAFT -> READY -> IN_PROGRESS -> SELF_CHECK -> REVIEW
      -> CHANGES_REQUESTED -> REVIEW
      -> READY_FOR_MERGE -> DONE
      -> BLOCKED
```

Nenhum agente move para `READY_FOR_MERGE` sem registrar validações.

## Handoff entre agentes

O handoff deve ser baseado em artefatos, não em memória conversacional:

- contrato versionado;
- commits pequenos;
- diff;
- handoff estruturado;
- resultados de testes;
- decisões registradas.

Isso permite `/clear`, troca de modelo e retomada sem o ritual deprimente de recontar a história inteira.

## Coordenação via MCP

O Codex pode rodar como MCP com `codex mcp-server`. Um cliente MCP, inclusive um fluxo controlado pelo Claude, pode iniciar ou continuar sessões Codex.

Use MCP quando:

- o fluxo manual já está estável;
- tarefas delegadas são autocontidas;
- cwd, permissões, modelo e critério de conclusão são explícitos;
- existe logging e possibilidade de interrupção;
- o orquestrador não tem permissão irrestrita por padrão.

Não use MCP como desculpa para dois agentes editarem o mesmo diretório.

## Segurança operacional

- Comece com sandbox e aprovações conservadoras.
- Rede deve permanecer desabilitada quando não for necessária.
- Proteja arquivos de segredo e produção.
- Hooks e scripts são código com privilégios reais; revise-os.
- Nunca permita merge/deploy irreversível sem gate humano.
- Dependências novas exigem verificação de existência e origem.
- Migrações exigem backup, dry run e rollback.

## Evolução das regras

1. Registre incidentes em `LESSONS.md`.
2. Observe recorrência.
3. Converta problema repetido em regra curta, teste, hook ou CI.
4. Prefira enforcement determinístico a lembrete textual.
5. Remova regras obsoletas.

O objetivo é fazer o sistema aprender sem transformar o arquivo principal numa autobiografia traumática de cada bug já cometido.
