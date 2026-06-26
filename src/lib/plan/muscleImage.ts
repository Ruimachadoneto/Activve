import type { Muscle } from "./schema";

/**
 * Chaves de imagem do mapa muscular. Cada uma corresponde a um arquivo em
 * `public/muscles/<key>.png`. Ver docs/ai/asset-prompts-muscles.md.
 */
export type MuscleImageKey =
  | "corpo"
  | "empurrar"
  | "puxar"
  | "peito"
  | "costas"
  | "ombros"
  | "pernas"
  | "gluteos"
  | "posterior"
  | "panturrilha";

/**
 * Resolve a ilustração do treino a partir dos músculos primários dos exercícios.
 * Usa o vocabulário fechado do schema (mais confiável que o texto livre do `focus`).
 * Sempre retorna uma chave válida — `corpo` é o fallback universal.
 */
export function resolveMuscleImage(muscles: Muscle[]): MuscleImageKey {
  const n = (m: Muscle) => muscles.filter((x) => x === m).length;

  const chest = n("chest");
  const back = n("lats") + n("upper_back") + n("traps") + n("lower_back");
  const delts = n("front_delts") + n("side_delts") + n("rear_delts");
  const biceps = n("biceps");
  const triceps = n("triceps");
  const quads = n("quads");
  const hams = n("hamstrings");
  const glutes = n("glutes");
  const calves = n("calves");

  const upper = chest + back + delts + biceps + triceps;
  const lower = quads + hams + glutes + calves;

  // Mistura superior + inferior no mesmo dia (full body / upper-lower) → corpo inteiro.
  if (upper > 0 && lower > 0) return "corpo";

  // Inferiores (subdivididos — comum em treino feminino).
  if (lower > 0) {
    if (quads >= Math.max(glutes, hams, calves)) return "pernas"; // dia de quadríceps / perna
    if (glutes > 0 && (hams > 0 || calves > 0)) return "posterior"; // glúteo + cadeia posterior
    if (glutes > 0) return "gluteos"; // foco glúteo
    if (hams > 0) return "posterior";
    if (calves > 0) return "panturrilha";
    return "pernas";
  }

  // Superiores.
  if (back > 0 && chest > 0) return "corpo"; // upper completo (push + pull no mesmo dia)
  if (chest > 0) return delts > 0 || triceps > 0 ? "empurrar" : "peito";
  if (back > 0) return biceps > 0 ? "puxar" : "costas";
  if (delts > 0) return "ombros";
  return "corpo"; // braços isolados ou sem dados → fallback
}
