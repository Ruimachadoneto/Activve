import { describe, it, expect } from "vitest";
import {
  completedThisWeek,
  consecutiveDaysUntilYesterday,
  nextInRotation,
  resolveToday,
  rotationOf,
  suggestWorkout,
} from "./rotation";
import type { PlanFile } from "./schema";
import type { WorkoutSession } from "./session";

/** Plano upper/lower 4x: A, B, descanso, A, B, descanso, descanso. */
function plano(
  weekSchedule: string[] = ["A", "B", "rest", "A", "B", "rest", "rest"],
  workoutIds: string[] = ["A", "B"],
  daysPerWeek = 4,
): PlanFile {
  return {
    profile: { daysPerWeek },
    training: {
      weekSchedule,
      workouts: workoutIds.map((id) => ({ id, name: `Treino ${id}`, exercises: [] })),
    },
  } as unknown as PlanFile;
}

function sessao(date: string, workoutId: string, status: WorkoutSession["status"] = "done") {
  return {
    sessionId: `p1:${workoutId}:${date}`,
    planId: "p1",
    workoutId,
    date,
    status,
    startedAt: `${date}T19:00:00.000Z`,
    completedAt: status === "done" ? `${date}T20:00:00.000Z` : undefined,
    exercises: [],
  } as WorkoutSession;
}

/** Datas de referência: 2026-07-27 é uma SEGUNDA. */
const SEG = "2026-07-27";
const TER = "2026-07-28";
const QUA = "2026-07-29";
const QUI = "2026-07-30";
const SEX = "2026-07-31";
const dia = (iso: string, hora = 9) =>
  new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)), hora);

describe("rotationOf — weekSchedule vira ordem + meta, não calendário", () => {
  it("dedupe preserva a ordem do ciclo e a meta conta as repetições", () => {
    // Upper/Lower 2x por semana: o CICLO é [A,B], mas a semana prevê 4 treinos.
    expect(rotationOf(plano())).toEqual({ order: ["A", "B"], weeklyTarget: 4 });
  });

  it("plano com 4 treinos distintos", () => {
    const p = plano(["A", "B", "rest", "C", "D", "rest", "rest"], ["A", "B", "C", "D"]);
    expect(rotationOf(p)).toEqual({ order: ["A", "B", "C", "D"], weeklyTarget: 4 });
  });

  it("ignora entradas que não são treinos do plano", () => {
    const p = plano(["A", "rest", "FANTASMA", "B", "rest", "rest", "rest"]);
    expect(rotationOf(p).order).toEqual(["A", "B"]);
  });

  it("agenda inutilizável cai na ordem dos treinos e no daysPerWeek", () => {
    // Plano histórico com agenda ilegível não pode derrubar a sugestão (TASK-013).
    const p = plano(["rest", "rest", "rest", "rest", "rest", "rest", "rest"], ["A", "B"], 3);
    expect(rotationOf(p)).toEqual({ order: ["A", "B"], weeklyTarget: 3 });
  });
});

describe("nextInRotation", () => {
  it("sem histórico, começa pelo primeiro", () => {
    expect(nextInRotation(plano(), [])).toBe("A");
  });

  it("depois de A vem B; depois de B volta pra A", () => {
    expect(nextInRotation(plano(), [sessao(TER, "A")])).toBe("B");
    expect(nextInRotation(plano(), [sessao(TER, "A"), sessao(QUA, "B")])).toBe("A");
  });

  it("olha o ÚLTIMO concluído, não o mais recente registrado", () => {
    const fora_de_ordem = [sessao(QUA, "B"), sessao(TER, "A")];
    expect(nextInRotation(plano(), fora_de_ordem)).toBe("A");
  });

  it("sessão em andamento não conta como feita", () => {
    expect(nextInRotation(plano(), [sessao(TER, "A", "in_progress")])).toBe("A");
  });

  it("treino que saiu da rotação (plano trocado) recomeça em vez de travar", () => {
    expect(nextInRotation(plano(), [sessao(TER, "ANTIGO")])).toBe("A");
  });
});

