# TASK-028 — Modo Treino confiável: descanso que sobrevive, fecha sozinho e avança

> Origem: feedback de uso real do usuário na academia (2026-07-30). Itens **1, 3 e 4** de
> uma lista de 7. Os outros 4 estão listados em "O que ficou de fora" no fim.

## Item 1 — "o contador continua ficando fora da realidade quando eu saio do app"

**Por que a correção anterior não bastou.** A TASK-017 ancorou o countdown num instante
absoluto (`endAt`) para ele não divergir com throttling de timer em segundo plano. Isso
resolve **enquanto o componente continua montado** — e num celular ele frequentemente não
continua: ao sair do PWA o sistema congela e muitas vezes **descarta** a página. Ao voltar,
o React remonta do zero, o `useRef` da âncora volta a ser `null`, e o descanso reaparece
cheio ou some. Ancorar no relógio nunca ia resolver isso sozinho: **a âncora precisava
sair da memória do React.**

**Correção.** `src/lib/storage/restTimer.ts` persiste `{endAt, duration, pausedRemaining,
sessionId, workoutId, exerciseId, alerted}`.

- **`localStorage`, não IndexedDB**, de propósito: a leitura é **síncrona**, então o tempo
  certo já está no primeiro render. Com IndexedDB haveria um frame com o valor errado —
  exatamente o defeito que estamos corrigindo. Não é dado de usuário (o ADR-001 governa
  plano/sessões/medidas); é estado efêmero de UI.
- Volta restaurando **treino + exercício + tempo**: perder o lugar no treino já era parte
  do bug.
- Descanso de outra sessão/exercício não revive; rodando expira em 30 min, pausado não
  expira (o tempo real não corre).

## Item 3 — descanso fecha sozinho

Zerou, o overlay sai depois de ~1,4s (o "acabou" ainda é visto; a vibração avisa quem não
estava olhando). O agendamento vive num efeito **com limpeza** — fechar na mão, pular ou
sair da tela cancela. É a mesma disciplina do compasso do recorde (`restDelayRef`), que é
a classe de bug conhecida nesta tela.

## Item 4 — avanço automático para o próximo exercício

Última série feita arma **5s** com "Cancelar" e `aria-live`.

- **Espera o descanso sair de cena** — a sequência natural é série → descanso → próximo, e
  sobrepor esconderia o botão de cancelar atrás do overlay.
- **Só o CTA principal arma.** Marcar o ✓ na tabela "Todas as séries" é ação de *edição*;
  quem corrige um registro não está pedindo para mudar de exercício.
- Guarda o índice de **destino** ao armar, em vez de somar 1 ao foco no disparo.

---

## Bug que só a verificação no browser pegou

A primeira versão guardava "já revivi" numa flag **consumida dentro do efeito**. O
StrictMode invoca o efeito **duas vezes**; na segunda a flag já estava limpa e o timer
**reancorava com o tempo cheio** — jogando fora justamente o descanso que sobreviveu. O
cronômetro voltava para 2:00 depois do reload.

Ancorar virou **idempotente por token**, então repetir é inofensivo. Nenhum teste unitário
pegaria isso: era comportamento de ciclo de vida do React, não de lógica.

## Review Codex — 2 ciclos, 4 achados, todos reais

| Ciclo | Achado | Correção |
|---|---|---|
| 1 | [P2] descanso revivia no **exercício errado** (foco volta ao 1º após descarte) | restaura a posição + `loadRestTimer` exige `exerciseId` |
| 1 | [P3] âncora só morria 1,4s depois do fim → descarte na janela **repetia a vibração** | quem chega vivo ao zero limpa na hora |
| 2 | [P2] treino escolhido **à mão** não era restaurado → sessão não batia, timer nunca revivia | `workoutId` explícito no registro; página restaura o treino |
| 2 | [P3] no caminho "última série + recorde" o descanso é adiado 1,6s e a contagem de 5s começava antes | estado `restPending` cobre o agendado-mas-não-aberto |

**Padrão dos 4:** todos são *"restaurei menos contexto do que o usuário tinha"*. A resposta
final restaura o contexto inteiro (treino + exercício + tempo) em vez de guardar cada
pedaço contra o sintoma da vez.

## Decisão de arquitetura que se repetiu

A reidratação mora no **próprio `RestTimer`** (quem leu o disco decide aparecer), e não num
`setState` dentro de efeito na página. O lint do projeto proíbe isso, e a lição desde a
TASK-010 é **reestruturar em vez de contornar**. Mesmo motivo para o foco do exercício ser
**derivado** (`current ?? posiçãoSalva ?? 0`) em vez de sincronizado.

## Gates
`typecheck` ✓ · `lint` ✓ · **257/257** testes ✓ · `build` ✓ (eram 244 antes da task).

## Verificação no browser (390×844)
- Reload — equivalente a um descarte pelo sistema — reabre o overlay com **1:51 de 1:51**
  esperados.
- Fim do descanso fecha o overlay e limpa a âncora.
- Avanço de 5s troca de exercício; "Cancelar" segura; o ✓ da tabela não arma nada.
- Cenário do achado 1: sair no **3/3** durante o descanso e voltar devolve 3/3.
- Cenário do achado 2: treino do dia = A, usuário escolhe **B** à mão, descanso no 2/2,
  sai e volta → **Treino B, 2/2, overlay em 2:13 de 2:12** esperados.

## O que ficou de fora (os outros 4 itens do feedback)
| # | Item | Onde vai |
|---|---|---|
| 2 | Rodar em background + **notificação** ao terminar | precisa de PWA (manifest + Service Worker) — task própria |
| 5 | Logo fraca | task própria |
| 6 | Sino de notificações sem função | é a TASK-023 do roadmap (centro de avisos), nunca construída |
| 7 | **Treino preso ao dia da semana** | o maior: agenda por ROTAÇÃO em vez de calendário |

### Limite honesto do item 2 (registrado antes de prometer)
Um app web **sem servidor de push** não consegue *garantir* notificação com a página
congelada pelo sistema. Sem backend dá para entregar: (a) contagem sempre correta ao
voltar — **já entregue nesta task**; (b) notificação quando o app está em segundo plano mas
ainda vivo (cobre o caso comum de 60–120s com a tela ligada); (c) aviso de recuperação no
instante em que volta, se acabou enquanto estava fora. Garantia total exigiria Web Push +
servidor (Fase 2, contraria o local-first do v1) ou app nativo.
