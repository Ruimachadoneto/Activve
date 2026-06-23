# Activve — Contrato do relatório de progresso (Report File)

> **Direção de SAÍDA do contrato plan-file.** O app exporta este arquivo; o **Artifact/gerador o re-ingere** para analisar e produzir o próximo plano (`PLAN_SCHEMA`). Fecha o ciclo de coaching.
> Formato: **JSON** versionado (parseável pela máquina) + o app também renderiza um **resumo legível** (Markdown) que o usuário pode ler/colar.

## 1. Princípios
- **Versionado** (`schemaVersion`); o Artifact rejeita/migra versão que não entende.
- **Honesto:** reporta só o que foi registrado; período com pouco dado gera relatório enxuto, nunca inventado.
- **Rastreável:** carimba `refersToPlanId` + `period` — o Artifact sabe sobre qual plano e janela está raciocinando.
- **Casável:** usa os mesmos `exercise.id` / `meal.id` / `muscle` do `PLAN_SCHEMA` (continuidade).
- **Privado:** export é ação explícita do usuário; nada sai do aparelho sem ele mandar.

## 2. Estrutura
```
ReportFile
├─ schemaVersion     "1.0"
├─ meta              reportId, generatedAt, app, locale, refersToPlanId, period{from,to}
├─ adherence         treinos feitos/agendados, % refeições marcadas, dias ativos
├─ training          resumo por exercício + volume por músculo + flags (dor/pulado)
├─ body              peso (início/atual/tendência) + medidas (delta)
├─ goal              tipo, alvo, atual, ritmo vs. alvo
├─ diet              % adesão + observações
└─ userNotes?        texto livre do usuário para o coach
```

## 3. Campos

### 3.1 `meta`
| campo | tipo | nota |
|---|---|---|
| `reportId` | string | id único do relatório |
| `generatedAt` | ISO 8601 | quando exportou |
| `app` | string | `activve@<versão>` |
| `locale` | string | `pt-BR` |
| `refersToPlanId` | string | `meta.planId` do plano vigente |
| `period` | `{ from, to }` (ISO date) | janela coberta (ex.: o mês) |

### 3.2 `adherence`
`{ workoutsScheduled:int, workoutsCompleted:int, workoutsPartial:int, mealsCheckedPct:0-100, activeDays:int, totalDays:int }`
> **Anti-culpa:** números descritivos, sem linguagem de fracasso. O Artifact interpreta; o app não julga.

### 3.3 `training`
```
training
├─ exercises[]
│  ├─ exerciseId     string (casa com o plano)
│  ├─ name           string
│  ├─ sessions       int (vezes treinado no período)
│  ├─ totalSets      int
│  ├─ bestSet        { load_kg?, reps }      (melhor do período)
│  ├─ lastSet        { load_kg?, reps, effort? }
│  ├─ est1RM_kg?     number (estimativa, se houver carga)
│  └─ trend          enum: up | flat | down   (carga/volume no período)
├─ volumeByMuscle[]  { muscle, sets, volume_kg? }   (deriva de primary/secondaryMuscles)
└─ flags[]           { exerciseId, type: pain|skipped|swapped, note? }
```

### 3.4 `body`
```
body
├─ weight      { start_kg?, latest_kg?, trend: up|flat|down, samples:int }
└─ measures[]  { key (waist|hip|...), start_cm?, latest_cm?, delta_cm? }
```
> Peso reportado como **tendência + amostras**, não um número solto (alinhado ao anti-culpa).

### 3.5 `goal`
`{ type, targetWeight_kg?, currentWeight_kg?, targetDate?, paceVsTarget: ahead|on_track|behind|na, note? }`

### 3.6 `diet`
`{ adherencePct:0-100, notes? }` — v1 mede adesão (refeições marcadas), não diário alimentar.

### 3.7 `userNotes?`
Texto livre do usuário pro coach ("senti dor no ombro no supino", "viajei 1 semana"). Escapado ao exibir.

## 4. Versão e round-trip
- `1.x` aditivo retrocompatível. O Artifact e o app evoluem juntos: campo novo no relatório → o gerador passa a usá-lo; campo novo no plano → o app passa a renderizar.
- O Artifact recebe `ReportFile` + (opcional) o `PLAN_SCHEMA` vigente e devolve um **novo PlanFile** — preservando `exercise.id` quando o exercício continua, para a continuidade de histórico.

## 5. Exemplo mínimo (`schemaVersion 1.0`)
```json
{
  "schemaVersion": "1.0",
  "meta": {
    "reportId": "rp_2026_06",
    "generatedAt": "2026-06-30T20:00:00Z",
    "app": "activve@0.1.0",
    "locale": "pt-BR",
    "refersToPlanId": "pl_2026_06_ana",
    "period": { "from": "2026-06-01", "to": "2026-06-30" }
  },
  "adherence": {
    "workoutsScheduled": 13, "workoutsCompleted": 11, "workoutsPartial": 1,
    "mealsCheckedPct": 78, "activeDays": 14, "totalDays": 30
  },
  "training": {
    "exercises": [
      {
        "exerciseId": "goblet_squat",
        "name": "Agachamento goblet",
        "sessions": 4, "totalSets": 12,
        "bestSet": { "load_kg": 16, "reps": 12 },
        "lastSet": { "load_kg": 16, "reps": 10, "effort": 8 },
        "est1RM_kg": 22,
        "trend": "up"
      }
    ],
    "volumeByMuscle": [
      { "muscle": "quads", "sets": 24, "volume_kg": 4200 },
      { "muscle": "glutes", "sets": 20 }
    ],
    "flags": [
      { "exerciseId": "goblet_squat", "type": "pain", "note": "joelho no fim da série" }
    ]
  },
  "body": {
    "weight": { "start_kg": 72.0, "latest_kg": 70.6, "trend": "down", "samples": 9 },
    "measures": [ { "key": "waist", "start_cm": 80, "latest_cm": 77, "delta_cm": -3 } ]
  },
  "goal": {
    "type": "lose_fat", "targetWeight_kg": 65, "currentWeight_kg": 70.6,
    "targetDate": "2026-09-30", "paceVsTarget": "on_track"
  },
  "diet": { "adherencePct": 78, "notes": "Fins de semana mais difíceis." },
  "userNotes": "Senti dor leve no joelho no agachamento; ombro ok."
}
```
