# Activve — Design System v2

> **Direção visual v2 aprovada pelo usuário em 2026-07-28**: registros **A (Instrumento) +
> B (Imersivo) + C (Editorial)**, com número-herói derivado da **prontidão muscular**.
> Substitui a v1 ("Soft Tech Minimal" starter, 2026-06-22), que continua válida no que não for
> contrariado aqui — a paleta base e a marca são herdadas.
> Benchmark que fundamenta esta direção: `docs/ai/BENCHMARK_VISUAL_2026-07.md`.
> Política que governa: `docs/ai/VISUAL_QUALITY.md`.

---

## 0. A regra que segura tudo: registros, não estilos

O usuário escolheu as três direções. Elas **não são três estilos convivendo** — isso produziria
identidade difusa, que é o risco registrado no momento da decisão. São **três registros de uma
identidade só**, e o registro é escolhido pela **tarefa do usuário**, nunca por gosto:

| Registro | Onde vale | Tarefa do usuário | Densidade |
|---|---|---|---|
| **A · Instrumento** | Hoje, Corpo, Relatórios, Mais | Decidir e entender ("devo treinar? estou evoluindo?") | Alta |
| **B · Imersivo** | Modo Treino (`/treino`) e só ele | Executar sob esforço, entre séries | Baixa, alto contraste |
| **C · Editorial** | Como fazer, Import, PDF/impressão, estados vazios/erro/onboarding | Ler e absorver | Média, tipografia protagonista |

### Invariantes (idênticos nos três registros — é isto que faz ser um app só)
1. **Paleta e semântica de cor** — as mesmas em todo lugar. Cor nunca é decorativa (§2).
2. **Família e escala tipográfica** — a mesma; muda o *tamanho* usado, nunca a fonte (§3).
3. **Grid de espaçamento e raios** — os mesmos (§4).
4. **Modelo de elevação** — o mesmo (§5).
5. **Vocabulário de movimento** — mesmas durações e curvas (§6).
6. **Voz** — calma, anti-culpa, específica (§10).

**Teste de conformidade:** se duas telas de registros diferentes, lado a lado, parecerem de apps
diferentes, o registro foi aplicado errado — o que muda é densidade e protagonismo, não identidade.

---

## 0.1 Direção v3 "Vivid" (2026-07-29 — decisão do usuário)

