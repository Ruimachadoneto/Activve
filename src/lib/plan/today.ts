import type { Muscle, PlanFile } from "./schema";

export type TodayResult =
  | {
      kind: "rest";
      /** Por que descansar: ciclo (2 dias seguidos) ou meta da semana batida. */
      reason: "cycle" | "week";
      /** O que viria a seguir — descanso não é beco sem saída (TASK-029). */
      nextWorkoutId: string | null;
      nextWorkoutName: string | null;
    }
  | {
      kind: "workout";
      workoutId: string;
      name: string;
      focus?: string;
      exerciseCount: number;
      muscles: Muscle[];
      /** Este treino já foi CONCLUÍDO hoje — a tela mostra fechamento, não convite. */
      doneToday: boolean;
    };

/*
 * `getTodayWorkout` (agenda por DIA DA SEMANA) foi removida na TASK-029 e substituída por
 * `resolveToday` em `rotation.ts`. A sugestão passou a vir do que foi efetivamente
 * concluído: o usuário treinou A na terça, faltou quarta e quinta, e na sexta o app
 * insistia no treino da sexta em vez de sugerir B — "perde toda a flexibilidade que o app
 * deve dar". Manter as duas faria a mesma pergunta ter duas respostas.
 */

/**
 * Rótulo de badge para um treino: o id só é exibível quando é curto e legível
 * ("A", "B2", "abc") — ids técnicos (slug/UUID, ex. "wk_42_a") viram null e a UI
 * não mostra badge, em vez de vazar identificador de armazenamento pro usuário.
 */
export function workoutBadge(id: string): string | null {
  return /^[A-Za-z0-9]{1,3}$/.test(id) ? id.toUpperCase() : null;
}

/**
 * Duração estimada do treino em minutos: por série, ~45s de execução + o descanso
 * do exercício (default 60s). Arredonda para múltiplo de 5 (é estimativa, não promessa).
 */
export function estimateWorkoutMinutes(workout: {
  exercises: { sets: number; rest_s?: number }[];
}): number {
  const seconds = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets * (45 + (ex.rest_s ?? 60)),
    0,
  );
  return Math.max(5, Math.round(seconds / 60 / 5) * 5);
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

/** Datas (yyyy-mm-dd) da semana atual, segunda → domingo (alinha com weekSchedule). */
export function weekDates(now: Date = new Date()): string[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIndex(now));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${dd}`;
  });
}
