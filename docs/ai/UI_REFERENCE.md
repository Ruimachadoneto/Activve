# Activve — Referência visual canônica (APROVADA)

> **Esta é a referência oficial** (aprovada pelo usuário em 2026-06-25): mockup "activve · treino inteligente, vida real", 3 telas (Hoje / Modo treino / Corpo), dark navy + acento teal/verde. Toda tela deve **bater esta referência** (ver `VISUAL_QUALITY.md`). Tokens em `docs/DESIGN_SYSTEM.md`.

## Marca
- Logo: "A" estilizado (traços, gradiente teal). Wordmark "activve" minúsculo. Tagline: "treino inteligente, vida real".
- Footer institucional: SIMPLES (o essencial, bem feito) · INTELIGENTE (dados que fazem sentido) · HUMANO (sem culpa, sem cobrança) · PRIVADO (seus dados, só seus).

## Tela 1 — Hoje
- Header: badge circular com "A" (anel teal) à esquerda; sino (com ponto de notificação) à direita.
- Saudação: "Boa noite, Rui" (h1) + "Como foi seu dia?" (muted).
- **Card TREINO DE HOJE (hero):** eyebrow "TREINO DE HOJE"; título "Costas + Bíceps"; **ilustração do grupo muscular trabalhado à direita do card** (costas destacadas em teal); linhas com ícone: "8 exercícios", "~60 min"; CTA verde "▶ Começar treino".
- **Card SEU RITMO NESTA SEMANA:** "4 de 7 treinos" à direita; "Constância é o que constrói."; círculos S T Q Q S S D (concluídos com check teal, futuros como anel vazio) + barra de progresso.
- **Card Corpo:** ícone de corpo + "Corpo" / "Acompanhe sua evolução" + chevron.
- **Card Alimentação:** ícone de tigela + "Alimentação" / "Plano de hoje" + "2 de 3 refeições" + barra de progresso.
- Bottom nav (4): **Hoje · Treino · Corpo · Mais** (Hoje ativo, teal).

## Tela 2 — Modo treino
- Header: chevron voltar; "Costas + Bíceps · 3 de 8" + barra de progresso; "···".
- "EXERCÍCIO ATUAL" + "Puxada frontal" + botão "Variação ⇄".
- Mídia (foto/vídeo do exercício) com play.
- **Tabela SÉRIES:** colunas SÉRIE · KG · REPS · RPE. Linhas com check (concluídas), atual destacada, futuras esmaecidas. **Steppers − valor + para KG e REPS.**
- **DESCANSO:** anel circular "00:48 restantes" + "DEFINIÇÕES RÁPIDAS" 30s/60s/90s.
- CTA verde "✓ Concluir série". Rodapé: "‹ Exercício anterior" / "Próximo exercício ›".

## Tela 3 — Corpo
- "Corpo" + ícone info. Tabs: Visão geral · Medições · Fotos · Desempenho.
- **Mapa muscular: dois corpos anatômicos realistas (frente+costas)**, músculos coloridos por estado. Legenda: **Pronto (teal) · Recuperando (amarelo) · Trabalhado (laranja/vermelho)**. (Asset colorível por músculo — dinâmico.)
- "Tendência de peso · 75,2 kg" (linha suave). "Medições principais" (Peso/Cintura/Peitoral/Coxa) + "Progresso em fotos" (antes/depois).
- Bottom nav (Corpo ativo).

## Assets necessários
- **Ilustrações de grupo muscular (estáticas)** para o card de treino: costas, peito, pernas, ombro, braço, full (frente/costas, grupo destacado). Geradas pelo usuário (GPT) → encaixadas por `workout.primaryMuscles`/`focus`.
- **Corpo colorível (dinâmico)** para a tela Corpo: SVG/lib por músculo (react-muscle-highlighter / body-muscles / asset licenciado realista), colorido pelo vocabulário `muscle` do PLAN_SCHEMA.
- Fotos de execução no Modo treino + fotos de progresso (do usuário).
