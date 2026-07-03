/**
 * Fotos reais de exercício via `free-exercise-db` (github.com/yuhonas/free-exercise-db,
 * Unlicense/domínio público — ADR-004). Cada exercício do dataset tem 2 fotos JPG
 * (posição inicial/final) em URL determinística no raw do GitHub.
 *
 * O plano fala PT-BR ("Puxada frontal") e o dataset EN ("Wide-Grip Lat Pulldown"),
 * então o casamento é por **dicionário curado** sobre o nome normalizado (sem acento,
 * caixa ou pontuação). Sem match → `null` e a UI mantém o placeholder — mostrar a foto
 * de um movimento ERRADO é pior do que não mostrar nenhuma.
 *
 * Módulo puro (sem React/rede aqui); a imagem em si é melhoria progressiva na UI.
 */

const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export type ExerciseMedia = {
  /** Id do exercício no free-exercise-db. */
  sourceId: string;
  /** Fotos (posição inicial e final). */
  imageUrls: [string, string];
};

/** Normaliza para chave de dicionário: minúsculas, sem acentos, sem pontuação, espaços únicos. */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Dicionário curado: nome BR normalizado → id no free-exercise-db.
 * Vários apelidos podem apontar para o mesmo id. Manutenção: adicionar a variação
 * nova aqui (e cobrir com teste) quando um plano usar um nome que não casa.
 */
