# Atualização do gerador para o PLAN_SCHEMA 1.1

> **Para quê:** o app já entende o schema **1.1** (dicas técnicas, dica rápida e foto explícita do
> exercício), mas quem **produz** o plano é o gerador externo (seu GPT de anamnese). Sem atualizar as
> instruções do gerador, esses campos simplesmente não vêm — o app degrada de forma graciosa, mas
> você perde o recurso. Este doc é o material **pronto para colar** nas instruções do seu GPT.
> Base: `PLAN_SCHEMA.md §3.6.2` + `DECISIONS.md ADR-005`.

## O que mudou (1.0 → 1.1, retrocompatível)

Dentro de cada `howTo` (do exercício **e** de cada variação), três campos novos, todos **opcionais**:

- `tips: string[]` — 2 a 4 **dicas técnicas** curtas de execução.
- `quickTip: string` — **uma** frase memorável (a "sacada" do movimento).
- `mediaId: string` — **id exato** de um exercício do `free-exercise-db` (a foto). **Só use ids do
  catálogo abaixo** — id inventado dá 404 e cai no placeholder.

Planos 1.0 continuam válidos. Ao adotar os campos, mude `schemaVersion` para `"1.1"`.

---

## Instruções para colar no gerador (GPT)

> Copie o bloco abaixo para as instruções do seu GPT gerador de planos.

```
Você gera planos no formato PLAN_SCHEMA 1.1. Regras dos exercícios:

1) schemaVersion = "1.1".

2) Para CADA exercício e CADA variação, em howTo:
   - "steps": 2–4 passos objetivos (já obrigatório).
   - "tips": 2–4 dicas técnicas curtas (postura, respiração, erro comum). Linguagem de
     treinador, direta, sem culpa. Ex.: ["Ative as escápulas antes de iniciar.",
     "Cotovelos próximos ao corpo.", "Amplitude total com controle."]
   - "quickTip": UMA frase, a sacada do movimento. Ex.: "Pense em puxar os cotovelos
     para os bolsos. Menos braço, mais costas."

3) Escolha os exercícios PREFERENCIALMENTE do CATÁLOGO oficial (abaixo). Ao usar um item
   do catálogo, copie EXATAMENTE o par:
   - "name" = o nome PT do catálogo,
   - "equipment" = o equipment do catálogo,
   - "howTo.mediaId" = o mediaId do catálogo (copiar literal, com maiúsculas/underscores/hífens).
   Se precisar de um exercício que NÃO está no catálogo, pode usá-lo, mas OMITA o mediaId
   (não invente id) — o app resolve a foto pelo nome quando conhece, senão mostra "ver vídeo".

4) Músculos (primaryMuscles/secondaryMuscles) SEMPRE do vocabulário exato:
   chest, upper_back, lats, traps, lower_back, front_delts, side_delts, rear_delts,
   biceps, triceps, forearms, abs, obliques, glutes, quads, hamstrings, adductors,
   abductors, calves, neck.
   Atribua os músculos corretos do MOVIMENTO (ex.: supino → primary [chest],
   secondary [triceps, front_delts]). Cada exercício precisa de ≥1 primário.

5) equipment SEMPRE do vocabulário exato:
   barbell, dumbbell, machine, cable, bodyweight, band, kettlebell, other.

6) Cada exercício precisa de ≥2 variações (alternatives), de preferência mudando o
   equipment (barra → halter → peso do corpo/elástico), cada uma com seu howTo.
```

---

## Exemplo de exercício 1.1 (few-shot — cole também no gerador)

