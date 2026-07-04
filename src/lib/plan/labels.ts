import type { Muscle } from "./schema";

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
