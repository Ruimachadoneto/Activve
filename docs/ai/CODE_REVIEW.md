# Padrão de revisão cruzada

## Objetivo

Encontrar defeitos reais antes do merge. A revisão não é concurso de preferência estilística nem oportunidade para o revisor reescrever tudo conforme sua religião arquitetural particular.

## Preparação

O revisor deve receber:

1. contrato da tarefa;
2. branch base e branch revisada;
3. diff/commits;
4. comandos de validação;
5. contexto de arquitetura relevante.

Use uma sessão nova ou contexto limpo. Não forneça a justificativa detalhada do implementador antes da primeira leitura quando uma revisão cega for viável; isso reduz ancoragem.

## Primeira passagem: somente leitura

Não altere arquivos. Verifique:

- correspondência aos critérios de aceite;
- lógica incorreta e casos de borda;
- regressões;
- contratos públicos e compatibilidade;
- autenticação, autorização, segredos e validação;
- integridade de dados e migrações;
- concorrência, idempotência e transações;
- desempenho e uso de recursos;
- tratamento de erros e observabilidade;
- cobertura e qualidade dos testes;
- escopo acidental e dependências novas.

## Severidades

- **P0 Bloqueador:** perda de dados, execução remota, vazamento grave, indisponibilidade ampla ou comportamento destrutivo provável.
- **P1 Alto:** bug funcional importante, falha de segurança, regressão relevante, contrato quebrado ou ausência de validação crítica.
- **P2 Médio:** problema real com impacto limitado, caso de borda relevante, teste insuficiente ou manutenção arriscada.
- **P3 Baixo:** melhoria válida sem risco imediato. Não bloqueia merge salvo regra do projeto.

## Formato obrigatório do achado

```markdown
### [P1] Título curto

- Local: `arquivo:linha`
- Evidência: cenário, trecho ou comando que demonstra o problema.
- Impacto: o que pode acontecer e para quem.
- Correção recomendada: mudança mínima sugerida.
- Teste esperado: como impedir regressão.
```

Não reporte achado sem evidência. Se for hipótese, marque explicitamente como hipótese e indique como confirmar.

## Critérios de aprovação

- Nenhum P0/P1 aberto.
- Critérios de aceite cobertos.
- Validações obrigatórias passaram.
- Riscos P2 aceitos ou corrigidos.
- Escopo e documentação coerentes.

## Revisão por especialidade

### Codex como revisor

Priorize correção do diff, testes, regressões, contratos, segurança e execução de comandos. Use `/review` contra a base correta e instruções deste arquivo.

### Claude como revisor

Priorize coerência arquitetural, efeitos transversais, legibilidade, adequação ao produto, UX e riscos não locais. Para mudanças críticas, use sessão dedicada e raciocínio alto disponível.

## Loop de correção

1. Revisor entrega achados.
2. Implementador classifica cada um: `aceito`, `rejeitado com evidência`, `necessita decisão`.
3. Implementador corrige achados aceitos.
4. Validações são repetidas.
5. Revisor verifica somente alterações e achados pendentes.

Máximo de três ciclos automáticos. Persistência de desacordo exige decisão humana.
