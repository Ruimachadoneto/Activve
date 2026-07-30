"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy } from "lucide-react";
import { formatDuration, type SessionSummary } from "@/lib/plan/summary";

/**
 * Tela de conclusão de treino (TASK-026) — o pico de conquista do app.
 *
 * Não é um banner em cima do Modo Treino: substitui a tela inteira. O treino sai de
 * cena e entra uma composição só sobre o que acabou de acontecer, no registro B
 * (imersivo): pouca densidade, número-herói, um campo de luz atrás.
 *
 * Honestidade (§9): o herói é a soma do que foi REGISTRADO. Se faltou carga ou
 * repetição em alguma série, a tela diz que a conta é parcial em vez de estimar. Se
 * nada foi registrado, não há número — há um fechamento digno mesmo assim.
 *
 * Anti-culpa: em nenhum lugar existe "você deixou X para trás". As contagens são
 * "N de M", factuais, sem adjetivo.
 *
 * Movimento: toda a coreografia é CSS (`.stagger` + `.pr-badge` + `.completion-*`).
 * Nenhum `setTimeout` — foi a fonte da classe de bug do compasso do recorde
 * (`restDelayRef`), que precisa ser cancelada em toda saída. A única animação em JS é
 * a contagem do herói, e ela escreve direto no DOM: o JSX já renderiza o valor final,
 * então `prefers-reduced-motion`, hidratação e ausência de JS mostram a verdade.
 */
