import { describe, it, expect } from "vitest";
import { buildNotices, unreadCount, type NoticesInput } from "./notices";
import type { PlanFile } from "./schema";
import type { WorkoutSession } from "./session";
import type { BodyEntry } from "./body";

function plano(): PlanFile {
  return {
    profile: { daysPerWeek: 4 },
    meta: { planId: "pl_1" },
    training: {
      weekSchedule: ["A", "B", "rest", "A", "B", "rest", "rest"],
      workouts: [
        {
          id: "A",
          name: "Treino A",
          exercises: [
            { id: "supino", name: "Supino reto", sets: 3, primaryMuscles: ["chest"], secondaryMuscles: ["triceps"] },
          ],
        },
        {
          id: "B",
          name: "Treino B",
          exercises: [
            { id: "puxada", name: "Puxada frontal", sets: 3, primaryMuscles: ["lats"], secondaryMuscles: ["biceps"] },
          ],
        },
      ],
    },
  } as unknown as PlanFile;
}

/** Sessão concluída com uma série feita na carga indicada. */
function sessao(date: string, workoutId: string, exerciseId: string, load: number): WorkoutSession {
  return {
    sessionId: `pl_1:${workoutId}:${date}`,
    planId: "pl_1",
    workoutId,
    date,
    status: "done",
    startedAt: `${date}T19:00:00.000Z`,
    completedAt: `${date}T20:00:00.000Z`,
    exercises: [{ exerciseId, sets: [{ done: true, load_kg: load, reps: 8 }] }],
  } as WorkoutSession;
}

const peso = (date: string, weight_kg: number): BodyEntry => ({ date, weight_kg }) as BodyEntry;

const base = (over: Partial<NoticesInput> = {}): NoticesInput => ({
  plan: plano(),
  planImportedAt: "2026-07-20T10:00:00.000Z",
  sessions: [],
  bodyEntries: [],
  ...over,
});

/** 2026-07-27 é uma SEGUNDA (mesma referência dos testes de rotação). */
const SEG = "2026-07-27";
const TER = "2026-07-28";
const QUA = "2026-07-29";
const QUI = "2026-07-30";
const dia = (iso: string, hora = 9) =>
  new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)), hora);

describe("buildNotices — determinismo (a regra que sustenta o 'lido')", () => {
  it("o MESMO fato gera o mesmo id e o mesmo carimbo, em relógios diferentes", () => {
    /*
     * Os avisos são recalculados do zero a cada abertura; só os ids lidos ficam no disco.
     * Se um id (ou o `at`) dependesse de `now`, todo aviso já lido voltaria como "novo" na
     * abertura seguinte — o sino nunca apagaria.
     */
    const input = base({
      sessions: [sessao(SEG, "A", "supino", 60), sessao(TER, "B", "puxada", 50)],
      bodyEntries: [peso("2026-06-01", 84)],
    });
    const cedo = buildNotices(input, dia(QUI, 8));
    const tarde = buildNotices(input, dia(QUI, 23));
    expect(cedo.map((n) => n.id)).toEqual(tarde.map((n) => n.id));
    expect(cedo.map((n) => n.at)).toEqual(tarde.map((n) => n.at));
  });

  it("nunca emite aviso com carimbo no futuro", () => {
    const avisos = buildNotices(
      base({ sessions: [sessao(QUI, "A", "supino", 60)], bodyEntries: [peso("2026-06-01", 84)] }),
      dia(QUI, 12),
    );
    const agora = dia(QUI, 12).getTime();
    for (const a of avisos) expect(new Date(a.at).getTime()).toBeLessThanOrEqual(agora);
  });

  it("ordena do mais recente para o mais antigo", () => {
    const avisos = buildNotices(
      base({ sessions: [sessao(SEG, "A", "supino", 60), sessao(QUA, "A", "supino", 70)] }),
      dia(QUI),
    );
    const carimbos = avisos.map((n) => n.at);
    expect([...carimbos].sort((a, b) => b.localeCompare(a))).toEqual(carimbos);
  });
});

describe("buildNotices — recorde", () => {
  it("carga maior que a anterior vira aviso, com a régua explícita", () => {
    const s = [sessao(SEG, "A", "supino", 60), sessao(QUA, "A", "supino", 70)];
    const rec = buildNotices(base({ sessions: s }), dia(QUI)).find((n) => n.kind === "record");
    expect(rec?.title).toBe("Novo recorde em Supino reto");
    expect(rec?.body).toContain("70 kg");
    expect(rec?.body).toContain("60 kg");
    expect(rec?.href).toBe(`/relatorios?d=${QUA}`);
  });

  it("primeira vez num exercício NÃO é recorde", () => {
    // Sem régua anterior não há o que superar — anunciar seria inventar conquista.
    const avisos = buildNotices(base({ sessions: [sessao(SEG, "A", "supino", 60)] }), dia(TER));
    expect(avisos.some((n) => n.kind === "record")).toBe(false);
  });
});

