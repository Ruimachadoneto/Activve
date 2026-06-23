# Activve — Contrato do arquivo de plano (Plan File)

> **Artefato central do projeto.** É a "API" entre o gerador (anamnese) e o app.
> Formato: **JSON** validado por schema (Zod, na implementação). Este doc é a fonte de verdade do formato; a TASK que implementar o import cria o Zod a partir daqui.

## 1. Princípios
- **Versionado:** todo arquivo declara `schemaVersion`. O app aceita uma faixa conhecida; versão desconhecida → erro claro, nunca "adivinhar".
- **Validável:** todo campo tem tipo, obrigatoriedade e faixa. Import inválido falha com mensagem acionável.
- **Estável para histórico:** `id`s de exercício e refeição são estáveis, para casar progresso entre planos diferentes (continuidade).
- **Entrada não confiável:** o app valida ranges e **escapa** todo texto renderizado (anti-XSS). Limite de tamanho do arquivo.
- **Extensível sem quebrar:** campos novos opcionais não exigem nova major. Campos/semântica que quebram → nova major.

## 2. Estrutura (visão geral)
```
PlanFile
├─ schemaVersion        "1.0"  (string semver "major.minor")
├─ meta                 geração: generatedAt, generator, locale, planId
├─ profile              anamnese: sexo, idade, altura, peso, ambiente, disponibilidade...
├─ goal                 objetivo: tipo, alvo, data-alvo, ritmo
├─ targets?             métricas-alvo opcionais (medidas)
├─ training             split + agenda semanal + lista de treinos (workouts → exercises → sets)
└─ diet                 kcal/macros do dia + refeições (meals → items)
```

## 3. Campos

### 3.1 `schemaVersion` (obrigatório)
`"major.minor"`. v1 = `"1.0"`. App v1 aceita `1.x`; rejeita `>= 2.0` pedindo gerador atualizado.

### 3.2 `meta` (obrigatório)
| campo | tipo | regra |
|---|---|---|
| `planId` | string | id único do plano (uuid/slug). Usado para versão/continuidade. |
| `generatedAt` | string (ISO 8601) | data de geração. |
| `generator` | string | nome/versão do gerador (auditoria). |
| `locale` | string | ex.: `pt-BR`. |

### 3.3 `profile` (obrigatório) — saída da anamnese
| campo | tipo | regra |
|---|---|---|
| `name` | string? | opcional, ≤ 60 chars. |
| `sex` | enum | `male` \| `female` \| `other`. |
| `age` | int | 12–100. |
| `height_cm` | number | 100–250. |
| `weight_kg` | number | 30–300. |
| `environment` | enum | `home` \| `gym` \| `both`. |
| `daysPerWeek` | int | 1–7. |
| `sessionMinutes` | int? | 10–180. |
| `experience` | enum | `beginner` \| `intermediate` \| `advanced`. |
| `restrictions` | string[]? | lesões/limitações (texto curto, escapado). |
| `notes` | string? | livre, ≤ 1000 chars. |

### 3.4 `goal` (obrigatório)
| campo | tipo | regra |
|---|---|---|
| `type` | enum | `lose_fat` \| `gain_muscle` \| `recomp` \| `maintain` \| `performance`. |
| `targetWeight_kg` | number? | 30–300. |
| `targetDate` | string? | ISO date futura. |
| `weeklyRate_kg` | number? | -1.5 a 1.5 (negativo = perder). |
| `summary` | string? | frase do objetivo, ≤ 200. |

### 3.5 `targets?` (opcional) — alvos de medida
Array de `{ key: enum(waist|hip|thigh|arm|chest|...), value_cm: number }`.

### 3.6 `training` (obrigatório)
```
training
├─ split            string   ex.: "ABC", "fullbody", "upper_lower"
├─ weekSchedule     array[7] cada item: workoutId | "rest"  (índice 0 = segunda)
└─ workouts[]       lista de treinos
   ├─ id            string estável  (ex.: "A")
   ├─ name          string
   ├─ focus?        string   ex.: "Peito e tríceps"
   └─ exercises[]
      ├─ id            string ESTÁVEL  (ex.: "bench_press") — chave de histórico
      ├─ name          string
      ├─ mediaId?      string  (id no banco de mídia; resolvido pelo app)
      ├─ instructions? string  (≤ 500, escapado)
      ├─ sets          int 1–20
      ├─ reps          string  ("8-12", "10", "AMRAP")
      ├─ load_kg?      number 0–500  (sugestão inicial; pode faltar p/ casa)
      ├─ rest_s        int 0–600
      ├─ effortTarget? int 6–10 (RPE)
      ├─ primaryMuscles?   muscle[]  (principais — alimenta o MAPA DO CORPO e o volume por grupo)
      ├─ secondaryMuscles? muscle[]  (auxiliares)
      └─ alternatives? [{ id, name, mediaId? }]  (variações do mesmo grupo)
```

