import { z } from "zod";

// Vocabulário fechado de músculos (alimenta mapa do corpo e volume por grupo).
export const MUSCLES = [
  "chest", "upper_back", "lats", "traps", "lower_back",
  "front_delts", "side_delts", "rear_delts",
  "biceps", "triceps", "forearms",
  "abs", "obliques",
  "glutes", "quads", "hamstrings", "adductors", "abductors", "calves", "neck",
] as const;

export const EQUIPMENT = [
  "barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "kettlebell", "other",
] as const;

export const muscleSchema = z.enum(MUSCLES);
export const equipmentSchema = z.enum(EQUIPMENT);

export const howToSchema = z.object({
  steps: z.array(z.string().min(1)).min(1, "O 'como fazer' precisa de ao menos 1 passo."),
  images: z.array(z.string()).optional(),
  gifUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  mediaId: z.string().optional(),
});

export const alternativeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  equipment: equipmentSchema.optional(),
  primaryMuscles: z.array(muscleSchema).optional(),
  howTo: howToSchema,
});

export const exerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  equipment: equipmentSchema.optional(),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1),
  load_kg: z.number().min(0).max(500).optional(),
  rest_s: z.number().int().min(0).max(600),
  effortTarget: z.number().int().min(6).max(10).optional(),
  primaryMuscles: z.array(muscleSchema).min(1, "Informe ao menos 1 músculo principal."),
  secondaryMuscles: z.array(muscleSchema).optional(),
  howTo: howToSchema,
  alternatives: z
    .array(alternativeSchema)
    .min(2, "Cada exercício precisa de pelo menos 2 variações."),
});

export const workoutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  focus: z.string().optional(),
  exercises: z.array(exerciseSchema),
});

export const trainingSchema = z
  .object({
    split: z.string().min(1),
    weekSchedule: z
      .array(z.string().min(1))
      .length(7, "weekSchedule precisa ter 7 itens (um por dia da semana)."),
    workouts: z.array(workoutSchema).min(1, "O plano precisa de ao menos 1 treino."),
  })
  .superRefine((training, ctx) => {
    const ids = new Set<string>();
    training.workouts.forEach((w, i) => {
      if (ids.has(w.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["workouts", i, "id"],
          message: `id de treino duplicado: "${w.id}".`,
        });
      }
      ids.add(w.id);
    });
    training.weekSchedule.forEach((day, i) => {
      if (day !== "rest" && !ids.has(day)) {
        ctx.addIssue({
          code: "custom",
          path: ["weekSchedule", i],
          message: `dia ${i + 1} aponta para o treino "${day}", que não existe.`,
        });
      }
    });
  });

export const profileSchema = z.object({
  name: z.string().max(60).optional(),
  sex: z.enum(["male", "female", "other"]),
  age: z.number().int().min(12, "Idade fora da faixa (12–100).").max(100, "Idade fora da faixa (12–100)."),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  environment: z.enum(["home", "gym", "both"]),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(10).max(180).optional(),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  restrictions: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

export const goalSchema = z.object({
  type: z.enum(["lose_fat", "gain_muscle", "recomp", "maintain", "performance"]),
  targetWeight_kg: z.number().min(30).max(300).optional(),
  targetDate: z.string().optional(),
  weeklyRate_kg: z.number().min(-1.5).max(1.5).optional(),
  summary: z.string().max(200).optional(),
});

export const mealSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  time: z.string().optional(),
  items: z.array(
    z.object({
      food: z.string().min(1),
      qty: z.number().optional(),
      unit: z.string().optional(),
      kcal: z.number().int().optional(),
    }),
  ),
  notes: z.string().max(300).optional(),
});

export const dietSchema = z.object({
  dailyKcal: z.number().int().min(800).max(6000).optional(),
  macros: z
    .object({
      protein_g: z.number().int().min(0),
      carbs_g: z.number().int().min(0),
      fat_g: z.number().int().min(0),
    })
    .optional(),
  meals: z.array(mealSchema),
  shoppingList: z.array(z.string()).optional(),
  prep: z.array(z.string()).optional(),
});

export const planFileSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+$/, "schemaVersion deve ser 'major.minor' (ex.: 1.0)."),
  meta: z.object({
    planId: z.string().min(1),
    generatedAt: z.string(),
    generator: z.string(),
    locale: z.string(),
  }),
  profile: profileSchema,
  goal: goalSchema,
  targets: z
    .array(z.object({ key: z.string(), value_cm: z.number() }))
    .optional(),
  training: trainingSchema,
  diet: dietSchema,
});

export type PlanFile = z.infer<typeof planFileSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Muscle = (typeof MUSCLES)[number];
