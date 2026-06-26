# Kit de prompts — ilustrações de grupo muscular (Hoje card)

Assets para o slot de ilustração do card "Treino de hoje". Estilo: **mapa muscular** — figura
atlética em tom escuro/apagado, com **o grupo-alvo acendendo no teal da marca**.

## Onde colocar / nomes
Gerar PNG **portrait 2:3 (1024×1536), fundo transparente**. Salvar em:
`public/muscles/<nome>.png`. O código mapeia `workout.focus` → arquivo.

| Prioridade | Arquivo | Vista | Acende |
|---|---|---|---|
| P1 | `costas.png` | costas | dorsais, trapézio, lombar |
| P1 | `peito.png` | frente | peitorais |
| P1 | `pernas.png` | frente (3/4) | quadríceps |
| P1 | `ombros.png` | frente | deltoides (os dois) |
| P2 | `biceps.png` | frente | bíceps (frente do braço) |
| P2 | `triceps.png` | costas (3/4) | tríceps (atrás do braço) |
| P2 | `gluteos.png` | costas | glúteos + posterior de coxa |
| P2 | `abdomen.png` | frente | abdômen / core |
| P3 | `corpo.png` | frente | corpo inteiro levemente aceso |
| P3 | `descanso.png` | frente | nenhum (pose relaxada, rim light suave) |

## Cores (tokens do app)
- Fundo do card: `#101d2e` · Acento (glow): `#2fd4b6` · Corpo apagado: slate-azulado `~#3a4d63`

---

## BLOCO DE ESTILO (cole no início de TODA geração)

```
Anatomical "muscle map" illustration for a premium dark fitness app. A single lean,
athletic, gender-neutral human figure, clean modern 3D render — smooth matte surfaces,
semi-realistic, NOT photorealistic skin, NOT a medical textbook, NOT cartoon.
The whole body is rendered in a muted, desaturated cool slate-blue (around #3a4d63),
softly lit and visible against a dark navy background. EXACTLY ONE muscle group is
highlighted: it glows in vivid teal-green (#2fd4b6) with a soft emissive bloom and teal
rim light, clearly brighter than the rest of the body. Centered figure, portrait 2:3,
full torso plus relevant limbs, head to mid-thigh, calm even lighting, no scene, no props,
no text, no ground shadow. Transparent background (PNG with alpha).
Keep the EXACT same figure, pose, camera, framing, proportions and lighting in every image
— only change which muscle group glows.
```

## PROMPTS POR IMAGEM (bloco de estilo + a linha abaixo)

- **costas.png** — `Back view (figure seen from behind). Highlight: the back — latissimus dorsi, trapezius and lower back glowing in teal.`
- **peito.png** — `Front view. Highlight: the chest — both pectoral muscles glowing in teal.`
- **pernas.png** — `Front 3/4 view. Highlight: the front of the thighs — quadriceps of both legs glowing in teal.`
- **ombros.png** — `Front view. Highlight: both shoulders — left and right deltoids glowing in teal.`
- **biceps.png** — `Front view. Highlight: the front of both upper arms — biceps glowing in teal.`
- **triceps.png** — `Back 3/4 view. Highlight: the back of both upper arms — triceps glowing in teal.`
- **gluteos.png** — `Back view. Highlight: glutes and hamstrings (back of thighs) glowing in teal.`
- **abdomen.png** — `Front view. Highlight: the abdominal core — rectus abdominis and obliques glowing in teal.`
- **corpo.png** — `Front view. Highlight: all major muscle groups softly lit in teal at once (full-body activation), evenly balanced.`
- **descanso.png** — `Front view, relaxed standing pose. No muscle highlighted; whole body in the muted slate tone with a gentle teal rim light only. Calm, restful feel.`

---

## COMPOSIÇÕES POR TIPO DE TREINO (o que a maioria usa)

Treino real combina grupos. Estas imagens acendem **vários músculos juntos**, mapeando os
dias dos splits mais comuns. Use o MESMO bloco de estilo, **trocando** a frase
"EXACTLY ONE muscle group is highlighted" por:
`The muscle groups listed below are highlighted together (all glowing teal); everything else stays muted.`

| Prio | Arquivo | Vista | Acende (juntos) | Cobre |
|---|---|---|---|---|
| P1 | `corpo.png` | frente | todos, suave e uniforme | Full Body |
| P1 | `empurrar.png` | frente | peito + deltoides frontais + tríceps | Push (PPL) |
| P1 | `puxar.png` | costas | dorsais + trapézio + deltoide posterior | Pull (PPL), Costas+Bíceps |
| P1 | `pernas.png` | frente 3/4 | quadríceps (já feita) | Legs |
| P2 | `peito-triceps.png` | frente | peito + tríceps | ABC bro A |
| P2 | `ombro-abdomen.png` | frente | deltoides + abdômen | ABC bro C / dia ombro |
| P3 | `superior.png` | frente | peito + deltoides + bíceps + tríceps | Upper |
| P3 | `posterior.png` | costas | glúteos + posterior de coxa + panturrilha | Lower posterior |
| P3 | `bracos.png` | frente | bíceps + tríceps | dia de Braços |

