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
    }[];
    volumeByMuscle: { muscle: Muscle; sets: number; volume_kg?: number }[];
    flags: { exerciseId: string; type: "pain" | "skipped" | "swapped"; note?: string }[];
  };
  body: {
    weight: { start_kg?: number; latest_kg?: number; trend: "up" | "flat" | "down"; samples: number };
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

/** Nome do exercício no plano vigente (procura em todos os workouts); fallback = id. */
function exerciseName(plan: PlanFile, exerciseId: string): string {
  for (const w of plan.training.workouts) {
    const ex = w.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex.name;
  }
  return exerciseId;
}

function weightTrend(deltaKg: number): "up" | "flat" | "down" {
  if (deltaKg > 0.3) return "up";
  if (deltaKg < -0.3) return "down";
  return "flat";
}

/** Constrói o relatório de um período a partir dos dados já persistidos localmente. */
export function buildReport(
  plan: PlanFile,
  allSessions: WorkoutSession[],
  bodyEntries: BodyEntry[],
  period: ReportPeriod,
  userNotes?: string,
  now: Date = new Date(),
): ReportFile {
  const days = datesInPeriod(period);
  const sessions = allSessions.filter((s) => inPeriod(s.date, period));

  // ---- adherence ----
  const workoutsScheduled = days.filter((date) => {
    const idx = (new Date(`${date}T12:00:00`).getDay() + 6) % 7; // 0 = segunda
    return plan.training.weekSchedule[idx] !== "rest";
  }).length;
  const workoutsCompleted = sessions.filter((s) => s.status === "done").length;
  const workoutsPartial = sessions.filter((s) => s.status === "in_progress").length;
  const activeDays = new Set(sessions.map((s) => s.date)).size;

  // ---- training.exercises ----
  type Visit = { date: string; sets: { load_kg?: number; reps?: number; rpe?: number }[] };
  const byExercise = new Map<string, Visit[]>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const doneSets = ex.sets.filter((x) => x.done);
      if (doneSets.length === 0) continue;
      const list = byExercise.get(ex.exerciseId) ?? [];
      list.push({ date: s.date, sets: doneSets });
      byExercise.set(ex.exerciseId, list);
    }
  }
  const exercises = [...byExercise.entries()]
    .map(([exerciseId, visits]) => {
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
      return {
        exerciseId,
        name: exerciseName(plan, exerciseId),
        sessions: visits.length,
        totalSets,
        bestSet: { load_kg: bestSet?.load_kg, reps: bestSet?.reps },
        lastSet: { load_kg: lastSet?.load_kg, reps: lastSet?.reps, effort: lastSet?.rpe },
        trend,
      };
    })
    .sort((a, b) => b.totalSets - a.totalSets);

  // ---- training.volumeByMuscle ----
  const getMuscles = buildExerciseMuscles(plan);
  const muscleAcc = new Map<Muscle, { sets: number; volume_kg: number }>();
  for (const s of sessions) {
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
  const currentWeight_kg = weightLatest ?? overallWeight[overallWeight.length - 1]?.weight ?? plan.profile.weight_kg;

  return {
    schemaVersion: "1.0",
    meta: {
      // Inclui `now` (epoch base36) — `REPORT_SCHEMA.md` exige id ÚNICO; só período colidiria
      // se o usuário exportasse a mesma semana/mês duas vezes (achado do review Codex).
      reportId: `rp_${period.from}_${period.to}_${now.getTime().toString(36)}`,
      generatedAt: now.toISOString(),
      app: "activve@0.1.0",
      locale: "pt-BR",
      refersToPlanId: plan.meta.planId,
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
      },
      measures,
    },
    goal: {
      type: plan.goal.type,
      targetWeight_kg: plan.goal.targetWeight_kg,
      currentWeight_kg,
      targetDate: plan.goal.targetDate,
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