```json
{
  "id": "supino_reto",
  "name": "Supino reto",
  "equipment": "barbell",
  "sets": 4,
  "reps": "6-10",
  "load_kg": 60,
  "rest_s": 120,
  "effortTarget": 8,
  "primaryMuscles": ["chest"],
  "secondaryMuscles": ["triceps", "front_delts"],
  "howTo": {
    "steps": [
      "Deite no banco com os pés firmes no chão.",
      "Pegada um pouco mais larga que os ombros.",
      "Desça a barra até o peito e empurre sem travar o cotovelo."
    ],
    "tips": [
      "Ative as escápulas antes de tirar a barra.",
      "Pés firmes no chão o tempo todo.",
      "Desça a barra até a linha do peito, com controle."
    ],
    "quickTip": "Imagine empurrar o chão com os pés enquanto sobe a barra.",
    "mediaId": "Barbell_Bench_Press_-_Medium_Grip"
  },
  "alternatives": [
    {
      "id": "supino_halteres",
      "name": "Supino reto com halteres",
      "equipment": "dumbbell",
      "primaryMuscles": ["chest"],
      "howTo": {
        "steps": ["Mesma execução, com halteres — mais amplitude."],
        "mediaId": "Dumbbell_Bench_Press"
      }
    },
    {
      "id": "flexao",
      "name": "Flexão de braço",
      "equipment": "bodyweight",
      "primaryMuscles": ["chest"],
      "howTo": {
        "steps": ["Corpo reto, desça controlando.", "Para casa / sem equipamento."],
        "mediaId": "Pushups"
      }
    }
  ]
}
```

---

## Catálogo oficial de exercícios (name → equipment → mediaId)

> 76 exercícios; **todos os `mediaId` verificados contra o `free-exercise-db`** (0 quebrados).
> Fonte: github.com/yuhonas/free-exercise-db (Unlicense). Para adicionar exercícios, pegue o `id`
> da pasta `exercises/<id>/` do repositório e valide antes.
### Peito

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Supino reto | barbell | `Barbell_Bench_Press_-_Medium_Grip` |
| Supino inclinado | barbell | `Barbell_Incline_Bench_Press_-_Medium_Grip` |
| Supino reto com halteres | dumbbell | `Dumbbell_Bench_Press` |
| Supino inclinado com halteres | dumbbell | `Hammer_Grip_Incline_DB_Bench_Press` |
| Supino máquina | machine | `Machine_Bench_Press` |
| Supino no Smith | machine | `Smith_Machine_Bench_Press` |
| Crucifixo com halteres | dumbbell | `Dumbbell_Flyes` |
| Voador (peck deck) | machine | `Butterfly` |
| Crossover | cable | `Cable_Crossover` |
| Flexão de braço | bodyweight | `Pushups` |

### Costas

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Puxada frontal | cable | `Wide-Grip_Lat_Pulldown` |
| Puxada frontal (amplitude total) | cable | `Full_Range-Of-Motion_Lat_Pulldown` |
| Puxada fechada (triângulo) | cable | `Close-Grip_Front_Lat_Pulldown` |
| Barra fixa | bodyweight | `Pullups` |
| Barra fixa supinada | bodyweight | `Chin-Up` |
| Remada curvada | barbell | `Bent_Over_Barbell_Row` |
| Remada baixa (sentada) | cable | `Seated_Cable_Rows` |
| Remada unilateral (serrote) | dumbbell | `One-Arm_Dumbbell_Row` |
| Remada cavalinho (T) | barbell | `T-Bar_Row_with_Handle` |
| Encolhimento com barra | barbell | `Barbell_Shrug` |
| Hiperextensão lombar | other | `Hyperextensions_Back_Extensions` |
| Levantamento terra | barbell | `Barbell_Deadlift` |
| Terra romeno | barbell | `Romanian_Deadlift` |
| Stiff | barbell | `Stiff-Legged_Barbell_Deadlift` |
| Bom dia (elástico) | band | `Band_Good_Morning` |

