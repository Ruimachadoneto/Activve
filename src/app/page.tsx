"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight, Dumbbell, Clock, Gauge, Play, Utensils } from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { BottomNav } from "@/components/BottomNav";
import { MuscleArt } from "@/components/MuscleArt";
import { Logo } from "@/components/Logo";
import { PlanErrorState } from "@/components/PlanErrorState";
import { LogoMark } from "@/components/LogoMark";
import { equipmentLabel } from "@/lib/plan/labels";
import { hasDietContent, hasDietTargets } from "@/lib/plan/diet";
import { completedThisWeek, resolveToday, rotationOf } from "@/lib/plan/rotation";
import {
  estimateWorkoutMinutes,
  experienceLabel,
  greeting,
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
import { getAllSessions } from "@/lib/storage/sessions";
import { getBodyLog } from "@/lib/storage/bodylog";
import { getReadNoticeIds } from "@/lib/storage/notices";
import { buildNotices, unreadCount } from "@/lib/plan/notices";
import { isoDate } from "@/lib/plan/session";

/** "sexta-feira, 01/08" — rótulo acessível de um dia da faixa da semana. */
const rotuloDoDia = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

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
  /*
   * Contagem de avisos não lidos — carregada À PARTE, sem travar a tela. O ponto do sino
   * começa apagado e acende quando a conta chega: "ainda não sei" tem que parecer
   * "nenhum", nunca o contrário. Um ponto que aparece e some seria a mentira de volta.
   */
  const [avisosNaoLidos, setAvisosNaoLidos] = useState(0);

  const planId = plan?.planId ?? null;
  const overrideLoading = overrideFetch.planId !== planId;
  const override = overrideLoading ? null : overrideFetch.value;
  /*
   * Enquanto o histórico não chegar, a lista é vazia — e desde a TASK-029 lista vazia não
   * é só "menos informação", é OUTRA RESPOSTA: `resolveToday` sugeriria o primeiro da
   * rotação (ou um treino onde o certo era descanso) até o fetch resolver. A tela Hoje é
   * onde o usuário DECIDE; ela não pode afirmar "Treino A" e trocar para "Treino B" um
   * instante depois. Por isso o mesmo guard derivado que o `/treino` já paga
   * (`historyLoading`), e não um booleano solto — comparar o planId do fetch com o atual
   * reancora sozinho quando o plano troca (achado do review Codex na TASK-016, ciclo 4).
   */
  const historyLoading = sessionsFetch.planId !== planId;
  // Estado DERIVADO: enquanto o fetch não corresponder ao plano atual, a lista é vazia —
  // nunca a do plano anterior. Memoizado porque o `[]` literal criaria um array novo a
  // cada render e invalidaria os memos abaixo sem necessidade.
  const sessions = useMemo(
    () => (sessionsFetch.planId === planId ? sessionsFetch.list : []),
    [sessionsFetch, planId],
  );
  /*
   * Data → treinos CONCLUÍDOS naquele dia. Substitui o antigo `Set` de datas porque a
   * faixa da semana passou a mostrar QUAL treino foi feito (fato), e não mais a letra que
   * o `weekSchedule` marcava para aquele dia da semana (promessa que a TASK-029 aboliu).
   */
  const doneByDate = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of sessions) {
      if (s.status !== "done") continue;
      m.set(s.date, [...(m.get(s.date) ?? []), s.workoutId]);
    }
    return m;
  }, [sessions]);

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

  // Avisos não lidos (TASK-030). Lê TODAS as sessões: recorde atravessa plano (ADR-002).
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    Promise.all([getAllSessions(), getBodyLog(), getReadNoticeIds()]).then(([todas, corpo, lidos]) => {
      if (cancelled) return;
      const avisos = buildNotices({
        plan: plan.plan,
        planImportedAt: plan.importedAt,
        activePlanId: plan.planId,
        sessions: todas,
        bodyEntries: corpo,
      });
      setAvisosNaoLidos(unreadCount(avisos, lidos));
    });
    return () => {
      cancelled = true;
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

  if (loading || overrideLoading || historyLoading) {
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
  const today = resolveToday(p, sessions, new Date(), override);
  // Compara DATA, não índice do dia da semana: a faixa deixou de ter qualquer relação
  // com a posição no `weekSchedule` (TASK-029/030).
  const hojeIso = isoDate();
  const week = weekDates();
  /*
   * Conta SESSÕES, pela mesma função que decide o descanso da semana — não os dias com
   * check na faixa. `trainingDays` abaixo vem de `weeklyTarget`, que conta entradas do
   * weekSchedule (4): contar dias no numerador e treinos no denominador mostrava
   * "2 de 4 treinos" para quem tinha feito os 4 juntando A+B em dois dias, enquanto a
   * rotação já considerava a semana fechada (achado do review Codex, ciclo 3).
   * `doneDates` continua servindo à FAIXA, que é sobre dias mesmo.
   */
  const doneThisWeek = completedThisWeek(sessions, new Date());
  /*
   * Meta semanal vem da ROTAÇÃO, não da contagem de dias não-"rest" do calendário
   * (TASK-029). São o mesmo número hoje, mas a fonte passou a ser a mesma que decide a
   * sugestão — duas contas separadas para o mesmo conceito acabam divergindo.
   */
  const trainingDays = rotationOf(p).weeklyTarget;
  const mealsCount = p.diet.meals.length;
  // Plano só com metas, ou só com compras/preparo, também tem o que mostrar (review Codex).
  const temDieta = hasDietContent(p.diet);
  // O subtítulo descreve o que a tela REALMENTE tem — prometer "lista de compras" num
  // plano que só traz metas seria mandar o usuário para uma tela diferente da anunciada.
  const resumoDieta =
    mealsCount > 0
      ? `${mealsCount} ${mealsCount === 1 ? "refeição" : "refeições"} · trocas e porquês`
      : hasDietTargets(p.diet)
        ? "Metas de calorias e macros"
        : "Lista de compras e preparo";

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
    <main className="stagger mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        {/* O símbolo da marca (TASK-030). Antes era a letra "A" digitada num anel — o
            `DESIGN_SYSTEM` §1 sempre pediu um "A" estilizado e ele nunca fora desenhado. */}
        <LogoMark size={34} className="text-accent" />
        {/*
          O sino era um `<span>` com bolinha teal FIXA: inerte e, pior, afirmando haver
          aviso novo quando não havia nenhum sistema de avisos. Agora é link de verdade,
          com alvo de 44px, e o ponto só acende com aviso não lido de verdade.
        */}
        <Link
          href="/avisos"
          aria-label={avisosNaoLidos > 0 ? `Avisos: ${avisosNaoLidos} não lidos` : "Avisos"}
          className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
        >
          <Bell size={20} aria-hidden />
          {avisosNaoLidos > 0 ? (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />
          ) : null}
        </Link>
      </header>

      <div className="mt-5">
        <h1 className="text-[26px] font-medium leading-tight tracking-tight">
          {greeting()}
          {p.profile.name ? (
            <>
              , <span className="text-grad-accent">{p.profile.name}.</span>
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
        <FocusCard
          focus={today.focus}
          // Sem `readiness` não há histórico — o card cala sobre recuperação em vez de
          // afirmar "tudo recuperado" sobre um corpo do qual nada foi medido.
          limiting={readiness?.limiting}
          recovery={readiness ? recovery : undefined}
        />
      ) : null}

      {today.kind === "workout" ? (
        <>
          <section className="card-lift relative mt-5 overflow-hidden rounded-card border border-line p-5">
            <div className="relative z-10 max-w-[62%]">
              <div className="flex items-center gap-2">
                {badge ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-accent/15 px-1 text-[11px] font-medium text-accent">
                    {badge}
                  </span>
                ) : null}
                <p className="text-[11px] uppercase tracking-wider text-faint">
                  {today.doneToday ? "Você treinou hoje" : "Seu treino de hoje"}
                </p>
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
              {/*
                Treino já concluído hoje vira FECHAMENTO, não convite: o card mantinha o
                CTA cheio de "Começar treino" e a tela parecia não ter registrado o que o
                usuário acabou de fazer (achado do review Codex). O teal é a cor da "ação
                disponível agora" (§2.1) — depois de treinar, a ação disponível não é a
                protagonista, então o botão desce para o registro secundário. Não é
                celebração: comemorar é um MOMENTO (a tela de conclusão da TASK-026),
                nunca um estado derivado de `status === "done"` a cada reabertura.
              */}
              {today.doneToday ? (
                <>
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium text-accent">
                    <Check size={16} aria-hidden /> Treino concluído
                  </p>
                  {today.nextWorkoutName ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-faint">
                      A seguir na rotação: {today.nextWorkoutName}
                    </p>
                  ) : null}
                  <Link
                    href="/treino"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-accent/40"
                  >
                    Abrir o treino
                  </Link>
                </>
              ) : (
                <Link
                  href="/treino"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98]"
                >
                  <Play size={15} aria-hidden /> Começar treino
                </Link>
              )}
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
        {/*
          A faixa mostra o que FOI FEITO, não o que "estava marcado" (ripple nº 1 da
          TASK-029, que tinha ficado para trás). Ela lia `weekSchedule[i]` como calendário
          e desenhava "A" na segunda, "B" na quarta — a agenda que a rotação aboliu — e
          ainda pintava HOJE com o mesmo preenchimento de um dia concluído, fazendo o dia
          parecer treinado sem ter sido.

          Dia com treino vira LINK para o detalhe daquela sessão em `/relatorios`, que já
          resolve essa tela (treino + série/carga/reps/RPE) — reusar é melhor que duplicar.
          Dia sem sessão não vira botão nenhum: o pedido do usuário era que nada pareça
          clicável sem ser, e a recíproca é sumir com a afordância onde não há destino.
        */}
        <div className="mt-4 flex justify-between">
          {WEEK_DAYS.map((d, i) => {
            const date = week[i];
            const feitos = doneByDate.get(date) ?? [];
            const isDone = feitos.length > 0;
            const isToday = date === hojeIso;
            // Badge = o treino que foi FEITO (fato). Vários no mesmo dia caem no ✓, que
            // não escolhe um deles; o detalhe está a um toque.
            const badgeFeito = feitos.length === 1 ? workoutBadge(feitos[0]) : null;
            const pill = [
              "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium",
              isDone
                ? "bg-accent text-on-accent"
                : isToday
                  ? "border border-accent/60 text-accent"
                  : "border border-line text-faint",
            ].join(" ");
            const conteudo = isDone ? (
              badgeFeito ?? <Check size={14} aria-hidden />
            ) : isToday ? (
              <span className="h-1 w-1 rounded-full bg-accent" />
            ) : null;

            /*
              O alvo de toque é o INVÓLUCRO de 44px, não a pílula de 32px que se vê. A
              TASK-026 já tinha subido a grade do calendário de 36 para 44px pelo mesmo
              motivo; repetir 32px aqui reintroduziria o alvo pequeno numa tela que se
              usa de pé, na academia. Sete colunas de 44px cabem nos 310px úteis do card.
            */
            const envolucro = "flex h-11 w-11 items-center justify-center";
            return (
              <div key={date} className="flex flex-col items-center">
                {isDone ? (
                  <Link
                    href={`/relatorios?d=${date}`}
                    aria-label={`${rotuloDoDia(date)}: ${
                      feitos.length === 1
                        ? `${p.training.workouts.find((w) => w.id === feitos[0])?.name ?? "treino"} concluído`
                        : `${feitos.length} treinos concluídos`
                    }. Ver detalhes.`}
                    className={`${envolucro} transition-transform active:scale-95`}
                  >
                    <span className={pill}>{conteudo}</span>
                  </Link>
                ) : (
                  <div className={envolucro} aria-hidden>
                    <span className={pill}>{conteudo}</span>
                  </div>
                )}
                <span className={`text-[10px] ${isToday ? "text-accent" : "text-faint"}`}>{d}</span>
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

      {/*
        Era um `<div>` que prometia "Plano de hoje" e não levava a lugar nenhum — a mesma
        classe de UI morta do sino. Agora é link de verdade para a tela de alimentação
        (TASK-024), mostrando o progresso do dia em vez do total estático de refeições.
      */}
      {temDieta ? (
        <Link
          href="/alimentacao"
          className="mt-3 flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:bg-surface2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-accent">
            <Utensils size={18} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Alimentação</span>
            <span className="block text-xs text-muted">{resumoDieta}</span>
          </span>
          <ChevronRight size={16} aria-hidden className="shrink-0 text-faint" />
        </Link>
      ) : null}

      <BottomNav active="hoje" />
    </main>
  );
}

function firstMuscleLabel(focus?: string): string {
  return focus ? focus.split(/[,·]/)[0].trim() : "Treino";
}
