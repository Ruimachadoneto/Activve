/**
 * Agenda por ROTAÇÃO — o treino sugerido vem do que foi efetivamente concluído, não do
 * dia da semana (TASK-029).
 *
 * POR QUE ISTO EXISTE
 * `getTodayWorkout` resolvia `weekSchedule[índiceDoDiaDaSemana]`: calendário puro. Nas
 * palavras do usuário, depois de usar o app na academia: *"fiz o treino A na terça e não
 * pude ir quarta e quinta; na sexta deve me sugerir o treino B, e não ficar preso na info
 * de que segunda A, terça B. Perde toda a flexibilidade que o app deve dar, pois a vida é
 * cheia de situações variáveis."*
 *
 * O `weekSchedule` deixa de ser um calendário e passa a ser lido como duas coisas: a
 * **ordem da rotação** e a **meta semanal**. Nenhum campo novo — mesma estrutura, leitura
 * diferente (por isso não há bump do PLAN_SCHEMA).
 *
 * Camada pura: sem React, sem IndexedDB.
 */

import type { PlanFile } from "./schema";
import type { WorkoutSession } from "./session";
import { isoDate } from "./session";
import type { TodayResult } from "./today";

/**
 * Cadência quando o plano não declara uma legível. Era uma CONSTANTE global até a
 * decisão do usuário em 2026-08-01 (ver `cycleLengthOf`).
 */
const CICLO_PADRAO_EM_DIAS = 2;

/** Quantos dias para trás vale a pena olhar ao medir a sequência (barato e suficiente). */
const LOOKBACK_DIAS = 14;

/**
 * Treinos do plano, tolerando plano HISTÓRICO malformado.
 *
 * `report.ts` chama a rotação com planos que passaram só pela guarda estrutural da
 * TASK-013 — `workouts` pode não ser array e pode conter elementos nulos. Ler o campo
 * direto derrubava o relatório inteiro por causa de um treino ruim, que é exatamente a
 * regressão que a TASK-013 fechou. Aqui vale a mesma postura: **função total**.
 */
function workoutsOf(plan: PlanFile): PlanFile["training"]["workouts"] {
  return Array.isArray(plan.training?.workouts)
    ? plan.training.workouts.filter((w) => typeof w?.id === "string")
    : [];
}

export type Rotation = {
  /** Ordem dos treinos, sem repetição — ex.: `["A","B"]` ou `["A","B","C","D"]`. */
  order: string[];
  /** Quantos treinos a semana prevê — ex.: 4. Conta repetições, ao contrário de `order`. */
  weeklyTarget: number;
};

/**
 * Extrai a rotação do plano.
 *
 * `order` é o `weekSchedule` sem `rest` e sem repetições (upper/lower duas vezes por
 * semana vira `[U, L]`, que é o ciclo real). `weeklyTarget` conta as repetições, porque a
 * meta da semana são 4 treinos mesmo quando só existem 2 distintos.
 *
 * Sem agenda utilizável, cai na ordem dos treinos do plano e em `profile.daysPerWeek` —
 * plano histórico com agenda ilegível não pode derrubar a sugestão (mesma postura de
 * função total da TASK-013).
 */
export function rotationOf(plan: PlanFile): Rotation {
  const workouts = workoutsOf(plan);
  const ids = new Set(workouts.map((w) => w.id));
  const agendados = (Array.isArray(plan.training?.weekSchedule) ? plan.training.weekSchedule : []).filter(
    (entry): entry is string => typeof entry === "string" && ids.has(entry),
  );
  const order = [...new Set(agendados)];
  if (order.length === 0) {
    const fallback = workouts.map((w) => w.id);
    return {
      order: fallback,
      weeklyTarget: Math.max(1, plan.profile?.daysPerWeek || fallback.length),
    };
  }
  return { order, weeklyTarget: Math.max(1, agendados.length) };
}

/**
 * Quantos dias seguidos de treino fecham um CICLO neste plano — e portanto quando o
 * descanso passa a ser sugerido.
 *
 * Vem do próprio `weekSchedule`: é a maior sequência de entradas de treino CONSECUTIVAS
 * que o plano declara. Regra do usuário (2026-08-01): *"vai variar do plano... se o
 * treino é A+B+C onde cada dia tem um foco, o descanso é após o fim do ciclo. Se é
 * Upper/Lower A/B — C/D, o descanso é ao fim do ciclo upper/lower"*.
 *
 * | `weekSchedule`                | ciclo |
 * |---|---|
 * | `A,B,rest,A,B,rest,rest`      | 2 (o plano do usuário — comportamento inalterado) |
 * | `A,B,C,rest,A,B,C`            | 3 |
 * | `A,rest,B,rest,C,rest,rest`   | 1 (o plano alterna treino e descanso) |
 *
 * Sem sequência utilizável (agenda ilegível ou só `rest`), cai no padrão — plano
 * histórico malformado não pode derrubar a sugestão (mesma postura da TASK-013).
 *
 * Sem envolver a virada da semana de propósito: juntar o fim com o começo do array
 * transformaria `A,rest,rest,rest,rest,rest,A` (2× por semana, bem espaçado) numa
 * sequência de 2, quando o que o plano diz é treinar um dia e descansar.
 */
