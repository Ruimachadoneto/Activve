"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, CalendarCheck, ChevronLeft, RefreshCw, Scale, Trophy } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { PlanErrorState } from "@/components/PlanErrorState";
import { getAllSessions } from "@/lib/storage/sessions";
import { getBodyLog } from "@/lib/storage/bodylog";
import { getReadNoticeIds, markNoticesRead } from "@/lib/storage/notices";
import { buildNotices, type Notice, type NoticeKind } from "@/lib/plan/notices";
import type { WorkoutSession } from "@/lib/plan/session";
import type { BodyEntry } from "@/lib/plan/body";

const ICON: Record<NoticeKind, typeof Trophy> = {
  record: Trophy,
  ready: Activity,
  week_done: CalendarCheck,
  weight_stale: Scale,
  plan_age: RefreshCw,
};

/**
 * Cor por tipo, seguindo a semântica estrita da §2.1 — nunca decorativa.
 * Âmbar = conquista/marco (o mesmo do recorde no Modo Treino). Teal = pronto para agir.
 * Cinza = informação neutra, sem urgência. **Vermelho não aparece aqui**: nenhum aviso
 * deste app é falha, e usar `danger` para "faz tempo que você não registra peso" seria
 * transformar uma constatação em cobrança.
 */
const TOM: Record<NoticeKind, string> = {
  record: "text-recovering",
  ready: "text-accent",
  week_done: "text-accent",
  weight_stale: "text-muted",
  plan_age: "text-muted",
};

function quando(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const dias = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Centro de avisos (TASK-030). Substitui o sino morto do Hoje, que era um `<span>` com
 * bolinha fixa — inerte E mentiroso, porque afirmava haver aviso novo.
 *
 * Tudo local: `buildNotices` deriva de sessões, peso e plano; só o "lido" é persistido.
 */
export default function AvisosPage() {
  const { loading, plan, invalid } = useActivePlan();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [body, setBody] = useState<BodyEntry[]>([]);
  const [read, setRead] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllSessions(), getBodyLog(), getReadNoticeIds()]).then(([s, b, r]) => {
      if (cancelled) return;
      setSessions(s);
      setBody(b);
      setRead(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const notices = useMemo(
    () =>
      buildNotices({
        plan: plan?.plan ?? null,
        planImportedAt: plan?.importedAt ?? null,
        activePlanId: plan?.planId ?? null,
        sessions,
        bodyEntries: body,
      }),
    [plan, sessions, body],
  );

  /*
   * O destaque de "não lido" é congelado na PRIMEIRA leitura do disco e não reage ao
   * `markNoticesRead` abaixo. Sem isso, o marcador sumiria no mesmo frame em que a tela
   * abre e o usuário nunca saberia qual aviso era novo — a marcação existe para ele, não
   * para o banco.
   */
  const naoLidosAoAbrir = useMemo(() => (read ? new Set(read) : null), [read]);

  // Abrir a tela É ter visto os avisos. Persiste depois de renderizar.
  useEffect(() => {
    if (read === null || notices.length === 0) return;
    const novos = notices.map((n) => n.id).filter((id) => !read.includes(id));
    if (novos.length > 0) void markNoticesRead(novos);
    // `read` fora das deps de propósito: rodar de novo a cada mudança do estado local
    // reabriria o ciclo. A gravação é idempotente (união de ids).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices, read === null]);

  if (loading || read === null) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (invalid) return <PlanErrorState errors={invalid.errors} />;

  return (
    <main className="stagger mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Voltar para o início"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <div>
          <h1 className="text-xl font-medium tracking-tight">Avisos</h1>
          <p className="mt-0.5 text-sm text-muted">Do que você registrou — nada sai do aparelho.</p>
        </div>
      </header>

      {notices.length === 0 ? (
        /* Estado vazio = registro C (Editorial, §0). A tarefa aqui é LER e entender. */
        <section className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-[30px] font-medium leading-[1.15] tracking-tight text-ink">
            Nada por aqui
          </h2>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-muted">
            Os avisos nascem do que você registra: um recorde batido, a semana fechada, o corpo
            recuperado. Treine e eles aparecem.
          </p>
        </section>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {notices.map((n) => (
            <NoticeRow key={n.id} notice={n} novo={naoLidosAoAbrir ? !naoLidosAoAbrir.has(n.id) : false} />
          ))}
        </ul>
      )}

      {/* Sub-tela do Hoje (é de lá que o sino leva) — mesma convenção do `/alimentacao`. */}
      <BottomNav active="hoje" />
    </main>
  );
}

function NoticeRow({ notice, novo }: { notice: Notice; novo: boolean }) {
  const Icon = ICON[notice.kind];
  const corpo = (
    <>
      <span className={`mt-0.5 shrink-0 ${TOM[notice.kind]}`}>
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{notice.title}</span>
          {novo ? (
            <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              novo
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-muted">{notice.body}</span>
        <span className="mt-1.5 block text-[11px] text-faint">{quando(notice.at)}</span>
      </span>
    </>
  );

  /*
   * Só vira link quando existe destino de verdade. Um item que parecesse clicável e não
   * levasse a lugar nenhum recriaria exatamente o problema que esta tela veio resolver.
   */
  return (
    <li>
      {notice.href ? (
        <Link
          href={notice.href}
          className="card-lift flex gap-3 rounded-card border border-line p-4 transition-colors hover:border-accent/40"
        >
          {corpo}
        </Link>
      ) : (
        <div className="card-lift flex gap-3 rounded-card border border-line p-4">{corpo}</div>
      )}
    </li>
  );
}
