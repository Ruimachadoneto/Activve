# TASK-026 — Vivid Fase 2: Corpo, Relatórios, conclusão de treino e registro editorial

> **Status: EM ANDAMENTO.** Corpo entregue e commitado. Os outros 3 itens NÃO foram iniciados.
> Branch: `ai/TASK-026-vivid-corpo-claude` · Base: `main` (`0ef1fff`, TASK-025 fase 1 mergeada)

## Contexto herdado (leia antes de continuar)
A direção **v3 "Vivid"** está registrada no `DESIGN_SYSTEM.md` **§0.1**. O usuário liberou
explicitamente os limites de sobriedade da política visual ("não precisa se limitar ao padrão
exigido na documentação") — **liberou estética, não integridade**. Continuam não negociáveis:
honestidade de dados (§9), anti-culpa, arquitetura plan-file (o app **não prescreve** treino nem
dieta), acessibilidade (reduced-motion, contraste, aria) e o teto de **1 E3 por tela**.

### Vocabulário v3 já disponível (em `globals.css`)
| Recurso | O que faz |
|---|---|
| Atmosfera do `body` | 2 campos de luz radiais fixos (teal no topo, azul embaixo, ≤9%) |
| `.card-lift` | Relevo: gradiente sutil + fio de luz na borda superior |
| `.elev-focus` | E3 com **brilho ambiente** (halo interno + glow externo) |
| `.text-grad-accent` | Texto em gradiente do acento (momento de assinatura) |
| `.stagger` | Entrada em escada por `nth-child` (sem configurar por filho) |
| `.pr-badge` / `.pr-ring` | Selo de recorde com overshoot + anel que dissipa |
| Tokens de movimento | `--dur-instant/fast/base/slow`, `--ease-out-soft/snap/overshoot` |

Todos degradam corretamente em `prefers-reduced-motion` (bloco no fim do `globals.css`).

---

## ✅ ENTREGUE: Corpo v3 (commit `42aaf98`)
- **Mapa muscular vira o E3** com **spotlight**: `radial-gradient` de accent a 12% atrás dos
  corpos, dentro de um wrapper `relative overflow-hidden`. Os corpos emergem do fundo.
- **Peso vira número-herói** (44px) e **perdeu o `tabular-nums`** — que violava a §3.2 corrigida
  na TASK-021 (largura fixa deixa número grande e isolado frouxo).
- `card-lift` nos demais cards + `stagger` no `<main>`.
- Verificado: 1 E3, 4 cards com relevo, sem overflow, console limpo. Gates 200/200 ✓.

---

## ⬜ PENDENTE 1 — Tela de conclusão de treino celebrada
**Onde:** `src/app/treino/page.tsx`. Hoje `concluirTreino()` chama `completeSession(session)` e a
tela simplesmente muda de estado — **não há celebração nenhuma** no fim do treino, que é o
momento de maior conquista do app.

**Dados já disponíveis para a tela (nada novo precisa ser calculado do zero):**
- `sessionProgress(session)` → séries feitas/total, `allDone`
- `bestPreviousLoad(history, exId, sessionId, movementId)` → régua de recorde (já existe, testada)
- `session.exercises[].sets[]` → carga, reps, RPE de tudo que foi feito
- `history` → sessões anteriores (para "3º treino da semana", volume comparado)

**Direção sugerida (registro B, imersivo):**
- Volume total levantado (soma de `load_kg × reps` das séries feitas) como número-herói
- Recordes batidos na sessão (reusar a régua do `bestPreviousLoad`)
- Duração real (`completedAt - startedAt`)
- Celebração com `pop`/`pr-ring`, respeitando reduced-motion
- **Anti-culpa:** treino parcial (nem todas as séries) também merece fechamento digno — nunca
  "você deixou 2 séries para trás"

**Cuidado conhecido:** existe um `restDelayRef` (compasso de 1,6s do recorde) que já é cancelado
em `concluirTreino()` e na navegação via helper `navegar()`. Qualquer novo timer precisa do mesmo
tratamento.

## ⬜ PENDENTE 2 — Relatórios v3
**Onde:** `src/app/relatorios/page.tsx`. Estrutura atual: calendário mensal → detalhe do dia →
geração de relatório (com `ReportLineChart`, que já é casca do `LineChart` bom).

**Direção sugerida:**
- `card-lift` + `stagger` (consistência com Hoje/Corpo)
- Dias com sessão no calendário: hoje é um ponto discreto — podem ganhar presença (halo/anel na
  cor semântica), transformando o calendário num **mapa de constância**
- O bloco do relatório é candidato natural ao **registro C (editorial)**: tipografia protagonista,
  já que a tarefa ali é **ler**
- **Não** introduzir streak nem cobrança por dia vazio (anti-culpa)

## ⬜ PENDENTE 3 — Registro C (Editorial)
**Onde vale (DESIGN_SYSTEM §0):** Como fazer (modal de exercício), `/import`, PDF/impressão,
estados vazios/erro/onboarding.

**O que caracteriza:** densidade média, **tipografia protagonista**, medida de linha confortável,
o degrau *Display* (30–34px) da escala tipográfica — que hoje **não é usado em lugar nenhum**.

---

## Estado do repositório neste ponto
- `main` = `0ef1fff` (TASK-025 fase 1 mergeada; 013/020/021/022/023/024 já em `main`)
- Branch atual `ai/TASK-026-vivid-corpo-claude` = `42aaf98` (Corpo v3), **working tree limpo**
- Gates no commit: typecheck ✓ · lint ✓ · **200/200** ✓ · build ✓
- **Ainda não passou por review Codex** e **não foi mergeada**

## Como retomar
1. `git checkout ai/TASK-026-vivid-corpo-claude`
2. Rodar `codex review --base main` para chancelar o Corpo v3, corrigir achados
3. Seguir para os 3 pendentes (a ordem sugerida é a de impacto: conclusão de treino → relatórios
   → editorial)
4. **Regra do usuário:** parar de auto-corrigir após **3 ciclos** de review e escalar
5. Semear dados no preview: o IndexedDB do preview é efêmero; usar `indexedDB.open("activve", 3)`
   e popular `plans` + `kv` (`activePlanId`) + `bodylog` + `sessions`. Campo de peso é
   **`weight_kg`**, não `weight`.
