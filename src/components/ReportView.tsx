import type { ReportFile } from "@/lib/plan/report";
import { ReportLineChart } from "./ReportLineChart";
import { goalLabel } from "@/lib/plan/labels";

const TREND_LABEL = { up: "subindo", flat: "estável", down: "caindo" } as const;
const MEASURE_LABEL: Record<string, string> = { waist: "Cintura", chest: "Peito", thigh: "Coxa", arm: "Braço" };

function formatPeriod(from: string, to: string): string {
  const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(from)} — ${fmt(to)}`;
}

/**
 * Relatório visual — o que o usuário de fato lê pra acompanhar o próprio progresso
 * (pedido explícito: não JSON, algo com progressão de carga, comparativos, observações).
 * Renderiza igual na tela e impresso (`.report-print`, ver globals.css) — "Baixar PDF" é
 * só `window.print()`, sem lib nova.
 */
export function ReportView({ report, label }: { report: ReportFile; label: string }) {
  const { adherence, training, body, goal } = report;
  const weightChartSeries = body.weight.series.map((p) => ({ date: p.date, value: p.weight }));
  const measuresWithDelta = body.measures.filter((m) => m.delta_cm != null);

  return (
    <div className="report-print rounded-card border border-line bg-surface p-5">
      <header>
        <p className="text-[11px] uppercase tracking-wider text-faint">Relatório · {label}</p>
        <h2 className="mt-1 text-lg font-medium text-ink">{formatPeriod(report.meta.period.from, report.meta.period.to)}</h2>
        <p className="mt-0.5 text-sm text-muted">{goalLabel(goal.type)}</p>
      </header>

      <section className="mt-5">
        <p className="text-[11px] uppercase tracking-wider text-faint">Constância</p>
        <p className="mt-1.5 text-sm text-ink">
          <span className="text-xl font-medium tabular-nums">{adherence.workoutsCompleted}</span>
          <span className="text-muted"> de {adherence.workoutsScheduled} treinos concluídos</span>
          {adherence.workoutsPartial > 0 ? (
            <span className="text-muted"> (+{adherence.workoutsPartial} em andamento)</span>
          ) : null}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-accent"
            style={{
              width: `${adherence.workoutsScheduled ? Math.min(100, (adherence.workoutsCompleted / adherence.workoutsScheduled) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {adherence.activeDays} de {adherence.totalDays} dias ativos
        </p>
      </section>

      {weightChartSeries.length >= 2 || body.weight.latest_kg != null ? (
        <section className="mt-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Peso</p>
          {weightChartSeries.length >= 2 ? (
            <div className="mt-2">
              <ReportLineChart series={weightChartSeries} label="Peso ao longo do período" />
            </div>
          ) : null}
          <p className="mt-1.5 text-sm text-ink">
            {body.weight.start_kg != null ? `${body.weight.start_kg} kg → ` : ""}
            <span className="font-medium">{body.weight.latest_kg} kg</span>
            <span className="text-muted"> · {body.weight.samples} registros</span>
          </p>
        </section>
      ) : null}

      {measuresWithDelta.length > 0 ? (
        <section className="mt-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Medidas</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {measuresWithDelta.map((m) => (
              <p key={m.key} className="text-sm text-ink">
                {MEASURE_LABEL[m.key] ?? m.key}:{" "}
                <span className="font-medium tabular-nums">
                  {(m.delta_cm ?? 0) > 0 ? "+" : ""}
                  {m.delta_cm} cm
                </span>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {training.exercises.length > 0 ? (
        <section className="mt-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Progressão de carga</p>
          <div className="mt-2 flex flex-col gap-4">
            {training.exercises.map((ex) => (
              // `exerciseId` sozinho não é único: o mesmo exercício base pode aparecer
              // duas vezes (original + variação trocada), cada um como um movimento
              // separado (fix do review Codex em report.ts) — a chave precisa do nome
              // do movimento junto pra não colidir.
              <div key={`${ex.exerciseId}-${ex.name}`} className="rounded-xl bg-surface2/40 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{ex.name}</p>
                  <span className="shrink-0 text-xs text-muted">{TREND_LABEL[ex.trend]}</span>
                </div>
                {ex.series.length >= 2 ? (
                  <div className="mt-2">
                    <ReportLineChart
                      series={ex.series.map((p) => ({ date: p.date, value: p.avgLoad }))}
                      label={`Progressão de carga — ${ex.name}`}
                    />
                  </div>
                ) : null}
                <p className="mt-1.5 text-xs text-muted">
                  {ex.sessions}x no período · {ex.totalSets} séries · melhor{" "}
                  {ex.bestSet.load_kg != null ? `${ex.bestSet.load_kg} kg × ${ex.bestSet.reps ?? "—"}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-5 text-sm text-muted">Sem treino registrado neste período.</p>
      )}

      {report.userNotes ? (
        <section className="mt-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Observações</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink">{report.userNotes}</p>
        </section>
      ) : null}

      <p className="mt-6 text-[10px] text-faint">
        Gerado pelo Activve em {new Date(report.meta.generatedAt).toLocaleDateString("pt-BR")}.
      </p>
    </div>
  );
}