const PT_TO_ID: Record<string, string> = {
  // ---- Peito ----
  "supino reto": "Barbell_Bench_Press_-_Medium_Grip",
  "supino reto com barra": "Barbell_Bench_Press_-_Medium_Grip",
  "supino inclinado": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "supino inclinado com barra": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "supino com halteres": "Dumbbell_Bench_Press",
  "supino reto com halteres": "Dumbbell_Bench_Press",
  "supino inclinado com halteres": "Hammer_Grip_Incline_DB_Bench_Press",
  "supino maquina": "Machine_Bench_Press",
  "supino no smith": "Smith_Machine_Bench_Press",
  crucifixo: "Dumbbell_Flyes",
  "crucifixo reto": "Dumbbell_Flyes",
  "crucifixo com halteres": "Dumbbell_Flyes",
  "crucifixo maquina": "Butterfly",
  "peck deck": "Butterfly",
  "voador": "Butterfly",
  "crossover": "Cable_Crossover",
  "cross over": "Cable_Crossover",
  "crucifixo no cabo": "Cable_Crossover",
  flexao: "Pushups",
  "flexao de braco": "Pushups",
  "mergulho no banco": "Bench_Dips",
  paralelas: "Dips_-_Triceps_Version",

  // ---- Costas ----
  "puxada frontal": "Wide-Grip_Lat_Pulldown",
  "puxada alta": "Wide-Grip_Lat_Pulldown",
  "puxada aberta": "Wide-Grip_Lat_Pulldown",
  "pulldown": "Full_Range-Of-Motion_Lat_Pulldown",
  "puxada fechada": "Close-Grip_Front_Lat_Pulldown",
  "puxada triangulo": "Close-Grip_Front_Lat_Pulldown",
  "barra fixa": "Pullups",
  "barra fixa supinada": "Chin-Up",
  "remada curvada": "Bent_Over_Barbell_Row",
  "remada curvada com barra": "Bent_Over_Barbell_Row",
  "remada baixa": "Seated_Cable_Rows",
  "remada sentada": "Seated_Cable_Rows",
  "remada no cabo": "Seated_Cable_Rows",
  "remada unilateral": "One-Arm_Dumbbell_Row",
  "remada serrote": "One-Arm_Dumbbell_Row",
  "serrote": "One-Arm_Dumbbell_Row",
  "remada cavalinho": "T-Bar_Row_with_Handle",
  "remada t": "T-Bar_Row_with_Handle",
  "face pull": "Face_Pull",
  "hiperextensao": "Hyperextensions_Back_Extensions",
  "extensao lombar": "Hyperextensions_Back_Extensions",
  "levantamento terra": "Barbell_Deadlift",
  terra: "Barbell_Deadlift",
  "terra romeno": "Romanian_Deadlift",
  "levantamento terra romeno": "Romanian_Deadlift",
  "stiff": "Stiff-Legged_Barbell_Deadlift",
  "bom dia": "Band_Good_Morning",
  "encolhimento": "Barbell_Shrug",
  "encolhimento com barra": "Barbell_Shrug",

  // ---- Ombros ----
  "desenvolvimento ombro": "Barbell_Shoulder_Press",
  "desenvolvimento de ombro": "Dumbbell_Shoulder_Press",
  "desenvolvimento de ombros": "Dumbbell_Shoulder_Press",
  "desenvolvimento": "Barbell_Shoulder_Press",
  "desenvolvimento com barra": "Barbell_Shoulder_Press",
  "desenvolvimento militar": "Standing_Military_Press",
  "desenvolvimento com halteres": "Dumbbell_Shoulder_Press",
  "desenvolvimento sentado": "Seated_Dumbbell_Press",
  "desenvolvimento arnold": "Arnold_Dumbbell_Press",
  "arnold press": "Arnold_Dumbbell_Press",
  "desenvolvimento maquina": "Machine_Shoulder_Military_Press",
  "desenvolvimento na maquina": "Machine_Shoulder_Military_Press",
  "elevacao lateral": "Side_Lateral_Raise",
  "elevacao lateral com halteres": "Side_Lateral_Raise",
  "elevacao frontal": "Front_Dumbbell_Raise",
  "elevacao frontal com halteres": "Front_Dumbbell_Raise",
  "elevacao frontal no cabo": "Front_Cable_Raise",
  "crucifixo inverso": "Reverse_Flyes",
  "crucifixo invertido": "Reverse_Flyes",
  "voador invertido": "Reverse_Machine_Flyes",
  "remada alta": "Dumbbell_One-Arm_Upright_Row",

  // ---- Bíceps ----
  "rosca direta": "Barbell_Curl",
  "rosca direta com barra": "Barbell_Curl",
  "rosca alternada": "Dumbbell_Alternate_Bicep_Curl",
  "rosca alternada com halteres": "Dumbbell_Alternate_Bicep_Curl",
  "rosca martelo": "Alternate_Hammer_Curl",
  "rosca martelo no cabo": "Cable_Hammer_Curls_-_Rope_Attachment",
  "rosca scott": "Preacher_Curl",
  "rosca scott maquina": "Machine_Preacher_Curls",
  "rosca concentrada": "Concentration_Curls",
  "rosca inclinada": "Alternate_Incline_Dumbbell_Curl",

  // ---- Tríceps ----
  "triceps pulley": "Triceps_Pushdown",
  "triceps polia": "Triceps_Pushdown",
  "triceps pushdown": "Triceps_Pushdown",
  "triceps corda": "Triceps_Pushdown_-_Rope_Attachment",
  "triceps na corda": "Triceps_Pushdown_-_Rope_Attachment",
  "triceps testa": "Cable_Lying_Triceps_Extension",
  "triceps frances": "Standing_Dumbbell_Triceps_Extension",
  "triceps frances com halter": "Standing_Dumbbell_Triceps_Extension",
  "triceps overhead": "Cable_Rope_Overhead_Triceps_Extension",
  "extensao de triceps acima da cabeca": "Cable_Rope_Overhead_Triceps_Extension",
  "supino fechado": "Close-Grip_Barbell_Bench_Press",
  "mergulho": "Dips_-_Triceps_Version",

  // ---- Pernas / Glúteos ----
  agachamento: "Barbell_Squat",
  "agachamento livre": "Barbell_Squat",
  "agachamento com barra": "Barbell_Squat",
  "agachamento frontal": "Front_Barbell_Squat",
  "agachamento goblet": "Goblet_Squat",
  "goblet squat": "Goblet_Squat",
  "agachamento com halteres": "Dumbbell_Squat",
  "leg press": "Leg_Press",
  "leg press 45": "Leg_Press",
  "cadeira extensora": "Leg_Extensions",
  extensora: "Leg_Extensions",
  "mesa flexora": "Lying_Leg_Curls",
  "flexora deitada": "Lying_Leg_Curls",
  "cadeira flexora": "Seated_Leg_Curl",
  flexora: "Lying_Leg_Curls",
  afundo: "Barbell_Lunge",
  "afundo com barra": "Barbell_Lunge",
  "avanco": "Dumbbell_Lunges",
  "afundo com halteres": "Dumbbell_Lunges",
  "passada": "Dumbbell_Lunges",
  "elevacao pelvica": "Barbell_Hip_Thrust",
  "hip thrust": "Barbell_Hip_Thrust",
  "ponte de gluteo": "Barbell_Glute_Bridge",
  "cadeira abdutora": "Thigh_Abductor",
  abdutora: "Thigh_Abductor",
  "cadeira adutora": "Thigh_Adductor",
  adutora: "Thigh_Adductor",
  "panturrilha em pe": "Standing_Calf_Raises",
  "panturrilha no smith": "Standing_Calf_Raises",
  "panturrilha sentado": "Seated_Calf_Raise",
  "panturrilha no leg press": "Calf_Press_On_The_Leg_Press_Machine",

  // ---- Core ----
  abdominal: "Crunches",
  "abdominal reto": "Crunches",
  "abdominal supra": "Crunches",
  prancha: "Plank",
  "prancha frontal": "Plank",
  "russian twist": "Russian_Twist",
  "torcao russa": "Russian_Twist",
  "elevacao de pernas": "Bent-Knee_Hip_Raise",
  "abdominal bicicleta": "Air_Bike",
};

/**
 * Resolve as fotos de um exercício pelo nome (PT-BR). Match exato sobre o nome
 * normalizado; sem match → null (a UI mantém o placeholder com o link de vídeo).
 */
export function resolveExerciseMedia(name: string): ExerciseMedia | null {
  const id = PT_TO_ID[normalizeExerciseName(name)];
  if (!id) return null;
  return { sourceId: id, imageUrls: [`${BASE}${id}/0.jpg`, `${BASE}${id}/1.jpg`] };
}
