# Biblioteca de prompts operacionais

Use estes prompts como ponto de partida. Substitua os campos entre colchetes e aponte sempre para o contrato versionado da tarefa.

## 1. Claude como Lead/Planner

```text
Atue como Lead técnico desta tarefa.

Leia, nesta ordem:
1. AGENTS.md
2. docs/ai/STATUS.md
3. [arquivos/documentos relevantes]

Objetivo: [objetivo]

Não altere código nesta etapa. Explore o repositório e produza/atualize
`docs/ai/tasks/TASK-[ID]-[nome].md` usando o template oficial.

O contrato deve conter:
- estado atual e resultado observável;
- escopo e fora de escopo;
- arquivos/módulos afetados;
- invariantes e contratos que não podem quebrar;
- riscos, rollback e dependências;
- plano em slices pequenos;
- critérios de aceite verificáveis;
- comandos de validação;
- pontos que exigem decisão humana.

Não assuma fatos que possa verificar no repositório. Marque incertezas e proponha
experimentos para resolvê-las.
```

## 2. Codex como crítico independente do plano

```text
Revise somente o plano em `docs/ai/tasks/TASK-[ID]-[nome].md`.
Leia AGENTS.md e o código necessário, mas não altere arquivos.

Procure:
- requisitos esquecidos;
- premissas não verificadas;
- impactos transversais;
- incompatibilidades;
- riscos de segurança/dados;
- slices grandes ou acoplados;
- critérios de aceite não testáveis;
- validações insuficientes;
- alternativas mais simples.

Entregue achados por severidade e uma versão recomendada das mudanças do plano.
Evite preferências estilísticas sem impacto.
```

## 3. Codex como Implementer

```text
Atue como Implementer da TASK-[ID].

Leia:
- AGENTS.md
- docs/ai/tasks/TASK-[ID]-[nome].md
- docs/ai/STATUS.md

Você está no worktree/branch designado. Não altere fora do escopo e não faça merge.

Fluxo obrigatório:
1. confirme internamente os critérios de aceite;
2. inspecione os arquivos relevantes;
3. implemente o menor slice coerente;
4. adicione/atualize testes;
5. execute build, lint, typecheck e testes relevantes;
6. revise o diff contra [branch-base];
7. preencha um handoff com base em docs/ai/HANDOFF_TEMPLATE.md;
8. atualize o contrato e docs/ai/STATUS.md.

No final, liste comandos executados, resultados, arquivos alterados, riscos residuais
e o que não pôde ser validado. Não declare sucesso sem evidência.
```

## 4. Claude como Implementer de longo horizonte

```text
Implemente a TASK-[ID] seguindo AGENTS.md e o contrato versionado.
Use Plan Mode antes da primeira edição se houver qualquer divergência entre o plano
e o código atual.

Trabalhe apenas neste worktree. Use subagentes em modo leitura para explorar módulos
independentes, mas mantenha um único escritor. Faça commits pequenos por slice e rode
validações após cada etapa relevante.

Não expanda escopo, não reescreva arquitetura sem decisão registrada e não altere
produção. Finalize com handoff estruturado e evidências de validação.
```

## 5. Codex como Reviewer

```text
/review

Use como base: [origin/main ou branch específica].
Leia AGENTS.md, docs/ai/CODE_REVIEW.md e o contrato TASK-[ID].

Primeira passagem somente leitura. Avalie o diff contra os critérios de aceite.
Priorize bugs, regressões, segurança, dados, concorrência, contratos, tratamento de
erros, desempenho e testes ausentes.

Reporte apenas achados reproduzíveis no formato P0-P3 definido no guia.
Para cada achado, informe arquivo/linha, evidência, impacto, correção mínima e teste.
Não bloqueie por preferência cosmética.
```

## 6. Claude como Reviewer arquitetural/UX

```text
Atue como revisor independente. Não altere arquivos nesta passagem.

Leia:
- AGENTS.md
- docs/ai/CODE_REVIEW.md
- contrato TASK-[ID]
- diff da branch atual contra [base]

Avalie:
- aderência ao objetivo do produto;
- coerência com a arquitetura existente;
- impactos em fluxos e módulos não óbvios;
- UX, acessibilidade e estados de erro;
- complexidade e manutenção futura;
- regressões e ausência de testes.

Entregue achados acionáveis P0-P3 com evidência. Separe defeitos de sugestões.
```

## 7. Investigação cega de bug

Envie o mesmo prompt a Claude e Codex em sessões separadas:

```text
Investigue este bug sem editar código: [descrição/log/reprodução].

Entregue:
1. reprodução mínima;
2. mapa do fluxo relevante;
3. hipóteses ordenadas;
4. evidência a favor/contra cada hipótese;
5. experimento ou comando que confirma a causa;
6. correção mínima proposta;
7. teste de regressão esperado;
8. riscos da correção.

Não trate hipótese como causa confirmada.
```

Depois, compare as análises e só implemente uma hipótese validada.

## 8. Handoff para o outro agente

```text
Leia o handoff da TASK-[ID] e os commits [hashes].
Não confie no resumo como prova; valide no diff e nos testes.
Assuma o papel de [Reviewer/Implementer] e siga AGENTS.md.
Liste qualquer divergência entre contrato, handoff e código antes de prosseguir.
```

## 9. Delegação do Claude para Codex via MCP

```text
Delegue ao Codex somente a implementação da TASK-[ID].

Parâmetros obrigatórios:
- cwd: [caminho absoluto do worktree]
- modelo: gpt-5.5
- approval policy: on-request
- contrato: [caminho]
- branch base: [base]
- arquivos permitidos: [lista/área]
- validações: [comandos]
- saída: handoff estruturado, sem merge e sem deploy

Após a resposta do Codex, não aceite o resumo como conclusão. Inspecione o diff,
execute ou confirme as validações e faça revisão independente.
```

## 10. Retrospectiva após falha

```text
Faça uma retrospectiva da TASK-[ID] sem alterar AGENTS.md automaticamente.

Identifique:
- sintoma;
- causa técnica;
- causa de processo/contexto;
- por que testes/revisão não detectaram cedo;
- correção aplicada;
- prevenção determinística possível;
- se é incidente isolado ou padrão recorrente.

Registre em docs/ai/LESSONS.md. Recomende promoção para AGENTS.md somente se a regra
for durável, recorrente, curta e verificável; prefira teste, hook ou CI quando possível.
```
