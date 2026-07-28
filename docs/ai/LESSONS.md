# Aprendizados operacionais

Use este arquivo como área de triagem. Um aprendizado só deve virar regra em `AGENTS.md` quando for recorrente, durável, curto e verificável.

## Formato

### YYYY-MM-DD — [Título]

- Tarefa:
- Sintoma:
- Causa:
- Correção:
- Como detectar cedo:
- Deve virar regra, teste, hook ou CI?:
- Status: `observando | promovido | descartado`

### 2026-07-28 — Validação uniforme quebra consumidores com necessidades diferentes

- Tarefa: TASK-013 (estado de erro amigável p/ plano corrompido).
- Sintoma: ao revalidar planos na leitura, o calendário de `/relatorios` passou a exibir ids crus
  (`supino`, `A`) no lugar dos nomes reais ("Supino reto (ciclo 1)", "Treino A — Ciclo 1") para
  sessões de ciclos anteriores.
- Causa: apliquei `validatePlan` (contrato inteiro) a TODOS os planos, inclusive os históricos. Um
  plano antigo real era inválido só por um defeito cosmético (`weekSchedule` apontando pra um
  treino removido) num campo que a tela de histórico nem lê — e foi descartado inteiro.
- Correção: escolher o rigor pelo **consumidor**, não pelo dado. Plano ATIVO exige o contrato
  completo (o app monta agenda/treino/dieta a partir dele); plano histórico usado só pra resolver
  nome exige apenas ser percorrível (`hasReadableTraining`); cálculo profundo (`buildReport`) exige
  o que de fato desreferencia.
- Como detectar cedo: **verificar no browser com dados REAIS já gravados**, não só com fixtures
  sintéticas. Os 148 testes passavam com a versão errada — quem pegou foi abrir a tela e comparar
  o nome exibido com o conteúdo do IndexedDB. Fixture sintética é sempre válida por construção;
  dado real acumulado, não.
- Deve virar regra, teste, hook ou CI?: candidato a regra curta em `AGENTS.md` §11 ("verificação
  manual inclui dado pré-existente real, não só semeado pela própria task"). Observando por ora.
- Status: `observando`

### 2026-07-28 — Guarda estrutural que espelha dereferências vira schema pior

- Tarefa: TASK-013, ciclos 1–3 do review Codex.
- Sintoma: a mesma guarda (`hasReadableTraining`) foi apontada em 3 ciclos seguidos — cada ciclo
  revelava mais um campo desreferenciado rio abaixo (`workout.exercises`, depois
  `exercise.primaryMuscles`, depois `alternatives` não-iterável).
- Causa: tentar proteger um cálculo profundo enumerando, no chamador, cada campo que ele lê. Isso
  duplica o schema sem os testes e as garantias dele, e nunca converge.
- Correção: separar por consumidor (raso → guarda estrutural mínima; profundo → contrato completo).
  Alternativa ainda melhor, em aberto pra decisão: tornar o ponto de leitura profundo defensivo na
  ORIGEM (`buildExerciseMuscles`), fechando a classe inteira num lugar só.
- Como detectar cedo: se uma guarda cresce a cada review, ela está no lugar errado — a proteção
  pertence a quem lê, não a quem chama.
- Deve virar regra, teste, hook ou CI?: não; é heurística de design, fica registrada aqui.
- Status: `observando`
