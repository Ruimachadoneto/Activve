import type { Muscle, PlanFile } from "./schema";

/**
 * Texto opcional do plano que vale a pena mostrar — ou `undefined`.
 *
 * O schema aceita `"   "` em todo campo de texto livre (`min(1)` mede a string crua), e
 * `"   "` é verdadeiro em JS. Sem esta régua, cada tela decide sozinha se campo presente é
 * conteúdo, e um `why` só com espaços vira parágrafo fantasma aqui, "·" pendurado ali, e
 * um aviso de "formato anterior" suprimido acolá. **Uma pergunta, uma resposta** — a lição
 * que se repetiu nas TASK-016/027/029.
 */
export function textoVisivel(valor?: string): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

/** Rótulos pt-BR do vocabulário de objetivo do plano. */
export const GOAL_LABEL: Record<PlanFile["goal"]["type"], string> = {
  lose_fat: "Perder gordura",
  gain_muscle: "Ganhar músculo",
  recomp: "Recomposição",
  maintain: "Manutenção",
  performance: "Performance",
};

export function goalLabel(type: PlanFile["goal"]["type"]): string {
  return GOAL_LABEL[type] ?? type;
}

/** Rótulos pt-BR do vocabulário de equipamento do plano (ver schema EQUIPMENT). */
export const EQUIP_LABEL: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Halteres",
  machine: "Máquina",
  cable: "Cabo",
  bodyweight: "Peso do corpo",
  band: "Elástico",
  kettlebell: "Kettlebell",
  other: "Outro",
};

export function equipmentLabel(equipment?: string): string {
  if (!equipment) return "Livre";
  return EQUIP_LABEL[equipment] ?? equipment;
}

/** Rótulos pt-BR do vocabulário muscular do plano (ver schema MUSCLES). */
export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Peito",
  upper_back: "Costas",
  lats: "Dorsais",
  traps: "Trapézio",
  lower_back: "Lombar",
  front_delts: "Ombro anterior",
  side_delts: "Ombro lateral",
  rear_delts: "Ombro posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebraço",
  abs: "Abdômen",
  obliques: "Oblíquos",
  glutes: "Glúteos",
  quads: "Quadríceps",
  hamstrings: "Posterior de coxa",
  adductors: "Adutores",
  abductors: "Abdutores",
  calves: "Panturrilha",
  neck: "Pescoço",
};

export function muscleLabel(muscle: Muscle): string {
  return MUSCLE_LABEL[muscle] ?? muscle;
}
