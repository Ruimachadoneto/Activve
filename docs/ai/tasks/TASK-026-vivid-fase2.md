# TASK-026 — Vivid Fase 2: Corpo, conclusão de treino, Relatórios e registro editorial

> **Status: IMPLEMENTADA, REVISADA (3 ciclos Codex) e VERIFICADA — aguarda só o gate humano de
> merge.** Branch: `ai/TASK-026-vivid-corpo-claude` · Base: `main` (`0ef1fff`)

## ⚠️ MANDATO DO USUÁRIO — leia isto com atenção antes de projetar qualquer coisa

Reafirmado em 2026-07-30, com estas palavras: *"a ideia é avançar o app para um novo nível, não
precisa se limitar ao padrão exigido na documentação ou demais limitações se isso impedir avanços,
seja estéticos ou de funcionalidade."*

**Como aplicar:** se uma regra de sobriedade da documentação estiver travando um avanço real,
**o avanço vence** — e a decisão é registrada aqui e no `DESIGN_SYSTEM` §0.1. Isso vale também
para funcionalidade: se algo exige um campo novo no `PLAN_SCHEMA`, **proponha o bump** em vez de
encolher a ideia para caber no schema atual.

**O que continua valendo mesmo assim** (o usuário liberou estética e escopo, não integridade):
honestidade de dados, anti-culpa, o app não prescreve treino/dieta, e acessibilidade.

**Leitura errada deste mandato:** fazer os itens como "aplicar `card-lift` e seguir". O pedido é
que as telas fiquem **irreconhecíveis de forma positiva** — repense a tela, não só a sua pintura.

> **Nota de execução (2026-07-30):** nenhum dos 4 itens exigiu bump do `PLAN_SCHEMA`. A tela de
> conclusão nasceu inteira de dado que a sessão já registrava. O bump segue disponível para as
> próximas ideias, mas forçá-lo aqui teria sido cerimônia sem ganho.

---

## ✅ ENTREGUE 1 — Corpo v3 (commit `42aaf98`)
- **Mapa muscular vira o E3** com **spotlight**: `radial-gradient` de accent a 12% atrás dos
  corpos, dentro de um wrapper `relative overflow-hidden`. Os corpos emergem do fundo.
- **Peso vira número-herói** (44px) e **perdeu o `tabular-nums`** — que violava a §3.2 corrigida
  na TASK-021.
- `card-lift` nos demais cards + `stagger` no `<main>`.

**Review Codex (ciclo 1) — LIMPO**, nenhum achado.

**1 achado meu, na verificação no browser** (commit `1483e46`): o `BottomNav` renderiza espaçador
+ nav como filhos **diretos** do `<main>`, então os dois entravam na escada do `.stagger`. Com
`fill-mode: both`, o `opacity: 0` do keyframe `rise` ficava retido durante o atraso e a navegação
principal só aparecia ~280ms depois do conteúdo — o "movimento que atrasa a ação" proibido na §6.
→ classe `stagger-skip` (chrome não espera a vez do conteúdo).

## ✅ ENTREGUE 2 — Tela de conclusão de treino (commits `779ab0f`, `e0102a9`, `25745ff`, `c965f4c`)

Antes, `concluirTreino()` chamava `completeSession(session)` e a tela só mudava de estado. Agora a
tela de execução **sai de cena** e entra uma composição só sobre o que acabou de acontecer.

**Núcleo puro — `src/lib/plan/summary.ts`** (`buildSessionSummary`, `sessionVolume`,
`buildConstancy`, `formatDuration`), 27 testes:
- volume levantado (Σ carga × reps), com `volumeSets` separado de `doneSets`;
- recordes da sessão (mesma régua do `bestPreviousLoad`, um por exercício, empate não conta);
- série mais pesada, duração, contagens e movimentos executados.