export function cycleLengthOf(plan: PlanFile): number {
  const ids = new Set(workoutsOf(plan).map((w) => w.id));
  let maior = 0;
  let atual = 0;
  for (const entry of Array.isArray(plan.training?.weekSchedule) ? plan.training.weekSchedule : []) {
    if (typeof entry === "string" && ids.has(entry)) {
      atual += 1;
      maior = Math.max(maior, atual);
    } else {
      atual = 0;
    }
  }
  return maior > 0 ? maior : CICLO_PADRAO_EM_DIAS;
}

/** Só sessões concluídas contam — a mesma régua de `recovery.ts` e do relatório. */
const concluidas = (sessions: WorkoutSession[]) => sessions.filter((s) => s.status === "done");

/**
 * Concluídas em ordem cronológica (data e, dentro do dia, `completedAt`).
 *
 * Fonte ÚNICA de "qual foi a última". Antes, `nextInRotation` ordenava e pegava a última
 * enquanto `suggestWorkout` usava um `find` que parava na PRIMEIRA do dia: com dois
 * treinos no mesmo dia (que a rotação passou a permitir pra recuperar atraso), a mesma
 * função dava duas respostas — dizia "você fez A" e "o próximo é A" ao mesmo tempo, e o
 * `/treino` reabria o treino já encerrado (achado do review Codex).
 */
function concluidasEmOrdem(sessions: WorkoutSession[]): WorkoutSession[] {
  return concluidas(sessions)
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? (a.completedAt ?? "").localeCompare(b.completedAt ?? "")
        : a.date.localeCompare(b.date),
    );
}

/** Data (yyyy-mm-dd) de `dias` atrás, no fuso local. */
function diaAtras(now: Date, dias: number): string {
  return isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - dias));
}

/**
 * Dias consecutivos com treino concluído terminando em ONTEM.
 *
 * Termina em ontem de propósito: o que interessa é "vim treinando seguido?", e o treino de
 * hoje (se houver) é tratado à parte. Sem isso, abrir o app depois de treinar hoje contaria
 * o próprio dia e mudaria a resposta.
 */
export function consecutiveDaysUntilYesterday(
  sessions: WorkoutSession[],
  now: Date = new Date(),
): number {
  const dias = new Set(concluidas(sessions).map((s) => s.date));
  let streak = 0;
  for (let i = 1; i <= LOOKBACK_DIAS; i++) {
    if (!dias.has(diaAtras(now, i))) break;
    streak += 1;
  }
  return streak;
}

/**
 * Treinos concluídos na semana corrente (segunda → hoje, como o resto do app).
 *
 * Conta SESSÕES, não dias com treino. `weeklyTarget` conta entradas do `weekSchedule`
 * (4 num upper/lower 2×), então comparar os dois exige a mesma unidade: contando dias,
 * quem juntasse A+B na segunda e A+B na quarta somava 2 contra uma meta de 4 e a semana
 * nunca fechava, apesar dos 4 treinos feitos (achado do review Codex). Juntar treinos no
 * mesmo dia é justamente o que a rotação passou a permitir pra recuperar atraso.
 */
export function completedThisWeek(sessions: WorkoutSession[], now: Date = new Date()): number {
  const segunda = diaAtras(now, (now.getDay() + 6) % 7);
  const hoje = isoDate(now);
  // `yyyy-mm-dd` compara lexicograficamente = cronologicamente. Dia futuro não conta.
  return concluidas(sessions).filter((s) => s.date >= segunda && s.date <= hoje).length;
}

/** Próximo treino da rotação depois do último concluído. */
export function nextInRotation(plan: PlanFile, sessions: WorkoutSession[]): string | null {
  const { order } = rotationOf(plan);
  if (order.length === 0) return null;
  const feitas = concluidasEmOrdem(sessions);
  const ultimo = feitas[feitas.length - 1];
  if (!ultimo) return order[0];
  const i = order.indexOf(ultimo.workoutId);
  // Treino que saiu da rotação (plano trocado): recomeça, em vez de travar.
  if (i < 0) return order[0];
  return order[(i + 1) % order.length];
}

export type Suggestion =
  /** Já treinou hoje — mostra o que foi feito; `next` é só informação do que vem depois. */
  | { kind: "done_today"; workoutId: string; next: string | null }
  /** Descanso sugerido (ciclo fechado ou meta da semana batida). */
  | { kind: "rest"; reason: "cycle" | "week"; next: string | null }
  | { kind: "workout"; workoutId: string };

