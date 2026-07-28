/**
 * Relatório de período (semana/mês) — camada pura, sem IndexedDB/React aqui.
 * Espelha `docs/ai/REPORT_SCHEMA.md` (schemaVersion 1.0): é o que o app exporta e o
 * coach (Claude Project) re-ingere pra fechar o ciclo (ADR-002).
 *
 * Simplificações honestas do v1 (documentadas — "reporta só o que foi registrado",
 * nunca inventa): `training.flags` sempre vazio (detecção de dor/pulado por texto
 * livre é NLP, fora de escopo); `goal.paceVsTarget` sempre "na" (é um julgamento, sem
 * cálculo ainda); `diet.adherencePct`/`mealsCheckedPct` sempre 0 (app não rastreia
 * dieta ainda — Fase 1 do PRODUCT_VISION.md); `adherence.workoutsScheduled` usa o
 * `weekSchedule` do plano, sem considerar overrides do dia (TASK-016).
 */

import type { Muscle, PlanFile } from "./schema";
import type { WorkoutSession } from "./session";
import type { BodyEntry } from "./body";
import { weightSeries } from "./body";
import { buildExerciseMuscles } from "./recovery";

export type ReportPeriod = { from: string; to: string }; // yyyy-mm-dd, inclusive

export type ReportFile = {
  schemaVersion: "1.0";
  meta: {
    reportId: string;
    generatedAt: string;
    app: string;
    locale: string;
    refersToPlanId: string;
    period: ReportPeriod;
  };
  adherence: {
    workoutsScheduled: number;
    workoutsCompleted: number;
    workoutsPartial: number;
    mealsCheckedPct: number;
    activeDays: number;
    totalDays: number;
  };
  training: {
    exercises: {
      exerciseId: string;
      name: string;
      sessions: number;
      totalSets: number;
      bestSet: { load_kg?: number; reps?: number };
      lastSet: { load_kg?: number; reps?: number; effort?: number };
      trend: "up" | "flat" | "down";
      /** Carga média por visita, em ordem — alimenta o gráfico de progressão. */
      series: { date: string; avgLoad: number }[];
    }[];
    volumeByMuscle: { muscle: Muscle; sets: number; volume_kg?: number }[];
    flags: { exerciseId: string; type: "pain" | "skipped" | "swapped"; note?: string }[];
  };
  body: {
    weight: {
      start_kg?: number;
      latest_kg?: number;
      trend: "up" | "flat" | "down";
      samples: number;
      /** Série completa (data+peso) dentro do período — alimenta o gráfico do relatório visual. */
      series: { date: string; weight: number }[];
    };
    measures: { key: string; start_cm?: number; latest_cm?: number; delta_cm?: number }[];
  };
  goal: {
    type: PlanFile["goal"]["type"];
    targetWeight_kg?: number;
    currentWeight_kg?: number;
    targetDate?: string;
    paceVsTarget: "ahead" | "on_track" | "behind" | "na";
  };
  diet: { adherencePct: number; notes?: string };
  userNotes?: string;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Datas (yyyy-mm-dd) do período, inclusive em ambas as pontas. */
function datesInPeriod(period: ReportPeriod): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = period.from.split("-").map(Number);
  const [ty, tm, td] = period.to.split("-").map(Number);
  const cur = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function inPeriod(date: string, period: ReportPeriod): boolean {
  return date >= period.from && date <= period.to;
}

/**
 * Nome do movimento efetivamente executado: se houve troca (`swappedToId`), busca
 * dentro das `alternatives` do exercício base — ids de variação são escopados ao
 * exercício, não existem no nível do treino (mesma pegadinha do `recovery.ts`, já
 * corrigida na UI do calendário — aqui é a mesma lógica pro relatório).
 */
function exerciseName(plan: PlanFile, exerciseId: string, swappedToId?: string): string {
  for (const w of Array.isArray(plan.training?.workouts) ? plan.training.workouts : []) {
    // Um treino corrompido no meio de um plano histórico não pode cegar os OUTROS
    // treinos do mesmo ciclo — pula só ele (TASK-013 / review Codex).
    if (!Array.isArray(w?.exercises)) continue;
    const ex = w.exercises.find((e) => e?.id === exerciseId);
    if (!ex) continue;
    const base = label(ex?.name) ?? swappedToId ?? exerciseId;
    if (!swappedToId) return base;
    // `alternatives` não-array (plano histórico corrompido) não tem `.find` — cai no
    // nome do exercício base em vez de estourar (TASK-013 / review Codex).
    if (!Array.isArray(ex.alternatives)) return base;
    // `a?.id`: elemento nulo dentro de `alternatives` não pode derrubar a busca.
    return label(ex.alternatives.find((a) => a?.id === swappedToId)?.name) ?? base;
  }
  return swappedToId ?? exerciseId;
}

/**
 * Rótulo utilizável ou `undefined` — o chamador decide o fallback.
 *
 * Um plano HISTÓRICO só passou por guarda estrutural (TASK-013): qualquer campo pode
 * faltar ou vir com o tipo errado. Sem isto, `ex.name` ausente virava rótulo em branco
 * na UI e furava o contrato `string` do `ReportFile` (achado do review Codex). A regra
 * geral desta camada: **resolver nome é função total** — nunca devolve algo inútil.
 */
function label(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** Um plano já importado, com a data em que o ciclo começou — pra resolver qual
 * definição valia numa data específica (histórico cruza planos, TASK-018). */
export type KnownPlan = { planId: string; importedAt: string; plan: PlanFile };

/**
 * Plano vigente numa data: o mais recente entre os que já existiam nela
 * (`importedAt <= date`). Sem nenhum candidato (data anterior a todo histórico
 * conhecido), cai no mais antigo conhecido — melhor aproximação disponível; sem
 * nenhum plano conhecido, cai no `fallback` (o ativo). **Não decide sozinho se o dia
 * "conta" como agendado** — isso é responsabilidade de quem chama (ver `earliestKnown`
 * em `buildReport`: dias antes do primeiro plano nunca deveriam ter agenda nenhuma).
 */
function planForDate(knownPlans: KnownPlan[], date: string, fallback: PlanFile): PlanFile {
  if (knownPlans.length === 0) return fallback;
  const sorted = [...knownPlans].sort((a, b) => a.importedAt.localeCompare(b.importedAt));
  const candidates = sorted.filter((p) => p.importedAt.slice(0, 10) <= date);
  if (candidates.length > 0) return candidates[candidates.length - 1].plan; // mais recente válido
  return sorted[0].plan; // nenhum existia ainda: mais antigo conhecido
}

/** Plano de uma sessão pelo `planId` dela — histórico real, não o ativo (TASK-018). */
function planForSession(knownPlans: KnownPlan[], planId: string, fallback: PlanFile): PlanFile {
  return knownPlans.find((p) => p.planId === planId)?.plan ?? fallback;
}

function weightTrend(deltaKg: number): "up" | "flat" | "down" {
  if (deltaKg > 0.3) return "up";
  if (deltaKg < -0.3) return "down";
  return "flat";
}

/**
 * Constrói o relatório de um período a partir dos dados já persistidos localmente.
 * `activePlan` decide `goal`/`refersToPlanId` (o ciclo vigente); `knownPlans` resolve
 * nome de exercício/músculos/agenda de cada sessão pelo plano que estava valendo
 * NAQUELE momento — sem isso, sessões de antes de uma troca de plano ficariam sem
 * dado (achado do review Codex: o relatório virou "acompanhe seu progresso", não faz
 * sentido perder o histórico de um ciclo anterior só porque o usuário trocou de plano).
 */
export function buildReport(
  activePlan: PlanFile,
  knownPlans: KnownPlan[],
  allSessions: WorkoutSession[],
  bodyEntries: BodyEntry[],
  period: ReportPeriod,
  userNotes?: string,
  now: Date = new Date(),
): ReportFile {
  const days = datesInPeriod(period);
  const sessions = allSessions.filter((s) => inPeriod(s.date, period));

  // ---- adherence ----
  // Dia ANTES de qualquer plano ter existido não "conta" como agendado — não dá pra
  // ter perdido um treino de um app que a pessoa nem tinha ainda (achado do review
  // Codex: sem isso, exportar um período que começa antes do primeiro plano inventava
  // agenda pra dias em que não havia plano nenhum, usando o mais antigo por engano).
  const earliestKnown =
    knownPlans.length > 0
      ? [...knownPlans].sort((a, b) => a.importedAt.localeCompare(b.importedAt))[0].importedAt.slice(0, 10)
      : null;
  const workoutsScheduled = days.filter((date) => {
    if (earliestKnown != null && date < earliestKnown) return false;
    const p = planForDate(knownPlans, date, activePlan);
    const idx = (new Date(`${date}T12:00:00`).getDay() + 6) % 7; // 0 = segunda
    // Plano histórico pode ter passado só pela guarda estrutural (TASK-013), que não
    // exige `weekSchedule`. Sem agenda legível não dá pra afirmar que o dia era de
    // treino — e inventar "agendado" faria a constância parecer PIOR do que foi, o que
    // viola o princípio anti-culpa. Na dúvida, o dia não conta.
    const schedule = p.training?.weekSchedule;
    if (!Array.isArray(schedule)) return false;
    return schedule[idx] !== "rest";
  }).length;
  const workoutsCompleted = sessions.filter((s) => s.status === "done").length;
  const workoutsPartial = sessions.filter((s) => s.status === "in_progress").length;
  const activeDays = new Set(sessions.map((s) => s.date)).size;

  // ---- training.exercises ----
  // Agrupado pelo MOVIMENTO efetivo (exercício + variação), não só `exerciseId` — misturar
  // uma troca de variação (ex.: agachamento → leg press) no mesmo grupo compararia cargas
  // de movimentos diferentes como se fossem progressão do mesmo (achado do review Codex;
  // mesmo critério já usado em `previousPerformance`/`session.ts` pra continuidade).
  type Visit = { date: string; planId: string; sets: { load_kg?: number; reps?: number; rpe?: number }[] };
  type Group = { exerciseId: string; swappedToId?: string; visits: Visit[] };
  const byMovement = new Map<string, Group>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const doneSets = ex.sets.filter((x) => x.done);
      if (doneSets.length === 0) continue;
      const movementKey = `${ex.exerciseId}::${ex.swappedToId ?? ""}`;
      const group = byMovement.get(movementKey) ?? {
        exerciseId: ex.exerciseId,
        swappedToId: ex.swappedToId,
        visits: [],
      };
      group.visits.push({ date: s.date, planId: s.planId, sets: doneSets });
      byMovement.set(movementKey, group);
    }
  }
  const exercises = [...byMovement.values()]
    .map(({ exerciseId, swappedToId, visits }) => {
      visits.sort((a, b) => a.date.localeCompare(b.date));
      const allSets = visits.flatMap((v) => v.sets);
      const totalSets = allSets.length;
      const bestSet = allSets.reduce(
        (best, s) => ((s.load_kg ?? -1) > (best.load_kg ?? -1) ? s : best),
        allSets[0],
      );
      const lastVisit = visits[visits.length - 1];
      const lastSet = lastVisit.sets[lastVisit.sets.length - 1];
      const avgLoad = (v: Visit) => {
        const loaded = v.sets.filter((s) => s.load_kg != null);
        if (loaded.length === 0) return null;
        return loaded.reduce((a, s) => a + (s.load_kg ?? 0), 0) / loaded.length;
      };
      const firstAvg = avgLoad(visits[0]);
      const lastAvg = avgLoad(lastVisit);
      let trend: "up" | "flat" | "down" = "flat";
      if (visits.length > 1 && firstAvg != null && lastAvg != null && firstAvg > 0) {
        const change = (lastAvg - firstAvg) / firstAvg;
        trend = change > 0.05 ? "up" : change < -0.05 ? "down" : "flat";
      }
      // Carga média por visita, em ordem — alimenta o gráfico de progressão no
      // relatório visual (pedido do usuário: "observações de progressão de carga").
      const series = visits
        .map((v) => ({ date: v.date, avgLoad: avgLoad(v) ?? undefined }))
        .filter((p): p is { date: string; avgLoad: number } => p.avgLoad != null);
      // Nome resolvido pelo plano da visita mais RECENTE — se o exercício mudou de
      // nome entre planos (mesmo id, continuidade do ADR-002), mostra como é hoje.
      const namePlan = planForSession(knownPlans, lastVisit.planId, activePlan);
      return {
        exerciseId,
        name: exerciseName(namePlan, exerciseId, swappedToId),
        sessions: visits.length,
        totalSets,
        bestSet: { load_kg: bestSet?.load_kg, reps: bestSet?.reps },
        lastSet: { load_kg: lastSet?.load_kg, reps: lastSet?.reps, effort: lastSet?.rpe },
        trend,
        series,
      };
    })
    .sort((a, b) => b.totalSets - a.totalSets);

  // ---- training.volumeByMuscle ----
  // Resolve por sessão (memoizado por planId) — mesma razão do `training.exercises`
  // acima: o mapeamento exercício→músculo pode diferir entre ciclos.
  const musclesCache = new Map<string, ReturnType<typeof buildExerciseMuscles>>();
  function getMusclesFor(planId: string) {
    let fn = musclesCache.get(planId);
    if (!fn) {
      fn = buildExerciseMuscles(planForSession(knownPlans, planId, activePlan));
      musclesCache.set(planId, fn);
    }
    return fn;
  }
  const muscleAcc = new Map<Muscle, { sets: number; volume_kg: number }>();
  for (const s of sessions) {
    const getMuscles = getMusclesFor(s.planId);
    for (const ex of s.exercises) {
      const doneSets = ex.sets.filter((x) => x.done);
      if (doneSets.length === 0) continue;
      const muscles = getMuscles(ex.exerciseId, ex.swappedToId);
      if (!muscles) continue;
      const setVolume = doneSets.reduce((sum, s2) => sum + (s2.load_kg ?? 0) * (s2.reps ?? 0), 0);
      for (const muscle of muscles.primary) {
        const acc = muscleAcc.get(muscle) ?? { sets: 0, volume_kg: 0 };
        acc.sets += doneSets.length;
        acc.volume_kg += setVolume;
        muscleAcc.set(muscle, acc);
      }
      for (const muscle of muscles.secondary ?? []) {
        const acc = muscleAcc.get(muscle) ?? { sets: 0, volume_kg: 0 };
        acc.sets += doneSets.length * 0.5;
        acc.volume_kg += setVolume * 0.5;
        muscleAcc.set(muscle, acc);
      }
    }
  }
  const volumeByMuscle = [...muscleAcc.entries()]
    .map(([muscle, v]) => ({
      muscle,
      sets: Math.round(v.sets * 10) / 10,
      volume_kg: v.volume_kg > 0 ? round1(v.volume_kg) : undefined,
    }))
    .sort((a, b) => b.sets - a.sets);

  // ---- body ----
  const bodyInPeriod = bodyEntries.filter((e) => inPeriod(e.date, period));
  const weightPts = weightSeries(bodyInPeriod);
  const weightStart = weightPts[0]?.weight;
  const weightLatest = weightPts[weightPts.length - 1]?.weight;
  // `measures[key]` pode ser `null` — uma LÁPIDE (a medida foi apagada nesse dia, ver
  // body.ts). Ignorar lápides faria o relatório mostrar o valor antigo como "atual"
  // mesmo depois do usuário apagar (achado do review Codex) — por isso o toque mais
  // recente (número OU lápide) decide `latest_cm`/`start_cm`, não só o último número.
  const measures = ["waist", "chest", "thigh", "arm"].map((key) => {
    const touches = bodyInPeriod
      .filter((e) => e.measures?.[key] !== undefined)
      .map((e) => ({ date: e.date, value: e.measures![key] }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const start_cm = touches[0]?.value ?? undefined;
    const latest_cm = touches[touches.length - 1]?.value ?? undefined;
    return {
      key,
      start_cm,
      latest_cm,
      delta_cm: start_cm != null && latest_cm != null ? round1(latest_cm - start_cm) : undefined,
    };
  });

  // ---- goal ----
  const overallWeight = weightSeries(bodyEntries);
  const currentWeight_kg = weightLatest ?? overallWeight[overallWeight.length - 1]?.weight ?? activePlan.profile.weight_kg;

  return {
    schemaVersion: "1.0",
    meta: {
      // Inclui `now` (epoch base36) — `REPORT_SCHEMA.md` exige id ÚNICO; só período colidiria
      // se o usuário exportasse a mesma semana/mês duas vezes (achado do review Codex).
      reportId: `rp_${period.from}_${period.to}_${now.getTime().toString(36)}`,
      generatedAt: now.toISOString(),
      app: "activve@0.1.0",
      locale: "pt-BR",
      refersToPlanId: activePlan.meta.planId,
      period,
    },
    adherence: {
      workoutsScheduled,
      workoutsCompleted,
      workoutsPartial,
      mealsCheckedPct: 0,
      activeDays,
      totalDays: days.length,
    },
    training: { exercises, volumeByMuscle, flags: [] },
    body: {
      weight: {
        start_kg: weightStart,
        latest_kg: weightLatest,
        trend:
          weightStart != null && weightLatest != null ? weightTrend(weightLatest - weightStart) : "flat",
        samples: weightPts.length,
        series: weightPts,
      },
      measures,
    },
    goal: {
      type: activePlan.goal.type,
      targetWeight_kg: activePlan.goal.targetWeight_kg,
      currentWeight_kg,
      targetDate: activePlan.goal.targetDate,
      paceVsTarget: "na",
    },
    diet: { adherencePct: 0, notes: "Sem rastreio de refeições no app ainda." },
    userNotes,
  };
}

/** Resumo legível (Markdown) do relatório — pro usuário copiar/levar ao coach. */
export function reportToMarkdown(report: ReportFile): string {
  const lines: string[] = [];
  lines.push(`# Relatório Activve — ${report.meta.period.from} a ${report.meta.period.to}`);
  lines.push("");
  lines.push("## Constância");
  lines.push(
    `- Treinos: ${report.adherence.workoutsCompleted} concluídos de ${report.adherence.workoutsScheduled} agendados` +
      (report.adherence.workoutsPartial ? ` (+${report.adherence.workoutsPartial} em andamento)` : ""),
  );
  lines.push(`- Dias ativos: ${report.adherence.activeDays} de ${report.adherence.totalDays}`);
  lines.push("");
  if (report.training.exercises.length > 0) {
    lines.push("## Exercícios");
    for (const ex of report.training.exercises) {
      const best = ex.bestSet.load_kg != null ? `${ex.bestSet.load_kg} kg × ${ex.bestSet.reps ?? "—"}` : "—";
      const trendLabel = ex.trend === "up" ? "subindo" : ex.trend === "down" ? "caindo" : "estável";
      lines.push(`- **${ex.name}** — ${ex.sessions}x, ${ex.totalSets} séries, melhor ${best} (${trendLabel})`);
    }
    lines.push("");
  }
  if (report.body.weight.latest_kg != null) {
    lines.push("## Corpo");
    lines.push(
      `- Peso: ${report.body.weight.start_kg ?? "—"} kg → ${report.body.weight.latest_kg} kg (${report.body.weight.samples} registros)`,
    );
    for (const m of report.body.measures) {
      if (m.delta_cm != null) lines.push(`- ${m.key}: ${m.delta_cm > 0 ? "+" : ""}${m.delta_cm} cm`);
    }
    lines.push("");
  }
  if (report.userNotes) {
    lines.push("## Notas");
    lines.push(report.userNotes);
  }
  return lines.join("\n");
}
