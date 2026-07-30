"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, FileDown } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { ReportView } from "@/components/ReportView";
import { PlanErrorState } from "@/components/PlanErrorState";
import { hasReadableTraining } from "@/lib/plan/parse";
import { getAllSessions } from "@/lib/storage/sessions";
import { getBodyLog } from "@/lib/storage/bodylog";
import { getAllPlans, type StoredPlan } from "@/lib/storage/plans";
import { isoDate, type WorkoutSession } from "@/lib/plan/session";
import { buildConstancy, type DayConstancy } from "@/lib/plan/summary";
import type { BodyEntry } from "@/lib/plan/body";
import { buildReport, reportToMarkdown, type KnownPlan, type ReportFile, type ReportPeriod } from "@/lib/plan/report";
import { weekDates } from "@/lib/plan/today";
import type { PlanFile } from "@/lib/plan/schema";

const WEEK_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"] as const;

/**
 * Rótulo utilizável vindo de um plano HISTÓRICO (que só passou por guarda estrutural —
 * TASK-013) ou `undefined`. Sem isto, um `name` ausente vira texto em branco na tela.
 */
function planLabel(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

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

/**
 * Altura do nível de um dia no mapa de constância — a intensidade virou GEOMETRIA.
 *
 * A primeira versão codificava volume em opacidade (14%→44%). Não funcionou: opacidade
 * é limitada por cima pelo contraste do número do dia (medido: o acento a 55–60% cai
 * para 3,6–4,1:1, abaixo do AA), e a faixa que sobra é sutil demais para ser lida — na
 * prática a escala ficava morta.
 *
 * Altura não tem custo de contraste. A cor fica FIXA num valor seguro e o que varia é
 * quanto da célula o nível preenche, de baixo pra cima: o dia se lê como uma barra, não
 * como um tom. Dá pra comparar dois dias de relance, que era o ponto do mapa.
 *
 * Piso de 26% para um dia treinado nunca virar uma célula vazia só porque o volume dele
 * foi pequeno perto do maior do mês.
 *
 * `intensity` nula = mês sem nenhum volume medido: sem régua, todo dia treinado recebe
 * o MESMO nível, em vez de uma comparação inventada.
 */
function dayLevel(intensity: number | null): number {
  return intensity == null ? 60 : Math.round(26 + intensity * 74);
}

/**
 * Cor do nível. Fixa de propósito (ver `dayLevel`): 40% do acento mede ~5,2:1 contra o
 * `text-ink` de 12px, com folga sobre o AA. Nenhum dia fica mais claro que este.
 */
const DAY_FILL = "color-mix(in srgb, var(--color-accent) 40%, transparent)";

/**
 * Rótulo do dia para leitor de tela. A intensidade é um canal VISUAL — sozinha ela não
 * chega a quem não enxerga, então o que a cor diz vai por extenso aqui.
 */
function dayAriaLabel(date: string, day?: DayConstancy): string {
  const legivel = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
  if (!day) return legivel;
  const partes: string[] = [];
  if (day.done > 0) partes.push(`${day.done} ${day.done === 1 ? "treino" : "treinos"}`);
  if (day.inProgress > 0) partes.push(`${day.inProgress} em andamento`);
  if (day.volumeKg > 0) partes.push(`${day.volumeKg.toLocaleString("pt-BR")} kg`);
  return `${legivel} · ${partes.join(" · ")}`;
}

/**
 * Resumo do mês sob o nome do mês. Só descreve o que existe: sessão aberta é contada
 * como "em andamento" (nunca somada ao volume, que é de treino concluído), e o mês
 * vazio de verdade é o único que diz que está vazio.
 */
function monthSummary(
  totals: { done: number; inProgress: number; volumeKg: number },
  hasScale: boolean,
): string {
  const partes: string[] = [];
  if (totals.done > 0) {
    partes.push(`${totals.done} ${totals.done === 1 ? "treino" : "treinos"}`);
    if (hasScale) partes.push(`${totals.volumeKg.toLocaleString("pt-BR")} kg`);
  }
  if (totals.inProgress > 0) partes.push(`${totals.inProgress} em andamento`);
  return partes.length > 0 ? partes.join(" · ") : "Nenhum treino registrado";
}

function monthPeriod(y: number, m: number): ReportPeriod {
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export default function RelatoriosPage() {
  const { loading, plan, invalid } = useActivePlan();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [bodyEntries, setBodyEntries] = useState<BodyEntry[]>([]);
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const today = useMemo(() => new Date(), []);
  const todayStr = isoDate(today);
  const [view, setView] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [selected, setSelected] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [reportPreview, setReportPreview] = useState<{ label: string; report: ReportFile } | null>(null);
  const [reportEmptyMessage, setReportEmptyMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Sem isso, o calendário mostra nenhum dia marcado e o export pode gerar um
  // relatório vazio se clicado antes do IndexedDB responder (achado do review Codex).
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllSessions(), getBodyLog(), getAllPlans()]).then(([s, b, p]) => {
      if (cancelled) return;
      setSessions(s);
      setBodyEntries(b);
      // Planos históricos passam por uma guarda ESTRUTURAL (TASK-013), não pela
      // validação completa: um registro impossível de percorrer derrubaria o calendário,
      // mas exigir validade total descartaria planos antigos ainda perfeitamente úteis
      // pro que esta tela faz com eles (resolver nome de treino/exercício de sessões
      // passadas) — e o histórico regrediria pra ids crus. Os cálculos profundos que
      // consomem esta lista se protegem na própria origem; ver `hasReadableTraining`.
      setPlans(p.filter((record) => hasReadableTraining(record.plan)));
      setDataLoading(false);
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

  // Todos os planos já importados, com a data de início de cada ciclo — o relatório
  // (buildReport) usa isso pra resolver nome de exercício/agenda de cada sessão pelo
  // plano que valia NAQUELE momento, não só o ativo (histórico cruza trocas de plano).
  //
  // Usa a MESMA guarda estrutural da lista acima (TASK-013, decisão final): exigir
  // validação completa aqui protegia contra crash, mas excluía plano histórico
  // cosmeticamente inválido do relatório — `planForSession` caía no plano ativo e o
  // export mostrava nome errado e subcontava volume daquele ciclo. A proteção agora
  // mora na ORIGEM da leitura profunda (`buildExerciseMuscles` normaliza músculos e
  // variações; `workoutsScheduled` ignora agenda ilegível), então o relatório pode
  // aproveitar todo plano percorrível sem risco de estourar.
  const knownPlans = useMemo<KnownPlan[]>(() => {
    const list = plans.map((p) => ({ planId: p.planId, importedAt: p.importedAt, plan: p.plan }));
    if (plan && !list.some((p) => p.planId === plan.planId)) {
      list.push({ planId: plan.planId, importedAt: plan.importedAt, plan: plan.plan });
    }
    return list;
  }, [plans, plan]);

  /**
   * Nome do movimento efetivamente executado: se houve troca (`swappedToId`), busca
   * dentro das `alternatives` do exercício base — ids de variação são escopados ao
   * exercício, não existem no nível do treino (mesma pegadinha do `recovery.ts`).
   */
  function movementName(planId: string, exerciseId: string, swappedToId?: string): string {
    const p = plansById.get(planId);
    if (!p) return swappedToId ?? exerciseId;
    for (const w of Array.isArray(p.training?.workouts) ? p.training.workouts : []) {
      // Um treino corrompido no meio de um plano histórico não pode cegar os OUTROS
      // treinos do mesmo ciclo — pula só ele (TASK-013 / review Codex).
      if (!Array.isArray(w?.exercises)) continue;
      const ex = w.exercises.find((e) => e?.id === exerciseId);
      if (!ex) continue;
      // Nome ausente/torto num plano histórico viraria rótulo em BRANCO na tela —
      // resolver nome é função total, sempre cai num id legível (review Codex).
      const base = planLabel(ex?.name) ?? swappedToId ?? exerciseId;
      if (!swappedToId) return base;
      // `alternatives` não-array (plano histórico corrompido) não tem `.find` — cai no
      // nome do exercício base em vez de estourar (TASK-013 / review Codex).
      if (!Array.isArray(ex.alternatives)) return base;
      // `a?.id`: elemento nulo dentro de `alternatives` não pode derrubar a busca.
      return planLabel(ex.alternatives.find((a) => a?.id === swappedToId)?.name) ?? base;
    }
    return swappedToId ?? exerciseId;
  }

  function workoutName(planId: string, workoutId: string): string {
    const workouts = plansById.get(planId)?.training?.workouts;
    if (!Array.isArray(workouts)) return workoutId;
    // `w?.id`: elemento nulo num plano corrompido não pode derrubar a busca.
    return planLabel(workouts.find((w) => w?.id === workoutId)?.name) ?? workoutId;
  }

  function exportPeriod(period: ReportPeriod, label: string) {
    if (!plan) return;
    // Cross-plano de propósito: o relatório é "acompanhe seu progresso", não um
    // hand-off formal pro coach — trocar de plano não pode apagar o histórico de um
    // ciclo anterior do período pedido (achado do review Codex). `buildReport` resolve
    // agenda/nome de exercício pelo plano de CADA sessão via `knownPlans`, então não
    // precisamos mais filtrar por `planId` nem recortar o início do período aqui.
    // Só o fim do período é recortado — "esta semana"/"este mês" pode ir até um dia
    // futuro (ex.: gerar o relatório na segunda conta a semana inteira até domingo);
    // contar dias que ainda nem chegaram como "agendados e não feitos" faz a constância
    // parecer pior do que é (achado do review Codex).
    const clippedPeriod: ReportPeriod = {
      from: period.from,
      to: period.to > todayStr ? todayStr : period.to,
    };
    // Período pedido inteiro no futuro (ex.: navegou pro mês que vem e clicou "Este
    // mês") — recortar produziria from > to. Nada pra exportar; explica em vez de
    // gerar lixo.
    if (clippedPeriod.from > clippedPeriod.to) {
      setReportEmptyMessage("Nenhum dado neste período — ele ainda não chegou.");
      setReportPreview(null);
      return;
    }
    const report = buildReport(
      plan.plan,
      knownPlans,
      sessions,
      bodyEntries,
      clippedPeriod,
      notesDraft.trim() || undefined,
    );
    setReportPreview({ label, report });
    setReportEmptyMessage(null);
    setCopied(false);
  }

  const weeks = monthGrid(view.y, view.m);
  const selectedSessions = selected ? (sessionsByDate.get(selected) ?? []) : [];

  /*
   * Mapa de constância do MÊS EM TELA. A comparação de volume é entre os dias daquele
   * mês — normalizar pelo histórico inteiro faria um mês inteiro parecer apagado só
   * porque houve um pico em outro ciclo, o que é dramatizar oscilação (§7.8).
   */
  const monthPrefix = `${view.y}-${String(view.m + 1).padStart(2, "0")}`;
  const constancy = buildConstancy(sessions.filter((s) => s.date.startsWith(monthPrefix)));
  const monthTotals = [...constancy.values()].reduce(
    (acc, d) => ({
      done: acc.done + d.done,
      inProgress: acc.inProgress + d.inProgress,
      volumeKg: acc.volumeKg + d.volumeKg,
    }),
    { done: 0, inProgress: 0, volumeKg: 0 },
  );
  /** Algum dia do mês tem volume medido? Sem isso, a escala não significa nada. */
  const hasScale = monthTotals.volumeKg > 0;

  if (invalid) {
    return <PlanErrorState errors={invalid.errors} />;
  }

  return (
    <main className="stagger mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header className="print:hidden">
        <h1 className="text-xl font-medium tracking-tight">Relatórios</h1>
        <p className="mt-0.5 text-sm text-muted">Seu histórico de treino, dia a dia.</p>
      </header>

      {loading || dataLoading ? (
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
          {/*
            Mapa de constância (v3). Antes cada dia com treino era um ponto de 4px — a
            informação existia e não se via. Agora o próprio dia se acende, e a força da
            luz é o VOLUME daquele dia comparado ao maior do mês: o calendário deixa de
            ser uma lista de datas e vira o desenho do seu ritmo.

            Anti-culpa: dia vazio continua vazio — sem vermelho, sem "faltou", sem
            streak. O mapa só mostra o que aconteceu.
          */}
          <section className="card-lift elev-focus mt-5 rounded-card border border-line p-3 print:hidden">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() =>
                  setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:bg-surface2"
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium">{monthLabel(view.y, view.m)}</p>
                {/* O resumo precisa contar a MESMA história que a grade: um mês só com
                    sessões abertas acende dias tracejados e abre detalhe ao toque —
                    dizer "Nenhum treino registrado" ali seria a tela se contradizendo
                    (achado do review Codex). Sessão aberta aparece na contagem, mas
                    continua fora do volume: ela não é treino concluído. */}
                <p className="mt-0.5 text-[11px] text-faint">{monthSummary(monthTotals, hasScale)}</p>
              </div>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() =>
                  setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:bg-surface2"
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-0.5 text-center text-[10px] text-faint">
              {WEEK_DAYS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            {/* `gap-0.5` + `p-3`: sete colunas em 390px só chegam aos 44x44px do §4 com esta
                geometria. Alvo de toque abaixo do mínimo era regressão herdada (a grade
                antiga tinha 36px de altura). */}
            <div className="mt-1 flex flex-col gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-0.5">
                  {week.map((date) => {
                    const inMonth = Number(date.slice(5, 7)) === view.m + 1;
                    const day = constancy.get(date);
                    const has = sessionsByDate.has(date);
                    const isToday = date === todayStr;
                    const isSelected = date === selected;
                    // Só o dia CONCLUÍDO se acende. Em andamento ganha contorno: é um
                    // estado diferente, e pintar os dois igual seria dizer que treino
                    // aberto é treino feito.
                    const lit = !isSelected && !!day && day.done > 0;
                    const onlyOpen = !isSelected && !!day && day.done === 0 && day.inProgress > 0;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={!has}
                        onClick={() => setSelected(date)}
                        aria-label={dayAriaLabel(date, day)}
                        aria-pressed={isSelected}
                        className={`relative flex h-11 items-center justify-center overflow-hidden rounded-lg text-xs transition-colors duration-[var(--dur-fast)] ${
                          !inMonth && !lit ? "text-faint/40" : ""
                        } ${isSelected ? "bg-accent font-medium text-on-accent" : "text-ink"} ${
                          has && !isSelected ? "hover:brightness-125" : ""
                        } ${isToday && !isSelected ? "ring-1 ring-accent/60" : ""} ${
                          onlyOpen ? "border border-dashed border-faint/70" : ""
                        }`}
                      >
                        {lit ? (
                          <>
                            {/* Base tênue: o dia foi treinado mesmo quando o nível é
                                baixo — sem ela, um dia de volume pequeno pareceria vazio. */}
                            <span className="absolute inset-0 bg-accent/10" aria-hidden />
                            <span
                              className="absolute inset-x-0 bottom-0"
                              style={{ height: `${dayLevel(day.intensity)}%`, background: DAY_FILL }}
                              aria-hidden
                            />
                          </>
                        ) : null}
                        <span className="relative">{Number(date.slice(8, 10))}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {hasScale ? (
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-faint">
                <span>menos volume</span>
                {[0, 0.34, 0.67, 1].map((i) => (
                  <span
                    key={i}
                    className="relative h-5 w-4 overflow-hidden rounded-[3px] bg-accent/10"
                    aria-hidden
                  >
                    <span
                      className="absolute inset-x-0 bottom-0"
                      style={{ height: `${dayLevel(i)}%`, background: DAY_FILL }}
                    />
                  </span>
                ))}
                <span>mais</span>
              </div>
            ) : null}
          </section>

          {selected ? (
            <section className="card-lift mt-4 rounded-card border border-line p-4 print:hidden">
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
                                {movementName(s.planId, ex.exerciseId, ex.swappedToId)}
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

          <section className="card-lift mt-4 rounded-card border border-line p-4 print:hidden">
            <p className="text-[11px] uppercase tracking-wider text-faint">Relatório de progresso</p>
            <p className="mt-1 text-xs text-muted">
              Gera um relatório com progressão de carga, peso e constância — pra você acompanhar e,
              se quiser, imprimir ou salvar como PDF.
            </p>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Observações (opcional): ex. senti dor no ombro, viajei uma semana…"
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent/50"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => exportPeriod({ from: weekDates()[0], to: weekDates()[6] }, "Esta semana")}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-ink active:bg-surface2"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={() => exportPeriod(monthPeriod(view.y, view.m), "Este mês")}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-ink active:bg-surface2"
              >
                Este mês
              </button>
            </div>

            {reportEmptyMessage ? (
              <p className="mt-3 text-xs text-muted">{reportEmptyMessage}</p>
            ) : null}

            {reportPreview ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-medium text-on-accent active:bg-accent-press"
                >
                  <FileDown size={14} aria-hidden /> Baixar PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(reportToMarkdown(reportPreview.report));
                    setCopied(true);
                  }}
                  aria-label="Copiar resumo em texto pro coach"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-xs text-muted active:bg-surface2"
                >
                  <Copy size={13} aria-hidden /> {copied ? "Copiado" : "Texto p/ coach"}
                </button>
              </div>
            ) : null}
          </section>

          {reportPreview ? (
            <div className="mt-4">
              <ReportView report={reportPreview.report} label={reportPreview.label} />
            </div>
          ) : null}
        </>
      )}

      <div className="stagger-skip print:hidden">
        <BottomNav active="mais" />
      </div>
    </main>
  );
}