**`muscle` (vocabulário fechado)** — usar estes ids estáveis p/ o mapa do corpo e o volume por grupo:
`chest · upper_back · lats · traps · lower_back · front_delts · side_delts · rear_delts · biceps · triceps · forearms · abs · obliques · glutes · quads · hamstrings · adductors · abductors · calves · neck`.
Recuperação no app é **heurística** (ex.: ~48–72h, escalada por volume/esforço), configurável — não promessa científica.

### 3.7 `diet` (obrigatório)
```
diet
├─ dailyKcal?    int 800–6000
├─ macros?       { protein_g, carbs_g, fat_g }  (ints ≥ 0)
├─ meals[]
│  ├─ id         string estável (ex.: "breakfast")
│  ├─ name       string ("Café da manhã")
│  ├─ time?      string ("07:30")
│  ├─ items[]    { food: string, qty?: number, unit?: enum(g|ml|un|colher|...), kcal?: int }
│  └─ notes?     string ≤ 300
├─ shoppingList? string[]   (opcional)
└─ prep?         string[]   (opcional, preparo/dicas)
```

## 4. Regras de validação (resumo)
- Campos obrigatórios presentes; tipos corretos; enums válidos; números dentro das faixas acima.
- `weekSchedule` referencia apenas `workoutId` existentes ou `"rest"`.
- `id`s de workout e exercise únicos dentro do arquivo.
- Todo texto exibível é **escapado** ao renderizar.
- Tamanho do arquivo ≤ (limite a definir, ex.: 512 KB).
- Falha de validação → erro com **campo + motivo** (ex.: `profile.age fora da faixa (12–100)`).

## 5. Continuidade entre planos
- `exercise.id` e `meal.id` estáveis permitem carregar **histórico anterior** (cargas/sessões) ao subir um plano novo.
- `meta.planId` identifica a versão vigente; progresso é gravado referenciando `planId` + `exercise.id`.
- Subir plano novo **não apaga** logs antigos; cria novo "período" e mantém histórico consultável.

## 6. Política de versão
- **1.x:** adições retrocompatíveis (campos opcionais novos). App 1.x ignora campos que não conhece.
- **2.0+:** mudança que quebra. App exige gerador/atualização compatível e oferece migração quando possível.

## 7. Exemplo mínimo válido (`schemaVersion 1.0`)
```json
{
  "schemaVersion": "1.0",
  "meta": {
    "planId": "pl_2026_06_ana",
    "generatedAt": "2026-06-22T18:00:00Z",
    "generator": "activve-anamnese@1.0",
    "locale": "pt-BR"
  },
  "profile": {
    "name": "Ana",
    "sex": "female",
    "age": 30,
    "height_cm": 165,
    "weight_kg": 72,
    "environment": "gym",
    "daysPerWeek": 3,
    "sessionMinutes": 60,
    "experience": "beginner",
    "restrictions": ["joelho sensível"],
    "notes": "Treina à noite."
  },
  "goal": {
    "type": "lose_fat",
    "targetWeight_kg": 65,
    "targetDate": "2026-09-30",
    "weeklyRate_kg": -0.5,
    "summary": "Perder gordura mantendo massa."
  },
  "targets": [
    { "key": "waist", "value_cm": 72 }
  ],
  "training": {
    "split": "ABC",
    "weekSchedule": ["A", "rest", "B", "rest", "C", "rest", "rest"],
    "workouts": [
      {
        "id": "A",
        "name": "Treino A — Inferiores",
        "focus": "Pernas e glúteos",
        "exercises": [
          {
            "id": "goblet_squat",
            "name": "Agachamento goblet",
            "mediaId": "goblet_squat",
            "instructions": "Desça controlando, joelhos alinhados aos pés.",
            "sets": 3,
            "reps": "10-12",
            "load_kg": 12,
            "rest_s": 90,
            "effortTarget": 8,
            "primaryMuscles": ["quads", "glutes"],
            "secondaryMuscles": ["hamstrings", "abs"],
            "alternatives": [
              { "id": "leg_press", "name": "Leg press", "mediaId": "leg_press" }
            ]
          }
        ]
      },
      { "id": "B", "name": "Treino B — Superiores (empurrar)", "exercises": [] },
      { "id": "C", "name": "Treino C — Superiores (puxar)", "exercises": [] }
    ]
  },
  "diet": {
    "dailyKcal": 1700,
    "macros": { "protein_g": 130, "carbs_g": 160, "fat_g": 55 },
    "meals": [
      {
        "id": "breakfast",
        "name": "Café da manhã",
        "time": "07:30",
        "items": [
          { "food": "Ovos mexidos", "qty": 2, "unit": "un", "kcal": 160 },
          { "food": "Pão integral", "qty": 1, "unit": "un", "kcal": 80 }
        ],
        "notes": "Café sem açúcar."
      }
    ],
    "shoppingList": ["Ovos", "Pão integral"],
    "prep": ["Deixar legumes cortados no domingo."]
  }
}
```