**UI — `src/components/WorkoutCompletion.tsx`**: herói de 56px com count-up, bloco âmbar de
recordes com `pr-badge`, três estatísticas, foco muscular e saídas explícitas. Campo de luz +
anéis (`.completion-bloom` / `.completion-ring`).

**Honestidade (§9):** o volume soma **só o que foi registrado**. Série sem carga ou sem reps fica
fora e a tela **diz quantas ficaram**, em vez de estimar. Sem carga nenhuma, o herói vira contagem
de séries; sem nada marcado, ainda há fechamento digno.

**Anti-culpa:** nunca "você deixou X para trás" — as contagens são "N de M", secas.

**Decisões de projeto que valem para o futuro:**
- `celebration` é **snapshot local**, não `session.status === "done"`: celebração é um MOMENTO.
  Derivar do status faria o app comemorar treino velho a cada reabertura.
- A coreografia é toda CSS. **Nenhum `setTimeout` novo** — foi a classe de bug do compasso do
  recorde (`restDelayRef`), que exige cancelamento em toda saída.
- O count-up **escreve no DOM** e o JSX já contém o valor FINAL: sem JS, com `reduced-motion` ou
  se o rAF não rodar, a tela mostra a verdade, nunca um número parcial preso. (Provado por
  acidente: numa aba `document.hidden` o rAF nunca roda e o número exibido continuou correto.)

## ✅ ENTREGUE 3 — Relatórios v3 (commit `7648ef6`)

**Calendário vira mapa de constância.** Cada dia com treino era um ponto de 4px: a informação
existia e não se via. Agora o próprio dia se acende, e a força da luz é o **volume daquele dia
comparado ao maior do mês em tela**. Cabeçalho ganha o total do mês.

- Normaliza dentro do MÊS: comparar com o histórico inteiro apagaria um mês inteiro por causa de
  um pico de outro ciclo — dramatizar oscilação (§7.8).
- Sessão **aberta** não soma volume (mesma régua de `recovery.ts` e do relatório), mas aparece:
  contorno tracejado e contagem própria no resumo do mês.
- **Anti-culpa:** dia vazio continua vazio. `buildConstancy` nem cria registro de ausência.
- `aria-label` do dia diz por extenso o que a cor diz.

**Relatório em registro C** (ver item 4).

## ✅ ENTREGUE 4 — Registro C, Editorial (commit `5c855d0`)

O degrau **Display (30–34px)** da §3.1 existia na documentação e **não era usado em tela nenhuma**.
Agora marca as telas cuja tarefa é LER:

- **`ReportView`** (relatório/PDF): título do período em Display, medida de linha controlada,
  entrelinha larga, fios separando seções no lugar de caixas.
- **`ExerciseSheet`** (Como fazer): nome ao Display; os **passos** deixam de ser legenda
  `text-muted` de 14px e viram o texto principal (15px / 1.62 / `text-ink`) — era a informação
  mais importante da sheet renderizada com a menor ênfase disponível. Numeral do passo sai do teal
  para `faint` (§2.1 reserva o acento para ação e para "pronto"). Ganha `elev-float` (E4).
- **`PlanErrorState`**: título ao Display; ícone passa de `accent` para `danger` — plano ilegível é
  falha real, e teal significa outra coisa. O tom calmo mora na copy.
- **`/import`**: mesmo tratamento no cabeçalho.

---

## Review Codex — 3 ciclos (limite do AGENTS §13), 5 achados reais, todos corrigidos

| Ciclo | Achado | Correção |
|---|---|---|
| 1 (Corpo) | — (limpo) | — |
| 1 (conclusão) | [P2] `setCelebrating(true)` antes de `saveSession` resolver → toque rápido no CTA montava `/corpo` com dado velho | celebração passou a esperar a escrita |
| 2 | [P2] sessão **aberta** entrava no volume do mapa de constância | só `status === "done"` soma volume |
| 2 | [P2] celebração lia `session`/`workout` **correntes** → trocar de treino no intervalo resumia o treino errado, ou a tela não aparecia | **snapshot** imutável no momento da conclusão |
| 3 | [P2] mês só com sessões abertas dizia "Nenhum treino registrado" contradizendo a própria grade | `monthSummary` conta "N em andamento" separado do volume |
| 3 | [P2] adiar a troca de tela deixava o Modo Treino **editável** durante o round-trip da escrita | celebração voltou a ser **síncrona**; só a **navegação** espera a promessa |

