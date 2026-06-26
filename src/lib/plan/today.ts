import type { Muscle, PlanFile } from "./schema";

export type TodayResult =
  | { kind: "rest" }
  | {
      kind: "workout";
      workoutId: string;
      name: string;
      focus?: string;
      exerciseCount: number;
      muscles: Muscle[];
    };

/**
 * Treino de hoje a partir do weekSchedule (índice 0 = segunda).
 * Agenda é uma sugestão (decisão de produto: agenda flexível) — aqui só resolvemos
 * o que está previsto para o dia atual.
 */
export function getTodayWorkout(plan: PlanFile, now: Date = new Date()): TodayResult {
  const mondayIndex = (now.getDay() + 6) % 7; // getDay(): 0=domingo → mapeia p/ 0=segunda
  const entry = plan.training.weekSchedule[mondayIndex];
  if (!entry || entry === "rest") return { kind: "rest" };

  const workout = plan.training.workouts.find((w) => w.id === entry);
  if (!workout) return { kind: "rest" };

  return {
    kind: "workout",
    workoutId: workout.id,
    name: workout.name,
    focus: workout.focus,
    exerciseCount: workout.exercises.length,
    muscles: workout.exercises.flatMap((e) => e.primaryMuscles),
  };
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const EXPERIENCE_LABEL: Record<PlanFile["profile"]["experience"], string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export function experienceLabel(exp: PlanFile["profile"]["experience"]): string {
  return EXPERIENCE_LABEL[exp];
}

/** Dias da semana, índice 0 = segunda (alinha com weekSchedule). */
export const WEEK_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"] as const;

/** Índice do dia atual no weekSchedule (0 = segunda). */
export function todayIndex(now: Date = new Date()): number {
  return (now.getDay() + 6) % 7;
}
