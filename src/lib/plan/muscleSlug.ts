/**
 * Ponte entre o nosso vocabulário muscular (`Muscle`, 20 grupos) e os slugs do
 * `react-muscle-highlighter` (23 regiões desenhadas). Vários músculos nossos caem
 * na mesma região (ex.: os 3 deltoides → "deltoids"); por isso a agregação escolhe,
 * por região, o estado **mais fatigado** (é a informação relevante: "essa área foi
 * trabalhada"). Módulo puro — testável em node (import de tipo da lib é apagado).
 */

import type { Slug } from "react-muscle-highlighter";
import type { Muscle } from "./schema";
import type { RecoveryState, MuscleRecovery } from "./recovery";

/** Mapa explícito Muscle → Slug. Regiões sem 1:1 caem na mais próxima (ver comentários). */
export const MUSCLE_TO_SLUG: Record<Muscle, Slug> = {
  chest: "chest",
  upper_back: "upper-back",
  lats: "upper-back", // a lib não separa dorsais; entram nas costas superiores
  traps: "trapezius",
  lower_back: "lower-back",
  front_delts: "deltoids",
  side_delts: "deltoids",
  rear_delts: "deltoids",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  abs: "abs",
  obliques: "obliques",
  glutes: "gluteal",
  quads: "quadriceps",
  hamstrings: "hamstring",
  adductors: "adductors",
  abductors: "gluteal", // sem região própria; abdutores do quadril ≈ glúteo
  calves: "calves",
  neck: "neck",
};

// Estado mais fatigado vence ao agregar vários músculos numa região.
const PRIORITY: Record<RecoveryState, number> = {
  worked: 3,
  recovering: 2,
  ready: 1,
  rested: 0,
};

/**
 * Reduz o mapa de recuperação por músculo a um estado por região desenhável (slug).
 * Inclui **todos** os músculos — inclusive os `rested` —, pois "descansado" é um
 * estado real (token próprio, está na legenda). Assim cada região muscular sempre
 * carrega uma cor; só as partes não-musculares (cabeça/mãos/pés) usam o fill padrão.
 * Onde vários músculos caem na mesma região, vence o estado mais fatigado.
 */
export function slugRecoveryStates(
  recovery: Record<Muscle, MuscleRecovery>,
): Map<Slug, RecoveryState> {
  const out = new Map<Slug, RecoveryState>();
  for (const muscle of Object.keys(recovery) as Muscle[]) {
    const state = recovery[muscle].state;
    const slug = MUSCLE_TO_SLUG[muscle];
    const cur = out.get(slug);
    if (!cur || PRIORITY[state] > PRIORITY[cur]) out.set(slug, state);
  }
  return out;
}