describe("buildNotices — semana e peso", () => {
  it("meta semanal atingida vira aviso carimbado na sessão que fechou", () => {
    const s = [
      sessao(SEG, "A", "supino", 60),
      sessao(TER, "B", "puxada", 50),
      sessao(QUA, "A", "supino", 61),
      sessao(QUI, "B", "puxada", 51),
    ];
    const w = buildNotices(base({ sessions: s }), dia(QUI, 22)).find((n) => n.kind === "week_done");
    expect(w?.id).toBe(`week_done:${SEG}`); // estável pela semana, não pelo dia da leitura
    expect(w?.at).toBe(`${QUI}T20:00:00.000Z`);
    expect(w?.body).toContain("4");
  });

  it("abaixo da meta não vira aviso — ausência não é cobrança", () => {
    const avisos = buildNotices(base({ sessions: [sessao(SEG, "A", "supino", 60)] }), dia(QUI));
    expect(avisos.some((n) => n.kind === "week_done")).toBe(false);
  });

  it("peso parado há mais de 14 dias avisa, carimbado em quando PAROU", () => {
    const a = buildNotices(base({ bodyEntries: [peso("2026-07-01", 84)] }), dia(QUI)).find(
      (n) => n.kind === "weight_stale",
    );
    expect(a?.id).toBe("weight_stale:2026-07-01");
    expect(a?.at.slice(0, 10)).toBe("2026-07-15"); // 01/07 + 14 dias
  });

  it("quem NUNCA registrou peso não é cutucado", () => {
    // "Nunca começou" não é "parado". Cobrar quem não começou é culpa, não aviso.
    const avisos = buildNotices(base({ bodyEntries: [] }), dia(QUI));
    expect(avisos.some((n) => n.kind === "weight_stale")).toBe(false);
  });

  it("plano com 8 semanas sugere um ciclo novo, uma vez só", () => {
    const a = buildNotices(
      base({ planImportedAt: "2026-05-01T10:00:00.000Z" }),
      dia(QUI),
    ).find((n) => n.kind === "plan_age");
    expect(a?.id).toBe("plan_age:pl_1");
    expect(a?.href).toBe("/mais");
  });
});

describe("buildNotices — recuperação", () => {
  it("sem nada trabalhado, não anuncia 'recuperado'", () => {
    /*
     * Corpo do qual nada foi medido não tem travessia a anunciar. Dizer "está tudo pronto"
     * seria a mesma afirmação vazia que a §9 barra no número-herói do Hoje.
     */
    const avisos = buildNotices(base({ sessions: [] }), dia(QUI));
    expect(avisos.some((n) => n.kind === "ready")).toBe(false);
  });

  it("enquanto algum músculo do próximo treino não recuperou, silêncio", () => {
    // Treinou A ontem: o próximo é B, mas o peito/tríceps de A ainda não entram nele —
    // então o que decide é a recuperação dos músculos de B, que nunca foram trabalhados.
    const avisos = buildNotices(base({ sessions: [sessao(QUA, "B", "puxada", 50)] }), dia(QUA, 20));
    expect(avisos.some((n) => n.kind === "ready")).toBe(false);
  });
});

describe("robustez e leitura", () => {
  it("plano histórico malformado não derruba a geração (TASK-013)", () => {
    const ruim = {
      profile: {},
      meta: { planId: "pl_x" },
      training: { weekSchedule: ["A"], workouts: [null, { id: "A" }] },
    } as unknown as PlanFile;
    expect(() =>
      buildNotices({ plan: ruim, planImportedAt: null, sessions: [], bodyEntries: [] }, dia(QUI)),
    ).not.toThrow();
  });

  it("sem plano nenhum, devolve lista vazia em vez de estourar", () => {
    expect(buildNotices({ plan: null, sessions: [], bodyEntries: [] }, dia(QUI))).toEqual([]);
  });

  it("unreadCount conta só o que não foi lido", () => {
    const avisos = buildNotices(
      base({ sessions: [sessao(SEG, "A", "supino", 60), sessao(QUA, "A", "supino", 70)] }),
      dia(QUI),
    );
    expect(unreadCount(avisos, [])).toBe(avisos.length);
    expect(unreadCount(avisos, avisos.map((n) => n.id))).toBe(0);
  });
});