### Ombros

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Desenvolvimento com barra | barbell | `Barbell_Shoulder_Press` |
| Desenvolvimento militar | barbell | `Standing_Military_Press` |
| Desenvolvimento com halteres | dumbbell | `Dumbbell_Shoulder_Press` |
| Desenvolvimento sentado | dumbbell | `Seated_Dumbbell_Press` |
| Desenvolvimento Arnold | dumbbell | `Arnold_Dumbbell_Press` |
| Desenvolvimento máquina | machine | `Machine_Shoulder_Military_Press` |
| Elevação lateral | dumbbell | `Side_Lateral_Raise` |
| Elevação frontal (halteres) | dumbbell | `Front_Dumbbell_Raise` |
| Elevação frontal (cabo) | cable | `Front_Cable_Raise` |
| Crucifixo inverso | dumbbell | `Reverse_Flyes` |
| Voador invertido | machine | `Reverse_Machine_Flyes` |
| Remada alta (unilateral) | dumbbell | `Dumbbell_One-Arm_Upright_Row` |
| Face pull | cable | `Face_Pull` |

### Bíceps

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Rosca direta | barbell | `Barbell_Curl` |
| Rosca alternada | dumbbell | `Dumbbell_Alternate_Bicep_Curl` |
| Rosca martelo | dumbbell | `Alternate_Hammer_Curl` |
| Rosca martelo na corda | cable | `Cable_Hammer_Curls_-_Rope_Attachment` |
| Rosca scott | barbell | `Preacher_Curl` |
| Rosca scott máquina | machine | `Machine_Preacher_Curls` |
| Rosca concentrada | dumbbell | `Concentration_Curls` |
| Rosca inclinada | dumbbell | `Alternate_Incline_Dumbbell_Curl` |

### Tríceps

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Tríceps pulley | cable | `Triceps_Pushdown` |
| Tríceps na corda | cable | `Triceps_Pushdown_-_Rope_Attachment` |
| Tríceps testa (cabo) | cable | `Cable_Lying_Triceps_Extension` |
| Tríceps francês | dumbbell | `Standing_Dumbbell_Triceps_Extension` |
| Tríceps overhead (corda) | cable | `Cable_Rope_Overhead_Triceps_Extension` |
| Supino fechado | barbell | `Close-Grip_Barbell_Bench_Press` |
| Paralelas | bodyweight | `Dips_-_Triceps_Version` |
| Mergulho no banco | bodyweight | `Bench_Dips` |

### Pernas e glúteos

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Agachamento livre | barbell | `Barbell_Squat` |
| Agachamento frontal | barbell | `Front_Barbell_Squat` |
| Agachamento com halteres | dumbbell | `Dumbbell_Squat` |
| Agachamento goblet | kettlebell | `Goblet_Squat` |
| Leg press | machine | `Leg_Press` |
| Cadeira extensora | machine | `Leg_Extensions` |
| Mesa flexora | machine | `Lying_Leg_Curls` |
| Cadeira flexora | machine | `Seated_Leg_Curl` |
| Afundo com barra | barbell | `Barbell_Lunge` |
| Afundo com halteres | dumbbell | `Dumbbell_Lunges` |
| Elevação pélvica (hip thrust) | barbell | `Barbell_Hip_Thrust` |
| Ponte de glúteo | barbell | `Barbell_Glute_Bridge` |
| Cadeira abdutora | machine | `Thigh_Abductor` |
| Cadeira adutora | machine | `Thigh_Adductor` |
| Panturrilha em pé | machine | `Standing_Calf_Raises` |
| Panturrilha sentado | machine | `Seated_Calf_Raise` |
| Panturrilha no leg press | machine | `Calf_Press_On_The_Leg_Press_Machine` |

### Core

| Exercício (PT) | equipment | mediaId |
|---|---|---|
| Abdominal (crunch) | bodyweight | `Crunches` |
| Prancha | bodyweight | `Plank` |
| Rotação russa (russian twist) | bodyweight | `Russian_Twist` |
| Elevação de pernas | bodyweight | `Bent-Knee_Hip_Raise` |
| Abdominal bicicleta | bodyweight | `Air_Bike` |
