# Auditoria visual — app atual vs. mockups (2026-06-30)

> **Duas peças de referência**, reconciliadas nesta auditoria:
> - **Mockup BASE ("Soft Tech Minimal", "Bom dia, Matheus.")** — é o mockup canônico do
>   `UI_REFERENCE.md` (aprovado 2026-06-25): Hoje (chip "Plano importado", hero c/ 12 exercícios ·
>   60–75 min · intensidade, visão da semana c/ checks, Dieta anel 3/4 + Corpo), Modo treino
>   (foto real, SÉRIE 3 DE 4 + badge RIR, steppers grandes, descanso anel inline c/ Pausar/Pular,
>   Próximo exercício, **Variações com thumbnails inline**), Corpo (tabs Visão geral · Medidas ·
>   Fotos · Histórico, **mapa 3D realista** c/ legenda Pronto/Recuperando/Trabalhado + "toque para
>   detalhes", Tendência de peso c/ delta "↓1,8 kg últ. 30 dias", **Medidas principais** c/ Editar,
>   Progresso de fotos). Bottom nav: Hoje · Treino · Corpo · **Progresso**.
> - **Mockup v2 ("Bom dia, Rui.")** — evolução do base: adiciona a tela **Como fazer** (execução,
>   dicas técnicas, alternativas c/ badge, dica rápida), card **FOCO DO DIA** e **lista numerada de
>   EXERCÍCIOS** na home.
>
> O alvo é a **união dos dois**. Comparação feita com o app real em 375×812 (plano semeado).

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

## Tela 4 — Corpo (do mockup BASE)
| # | Mockup | App atual | Gap |
|---|---|---|---|
| 1 | **Mapa 3D realista** (base anatômica cinza/escura + músculos coloridos) | Vetor `react-muscle-highlighter` polido | Confirma a **Fase 2 realista** como alvo final; o estilo do mockup = exatamente o dos assets `public/muscles/*` |
| 2 | Legenda **3 estados** (Pronto/Recuperando/Trabalhado); descansado = corpo neutro | 4 estados (descansado pintado azul-aço) | No realista, "descansado" volta a ser a base neutra (revisita a decisão do review quando a Fase 2 chegar) |
| 3 | "Toque em um grupo muscular para detalhes" | **JÁ IMPLEMENTADO** (tap + "pronto em ~X") | ✔ alinhado |
| 4 | Tabs **Visão geral · Medidas · Fotos · Histórico** | Visão geral · Medições | Renomear/estender |
| 5 | Tendência de peso: gráfico + **87,6 kg** grande + chip "**↓ 1,8 kg** últ. 30 dias" | WeightChart + delta em texto | Refino de layout (chip, número grande) |
| 6 | **Medidas principais** (Peso/Cintura/Peito/Coxa/Braço + Editar) | Só peso | Dado parcial já existe no schema (`targets[].value_cm`); medir/editar exige store novo (`bodylog` estendido) |
| 7 | Progresso de fotos (antes/depois) | Fora do escopo v1 (decisão registrada) | Mantém fora por ora |

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

## Plano proposto (prioridade = impacto visual × esforço; alvo = união dos 2 mockups)
- **TASK-010 (P1) — Mídia + foco do Modo Treino:** imagem real do exercício (free-exercise-db com
  tratamento dark) no slot de mídia; série atual em destaque (badge SÉRIE X DE N + badge RIR/RPE +
  steppers grandes; tabela completa colapsável mantendo RPE); barra de progresso no header
  (ex.: "3/12"); card PRÓXIMO EXERCÍCIO; **Variações com thumbnails inline** no fim da tela
  (mockup base) — a sheet vira só "Como fazer"; ✓ no CTA; SUGESTÃO/tempos do plano no descanso.
- **TASK-011 (P1) — Hoje v2:** saudação (nome teal + tagline), chip **"Plano importado" + Ver
  plano**, hero com nome do treino + ícones (N exercícios · ~min · intensidade), card FOCO DO DIA,
  lista EXERCÍCIOS numerada, CTA rodapé + equipamentos; anel de progresso na Dieta (3/4).
- **TASK-012 (P2) — Como fazer v2:** chips de músculos (dado pronto), DICAS TÉCNICAS + DICA RÁPIDA
  (schema minor bump + ADR), alternativas com thumbnail + badge.
- **TASK-013 (P3) — Robustez:** estado de erro amigável p/ plano corrompido (em vez de crash).
- **TASK-014 (P2) — Corpo v2:** número grande + chip de delta na tendência; tabs Medidas/Histórico;
  **Medidas principais** (cintura/peito/coxa/braço — estende `bodylog`); prepara a **Fase 2
  realista** do mapa (assets do usuário; no realista, "descansado" volta a ser base neutra).

Cada task: contrato próprio, review Codex, gate visual do usuário (VISUAL_QUALITY §10–13).
