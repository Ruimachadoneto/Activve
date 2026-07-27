# TASK-017 — Timer de descanso ancorado em tempo real

## Metadados

- Status: `in_progress`
- Risco: `médio` (reescreve o núcleo do `RestTimer`; componente já teve 1 bug de countdown
  corrigido na TASK-010 — atenção redobrada pra não reintroduzir regressão)
- Lead/Planner: `Claude` · Implementer: `Claude` · Reviewer: `Codex`
- Branch: `ai/TASK-017-timer-ancorado-claude` · Base: `origin/main` (`0a4a3cd`)

## Objetivo

Corrigir o timer de descanso divergir do tempo real quando o usuário sai da tela do app (troca de
app, tela apaga) e volta. **Sem** notificação em background nesta task — isso depende de Service
Worker/PWA (ver TASK-019, fora de escopo aqui); o objetivo é só a contagem **não divergir**.

## Contexto

- `RestTimer.tsx` conta por **decremento relativo**: `remaining` é reduzido de 1 em 1 a cada
  `setTimeout` recursivo (religado via `remaining` nas deps do efeito — solução da TASK-010 pra um
  bug diferente, "timer morria após zerar"). **Não existe âncora de tempo absoluto** (`Date.now()`);
  o browser faz throttling/pausa de timers em aba oculta (`document.hidden`) — quando o usuário
  volta, `remaining` não reflete o tempo real decorrido.
- Causa raiz confirmada por leitura de código (não é bug de browser, é o design do componente).

## Escopo

- Reescrever o núcleo do countdown pra ser **auto-corretivo**: uma âncora `endAt` (epoch ms,
  `Date.now() + remaining*1000`) é a fonte da verdade; `remaining` exibido é sempre recalculado de
  `endAt - Date.now()`, nunca decrementado.
- Recalcular imediatamente ao voltar o foco/visibilidade (`visibilitychange`, `focus`) — não espera
  o próximo tick pra corrigir o número na tela.
- Pausar/retomar: ao pausar, congela o valor **calculado no momento exato do clique** (não o último
  tick, que pode estar desatualizado); ao retomar, reancora a partir desse valor congelado.
- Presets/+15s: recalculam a âncora a partir do novo total.
- Preservar o comportamento existente: vibração 1x ao terminar, presets, overlay, `role=dialog`,
  Escape fecha, `runToken` reinicia o ciclo.

## Fora de escopo

- Notificação do sistema quando o app está minimizado/tela apagada (exige Service Worker — TASK-019).
- Qualquer mudança visual do componente (cores, layout, textos) — só o motor do countdown.

## Critérios de aceite

- [ ] Simulação de "sair e voltar" (avançar `Date.now()` mockado, ou aguardar real) mostra o tempo
      correto ao voltar — não o valor congelado de antes de sair.
- [ ] Pausar e retomar preserva o tempo restante correto (sem pular nem duplicar segundos).
- [ ] Preset/+15s continuam funcionando (inclusive depois do timer já ter zerado — regressão da
      TASK-010 a não reintroduzir).
- [ ] Vibração dispara 1x só, no momento em que chega a zero.
- [ ] Gates verdes; verificado no browser (DOM + `Date.now()` mockado via devtools/eval pra simular
      passagem de tempo em segundo plano, já que não dá pra minimizar a aba de verdade no preview).

## Validações

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Registro de execução

- Data: 2026-07-27 · Implementado: `RestTimer.tsx` reescrito. Núcleo agora usa `endAtRef` (epoch ms,
  `Date.now() + remaining*1000`) como fonte da verdade; `remaining` exibido é sempre recalculado de
  `endAt - Date.now()` (nunca decrementado). Recalcula na hora ao voltar foco/visibilidade
  (`visibilitychange`, `focus`), sem esperar o próximo tick. Pausar congela o valor **calculado no
  momento do clique** (via endAt), não o último tick armazenado. `remainingRef` (mirror síncrono)
  evita reler `endAt` de forma inconsistente entre preset/+15s/pause/resume. Vibração 1x guardada
  por `vibratedRef`. Preservado: overlay, `role=dialog`, Escape fecha, presets, `runToken` reinicia.
- Gates: typecheck ✓ · lint ✓ (1 ajuste: `react-hooks/refs` proíbe escrever ref durante o render —
  o reset por `runToken` movido pra um efeito dedicado, antes do efeito de ancoragem na ordem de
  declaração) · **120/120** ✓ · build ✓.
- **Verificado no browser** (`/treino`, descanso real de 120s pós "Concluir série"):
  - **Correção automática**: `Date.now` mockado +30s + `visibilitychange`/`focus` disparados sem
    esperar tick real → contador saltou exatamente o tempo decorrido (30s mock + latência real),
    não "1 tick só". Prova a âncora absoluta funcionando (o cenário exato do bug relatado).
  - **Pause/resume**: pausado, congelado durante 3s reais parado, retomado → continuou do valor
    correto (sem pular nem duplicar segundos).
  - **+15s**: estendeu corretamente a partir do valor real no momento do clique.
  - **Zerar + revivir**: mock +35s até 0:00 ("Descanso fim"/"Pronto para a próxima série"), depois
    clique num preset (60s) → religou e voltou a contar normalmente — **não reintroduz o bug da
    TASK-010** ("timer morria após zerar").
  - Console limpo em todos os passos.
- **Fora de escopo confirmado**: sem notificação do sistema com o app minimizado/tela apagada —
  isso exige Service Worker (TASK-019). O que esta task resolve é a contagem **não divergir**
  quando o usuário volta pro app; a notificação real fica pra depois do PWA existir.
- **Estado**: CONCLUÍDO — pendente review Codex + gate de merge do usuário.