/**
 * O que sugerir agora.
 *
 * Regra de descanso definida pelo usuário (2026-07-31): *"o descanso deve ser sugerido se
 * fiz um ciclo (upper-lower) ou se completei os dois ciclos da semana. Se eu não treinei
 * hoje e amanhã treino, por mais que seja o treino B, ele não deve sugerir o descanso —
 * somente depois de 2 dias seguidos ou ciclo completo."*
 *
 * Por isso a sequência é medida em DIAS CONSECUTIVOS, não em "quantos treinos fiz": pular
 * um dia zera a sequência e a sugestão volta a ser o próximo treino, que é exatamente o
 * caso que originou o pedido.
 *
 * `override` (TASK-016) continua tendo precedência sobre tudo: sugestão é sugestão, e o
 * app não prescreve.
 */
export function suggestWorkout(
  plan: PlanFile,
  sessions: WorkoutSession[],
  now: Date = new Date(),
  override?: string | null,
): Suggestion {
  const proximo = nextInRotation(plan, sessions);
  const hoje = isoDate(now);
  // O ÚLTIMO concluído hoje, não o primeiro: com A e B no mesmo dia, o que fecha o dia é
  // o mais recente — e é ele que precisa concordar com `proximo` (mesma ordenação).
  const doHoje = concluidasEmOrdem(sessions).filter((s) => s.date === hoje);

  if (override) {
    if (override === "rest") return { kind: "rest", reason: "cycle", next: proximo };
    const existe = workoutsOf(plan).some((w) => w.id === override);
    if (existe) {
      /*
       * O override diz QUAL é o treino de hoje, não que ele siga pendente. Sem esta
       * checagem, concluir o treino escolhido à mão deixava o card em "Começar treino"
       * para sempre — o mesmo convite fora de hora que o `doneToday` existe pra evitar,
       * escapando pelo caminho do override (achado do review Codex, ciclo 3).
       */
      const feito = doHoje.some((s) => s.workoutId === override);
      return feito
        ? { kind: "done_today", workoutId: override, next: proximo }
        : { kind: "workout", workoutId: override };
    }
    // Override órfão (plano trocado): ignora e segue a rotação, sem travar em descanso.
  }

  const feitoHoje = doHoje[doHoje.length - 1];
  if (feitoHoje) return { kind: "done_today", workoutId: feitoHoje.workoutId, next: proximo };

  if (consecutiveDaysUntilYesterday(sessions, now) >= cycleLengthOf(plan)) {
    return { kind: "rest", reason: "cycle", next: proximo };
  }

  const { weeklyTarget } = rotationOf(plan);
  if (completedThisWeek(sessions, now) >= weeklyTarget) {
    return { kind: "rest", reason: "week", next: proximo };
  }

  return proximo ? { kind: "workout", workoutId: proximo } : { kind: "rest", reason: "cycle", next: null };
}

/**
 * Adapta a sugestão ao formato que as telas já consomem (`TodayResult`), acrescentando o
 * que a rotação sabe e o calendário não sabia: se o treino de hoje **já foi feito** e, no
 * descanso, **por quê** e **o que vem depois**.
 *
 * Substitui `getTodayWorkout` nas telas. A regra antiga (dia da semana) não sobrevive em
 * lugar nenhum: manter as duas faria a mesma pergunta ter duas respostas.
 */
export function resolveToday(
  plan: PlanFile,
  sessions: WorkoutSession[],
  now: Date = new Date(),
  override?: string | null,
): TodayResult {
  const s = suggestWorkout(plan, sessions, now, override);
  const workoutId = s.kind === "rest" ? null : s.workoutId;
  const workouts = workoutsOf(plan);
  const workout = workoutId ? workouts.find((w) => w.id === workoutId) : undefined;
  const nomeDe = (id: string | null) =>
    id ? (workouts.find((w) => w.id === id)?.name ?? null) : null;

  if (!workout) {
    const next = s.kind === "rest" ? s.next : null;
    return {
      kind: "rest",
      reason: s.kind === "rest" ? s.reason : "cycle",
      nextWorkoutId: next,
      nextWorkoutName: nomeDe(next),
    };
  }

  // O "próximo" só acompanha um treino JÁ CONCLUÍDO: num treino pendente ele seria ruído
  // (e um empurrão para emendar outro), o que a regra de descanso existe pra evitar.
  const next = s.kind === "done_today" ? s.next : null;
  return {
    kind: "workout",
    workoutId: workout.id,
    name: workout.name,
    focus: workout.focus,
    exerciseCount: workout.exercises.length,
    muscles: workout.exercises.flatMap((e) => e.primaryMuscles),
    doneToday: s.kind === "done_today",
    nextWorkoutId: next,
    nextWorkoutName: nomeDe(next),
  };
}