O usuário liberou explicitamente os limites de sobriedade da política visual ("não precisa se
limitar ao padrão exigido na documentação") para um upgrade de imersividade. A partir daqui:

**Liberado, com propósito:**
- Atmosfera de luz no canvas (radial-gradients fixos, teal + azul profundo, ≤9% de opacidade).
- Relevo em cards (`.card-lift`: gradiente sutil + fio de luz superior).
- Brilho ambiente no E3 (`.elev-focus` agora emite luz) e no gauge (drop-shadow da cor semântica).
- Gradiente de texto no momento de assinatura (`.text-grad-accent` — nome na saudação).
- Nav flutuante com blur (`BottomNav` em pílula fixa).
- Palco no Modo Treino: foto do exercício desfocada como atmosfera do topo.
- Entrada coreografada (`.stagger` por nth-child).

**Continua NÃO negociável (o usuário liberou estética, não integridade):**
- Honestidade de dados (§9; sem número fabricado, kcal parcial marcada, etc.).
- Anti-culpa, arquitetura plan-file (app não prescreve), acessibilidade (reduced-motion,
  contraste, aria) e o teto de 1 E3 por tela — brilho em tudo é brilho em nada.

## 1. Marca
- **Nome:** Activve. Logo: "A" estilizado (pico/seta) + wordmark.
- **Tagline:** "Seu plano. Seu ritmo. Resultados consistentes."
- **Personalidade:** calmo, confiável, premium, humano, **anti-culpa**. Privado por padrão.
- **Tese visual v2:** *instrumento de precisão que respeita quem o usa*. Premium por exatidão,
  legibilidade e movimento com propósito — nunca por decoração.

---

## 2. Cor — semântica estrita

Herdadas da v1 (não mudam):

**Superfícies:** `--color-bg` #0A1422 · `--color-surface` #101D2E · `--color-surface2` #16263A
**Texto:** `--color-ink` #EAF1F8 · `--color-muted` #8B97A8 · `--color-faint` #5C6878
**Acento:** `--color-accent` #2FD4B6 · `--color-accent-press` #25B89D · `--color-on-accent` #03251F
**Recuperação:** `--color-worked` #F2854A · `--color-recovering` #F2C94C · `--color-ready` #2FD4B6 · `--color-rested` #6B7688

### 2.1 A regra nova: toda matiz carrega significado

O problema da v1 é que o teal fazia **tudo** — acento de marca, CTA, sucesso, "pronto",
destaque de nome, linha de gráfico. Sem vocabulário, nada se destaca. A partir da v2:

| Matiz | Significa, e só isso |
|---|---|
| **Teal** (`accent`) | Ação disponível agora + estado "pronto/recuperado". É a cor do **poder de agir**. |
| **Âmbar** (`recovering`/`warn`) | Em processo, parcial, atenção sem urgência. Nunca erro. |
| **Laranja** (`worked`) | Trabalhado/carga recente. É informação, **não** alerta. |
| **Vermelho** (`danger`) | Só falha real e ação destrutiva. Nunca performance, nunca "você faltou". |
| **Cinza** (`rested`/`faint`) | Neutro, inativo, ausência de dado. |

**Proibido:** usar teal como "enfeite" em texto que não é ação nem estado pronto. Se tudo é teal,
teal não significa nada — foi exatamente esse o diagnóstico de monotonia.

### 2.2 Cor de dado (dataviz)
Séries de gráfico usam a **mesma** semântica: a série principal em teal, comparação/meta em cinza
tracejado, marcos (recorde) em âmbar. Nunca introduzir matiz nova só para diferenciar série —
se precisar de mais de 3 séries, o gráfico está errado.

---

## 3. Tipografia

- Família: a atual (Geist Sans). **Dois pesos: 400 e 500.** Nunca 600/700.
- Sentence case. Eyebrows pequenas em uppercase com tracking (`0.06em`) são permitidas.

### 3.1 Escala (v2 — ganha o degrau de display)

| Papel | Tamanho/peso | Onde |
|---|---|---|
| **Métrica-herói** | 44–56 / 500, numerais **proporcionais**, `line-height: 1` | Número-herói (A), carga no treino (B) |
| Display | 30–34 / 500 | Título editorial (C) |
| H1 | 22–26 / 500 | Título de tela |
| H2 | 18 / 500 | Título de seção |
| Corpo | 15–16 / 400, `line-height: 1.6` | Texto |
| Caption | 12–13 / 400 | Apoio |
| Eyebrow/micro | 10–11 / 400, uppercase, tracking `0.06em` | Rótulo de seção |

### 3.2 Regra dos numerais (corrigida em 2026-07-28)

`tabular-nums` **só onde números se alinham verticalmente**: ticks de eixo, colunas de tabela,
listas de séries, cronômetro (evita o texto "pular" a cada segundo).

**Não usar em número grande e isolado** — número-herói, valor de card de métrica, carga em
destaque. Dígitos de largura fixa dão a todo algarismo a largura do `0`, e em tamanho display isso
faz um `121` parecer frouxo e mal espaçado. Ali valem os numerais proporcionais da fonte.

> Correção honesta: a v2 deste documento dizia "todo número que representa medida usa
> `tabular-nums`". Estava errado, e a regra certa é a acima. Pego ao aplicar o guia de dataviz na
> TASK-021, antes de o erro se espalhar pelas telas.

---

## 4. Forma e espaço
- Raio: cards `--radius-card` 16px · botões 12px · pílulas 999px · chips 8px.
- Espaçamento base 4 (4/8/12/16/24/32).
- Alvo de toque mínimo **44×44px** (já praticado).
- Largura de conteúdo: `max-w-[440px]` centralizado (mobile-first, já praticado).

---

## 5. Elevação — o que faltava

Diagnóstico: hoje **todo** card é `bg-surface` + `border-line`. Sem hierarquia, a tela vira uma
lista plana de retângulos iguais — causa direta da sensação de monotonia.

| Nível | Composição | Uso |
|---|---|---|
| **E0 — canvas** | `bg-bg` | Fundo da página |
| **E1 — repouso** | `bg-surface` + hairline `border-line` | Card informativo padrão |
| **E2 — destaque** | `bg-surface2` + hairline | Bloco que pede atenção dentro de um E1; inputs |
| **E3 — foco** | `bg-surface` + borda `accent/30` + halo suave | O card principal da tela. **Máximo 1 por tela.** |
| **E4 — flutuante** | `bg-surface2` + sombra difusa | Bottom sheet, overlay de descanso, menu |

**Regra:** uma tela tem no máximo **um** E3. Se dois blocos disputam foco, a hierarquia está errada.
Sombra só em E4 (elemento que realmente flutua) — em E1/E2/E3 a separação é por superfície e
hairline, respeitando a proibição de sombra decorativa da §6 da política.

---

## 6. Movimento — a camada que carrega a personalidade

Hoje o app tem **duas** animações no total. A meta não é animar tudo: é a **regra 80/20** —
~80% das interações invisíveis e fluidas, ~20% (as de alto valor) celebratórias.

### 6.1 Tokens de movimento
```
--dur-instant: 90ms    /* feedback de toque */
--dur-fast:   160ms    /* mudança de estado, hover, chip */
--dur-base:   240ms    /* entrada de elemento, transição de aba */
--dur-slow:   420ms    /* entrada de tela, revelação de dado */
--ease-out:      cubic-bezier(0.22, 1, 0.36, 1)     /* padrão: sai rápido, assenta */
--ease-snap:     cubic-bezier(0.3, 0, 0.2, 1)       /* controles */
--ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1) /* SÓ celebração */
```

### 6.2 Onde há movimento (e onde não)
- **Sempre:** entrada de tela (fade+rise 8px), troca de aba, aparecimento de card, contagem de
  número-herói (count-up), preenchimento de gráfico (desenho da linha da esquerda p/ direita).
- **Celebração (os 20%):** concluir série, concluir treino, **bater recorde pessoal**, músculo
  passar a "pronto". Usa `--ease-overshoot` + háptica (`navigator.vibrate`, já disponível).
- **Nunca:** movimento que atrase uma ação, loop infinito que compita com o conteúdo, animar
  durante rolagem, ou animação que o usuário precise esperar para agir.
- **`prefers-reduced-motion`:** todas as animações degradam para opacidade ou nada. Obrigatório —
  a UI deve funcionar 100% sem depender de animação (checklist §14 da política).

---

## 7. Dataviz — regras (o maior salto de percepção)

Diagnóstico registrado no benchmark: `preserveAspectRatio="none"` distorce traço e pontos; sem
eixo, sem rótulo, sem número legível; ponto em toda amostra; sem estado vazio.

**Regras obrigatórias para todo gráfico do Activve:**
0. **Um gráfico, um componente.** Todo gráfico de linha do app é `LineChart` — não duplicar SVG
   por tela (foi o que permitiu os mesmos defeitos existirem em dois lugares por meses).
1. **Nunca** `preserveAspectRatio="none"`. Escala uniforme, sempre.
2. **Todo gráfico mostra pelo menos um número legível** — valor atual em destaque, e min/máx no eixo.
3. **Eixo de referência discreto** (hairline) + rótulo do período. O usuário precisa saber "de
   quando até quando".
4. **Área preenchida sutil** sob a linha (opacidade baixa do acento) — dá corpo sem virar enfeite.
5. **Ponto só onde importa:** último valor, recorde, e o ponto sob interação. Nunca em todos.
6. **Interação:** tocar/arrastar revela valor e data daquele ponto (scrub). Em gráfico de leitura
   passiva (PDF), sem interação.
7. **Estados obrigatórios:** sem dado ("registre 2 medidas para ver a tendência"), 1 ponto só
   (mostra o valor, sem linha), muitos pontos (agrega, não empilha).
8. **Anti-culpa:** nunca dramatizar oscilação. Escala não começa no zero se isso exagerar variação
   normal; queda de peso não é "vermelho".
9. **Impressão:** herda `.report-print` (já existe) — tinta legível em papel branco.

---

## 8. Componentes-chave (atualizações v2)

Mantidos da v1: bottom nav, CTA primário, stepper de série, faixa da semana, mapa muscular,
import, "como fazer" com alternativas.

**Novos / revisados:**
- **Número-herói (A):** eyebrow + numeral 44–56 tabular + rótulo qualitativo em cor semântica +
  barra de segmentos. Deriva de **prontidão muscular** (`recovery.ts`) — ver §9.
- **Card de série em foco (B):** foto em bleed como palco, carga/reps em numeral grande, CTA único.
- **Selo de recorde:** aparece in-workout ao bater PR, com overshoot + háptica. Some sozinho.
- **Centro de avisos (sino):** substitui o sino morto. Avisos derivados do que o app já sabe
  localmente — músculo pronto, treino do dia pendente, medida sem registro há X dias, plano antigo.
  Sem Service Worker, sem backend. **Se não há aviso, o sino não mostra bolinha.**
- **Gráfico de linha v2:** conforme §7.

---

## 9. O número-herói: prontidão muscular (decisão de honestidade)

**Fonte:** `src/lib/plan/recovery.ts` — heurística já implementada e testada (estados
`worked/recovering/ready/rested` por músculo, a partir de séries concluídas, RPE e volume).

**Cálculo:** cobertura de recuperação dos músculos que o **treino de hoje** exige — quanto do que
você vai usar está pronto.

**Regras de honestidade (não negociáveis):**
- **Não é um score de saúde.** O Activve não tem HRV, sono nem frequência cardíaca. Rotular como
  "prontidão" (do músculo) e nunca como "recuperação corporal", "readiness" ou algo que sugira
  biometria.
- **Sem plano ou sem histórico → não exibe número.** Mostra o estado vazio, nunca um número
  fabricado. (Mesmo princípio dos testes de "honestidade do v1" em `report.ts`.)
- **Nunca é nota do usuário.** É estado do corpo, não desempenho. Número baixo diz "hoje pede
  leveza", não "você falhou" — anti-culpa.

---

## 10. Voz/microcopy
Calma, humana, específica, anti-culpa. Erros explicam o que houve e o que fazer.
Proibido: "Algo deu errado", "Clique aqui", placeholder genérico, jargão, exclamação em copy de
sistema. Celebração é específica ("62,5 kg — seu melhor no supino"), nunca genérica ("Parabéns!").

---

## 11. Reconciliações herdadas (v1, ainda válidas)
1. **Sync não existe no v1** (ADR-001: local-first, sem conta). Copy correta: "100% local · funciona offline".
2. **Presets de descanso:** configurável; inclui o `rest_s` do exercício (já implementado).
3. **Bottom nav padronizado:** Hoje · Treino · Corpo · Mais (estado atual do app).