### Linhas de highlight (bloco de estilo + a linha)
- **corpo.png** — `Front view. Highlight together: all major muscle groups, softly and evenly glowing teal (full-body activation).`
- **empurrar.png** — `Front view. Highlight together: chest (pectorals), front deltoids and triceps glowing teal.`
- **puxar.png** — `Back view (from behind). Highlight together: the back (latissimus dorsi, trapezius) and rear deltoids glowing teal.`
- **peito-triceps.png** — `Front view. Highlight together: chest (pectorals) and triceps glowing teal.`
- **ombro-abdomen.png** — `Front view. Highlight together: both deltoids and the abdominal core glowing teal.`
- **superior.png** — `Front view. Highlight together: chest, both deltoids, biceps and triceps glowing teal (whole upper body).`
- **posterior.png** — `Back view. Highlight together: glutes, hamstrings (back of thighs) and calves glowing teal.`
- **bracos.png** — `Front view. Highlight together: biceps and triceps of both arms glowing teal.`

### Inferiores subdivididos (comum em treino feminino)
Inferior raramente é "perna inteira" — costuma vir em 2+ dias. **Importante:** nas imagens de
perna o enquadramento vai até os **pés** (head to feet), não mid-thigh.

| Prio | Arquivo | Vista | Acende | Cobre |
|---|---|---|---|---|
| P1 | `pernas.png` | frente 3/4 | quadríceps (já feita) | Inferior A / quad day |
| P1 | `gluteos.png` | costas | glúteos (+ leve posterior) | Dia de glúteo (foco feminino) |
| P2 | `posterior.png` | costas | glúteos + posterior de coxa + panturrilha | Inferior B / posterior chain |
| P3 | `panturrilha.png` | costas | panturrilhas | dia/foco de panturrilha |
| P3 | `adutores.png` | frente | adutores (parte interna das coxas) | cadeira adutora / interno |

- **gluteos.png** — `Back view. Full body, head to feet. Highlight: the glutes (gluteus maximus, both sides) glowing teal, with a subtle glow on the upper hamstrings.`
- **posterior.png** — `Back view. Full body, head to feet. Highlight together: glutes, hamstrings (back of thighs) and calves glowing teal.`
- **panturrilha.png** — `Back view. Full body, head to feet. Highlight: both calves (gastrocnemius) glowing teal.`
- **adutores.png** — `Front view. Full body, head to feet. Highlight: the inner thighs (adductors) of both legs glowing teal.`

> Figura: manter **a mesma figura neutra** em todas (o mapa é anatômico, serve pra todo mundo).
> Se um dia quiser um set feminino dedicado, é um conjunto temático à parte — não misturar, pra
> não quebrar a consistência.

### Compromisso honesto (frente × costas)
Cada imagem é **uma vista só**. Dias que misturam frente e costas no mesmo músculo
(ex.: "costas + bíceps" — costas é vista traseira, bíceps é frontal) são representados pela
**vista dominante**: `puxar.png` mostra as costas (como o usuário reconhece "dia de costas"),
sem forçar o bíceps de frente. Se um dia quiser **fidelidade anatômica total**, dá pra evoluir
pra figura **dupla (frente+costas lado a lado)** — fica mais largo, então mudaria o layout do card.

### Mapeamento focus → imagem (eu faço no código)
Resolver por palavra-chave no `focus`/`primaryMuscles`: "empurrar"/peito+ombro+tríceps→`empurrar`;
"puxar"/costas+bíceps→`puxar`; pernas/quadríceps→`pernas`; posterior/glúteo→`posterior`;
peito+tríceps→`peito-triceps`; ombro+abdômen→`ombro-abdomen`; músculo único→a single correspondente;
**fallback**→`corpo`.

## Dicas pra manter consistência no GPT
1. Gere a **costas.png primeiro**. Nas próximas, comece o prompt com:
   `Same figure, pose, camera, framing, style and lighting as the previous image, but now ...`
2. Faça tudo **na mesma conversa** (o modelo mantém o estilo melhor).
3. Peça sempre **"transparent background, PNG with alpha"**. Se sair com fundo, peça
   `solid flat #101d2e background` (também encaixa no card).
4. Portrait/vertical sempre (2:3). Se vier quadrado, peça `portrait 2:3 aspect ratio`.
