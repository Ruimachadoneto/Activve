"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, Download } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { getAllSessions } from "@/lib/storage/sessions";
import { getBodyLog } from "@/lib/storage/bodylog";
import { getAllPlans, type StoredPlan } from "@/lib/storage/plans";
import { isoDate, type WorkoutSession } from "@/lib/plan/session";
import type { BodyEntry } from "@/lib/plan/body";
import { buildReport, reportToMarkdown, type ReportPeriod } from "@/lib/plan/report";
import { weekDates } from "@/lib/plan/today";
import type { PlanFile } from "@/lib/plan/schema";

const WEEK_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"] as const;

function monthLabel(y: number, m: number): string {
  const label = new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Grade do mês (yyyy-mm-dd), começando na segunda da semana que contém o dia 1. */
function monthGrid(y: number, m: number): string[][] {
  const first = new Date(y, m, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = segunda
  const start = new Date(y, m, 1 - firstWeekday);
  const weeks: string[][] = [];
  const cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const yy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const dd = String(cur.getDate()).padStart(2, "0");
      week.push(`${yy}-${mm}-${dd}`);
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur.getMonth() !== m && cur.getDate() > 7) break; // já cobriu o mês inteiro
  }
  return weeks;
}

function monthPeriod(y: number, m: number): ReportPeriod {
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const { loading, plan } = useActivePlan();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [bodyEntries, setBodyEntries] = useState<BodyEntry[]>([]);
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [selected, setSelected] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<{ label: string; markdown: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllSessions(), getBodyLog(), getAllPlans()]).then(([s, b, p]) => {
      if (cancelled) return;
      setSessions(s);
      setBodyEntries(b);
      setPlans(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [sessions]);

  const plansById = useMemo(() => {
    const map = new Map<string, PlanFile>();
    for (const p of plans) map.set(p.planId, p.plan);
    if (plan) map.set(plan.planId, plan.plan);
    return map;
  }, [plans, plan]);

  function exerciseName(planId: string, exerciseId: string): string {
    const p = plansById.get(planId);
    if (!p) return exerciseId;
    for (const w of p.training.workouts) {
      const ex = w.exercises.find((e) => e.id === exerciseId);
      if (ex) return ex.name;
    }
    return exerciseId;
  }

  function workoutName(planId: string, workoutId: string): string {
    return plansById.get(planId)?.training.workouts.find((w) => w.id === workoutId)?.name ?? workoutId;
  }

  function exportPeriod(period: ReportPeriod, label: string) {
    if (!plan) return;
    const report = buildReport(plan.plan, sessions, bodyEntries, period);
    downloadJson(`activve-relatorio-${period.from}_a_${period.to}.json`, report);
    setExportPreview({ label, markdown: reportToMarkdown(report) });
    setCopied(false);
  }

  const weeks = monthGrid(view.y, view.m);
  const selectedSessions = selected ? (sessionsByDate.get(selected) ?? []) : [];
  const todayStr = isoDate(today);

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header>
        <h1 className="text-xl font-medium tracking-tight">Relatórios</h1>
        <p className="mt-0.5 text-sm text-muted">Seu histórico de treino, dia a dia.</p>
      </header>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Carregando…</p>
      ) : !plan ? (
        <section className="mt-5 rounded-card border border-line bg-surface p-5 text-center">
          <p className="text-sm text-muted">Importe um plano pra começar a treinar.</p>
          <Link href="/import" className="mt-4 inline-block text-sm text-accent">
            Importar plano
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-5 rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() =>
                  setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-surface2"
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <p className="text-sm font-medium">{monthLabel(view.y, view.m)}</p>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() =>
                  setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-surface2"
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-faint">
              {WEEK_DAYS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((date) => {
                    const inMonth = Number(date.slice(5, 7)) === view.m + 1;
                    const has = sessionsByDate.has(date);
                    const done = (sessionsByDate.get(date) ?? []).some((s) => s.status === "done");
                    const isToday = date === todayStr;
                    const isSelected = date === selected;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={!has}
                        onClick={() => setSelected(date)}
                        aria-label={date}
                        aria-pressed={isSelected}
                        className={`relative flex h-9 items-center justify-center rounded-lg text-xs transition-colors ${
                          !inMonth ? "text-faint/40" : isSelected ? "bg-accent text-on-accent" : "text-ink"
                        } ${has && !isSelected ? "hover:bg-surface2" : ""} ${
                          isToday && !isSelected ? "border border-accent/50" : ""
                        }`}
                      >
                        {Number(date.slice(8, 10))}
                        {has ? (
                          <span
                            className={`absolute bottom-1 h-1 w-1 rounded-full ${
                              isSelected ? "bg-on-accent" : done ? "bg-accent" : "bg-faint"
                            }`}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {selected ? (
            <section className="mt-4 rounded-card border border-line bg-surface p-4">
              <p className="text-[11px] uppercase tracking-wider text-faint">
                {new Date(`${selected}T12:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
              {selectedSessions.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nenhum treino registrado neste dia.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-4">
                  {selectedSessions.map((s) => (
                    <div key={s.sessionId}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{workoutName(s.planId, s.workoutId)}</p>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                            s.status === "done"
                              ? "bg-accent/15 text-accent"
                              : "border border-line text-faint"
                          }`}
                        >
                          {s.status === "done" ? "concluído" : "em andamento"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {s.exercises.map((ex) => {
                          const doneSets = ex.sets.filter((set) => set.done);
                          if (doneSets.length === 0) return null;
                          return (
                            <div key={ex.exerciseId} className="rounded-xl bg-surface2/40 px-3 py-2">
                              <p className="text-xs font-medium text-ink">
                                {exerciseName(s.planId, ex.swappedToId ?? ex.exerciseId)}
                              </p>
                              <div className="mt-1 flex flex-col gap-0.5">
                                {doneSets.map((set, i) => (
                                  <p key={i} className="text-xs text-muted tabular-nums">
                                    Série {i + 1}: {set.load_kg != null ? `${set.load_kg} kg` : "—"}
                                    {set.reps != null ? ` × ${set.reps}` : ""}
                                    {set.rpe != null ? ` · RPE ${set.rpe}` : ""}
                                  </p>
                                ))}
                              </div>
                              {ex.note ? (
                                <p className="mt-1.5 text-xs italic text-faint">&ldquo;{ex.note}&rdquo;</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="mt-4 rounded-card border border-line bg-surface p-4">
            <p className="text-[11px] uppercase tracking-wider text-faint">Exportar relatório</p>
            <p className="mt-1 text-xs text-muted">
              Baixa um arquivo pra levar ao seu coach, com o resumo do período.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => exportPeriod({ from: weekDates()[0], to: weekDates()[6] }, "Esta semana")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-sm font-medium text-ink active:bg-surface2"
              >
                <Download size={14} aria-hidden /> Esta semana
              </button>
              <button
                type="button"
                onClick={() => exportPeriod(monthPeriod(view.y, view.m), "Este mês")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-sm font-medium text-ink active:bg-surface2"
              >
                <Download size={14} aria-hidden /> Este mês
              </button>
            </div>

            {exportPreview ? (
              <div className="mt-4 rounded-xl border border-line bg-surface2/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-faint">
                    Resumo · {exportPreview.label}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(exportPreview.markdown);
                      setCopied(true);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-accent"
                  >
                    <Copy size={12} aria-hidden /> {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-xs text-muted">
                  {exportPreview.markdown}
                </pre>
              </div>
            ) : null}
          </section>
        </>
      )}

      <BottomNav active="mais" />
    </main>
  );
}
