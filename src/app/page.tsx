"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check, Dumbbell, Clock, Gauge, Play, Utensils } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { MuscleArt } from "@/components/MuscleArt";
import { Logo } from "@/components/Logo";
import { PlanErrorState } from "@/components/PlanErrorState";
import { equipmentLabel } from "@/lib/plan/labels";
import {
  estimateWorkoutMinutes,
  experienceLabel,
  getTodayWorkout,
  greeting,
  todayIndex,
  weekDates,
  workoutBadge,
  WEEK_DAYS,
} from "@/lib/plan/today";
import { getSessionsForPlan } from "@/lib/storage/sessions";
import type { WorkoutSession } from "@/lib/plan/session";
import { ReadinessHero } from "@/components/ReadinessHero";
import { FocusCard } from "@/components/FocusCard";
import {
  buildExerciseMuscles,
  computeRecovery,
  stimuliFromSessions,
  todayReadiness,
} from "@/lib/plan/recovery";
import { getDayOverride, clearDayOverride } from "@/lib/storage/overrides";
import { isoDate } from "@/lib/plan/session";

export default function HojePage() {
  const { loading, plan, invalid } = useActivePlan();
  /*
   * Sessões guardadas JUNTO com o planId de origem (mesmo padrão do `overrideFetch`
   * abaixo, e pelo mesmo motivo). Ao trocar de plano, a lista antiga continuava em estado
   * até o novo fetch resolver, e a prontidão era calculada com o histórico do plano
   * ANTERIOR — inclusive fazendo `temHistorico` ser verdadeiro num plano recém-importado
   * que ainda não tem sessão nenhuma, exatamente o caso que a regra de honestidade quer
   * evitar (achado do review Codex).
   */
  const [sessionsFetch, setSessionsFetch] = useState<{
    planId: string | null;
    list: WorkoutSession[];
  }>({ planId: null, list: [] });
  // Override resolvido junto com o planId a que pertence — `overrideLoading` é DERIVADO
  // (planId atual ≠ planId do último fetch), não um booleano solto que pode ficar
  // obsoleto por 1 render quando o planId muda de null pro id real (mesmo achado do
  // review Codex na TASK-016, ciclo 4 — ver treino/page.tsx pro raciocínio completo).
  const [overrideFetch, setOverrideFetch] = useState<{ planId: string | null; value: string | null }>(
    { planId: null, value: null },
  );
  /*
   * Relógio da prontidão: a recuperação é função do TEMPO, então o `now` precisa avançar
   * com a tela aberta — senão o número congela até o usuário navegar ou recarregar
   * (mesmo achado que a TASK-009 teve no `/corpo`, que já resolve assim). Reusar o padrão
   * de lá mantém as duas telas concordando sobre o estado do corpo.
   */
  const [now, setNow] = useState(() => Date.now());

  const planId = plan?.planId ?? null;
  const overrideLoading = overrideFetch.planId !== planId;
  const override = overrideLoading ? null : overrideFetch.value;
  // Estado DERIVADO: enquanto o fetch não corresponder ao plano atual, a lista é vazia —
  // nunca a do plano anterior. Memoizado porque o `[]` literal criaria um array novo a
  // cada render e invalidaria os memos abaixo sem necessidade.
  const sessions = useMemo(
    () => (sessionsFetch.planId === planId ? sessionsFetch.list : []),
    [sessionsFetch, planId],
  );
  const doneDates = useMemo(
    () => new Set(sessions.filter((s) => s.status === "done").map((s) => s.date)),
    [sessions],
  );

  // Dias da semana com treino concluído (lê as sessões do período ativo).
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    // Mesma fonte que a tela Corpo usa (`getSessionsForPlan`): as duas telas precisam
    // concordar sobre o estado do corpo — um número aqui e um mapa lá discordando seria
    // pior que a limitação conhecida do ADR-002 (sessões de ciclos anteriores ficam de
    // fora do mapa quando o plano troca).
    getSessionsForPlan(plan.planId).then((lista) => {
      if (cancelled) return;
      setSessionsFetch({ planId: plan.planId, list: lista });
    });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  useEffect(() => {
    /*
     * Guarda de requisição obsoleta. Sem ela, trocar de plano com um refresh em voo fazia
     * o `then` gravar as sessões do plano ANTIGO; como `sessions` é derivado comparando o
     * planId, o resultado era uma lista vazia — a tela perdia os checks da semana e
     * escondia o herói até o próximo tick (achado do review Codex). O efeito depende de
     * `plan`, então trocar de plano roda a limpeza e invalida o fetch anterior.
     */
    let cancelled = false;
    const refresh = () => {
      setNow(Date.now());
      if (plan) {
        getSessionsForPlan(plan.planId).then((lista) => {
          if (cancelled) return;
          setSessionsFetch({ planId: plan.planId, list: lista });
        });
      }
    };
    const id = window.setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [plan]);

  // Treino trocado pelo usuário para hoje (TASK-016), se houver.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const value = planId ? await getDayOverride(planId, isoDate()) : null;
      if (!cancelled) setOverrideFetch({ planId, value });
    })();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  async function voltarAoPlanejado() {
    if (!plan) return;
    await clearDayOverride(plan.planId, isoDate());
    setOverrideFetch({ planId: plan.planId, value: null });
  }

  if (loading || overrideLoading) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center justify-center px-5">
        <p className="text-sm text-muted">Carregando…</p>
      </main>
    );
  }

  if (invalid) {
    return <PlanErrorState errors={invalid.errors} />;
  }

  if (!plan) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 text-center">
        <Logo size="lg" tagline />
        <p className="mt-6 max-w-xs text-sm text-muted">
          Seu plano. Seu ritmo. Comece importando o arquivo do seu plano.
        </p>
        <Link
          href="/import"
          className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
        >
          Importar plano
        </Link>
      </main>
    );
  }

  const p = plan.plan;
  const today = getTodayWorkout(p, new Date(), override);
  const ti = todayIndex();
  const week = weekDates();
  const doneThisWeek = week.filter((d) => doneDates.has(d)).length;
  const trainingDays = p.training.weekSchedule.filter((d) => d !== "rest").length;
  const mealsCount = p.diet.meals.length;

  const todayWorkout =
    today.kind === "workout"
      ? p.training.workouts.find((w) => w.id === today.workoutId)
      : undefined;
  const minutes = todayWorkout
    ? (p.profile.sessionMinutes ?? estimateWorkoutMinutes(todayWorkout))
    : null;

  /*
   * Prontidão do dia (DESIGN_SYSTEM §9). Só existe com treino hoje E com pelo menos uma
   * sessão concluída: sem histórico, todo músculo é "descansado" e o número daria 100% —
   * verdadeiro no sentido literal, mas seria um número de aparência científica sobre um
   * corpo do qual não medimos nada. Sem dado, não se exibe número.
   */
  const temHistorico = sessions.some((s) => s.status === "done");
  // Um cálculo só, dois consumidores: o número-herói e o Foco do dia, que explica o número.
  const recovery = computeRecovery(stimuliFromSessions(sessions, buildExerciseMuscles(p), now), now);
  const readiness =
    todayWorkout && temHistorico
      ? todayReadiness(
          todayWorkout.exercises.map((ex) => ({
            primary: ex.primaryMuscles,
            secondary: ex.secondaryMuscles,
          })),
          recovery,
        )
      : null;
  // Só equipamentos CONHECIDOS: `equipment` omitido é desconhecido, não "livre" —
  // afirmar "Livre" pro usuário seria converter incerteza em promessa.
  const equipmentList = todayWorkout
    ? [
        ...new Set(
          todayWorkout.exercises
            .map((e) => e.equipment)
            .filter((eq): eq is NonNullable<typeof eq> => Boolean(eq))
            .map((eq) => equipmentLabel(eq)),
        ),
      ]
    : [];
  const badge = today.kind === "workout" ? workoutBadge(today.workoutId) : null;

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 text-sm font-medium text-accent">
          A
        </span>
        <span className="relative text-faint">
          <Bell size={20} aria-hidden />
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      </header>

      <div className="mt-5">
        <h1 className="text-[26px] font-medium leading-tight tracking-tight">
          {greeting()}
          {p.profile.name ? (
            <>
              , <span className="text-accent">{p.profile.name}.</span>
            </>
          ) : (
            "."
          )}
        </h1>
        <p className="mt-1 text-sm text-muted">Foco agora, resultados sempre.</p>
      </div>

      {override ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3.5 py-2.5">
          <span className="text-xs text-ink">Você trocou o treino de hoje.</span>
          <button
            type="button"
            onClick={voltarAoPlanejado}
            className="shrink-0 text-xs font-medium text-accent underline-offset-2 hover:underline"
          >
            Voltar ao planejado
          </button>
        </div>
      ) : null}

      {/*
        Resposta antes da complexidade: o herói responde "como está meu corpo pra isso hoje?"
        acima do card do treino. É o ÚNICO E3 (foco) da tela — o card do treino segue em E1,
        senão dois blocos disputariam a atenção (DESIGN_SYSTEM §5).
      */}
      {readiness ? <ReadinessHero readiness={readiness} /> : null}

      {/*
        Foco do dia ENTRE o herói e o treino (pedido do usuário): antes ele vinha depois do
        card do treino, repetindo o que já estava logo acima. Aqui ele tem função própria —
        traduzir o número do herói para este treino.
      */}
      {today.kind === "workout" && (today.focus || readiness) ? (
        <FocusCard focus={today.focus} limiting={readiness?.limiting ?? []} recovery={recovery} />
      ) : null}

      {today.kind === "workout" ? (
        <>
          <section className="relative mt-5 overflow-hidden rounded-card border border-line bg-surface p-5">
            <div className="relative z-10 max-w-[62%]">
              <div className="flex items-center gap-2">
                {badge ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-accent/15 px-1 text-[11px] font-medium text-accent">
                    {badge}
                  </span>
                ) : null}
                <p className="text-[11px] uppercase tracking-wider text-faint">Seu treino de hoje</p>
              </div>
              <h2 className="mt-2 text-[22px] font-medium leading-tight tracking-tight">
                {today.name}
              </h2>
              <div className="mt-4 space-y-2 text-sm text-muted">
                <span className="flex items-center gap-2">
                  <Dumbbell size={16} aria-hidden /> {today.exerciseCount} exercícios
                </span>
                {minutes ? (
                  <span className="flex items-center gap-2">
                    <Clock size={16} aria-hidden /> ~{minutes} min
                  </span>
                ) : null}
                <span className="flex items-center gap-2">
                  <Gauge size={16} aria-hidden /> {experienceLabel(p.profile.experience)}
                </span>
              </div>
              <Link
                href="/treino"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98]"
              >
                <Play size={15} aria-hidden /> Começar treino
              </Link>
              {/*
                Único sobrevivente da lista de exercícios removida: "o que preciso levar
                hoje" não está agregado em nenhuma outra tela (o /treino mostra o
                equipamento exercício a exercício, não a soma).
              */}
              {equipmentList.length > 0 ? (
                <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-faint">
                  <Check size={13} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">Equipamentos: {equipmentList.join(", ")}</span>
                </p>
              ) : null}
            </div>
            <MuscleArt muscles={today.muscles} label={firstMuscleLabel(today.focus)} />
          </section>

        </>
      ) : (
        <section className="mt-5 rounded-card border border-line bg-surface p-5">
          <p className="text-[11px] uppercase tracking-wider text-faint">Hoje</p>
          <h2 className="mt-1.5 text-[22px] font-medium tracking-tight">Dia de descanso</h2>
          <p className="mt-1.5 text-sm text-muted">Recuperar faz parte do plano.</p>
          <Link href="/treino" className="mt-4 inline-block text-sm text-accent">
            Quero treinar mesmo assim
          </Link>
        </section>
      )}

      <section className="mt-4 rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-faint">Seu ritmo nesta semana</p>
          <span className="text-xs text-muted">
            {doneThisWeek} de {trainingDays} treinos
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">Constância é o que constrói.</p>
        <div className="mt-4 flex justify-between">
          {WEEK_DAYS.map((d, i) => {
            const isToday = i === ti;
            const entry = p.training.weekSchedule[i];
            const isRest = entry === "rest";
            const isDone = doneDates.has(week[i]);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    "flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-[11px]",
                    isDone || isToday
                      ? "bg-accent text-on-accent"
                      : isRest
                        ? "border border-line text-faint"
                        : "border border-accent/40 text-accent",
                  ].join(" ")}
                >
                  {isDone ? <Check size={14} aria-hidden /> : isRest ? d : entry}
                </div>
                <span className="text-[10px] text-faint">{d}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${trainingDays ? (doneThisWeek / trainingDays) * 100 : 0}%` }}
          />
        </div>
      </section>

      <div className="mt-3 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-accent">
          <Utensils size={18} aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Alimentação</span>
          <span className="block text-xs text-muted">Plano de hoje</span>
        </span>
        <span className="text-xs text-muted">{mealsCount} refeições</span>
      </div>

      <BottomNav active="hoje" />
    </main>
  );
}

function firstMuscleLabel(focus?: string): string {
  return focus ? focus.split(/[,·]/)[0].trim() : "Treino";
}
