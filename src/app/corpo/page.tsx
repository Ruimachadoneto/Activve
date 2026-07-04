"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { WeightChart } from "@/components/WeightChart";
import { RecoveryMap } from "@/components/RecoveryMap";
import { getBodyLog, saveBodyEntry, getBodyEntry } from "@/lib/storage/bodylog";
import { getSessionsForPlan } from "@/lib/storage/sessions";
import {
  weightSeries,
  computeTrend,
  weightDelta,
  latestMeasures,
  MEASURES,
  type BodyEntry,
} from "@/lib/plan/body";
import { isoDate } from "@/lib/plan/session";
import {
  buildExerciseMuscles,
  computeRecovery,
  stimuliFromSessions,
} from "@/lib/plan/recovery";
import type { WorkoutSession } from "@/lib/plan/session";

const GOAL_LABEL: Record<string, string> = {
  lose_fat: "Perder gordura",
  gain_muscle: "Ganhar músculo",
  recomp: "Recomposição",
  maintain: "Manter",
  performance: "Performance",
};

type Tab = "overview" | "measures" | "history";

const round1 = (n: number) => Math.round(n * 10) / 10;

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

export default function CorpoPage() {
  const { loading, plan } = useActivePlan();
  const [entries, setEntries] = useState<BodyEntry[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [input, setInput] = useState("");
  const [measureDraft, setMeasureDraft] = useState<Record<string, string>>({});
  // Relógio do mapa: a recuperação é função do tempo, então o `now` precisa avançar
  // mesmo com a tela aberta (senão um músculo fica preso em "trabalhado" a noite toda).
  const [now, setNow] = useState(() => Date.now());

  const planId = plan?.planId ?? null;

  useEffect(() => {
    let cancelled = false;
    getBodyLog().then((list) => {
      if (cancelled) return;
      setEntries(() => list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSessions = useCallback(() => {
    if (!planId) return;
    getSessionsForPlan(planId)
      .then((list) => setSessions(list))
      .catch(() => {});
  }, [planId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const refresh = () => {
      setNow(Date.now());
      loadSessions();
    };
    const id = window.setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [loadSessions]);

  const recovery = useMemo(() => {
    if (!plan) return null;
    const getMuscles = buildExerciseMuscles(plan.plan);
    return computeRecovery(stimuliFromSessions(sessions, getMuscles, now), now);
  }, [plan, sessions, now]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Importe um plano para acompanhar sua evolução.</p>
        <Link href="/import" className="mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent">
          Importar plano
        </Link>
      </main>
    );
  }

  const p = plan.plan;
  const goal = p.goal;
  const startWeight = p.profile.weight_kg;
  const series = weightSeries(entries);
  const trend = computeTrend(entries, goal.targetWeight_kg);
  const latest = trend.latest ?? startWeight;
  const defaultWeight = trend.latest ?? startWeight;
  const delta30 = weightDelta(entries, 30);
  const measures = latestMeasures(entries);
  const historyDesc = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const gender: "male" | "female" = p.profile.sex === "female" ? "female" : "male";

  /** Cria/atualiza o registro de HOJE mesclando (não sobrescreve medidas ao salvar peso, e vice-versa). */
  async function upsertToday(patch: Partial<BodyEntry>) {
    const today = isoDate();
    const existing = await getBodyEntry(today);
    const entry: BodyEntry = {
      ...existing,
      ...patch,
      date: today,
      recordedAt: new Date().toISOString(),
      measures: { ...(existing?.measures ?? {}), ...(patch.measures ?? {}) },
    };
    if (entry.measures && Object.keys(entry.measures).length === 0) delete entry.measures;
    await saveBodyEntry(entry);
    setEntries((prev) => [...prev.filter((e) => e.date !== today), entry]);
  }

  async function saveWeight() {
    const n = parseFloat((input || String(defaultWeight)).replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return;
    await upsertToday({ weight_kg: round1(n) });
    setInput("");
  }

  async function saveMeasures() {
    const patch: Record<string, number> = {};
    for (const { key } of MEASURES) {
      const raw = measureDraft[key];
      if (raw == null) continue; // não tocado → mantém o que já havia
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      const n = parseFloat(trimmed.replace(",", "."));
      if (!Number.isNaN(n) && n > 0) patch[key] = round1(n);
    }
    if (Object.keys(patch).length === 0) return;
    await upsertToday({ measures: patch });
    setMeasureDraft({});
  }

  const measureValue = (key: string) => measureDraft[key] ?? (measures[key]?.toString() ?? "");

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header>
        <h1 className="text-xl font-medium tracking-tight">Corpo</h1>
        <p className="mt-0.5 text-sm text-muted">Sua evolução, sem cobrança.</p>
      </header>

      <div className="mt-5 flex rounded-xl border border-line bg-surface p-1 text-sm">
        {([
          ["overview", "Visão geral"],
          ["measures", "Medidas"],
          ["history", "Histórico"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
              tab === key ? "bg-accent text-on-accent" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <section
            className="mt-4 rounded-card border border-line p-5"
            style={{ background: "linear-gradient(180deg, #16263a 0%, #101d2e 60%)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">Recuperação muscular</p>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            </div>
            {recovery ? <RecoveryMap recovery={recovery} gender={gender} /> : null}
          </section>

          {/* Tendência de peso: número grande + chip de delta (30 dias) + gráfico */}
          <section className="mt-4 rounded-card border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-faint">Tendência de peso</p>
            <div className="mt-2 flex items-end justify-between">
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-medium leading-none tabular-nums">{latest}</span>
                <span className="pb-1 text-sm text-muted">kg</span>
              </div>
              {delta30 !== null ? (
                <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-surface2/60 px-2.5 py-1 text-xs text-muted">
                  {delta30 < 0 ? (
                    <TrendingDown size={13} aria-hidden className="text-accent" />
                  ) : delta30 > 0 ? (
                    <TrendingUp size={13} aria-hidden className="text-accent" />
                  ) : null}
                  {delta30 > 0 ? "+" : ""}
                  {delta30} kg · últ. 30 dias
                </span>
              ) : null}
            </div>

            {trend.toTargetKg !== undefined && trend.toTargetKg !== 0 ? (
              <p className="mt-1.5 text-sm text-accent">
                {Math.abs(trend.toTargetKg)} kg até o alvo de {goal.targetWeight_kg} kg
              </p>
            ) : null}

            {series.length >= 2 ? (
              <div className="mt-4">
                <WeightChart series={series} target={goal.targetWeight_kg} />
              </div>
            ) : (
              <p className="mt-3 text-xs text-faint">
                Registre mais um peso (aba Medidas) para ver a tendência.
              </p>
            )}
          </section>

          {/* Medidas principais (resumo, leitura) */}
          <section className="mt-4 rounded-card border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-faint">Medidas principais</p>
              <button
                type="button"
                onClick={() => setTab("measures")}
                className="inline-flex items-center gap-1 text-xs text-accent"
              >
                <Pencil size={12} aria-hidden /> Editar
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-baseline justify-between border-b border-line/60 pb-1.5">
                <dt className="text-sm text-muted">Peso</dt>
                <dd className="text-sm tabular-nums">
                  {trend.latest != null ? `${trend.latest} kg` : <span className="text-faint">—</span>}
                </dd>
              </div>
              {MEASURES.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between border-b border-line/60 pb-1.5"
                >
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="text-sm tabular-nums">
                    {measures[key] != null ? (
                      `${measures[key]} cm`
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-4 rounded-card border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-faint">Sua meta</p>
            <h2 className="mt-1.5 text-lg font-medium">{GOAL_LABEL[goal.type] ?? goal.type}</h2>
            {goal.summary ? <p className="mt-1 text-sm text-muted">{goal.summary}</p> : null}
            {goal.targetWeight_kg || goal.targetDate ? (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {goal.targetWeight_kg ? (
                  <span className="text-muted">
                    Alvo: <span className="text-ink">{goal.targetWeight_kg} kg</span>
                  </span>
                ) : null}
                {formatDate(goal.targetDate) ? (
                  <span className="text-muted">até {formatDate(goal.targetDate)}</span>
                ) : null}
              </div>
            ) : null}
          </section>
        </>
      ) : tab === "measures" ? (
        <>
          <section className="mt-4 rounded-card border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-faint">Registrar peso de hoje</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                inputMode="decimal"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={String(defaultWeight)}
                aria-label="Peso de hoje em kg"
                className="w-24 rounded-xl border border-line bg-surface2/30 px-3 py-2.5 text-center text-sm tabular-nums outline-none focus:border-accent/50"
              />
              <span className="text-sm text-muted">kg</span>
              <button
                type="button"
                onClick={saveWeight}
                className="ml-auto rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
              >
                Salvar
              </button>
            </div>
          </section>

          <section className="mt-4 rounded-card border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-faint">Medidas (cm)</p>
            <p className="mt-1 text-xs text-muted">Preencha o que quiser acompanhar. Fica opcional.</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {MEASURES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label htmlFor={`measure-${key}`} className="w-24 text-sm text-muted">
                    {label}
                  </label>
                  <input
                    id={`measure-${key}`}
                    inputMode="decimal"
                    value={measureValue(key)}
                    onChange={(e) => setMeasureDraft((d) => ({ ...d, [key]: e.target.value }))}
                    placeholder="—"
                    className="w-24 rounded-xl border border-line bg-surface2/30 px-3 py-2 text-center text-sm tabular-nums outline-none focus:border-accent/50"
                  />
                  <span className="text-sm text-faint">cm</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={saveMeasures}
              className="mt-4 w-full rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
            >
              Salvar medidas
            </button>
          </section>
        </>
      ) : (
        <section className="mt-4 rounded-card border border-line bg-surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Histórico</p>
          {historyDesc.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nenhum registro ainda. Comece pela aba Medidas.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {historyDesc.map((e, i) => {
                const measureCount = e.measures ? Object.keys(e.measures).length : 0;
                return (
                  <li
                    key={e.date}
                    className={`flex items-center justify-between py-2.5 ${
                      i > 0 ? "border-t border-line/60" : ""
                    }`}
                  >
                    <span className="text-sm">{formatDate(e.date)}</span>
                    <span className="flex items-center gap-3 text-sm">
                      {e.weight_kg != null ? (
                        <span className="tabular-nums">{e.weight_kg} kg</span>
                      ) : null}
                      {measureCount > 0 ? (
                        <span className="text-xs text-faint">
                          {measureCount} medida{measureCount > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <BottomNav active="corpo" />
    </main>
  );
}
