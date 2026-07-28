"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, RefreshCw, ShieldCheck } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { goalLabel } from "@/lib/plan/labels";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

export default function MaisPage() {
  const { loading, plan } = useActivePlan();

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-7">
      <header>
        <h1 className="text-xl font-medium tracking-tight">Mais</h1>
        <p className="mt-0.5 text-sm text-muted">Seu plano e as configurações do Activve.</p>
      </header>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Carregando…</p>
      ) : plan ? (
        <section className="mt-5 rounded-card border border-line bg-surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Plano ativo</p>
          <h2 className="mt-1.5 text-lg font-medium">{goalLabel(plan.plan.goal.type)}</h2>
          <p className="mt-1 text-sm text-muted">
            {plan.plan.training.split} · {plan.plan.training.workouts.length} treinos · importado
            em {formatDate(plan.importedAt)}
          </p>

          <Link
            href="/import"
            className="mt-4 flex items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:bg-surface2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-accent">
              <RefreshCw size={17} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">Trocar plano</span>
              <span className="block text-xs text-muted">Importar um novo ciclo do coach</span>
            </span>
            <ChevronRight size={16} aria-hidden className="shrink-0 text-faint" />
          </Link>

          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-faint">
            <ShieldCheck size={13} aria-hidden className="mt-0.5 shrink-0 text-accent" />
            Seu histórico de treino e de medidas fica salvo no aparelho — trocar de plano não apaga
            nada.
          </p>
        </section>
      ) : null}

      {loading ? null : plan ? (
        <Link
          href="/relatorios"
          className="mt-3 flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:bg-surface2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-accent">
            <CalendarDays size={17} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Relatórios de treino</span>
            <span className="block text-xs text-muted">Calendário, detalhes por dia e export</span>
          </span>
          <ChevronRight size={16} aria-hidden className="shrink-0 text-faint" />
        </Link>
      ) : (
        <section className="mt-5 rounded-card border border-line bg-surface p-5 text-center">
          <p className="text-sm text-muted">Nenhum plano importado ainda.</p>
          <Link
            href="/import"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
          >
            Importar plano
          </Link>
        </section>
      )}

      <BottomNav active="mais" />
    </main>
  );
}
