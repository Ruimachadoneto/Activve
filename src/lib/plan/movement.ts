import type { Exercise, Muscle } from "./schema";

type HowTo = Exercise["howTo"];

/** Movimento "efetivo" de um exercício: o original ou a variação escolhida. */
export type Movement = {
  name: string;
  equipment?: Exercise["equipment"];
  howTo: HowTo;
  primaryMuscles?: Muscle[];
  isSwapped: boolean;
};

/**
 * Resolve o movimento a executar. Se `swappedToId` aponta para uma variação válida,
 * usa nome/equipamento/como-fazer dela; senão, o exercício original.
 * Séries/reps/carga NÃO mudam na troca (decisão de produto) — só o movimento.
 */
export function resolveMovement(exercise: Exercise, swappedToId?: string): Movement {
  if (swappedToId) {
    const alt = exercise.alternatives.find((a) => a.id === swappedToId);
    if (alt) {
      return {
        name: alt.name,
        equipment: alt.equipment,
        howTo: alt.howTo,
        primaryMuscles: alt.primaryMuscles,
        isSwapped: true,
      };
    }
  }
  return {
    name: exercise.name,
    equipment: exercise.equipment,
    howTo: exercise.howTo,
    primaryMuscles: exercise.primaryMuscles,
    isSwapped: false,
  };
}

/** Só http(s) é seguro como href (bloqueia `javascript:`/`data:` vindos do plano importado). */
function isSafeHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Link de vídeo: usa o `videoUrl` do plano apenas se for http(s) — senão (ausente ou
 * esquema perigoso como `javascript:`) cai numa busca por nome no YouTube. O plano é
 * input externo e o schema valida `videoUrl` só como string, então não dá pra confiar.
 */
export function videoHref(mov: Movement): string {
  const url = mov.howTo.videoUrl;
  if (url && isSafeHttpUrl(url)) return url;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${mov.name}`)}`;
}
