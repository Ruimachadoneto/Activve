# Auditoria visual — app atual vs. mockup v2 (2026-06-30)

> Mockup v2 (3 telas: Hoje "Bom dia, Rui." / Treino "Puxada frontal" / Como fazer) fornecido pelo
> usuário em 2026-06-30. É **mais rico** que o `UI_REFERENCE.md` (2026-06-25) e passa a ser a
> referência canônica quando aprovado. Comparação feita com o app real em 375×812 (plano semeado).

## Veredito geral
Estrutura e identidade (dark navy + teal, cards, anti-culpa) estão certas. O que separa o app do
mockup é sobretudo: **(1) mídia real de exercício, (2) densidade de informação (listas, chips,
ícones, metadados), (3) foco na série atual no Modo Treino, (4) riqueza do "Como fazer"**.
O overlay de Descanso já está ~90% do mockup. O hero do Hoje com asset 3D é ponto forte.

## Tela 1 — Hoje
| # | Mockup | App atual | Gap |
|---|---|---|---|
| 1 | "Bom dia, **Rui.**" (nome em teal) + "Foco agora, resultados sempre." | "Boa tarde, Rui" branco + "Como foi seu dia?" | Trivial, alto impacto de marca |
| 2 | Hero: eyebrow SEU TREINO DE HOJE; título = **nome do treino** ("Costas + Bíceps"); badge "A"; linhas com ícone "8 exercícios" e "~60 min"; botão fantasma "Ver objetivo" | Título = focus; só "3 exercícios"; sem duração; CTA dentro do hero | Médio |
| 3 | Card **FOCO DO DIA** (ícone alvo) com o focus do treino | Não existe (focus está no hero) | Pequeno |
| 4 | **Lista EXERCÍCIOS numerada** (nome + N séries + chevron → como fazer) | Não existe | **Maior gap estrutural da home** |
| 5 | CTA rodapé **▶ Iniciar treino** full-width + "✓ Equipamentos disponíveis" | CTA dentro do hero | Pequeno |
| 6 | Header: hamburger + sino | Logo badge + sino | Decisão de produto (logo = identidade; ok manter) |

Manter do app (não está no mockup mas é força): hero com asset 3D `public/muscles/*`, card
SEU RITMO NESTA SEMANA, cards Corpo/Alimentação, bottom nav.

## Tela 2 — Modo Treino
| # | Mockup | App atual | Gap |
|---|---|---|---|
| 1 | **Foto real dark premium** do exercício + badge 1.0x + fullscreen | Slot vazio "Ver demonstração" | **Maior gap visual do app inteiro** |
| 2 | Badge **SÉRIE 2 DE 4** + steppers **grandes** de CARGA/REPETIÇÕES da série atual (sem RPE visível) | Tabela 4 linhas com steppers pequenos + RPE | Grande (hierarquia: foco na série corrente) |
| 3 | Header "Treino" + progresso + "Ver instruções >" | Focus + "1 de 3"; instrução escondida no botão "Variação" | Médio |
| 4 | DESCANSO inline: anel + Pausar/Pular + SUGESTÃO 60/90/120 | Overlay: anel + Pausar/Pular + 30/60/90 | **~90% pronto** (overlay foi decisão aprovada; ajustar rótulo/tempos do plano) |
| 5 | Card **PRÓXIMO EXERCÍCIO** (thumb + nome + séries) | Só link "Próximo ›" | Pequeno, alto valor de orientação |
| 6 | CTA "Concluir série ✓" | Sem ícone | Trivial |

## Tela 3 — Como fazer (hoje: ExerciseSheet)
| # | Mockup | App atual | Gap |
|---|---|---|---|
| 1 | **Chips de músculo/padrão** no topo (Costas — Dorsal, Trapézio · Bíceps — Sinergista · Força — Padrão composto) | Não mostra músculos (dados JÁ existem: primary/secondaryMuscles) | Médio, dado pronto |
| 2 | EXECUÇÃO (bullets) | COMO FAZER numerado | OK (equivalente) |
| 3 | **DICAS TÉCNICAS** (checks teal) + **DICA RÁPIDA** (lâmpada) | Não existe | Requer campo novo no schema (`howTo.tips[]`, `howTo.quickTip` — opcionais, minor bump) |
| 4 | **ALTERNATIVAS com thumbnail + badge** (Semelhante/Alternativa) + séries | Lista textual com "Usar" | Médio (depende de mídia) |

## Transversal
- **Mídia de exercício** é a alavanca nº1: opções (a) tratamento dark (filter + overlay gradiente)
  sobre imagens do `free-exercise-db` (Unlicense) — rápido, cobre 800+ exercícios; (b) fotos
  geradas pelo usuário (GPT, estilo dark premium do mockup) para os top ~20 exercícios — máxima
  fidelidade; recomendação: (a) já, (b) sobrepondo depois. Casar por nome/`primaryMuscles`.
- Duração estimada (~60 min): heurística `Σ séries × (45s + rest_s)` — sem novo dado.
- Ícones de linha (lucide, já no projeto) nos metadados.
- **Schema/contrato:** `howTo.tips[]`/`quickTip` + `media.imageUrl` opcionais ⇒ ADR + PLAN_SCHEMA
  minor bump (contrato é bidirecional; gerador precisa acompanhar).
- **Bug descoberto na auditoria:** plano **corrompido/parcial no IndexedDB** (sem weekSchedule /
  howTo / diet.meals) derruba HojePage e TreinoPage com runtime error (tela vermelha). O import
  valida, então só ocorre com dado corrompido — mas viola VISUAL_QUALITY §8 (estados): deveria
  cair em estado de erro amigável ("plano inválido — reimporte"). Registrar como dívida.

## Plano proposto (prioridade = impacto visual × esforço)
- **TASK-010 (P1) — Mídia + foco do Modo Treino:** imagem real do exercício (free-exercise-db com
  tratamento dark) no slot de mídia e nas alternativas; série atual em destaque (badge SÉRIE X DE N
  + steppers grandes; tabela completa colapsável mantendo RPE); barra de progresso no header;
  card PRÓXIMO EXERCÍCIO; ✓ no CTA; SUGESTÃO/tempos do plano no descanso.
- **TASK-011 (P1) — Hoje v2:** saudação (nome teal + tagline), hero com nome do treino + ícones +
  ~duração + Ver objetivo, card FOCO DO DIA, lista EXERCÍCIOS numerada, CTA rodapé + equipamentos.
- **TASK-012 (P2) — Como fazer v2:** chips de músculos (dado pronto), DICAS TÉCNICAS + DICA RÁPIDA
  (schema minor bump + ADR), alternativas com thumbnail + badge.
- **TASK-013 (P3) — Robustez:** estado de erro amigável p/ plano corrompido (em vez de crash).

Cada task: contrato próprio, review Codex, gate visual do usuário (VISUAL_QUALITY §10–13).