describe("consecutiveDaysUntilYesterday", () => {
  it("conta dias seguidos terminando ONTEM", () => {
    const s = [sessao(TER, "A"), sessao(QUA, "B")];
    expect(consecutiveDaysUntilYesterday(s, dia(QUI))).toBe(2);
  });

  it("um buraco zera a sequência", () => {
    // Treinou terça, faltou quarta: na quinta a sequência é 0.
    expect(consecutiveDaysUntilYesterday([sessao(TER, "A")], dia(QUI))).toBe(0);
  });

  it("o treino de HOJE não entra na conta", () => {
    expect(consecutiveDaysUntilYesterday([sessao(QUI, "A")], dia(QUI))).toBe(0);
  });
});

describe("completedThisWeek", () => {
  it("conta as sessões da semana corrente até hoje", () => {
    const s = [sessao(SEG, "A"), sessao(TER, "B"), sessao(QUI, "A")];
    expect(completedThisWeek(s, dia(QUI))).toBe(3);
  });

  it("não conta semana anterior", () => {
    expect(completedThisWeek([sessao("2026-07-26", "A")], dia(TER))).toBe(0);
  });

  it("dois treinos no mesmo dia contam DOIS, não um", () => {
    /*
     * A unidade tem que bater com a de `weeklyTarget`, que conta entradas do
     * weekSchedule (4). Contando DIAS, A+B na segunda e A+B na quarta somavam 2 contra
     * uma meta de 4: a semana nunca fechava apesar dos 4 treinos (review Codex, ciclo 2).
     */
    const s = [sessao(SEG, "A"), sessao(SEG, "B"), sessao(QUA, "A"), sessao(QUA, "B")];
    expect(completedThisWeek(s, dia(QUI))).toBe(4);
  });

  it("juntar os 4 treinos em 2 dias fecha a semana", () => {
    const s = [sessao(SEG, "A"), sessao(SEG, "B"), sessao(QUA, "A"), sessao(QUA, "B")];
    // Quinta: ontem (quarta) teve treino mas terça não, então a sequência é 1 — quem
    // manda aqui é a meta semanal, não o ciclo.
    expect(consecutiveDaysUntilYesterday(s, dia(QUI))).toBe(1);
    expect(suggestWorkout(plano(), s, dia(QUI))).toMatchObject({ kind: "rest", reason: "week" });
  });
});

