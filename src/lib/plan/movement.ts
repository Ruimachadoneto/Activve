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

/** Link de vídeo: usa o do plano se houver, senão cai numa busca por nome no YouTube. */
export function videoHref(mov: Movement): string {
  return (
    mov.howTo.videoUrl ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${mov.name}`)}`
  );
}
