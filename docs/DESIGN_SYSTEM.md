# Activve — Design System (starter)

> Direção visual **aprovada** (2026-06-22): "Soft Tech Minimal" — dark + teal — a partir dos mockups de referência aprovados pelo usuário. Tokens abaixo são **derivados da referência** e devem ser calibrados contra os valores exatos quando extrairmos do arquivo-fonte/Figma. Segue `docs/ai/VISUAL_QUALITY.md`.

## 1. Marca
- **Nome:** Activve. Logo: "A" estilizado (pico/seta, gradiente teal→claro) + wordmark.
- **Tagline:** "Seu plano. Seu ritmo. Resultados consistentes."
- **Personalidade:** calmo, confiável, premium, humano, anti-culpa. Privado por padrão.

## 2. Cor (derivada da referência — calibrar)
**Superfícies (dark-first):**
- `--bg` #0A1422 (navy profundo) · `--surface` #101D2E · `--surface-2` #16263A
- `--line` rgba(255,255,255,.06) (hairline) · `--line-strong` rgba(255,255,255,.10)

**Texto:** `--text` #EAF1F8 · `--text-muted` #8B97A8 · `--text-faint` #5C6878

**Acento (teal/mint):** `--accent` #2FD4B6 · `--accent-press` #25B89D · texto sobre acento `--on-accent` #03251F

**Estados de recuperação muscular (legenda do mapa):**
- `--rec-worked` #F2854A (trabalhado · laranja)
- `--rec-recovering` #F2C94C (em recuperação · amarelo)
- `--rec-ready` #2FD4B6 (pronto · teal)
- `--rec-rested` #6B7688 (descansado · cinza)

**Semânticos:** sucesso = teal/verde · aviso = âmbar (#F2C94C) · erro = vermelho (#E5614F). Sempre validar contraste AA.

## 3. Tipografia
- Família: sans geométrica/neutra (Inter ou SF-like). **Dois pesos: 400 e 500.**
- Escala: display 28–30/500 · h1 22/500 · h2 18/500 · corpo 15–16/400 · caption 12–13 · micro 11.
- Saudação destaca o nome no acento (ex.: "Bom dia, **Rui**.").
- Sentence case. Sem ALL CAPS pesado (eyebrows pequenas em uppercase com tracking são ok).

## 4. Forma e espaço
- Raio: cards 16–18px · botões 12–14px · pílulas 999px · steppers 12px.
- Espaçamento base 4 (4/8/12/16/24). Respiro generoso; hairlines em vez de bordas pesadas.
- **Flat:** sem gradientes decorativos pesados nem sombras fortes (o gradiente fica só na marca/anel).

## 5. Componentes-chave (vistos na referência)
- **Bottom nav** (≤5): Hoje · Treino · Corpo · Dieta · Progresso. Ícone outline + label; ativo em teal. *(A referência variou os itens — padronizar nesta lista.)*
- **CTA primário:** preenchido teal, texto escuro, ícone à direita (seta/check). Largura total nos fluxos.
- **Card de treino do dia:** badge da divisão (A/B/C), título, foco, 3 stats com ícone (exercícios · minutos · intensidade).
- **Stepper de série:** `− valor +` para carga (passo 2,5 kg) e reps (passo 1), sem teclado.
- **Anel de descanso:** círculo de progresso + tempo + Pausar/Pular + presets (45/60/90s).
- **Faixa da semana:** S T Q Q S S D em círculos, concluído com check teal.
- **Mapa muscular (Corpo):** **asset anatômico realista** frente+costas, colorido pelos 4 estados de recuperação + legenda; "toque num grupo para detalhes". (Asset licenciado/lib — não desenhar à mão; alimentado pelo vocabulário `muscle` do PLAN_SCHEMA.)
- **Import do plano:** abas Arquivo / Colar texto · dropzone (.json/.txt) · prévia · erro claro · selo "importação local e privada".
- **Relatório/export:** cards de resumo (treinos · nutrição · meta) + checklist + "Gerar e exportar relatório" (ciclo fechado).
- **Gráfico de tendência:** linha suave (peso), rótulo de variação no período (ex.: ↓1,8 kg). Sem dramatizar oscilação.
- **Macros do dia:** barras Proteínas/Carboidratos/Gorduras. **Refeições:** marcar como feita.
- **Como fazer:** passos + dicas técnicas + **alternativas (equipamento ocupado)** com selo "Semelhante/Alternativa".

## 6. Imagens e assets
- **Fotos de exercício** (execução real) no Modo treino e "Como fazer" — sourcing: banco aberto (free-exercise-db) ou licenciado; fallback "ver vídeo".
- **Corpo anatômico** = asset licenciado (ex.: CodeCanyon/Figma Human Anatomy) ou lib (react-muscle-highlighter/body-muscles) colorível por grupo.
- **Fotos de progresso** do usuário (local, privadas) com comparação antes/depois.

## 7. Reconciliações com as decisões (importante)
1. **Sync:** uma das telas de referência cita "sincronizado em todos os dispositivos". No **v1 isto NÃO existe** (ADR-001: local-first, sem conta). Sync = Fase 2. A referência correta é "100% local · funciona offline".
2. **Presets de descanso:** referência mostra 60/90/120s; nosso default era 45/60/90s — definir na implementação (configurável).
3. **Itens do bottom nav** variaram entre as telas — padronizar (seção 5).

## 8. Voz/microcopy
Calma, humana, anti-culpa: "Foco hoje, evolução sempre.", "Consistência é o que gera mudança.", "Progresso sem culpa.", "Seus dados, só seus." Erros explicam o que houve e o que fazer.