describe("suggestWorkout — a regra de descanso definida pelo usuário", () => {
  it("O CASO QUE ORIGINOU O PEDIDO: A na terça, nada quarta/quinta, sexta sugere B", () => {
    const s = [sessao(TER, "A")];
    expect(suggestWorkout(plano(), s, dia(SEX))).toEqual({ kind: "workout", workoutId: "B" });
  });

  it("ciclo fechado (2 dias seguidos) sugere descanso", () => {
    const s = [sessao(SEG, "A"), sessao(TER, "B")];
    expect(suggestWorkout(plano(), s, dia(QUA))).toMatchObject({ kind: "rest", reason: "cycle" });
  });

  it("um dia só NÃO fecha ciclo — segue sugerindo o próximo", () => {
    const s = [sessao(SEG, "A")];
    expect(suggestWorkout(plano(), s, dia(TER))).toEqual({ kind: "workout", workoutId: "B" });
  });

  it("meta da semana batida sugere descanso, mesmo sem 2 dias seguidos", () => {
    /*
     * Isola a regra SEMANAL da regra do ciclo: 4 treinos na semana (a meta), mas nenhum
     * par de dias consecutivos terminando ontem — seg, ter, qui, sáb, olhando de domingo
     * (ontem = sábado, e sexta está vazia, então a sequência é 1).
     */
    const s = [sessao(SEG, "A"), sessao(TER, "B"), sessao(QUI, "A"), sessao("2026-08-01", "B")];
    const domingo = dia("2026-08-02");
    expect(consecutiveDaysUntilYesterday(s, domingo)).toBe(1);
    expect(suggestWorkout(plano(), s, domingo)).toMatchObject({ kind: "rest", reason: "week" });
  });

  it("treinou hoje: não empurra outro treino", () => {
    const s = [sessao(QUI, "A")];
    expect(suggestWorkout(plano(), s, dia(QUI))).toEqual({
      kind: "done_today",
      workoutId: "A",
      next: "B",
    });
  });

  it("nunca treinou: primeiro da rotação", () => {
    expect(suggestWorkout(plano(), [], dia(SEG))).toEqual({ kind: "workout", workoutId: "A" });
  });

  it("dois treinos hoje: fecha o dia com o ÚLTIMO, não com o primeiro registrado", () => {
    /*
     * `find` parava na primeira sessão do dia enquanto `next` já vinha da última: a mesma
     * função dizia "você fez A" e "o próximo é A" (review Codex, ciclo 2). A ordem do
     * array não pode decidir — quem decide é `completedAt`.
     */
    const cedo = { ...sessao(QUI, "A"), completedAt: `${QUI}T08:00:00.000Z` };
    const tarde = { ...sessao(QUI, "B"), completedAt: `${QUI}T19:00:00.000Z` };
    const esperado = { kind: "done_today", workoutId: "B", next: "A" };
    expect(suggestWorkout(plano(), [cedo, tarde], dia(QUI))).toEqual(esperado);
    // Mesma resposta com o array na ordem inversa.
    expect(suggestWorkout(plano(), [tarde, cedo], dia(QUI))).toEqual(esperado);
  });

  it("o descanso informa qual seria o próximo — não é um beco sem saída", () => {
    const s = [sessao(SEG, "A"), sessao(TER, "B")];
    const r = suggestWorkout(plano(), s, dia(QUA));
    expect(r.kind === "rest" && r.next).toBe("A");
  });
});

describe("suggestWorkout — o override do usuário vence a sugestão", () => {
  const s = [sessao(SEG, "A"), sessao(TER, "B")]; // estado que sugeriria descanso

  it("escolher um treino no dia de descanso é permitido", () => {
    expect(suggestWorkout(plano(), s, dia(QUA), "A")).toEqual({ kind: "workout", workoutId: "A" });
  });

  it("escolher descanso explicitamente também vale", () => {
    expect(suggestWorkout(plano(), [], dia(SEG), "rest")).toMatchObject({ kind: "rest" });
  });

  it("override órfão (plano trocado) não trava a tela em descanso", () => {
    // Cai na rotação normal em vez de virar "rest" por um id que não existe mais.
    expect(suggestWorkout(plano(), [], dia(SEG), "SUMIU")).toEqual({
      kind: "workout",
      workoutId: "A",
    });
  });
});

describe("resolveToday — o que as telas consomem", () => {
  it("treino pendente não carrega 'próximo': seria empurrão para emendar outro", () => {
    const r = resolveToday(plano(), [], dia(SEG));
    expect(r).toMatchObject({
      kind: "workout",
      workoutId: "A",
      doneToday: false,
      nextWorkoutId: null,
      nextWorkoutName: null,
    });
  });

  it("treino concluído hoje expõe o fechamento E o que vem a seguir", () => {
    // Sem isto o `doneToday` era escrito e nunca lido: a tela Hoje seguia convidando a
    // "Começar treino" um minuto depois de o usuário terminar (review Codex, ciclo 2).
    const r = resolveToday(plano(), [sessao(QUI, "A")], dia(QUI));
    expect(r).toMatchObject({
      kind: "workout",
      workoutId: "A",
      doneToday: true,
      nextWorkoutId: "B",
      nextWorkoutName: "Treino B",
    });
  });

  it("no descanso, informa o próximo pelo nome", () => {
    const s = [sessao(SEG, "A"), sessao(TER, "B")];
    expect(resolveToday(plano(), s, dia(QUA))).toMatchObject({
      kind: "rest",
      reason: "cycle",
      nextWorkoutId: "A",
      nextWorkoutName: "Treino A",
    });
  });
});
