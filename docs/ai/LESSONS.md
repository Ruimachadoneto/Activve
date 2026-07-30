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

### 2026-07-28 — Contra dado não confiável, torne o leitor TOTAL em vez de enumerar campos

- Tarefa: TASK-013, 8 ciclos de review Codex.
- Sintoma: cada rodada de review encontrava **outro campo** de plano histórico possivelmente
  malformado — `exercises`, depois `primaryMuscles`, depois `alternatives`, depois elementos nulos
  dentro dos arrays, depois `name`. Todos os achados eram reais; a lista não convergia.
- Causa: eu tratava cada caso como um defeito pontual ("falta checar mais este campo"), quando o
  problema era de forma: enquanto o leitor confia no dado, a superfície de falha é do tamanho do
  schema, e o revisor sempre acha mais um.
- Correção: transformar cada leitor em **função total** — sempre devolve algo utilizável,
  independentemente da entrada. `buildExerciseMuscles` sempre devolve arrays; resolver nome sempre
  devolve string não-vazia (senão cai no id); `workoutsScheduled` ignora agenda ilegível. Feito
  isso, a classe fecha por construção e a guarda de entrada volta a ser mínima.
- Como detectar cedo: **se uma guarda/validação cresce a cada rodada de review, o formato está
  errado.** Crescimento repetido é sinal de que a proteção está no chamador quando deveria estar no
  leitor. Vale parar e mudar a forma em vez de aplicar o próximo remendo.
- Deve virar regra, teste, hook ou CI?: candidato a regra curta em `AGENTS.md` §10. Observando.
- Status: `observando`

### 2026-07-30 — Quando um achado reaparece de outro ângulo, o interruptor é que está errado

- Tarefa: TASK-026, tela de conclusão de treino. 3 ciclos de review Codex.
- Sintoma: o mesmo ponto foi apontado três vezes, em formas diferentes. (1) A celebração aparecia
  antes de a sessão estar no IndexedDB, e o atalho dela levava a uma tela que lê as sessões na
  montagem. (2) Adiando a celebração, ela passou a ler `session`/`workout` correntes e podia
  resumir o treino errado. (3) Adiando a celebração, o Modo Treino ficava vivo durante o
  round-trip e aceitava edição num treino já encerrado.
- Causa: eu tratava "quando a celebração entra" como **um** interruptor, quando havia **duas**
  perguntas independentes com respostas opostas: *quando a tela troca* (imediatamente — fecha a
  janela de edição e devolve a reação) e *quando é seguro sair dela* (depois da escrita — o
  destino lê o disco na montagem). Cada tentativa de resolver com um booleano só movia o problema
  de lugar.
- Correção: separar as duas. A tela troca de forma síncrona a partir de um snapshot imutável; a
  promessa da escrita viaja junto e só a **navegação** a aguarda.
- Como detectar cedo: **se o mesmo trecho é apontado em ciclos consecutivos por motivos que
  parecem diferentes, provavelmente há dois requisitos disputando uma variável.** Antes de mover o
  `setState` mais uma vez, escrever as perguntas separadamente e ver se elas têm a mesma resposta.
- Deve virar regra, teste, hook ou CI?: registrado no `DESIGN_SYSTEM` §0.2 como regra de produto
  ("celebração é um momento"). Como heurística de revisão, observando.
- Status: `observando`

### 2026-07-30 — Escala de cor com texto em cima se mede, não se estima

- Tarefa: TASK-026, mapa de constância em `/relatorios`.
- Sintoma: a escala de intensidade (volume do dia → opacidade do acento) ficou bonita e passou no
  olho. Medido no browser, o topo da escala dava **3,64:1** de contraste com o número do dia —
  abaixo do AA (4,5:1). O teto tinha sido escolhido por aparência.
- Correção: teto da escala baixado de 60% para 44% (≈4,9:1 no pior caso), mantendo 3× de razão
  entre o dia mais fraco e o de pico. O motivo está comentado no código, senão o próximo ajuste
  estético sobe o teto de novo sem saber o que está quebrando.
- Bônus da mesma medição: o alvo de toque da grade era 36px **desde antes** desta task. Medir uma
  coisa fez aparecer a outra.
- Como detectar cedo: ao introduzir qualquer **gradiente/opacidade variável com texto por cima**,
  calcular contraste no extremo mais claro E no mais escuro antes de fechar. É três linhas de
  script na página; estimar de cabeça erra por larga margem em superfícies translúcidas empilhadas.
- Deve virar regra, teste, hook ou CI?: candidato a checklist na `VISUAL_QUALITY.md`. Observando.
- Status: `observando`
