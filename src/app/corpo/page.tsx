"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { WeightChart } from "@/components/WeightChart";
import { RecoveryMap } from "@/components/RecoveryMap";
import { getBodyLog, saveBodyEntry } from "@/lib/storage/bodylog";
import { getSessionsForPlan } from "@/lib/storage/sessions";
import { makeEntry, weightSeries, computeTrend, type BodyEntry } from "@/lib/plan/body";
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

type Tab = "overview" | "measurements";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  // Data-only (yyyy-mm-dd) é parseada como LOCAL — senão o fuso volta um dia.
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

  // Mantém o mapa fresco: tica o relógio a cada 5 min (envelhecimento) e, ao voltar
  // para a aba/app, também recarrega as sessões — cobre treino concluído noutra aba
  // com a tela aberta, além do simples passar do tempo.
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
  // A lib de anatomia só oferece male/female (não há silhueta neutra). Os dados de
  // recuperação são iguais para qualquer corpo (mesmos músculos) — só a silhueta muda;
  // por isso `sex: "other"` cai em "male" como default ilustrativo. Corpo neutro é
  // limitação conhecida, candidata à Fase 2 (assets realistas). Ver docs/ai/STATUS.md.
  const gender: "male" | "female" = p.profile.sex === "female" ? "female" : "male";

  async function save() {
    const n = parseFloat((input || String(defaultWeight)).replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return;
    const entry = makeEntry(n);
    await saveBodyEntry(entry);
    setEntries((prev) => [...prev.filter((e) => e.date !== entry.date), entry]);
    setInput("");
  }

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header>
        <h1 className="text-xl font-medium tracking-tight">Corpo</h1>
        <p className="mt-0.5 text-sm text-muted">Sua evolução, sem cobrança.</p>
      </header>

      <div className="mt-5 flex rounded-xl border border-line bg-surface p-1 text-sm">
        {([
          ["overview", "Visão geral"],
          ["measurements", "Medições"],
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
            style={{
              background:
                "linear-gradient(180deg, #16263a 0%, #101d2e 60%)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">
                Recuperação muscular
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            </div>
            {recovery ? <RecoveryMap recovery={recovery} gender={gender} /> : null}
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
      ) : (
        <>
          <section className="mt-4 rounded-card border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-wider text-faint">Peso</p>
            <div className="mt-1.5 flex items-end gap-1.5">
              <span className="text-3xl font-medium leading-none">{latest}</span>
              <span className="pb-0.5 text-sm text-muted">kg</span>
            </div>
            {trend.deltaKg !== undefined ? (
              <p className="mt-1.5 text-sm text-muted">
                {trend.deltaKg > 0 ? "+" : ""}
                {trend.deltaKg} kg desde o início · oscilação é normal
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-faint">Peso inicial do plano.</p>
            )}
            {trend.toTargetKg !== undefined && trend.toTargetKg !== 0 ? (
              <p className="mt-0.5 text-sm text-accent">{Math.abs(trend.toTargetKg)} kg até o alvo</p>
            ) : null}

            {series.length >= 2 ? (
              <div className="mt-4">
                <WeightChart series={series} target={goal.targetWeight_kg} />
              </div>
            ) : (
              <p className="mt-3 text-xs text-faint">Registre mais um peso para ver a tendência.</p>
            )}
          </section>

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
                onClick={save}
                className="ml-auto rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
              >
                Salvar
              </button>
            </div>
          </section>
        </>
      )}

      <BottomNav active="corpo" />
    </main>
  );
}
