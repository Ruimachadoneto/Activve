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
