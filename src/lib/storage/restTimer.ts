/**
 * Estado persistido do cronômetro de descanso.
 *
 * POR QUE ISTO EXISTE
 * A TASK-017 ancorou o countdown num instante absoluto (`endAt`) para ele não divergir
 * com throttling de timer em segundo plano. Isso resolve enquanto o componente continua
 * MONTADO — e num celular ele frequentemente não continua: ao sair do PWA, o sistema
 * congela e muitas vezes **descarta** a página. Ao voltar, o React remonta do zero, o
 * `useRef` da âncora volta a ser `null` e o descanso aparece cheio de novo ou some.
 * Era esse o "contador fora da realidade" relatado no uso real.
 *
 * A âncora precisa viver fora da memória do React. `localStorage` e não IndexedDB de
 * propósito: a leitura é SÍNCRONA, então na montagem o tempo certo já está no primeiro
 * render — com IndexedDB haveria um frame mostrando o valor errado, que é exatamente o
 * problema que estamos corrigindo.
 *
 * Não é dado de usuário (o ADR-001 governa plano/sessões/medidas, que continuam no
 * IndexedDB): é estado efêmero de UI, e some sozinho.
 */

const KEY = "activve:rest-timer";

/**
 * Descanso mais longo que aceitamos ressuscitar. Passou disso, o usuário não está mais
 * "naquele descanso" — voltou no dia seguinte, ou deixou o app aberto a manhã toda.
 * Ressuscitar um cronômetro velho seria pior do que não ressuscitar nada.
 */
const MAX_REVIVE_MS = 30 * 60 * 1000;

export type RestTimerState = {
  /** Instante absoluto (epoch ms) em que o descanso zera. Fonte da verdade. */
  endAt: number;
  /** Duração escolhida, para o arco de progresso. */
  duration: number;
  /** Pausado guarda o que restava; rodando é derivado de `endAt`. */
  pausedRemaining: number | null;
  /** A que sessão/exercício este descanso pertence — não revive noutro treino. */
  sessionId: string;
  exerciseId: string;
  /**
   * Treino a que o descanso pertence, explícito.
   *
   * Está aqui em vez de ser extraído do `sessionId` porque a página precisa dele ANTES
   * de montar a sessão: quem treinava um treino escolhido à mão (não o do dia) voltava
   * do descarte no treino padrão, e aí nem a sessão batia — a posição não era restaurada
   * e o cronômetro nunca revivia (achado do review Codex).
   */
  workoutId: string;
  /** Se a vibração/aviso de fim já foi disparado (não avisar duas vezes). */
  alerted: boolean;
};

function isState(value: unknown): value is RestTimerState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.endAt === "number" &&
    Number.isFinite(v.endAt) &&
    typeof v.duration === "number" &&
    typeof v.sessionId === "string" &&
    typeof v.exerciseId === "string" &&
    typeof v.workoutId === "string" &&
    typeof v.alerted === "boolean" &&
    (v.pausedRemaining === null || typeof v.pausedRemaining === "number")
  );
}

/**
 * Lê o registro salvo sem filtrar por sessão nem por idade.
 *
 * Serve para a página de treino RESTAURAR A POSIÇÃO: descartado o app durante o descanso
 * do 3º exercício, a remontagem voltava para o 1º e o overlay reaparecia sobre o card
 * errado (achado do review Codex). Perder o lugar no treino já era o defeito — a guarda
 * sozinha só esconderia o sintoma.
 */
export function peekRestTimer(): RestTimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Lê o descanso salvo. `null` se não houver, se for de outra sessão, de outro EXERCÍCIO,
 * ou se for velho.
 *
 * O casamento por exercício é a garantia por construção: mesmo que a posição não seja
 * restaurada por algum motivo, o cronômetro nunca reaparece sobre um card que não é o
 * dele — e nenhuma ação de preset/pausa sobrescreve o registro com o exercício errado.
 */
export function loadRestTimer(
  sessionId: string,
  exerciseId: string,
  now: number = Date.now(),
): RestTimerState | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null; // storage bloqueado (modo privado/permissão) — o timer só perde memória
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearRestTimer();
    return null;
  }
  if (!isState(parsed)) {
    clearRestTimer();
    return null;
  }
  // Descanso de outra sessão (outro dia, outro treino) ou de outro exercício não volta.
  if (parsed.sessionId !== sessionId || parsed.exerciseId !== exerciseId) return null;
  // Pausado não expira pelo relógio; rodando, sim.
  if (parsed.pausedRemaining === null && now - parsed.endAt > MAX_REVIVE_MS) {
    clearRestTimer();
    return null;
  }
  return parsed;
}

export function saveRestTimer(state: RestTimerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sem storage, o descanso ainda funciona — só não sobrevive a sair do app */
  }
}

export function clearRestTimer(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* idem */
  }
}

/** Segundos restantes de um estado salvo, já considerando pausa. Nunca negativo. */
export function remainingOf(state: RestTimerState, now: number = Date.now()): number {
  if (state.pausedRemaining !== null) return Math.max(0, state.pausedRemaining);
  return Math.max(0, Math.ceil((state.endAt - now) / 1000));
}