export function WorkoutCompletion({
  workoutName,
  dateISO,
  summary,
  movementName,
  muscles,
  whenSaved,
  onBackToWorkout,
}: {
  workoutName: string;
  dateISO: string;
  summary: SessionSummary;
  /** Resolve o nome do movimento executado (variação conta) para os recordes. */
  movementName: (exerciseId: string, movementId: string) => string;
  /** Músculos PRIMÁRIOS dos movimentos executados, já em PT-BR (ver eyebrow "Foco muscular"). */
  muscles: string[];
  /**
   * Escrita da sessão no IndexedDB. `/corpo` e `/` leem as sessões na montagem, então
   * sair daqui antes da escrita mostraria o treino recém-feito ausente do mapa —
   * justamente o que o atalho promete. A tela aparece na hora; só a saída espera.
   */
  whenSaved: Promise<unknown>;
  /** Volta ao Modo Treino (a sessão continua concluída — é só sair da celebração). */
  onBackToWorkout: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  /** Desmontar durante a espera não pode empurrar navegação depois (lição do `restDelayRef`). */
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    let current = true;
    void whenSaved.then(() => {
      if (current) setSaved(true);
    });
    return () => {
      current = false;
      aliveRef.current = false;
    };
  }, [whenSaved]);

  /**
   * Enquanto a escrita não resolveu, o link vira navegação adiada: segura o toque,
   * espera a promessa e então empurra a rota. Na prática são milissegundos e o caminho
   * normal é o `<Link>` nativo — o desvio existe só para fechar a corrida, não para ser
   * o comportamento de todo dia.
   */
  const irQuandoSalvo = (href: string) => (e: React.MouseEvent) => {
    if (saved) return;
    e.preventDefault();
    void whenSaved.then(() => {
      if (aliveRef.current) router.push(href);
    });
  };

  useEffect(() => {
    // A tela inteira trocou: leva o foco pro título, senão o leitor de tela e o
    // teclado continuam no botão que sumiu.
    headingRef.current?.focus();
    try {
      // Padrão do fim de treino: mais longo que o do recorde (que é [40,60,40]).
      navigator.vibrate?.([24, 50, 24, 50, 90]);
    } catch {
      /* vibração é opcional */
    }
  }, []);

  const partialSets = summary.doneSets - summary.volumeSets;
  const hasVolume = summary.volumeKg > 0;
  const dateLabel = new Date(`${dateISO}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-10 pt-10">
      {/*
        Campo de luz da conquista: mais forte que a atmosfera do `body` (§0.1 permite —
        é O momento da tela), ancorado atrás do herói. `aria-hidden`: é clima, não dado.
        O `overflow-hidden` mora AQUI, não no `<main>`: os anéis crescem além da largura
        da tela e precisam ser recortados sem transformar a página num contêiner de corte.
      */}
      <div
        className="completion-bloom pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
        aria-hidden
      >
        <span className="completion-ring absolute left-1/2 top-[210px] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <span className="completion-ring completion-ring-2 absolute left-1/2 top-[210px] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>

      <div className="stagger flex flex-col">
        <header>
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Treino concluído</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-1.5 text-[24px] font-medium leading-tight tracking-tight outline-none"
          >
            {workoutName}
          </h1>
          {/* `first-letter:uppercase`, não `capitalize`: em pt-BR o Tailwind `capitalize`
              maiusculiza TODA palavra ("Quinta-Feira, 30 De Julho"). */}
          <p className="mt-1 text-sm text-muted first-letter:uppercase">{dateLabel}</p>
        </header>

        {/* E3 da tela — o único. */}
        <section className="card-lift elev-focus relative mt-6 overflow-hidden rounded-card border border-line p-6 text-center">
          {hasVolume ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">Volume levantado</p>
              <p className="mt-2 flex items-end justify-center gap-1.5">
                {/* Numerais proporcionais: número grande e isolado não leva `tabular-nums` (§3.2). */}
                <CountUp value={summary.volumeKg} className="text-[56px] font-medium leading-none tracking-tight" />
                <span className="pb-2 text-base text-muted">kg</span>
              </p>
              <p className="mt-3 text-xs text-muted">Carga × repetições de tudo que você registrou.</p>
              {partialSets > 0 ? (
                <p className="mt-1.5 text-xs text-faint">
                  {partialSets === 1
                    ? "1 série sem carga ou repetições ficou fora desta conta."
                    : `${partialSets} séries sem carga ou repetições ficaram fora desta conta.`}
                </p>
              ) : null}
            </>
          ) : summary.doneSets > 0 ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">Séries registradas</p>
              <p className="mt-2 flex items-end justify-center gap-1.5">
                <CountUp value={summary.doneSets} className="text-[56px] font-medium leading-none tracking-tight" />
                <span className="pb-2 text-base text-muted">
                  {summary.doneSets === 1 ? "série" : "séries"}
                </span>
              </p>
              <p className="mt-3 text-xs text-muted">
                O volume aparece aqui quando você anotar carga e repetições.
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">Sessão registrada</p>
              <p className="mt-2 text-lg font-medium">Ficou no seu histórico.</p>
              <p className="mt-2 text-xs text-muted">
                Nenhuma série foi marcada desta vez — o dia continua registrado do mesmo jeito.
              </p>
            </>
          )}
        </section>

        {summary.records.length > 0 ? (
          <section className="mt-4">
            <p className="flex items-center gap-1.5 px-1 text-[11px] uppercase tracking-[0.14em] text-recovering">
              <Trophy size={13} aria-hidden />
              {summary.records.length === 1 ? "Recorde pessoal" : "Recordes pessoais"}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {summary.records.map((r) => (
                <div
                  key={`${r.exerciseId}-${r.movementId}`}
                  className="pr-badge flex items-center justify-between gap-3 rounded-card border border-recovering/40 bg-recovering/[0.07] px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {movementName(r.exerciseId, r.movementId)}
                    </span>
                    <span className="block text-xs text-muted">
                      antes {r.previousBest.toLocaleString("pt-BR")} kg · +
                      {(Math.round((r.load_kg - r.previousBest) * 10) / 10).toLocaleString("pt-BR")} kg
                    </span>
                  </span>
                  <span className="shrink-0 text-lg font-medium text-recovering">
                    {r.load_kg.toLocaleString("pt-BR")} kg
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Séries" value={String(summary.doneSets)} sub={`de ${summary.totalSets}`} />
          <Stat
            label="Exercícios"
            value={String(summary.exercisesDone)}
            sub={`de ${summary.exercisesTotal}`}
          />
          <Stat
            label="Do início ao fim"
            value={summary.durationMin != null ? formatDuration(summary.durationMin) : "—"}
            sub={summary.durationMin != null ? undefined : "sem registro"}
          />
        </section>

        {summary.heaviestSet && summary.records.length === 0 ? (
          <p className="mt-3 px-1 text-xs text-muted">
            Série mais pesada:{" "}
            <span className="text-ink">
              {movementName(summary.heaviestSet.exerciseId, summary.heaviestSet.movementId)} ·{" "}
              {summary.heaviestSet.load_kg.toLocaleString("pt-BR")} kg
              {summary.heaviestSet.reps != null ? ` × ${summary.heaviestSet.reps}` : ""}
            </span>
          </p>
        ) : null}

        {muscles.length > 0 ? (
          <section className="mt-5">
            {/* "Foco muscular" e não "Músculos trabalhados": a lista é só de PRIMÁRIOS.
                O rótulo mais amplo prometeria os sinergistas que não estão aqui — o
                mapa do Corpo é que conta a história completa (primário 1, secundário 0,5). */}
            <p className="px-1 text-[11px] uppercase tracking-[0.14em] text-faint">Foco muscular</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {muscles.map((m) => (
                <span
                  key={m}
                  className="rounded-lg border border-line bg-surface2/50 px-2.5 py-1 text-xs text-muted"
                >
                  {m}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/corpo"
            onClick={irQuandoSalvo("/corpo")}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press active:scale-[0.98]"
          >
            Ver como seu corpo ficou
            <ArrowRight size={16} aria-hidden />
          </Link>
          <div className="flex items-center justify-between px-1 text-sm">
            <Link href="/" onClick={irQuandoSalvo("/")} className="text-muted">
              Voltar ao início
            </Link>
            <button type="button" onClick={onBackToWorkout} className="text-muted">
              Ver o treino
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-lift rounded-card border border-line px-3 py-3 text-center">
      <p className="text-[10px] uppercase leading-tight tracking-[0.08em] text-faint">{label}</p>
      <p className="mt-1.5 text-lg font-medium leading-none">{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-faint">{sub}</p> : null}
    </div>
  );
}

const DURATION_MS = 900;
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

/**
 * Número que "sobe" até o valor real. O JSX já contém o valor FINAL — a animação só
 * sobrescreve o texto por ~0,9s. Consequência de projeto: sem JS, com
 * `prefers-reduced-motion` ou se o efeito falhar, a tela mostra o número certo, nunca
 * um zero preso. Escrever no DOM (em vez de estado) também evita ~54 re-renders da
 * árvore inteira durante a contagem.
 */
function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION_MS);
      // Aproximação do --ease-out-soft: sai rápido e assenta.
      el.textContent = fmt(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else el.textContent = fmt(value);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Desmontar no meio da contagem não pode deixar um número parcial na tela.
      el.textContent = fmt(value);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {fmt(value)}
    </span>
  );
}