**Nota sobre os ciclos 1→3 da conclusão de treino:** os três achados são a mesma tensão vista de
ângulos diferentes — *quem* precisa esperar o disco. A resposta final separa as duas coisas: a
**tela** troca na hora (fecha a janela de edição e devolve a reação imediata), a **navegação**
espera (porque o destino lê o IndexedDB na montagem). Tentar resolver com um único interruptor
booleano produziu, nas duas primeiras tentativas, um problema no lugar do outro.

## Gates
`typecheck` ✓ · `lint` ✓ · **228/228** testes ✓ · `build` ✓ (eram 200 antes da task).

## Verificação no browser (390×844, sempre em aba nova)
- Corpo: 1 E3, 4 cards com relevo, nav sem animação e centrado, sem overflow, console limpo.
- Conclusão: caminho completo (2.960 kg, 2 recordes, foco muscular); treino **parcial**
  (500 kg, "2 séries sem carga ou repetições ficaram fora desta conta", 3 de 7 séries, série mais
  pesada); "Ver o treino" volta sem desfazer a conclusão; CTA leva a `/corpo` com 14 regiões já em
  "trabalhado"; cenário exato do achado do ciclo 2 (concluir A e trocar pra B na mesma tick) mostra
  Treino A.
- Relatórios: 8 dias acesos com intensidade por volume, alvo de toque **44,6×44**, pior contraste
  medido **4,94:1**, mês só com sessão aberta mostra "1 em andamento" sem legenda de volume.
- Editorial: sheet 30px/500 com passos 15px/1.62 e numeral `faint`; erro com ícone `#E5614F`;
  import 30px.

⚠️ **Screenshot indisponível nesta sessão** (a Browser pane não estava compositando — quirk já
registrado no `STATUS.md`). Toda a verificação acima é por DOM + estilos computados, com as
animações forçadas ao estado assentado via `getAnimations().finish()`. **O gate visual humano
continua pendente.**

## Dois achados de acessibilidade pegos MEDINDO, não no olho
1. **Contraste do mapa de constância:** o acento a 55–60% derrubava o número do dia para 3,6–4,1:1,
   abaixo do AA. Teto da escala baixado para 44% → pior caso medido 4,94:1, e a escala segue
   legível (pico com 3× a luz do dia mais fraco). Registrado no comentário de `dayFill`.
2. **Alvo de toque:** a grade do calendário tinha 36px de altura (regressão herdada, não
   introduzida agora). Com `p-3` + `gap-0.5` + `h-11` chega a 44,6×44 — o mínimo do §4. Sete
   colunas em 390px só fecham 44px com essa geometria.

## Próxima ação
1. **Gate humano: aprovar (ou recusar) o merge** de `ai/TASK-026-vivid-corpo-claude` em `main`.
   Merge com `--no-ff`, revalidar gates na `main`, apagar a branch.
2. Depois: `main` está à frente de `origin` — o push dispara o deploy do Vercel e é decisão do
   usuário.

## Como semear dados no preview
O IndexedDB do preview é efêmero. Usar `indexedDB.open("activve", 3)` e popular `plans` + `kv`
(`activePlanId`) + `bodylog` + `sessions`. Campo de peso é **`weight_kg`**, não `weight`.
O `examples/plano-exemplo.json` **não** é servido pelo app — copiar temporariamente para `public/`
(e apagar depois) é o caminho mais barato para o script de seed conseguir buscá-lo.
