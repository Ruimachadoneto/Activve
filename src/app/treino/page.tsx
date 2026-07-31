"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Trophy,
} from "lucide-react";
import { useActivePlan } from "@/lib/storage/useActivePlan";
import { getTodayWorkout } from "@/lib/plan/today";
import { BottomNav } from "@/components/BottomNav";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { RestTimer } from "@/components/RestTimer";
import { PlanErrorState } from "@/components/PlanErrorState";
import { ExerciseMediaCard, ExerciseThumb, PreloadImages } from "@/components/ExerciseMediaCard";
import { WorkoutCompletion } from "@/components/WorkoutCompletion";
import { resolveMovement, videoHref } from "@/lib/plan/movement";
import { resolveExerciseMedia } from "@/lib/plan/exerciseMedia";
import { equipmentLabel, muscleLabel } from "@/lib/plan/labels";
import { buildExerciseMuscles } from "@/lib/plan/recovery";
import { buildSessionSummary } from "@/lib/plan/summary";
import type { PlanFile } from "@/lib/plan/schema";
import {
  createSession,
  sessionProgress,
  completeSession,
  clampRpe,
  previousPerformance,
  bestPreviousLoad,
  RPE_MIN,
  RPE_MAX,
  isoDate,
  type WorkoutSession,
} from "@/lib/plan/session";
import { getSession, saveSession, getAllSessions } from "@/lib/storage/sessions";
import { getDayOverride, setDayOverride, clearDayOverride } from "@/lib/storage/overrides";

const LOAD_STEP = 2.5;
/**
 * Janela para cancelar o avanço automático de exercício. Existe porque a última série
 * pode ter sido marcada sem querer — o avanço é conveniência, não uma decisão que o app
 * toma no lugar do usuário.
 */
const AUTO_NEXT_SECONDS = 5;
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function TreinoPage() {
  const { loading, plan, invalid } = useActivePlan();
  const [selected, setSelected] = useState<string | null>(null);
  const [stored, setStored] = useState<WorkoutSession | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [restToken, setRestToken] = useState(0);
  const [restOpen, setRestOpen] = useState(false);
  const [allSetsOpen, setAllSetsOpen] = useState(false);
  /** Recorde pessoal recém-batido — controla o selo de celebração (some sozinho). */
  const [prCelebration, setPrCelebration] = useState<{ load: number; token: number } | null>(null);
  /*
   * Avanço automático para o próximo exercício depois que todas as séries do atual são
   * feitas. Guarda o exercício que disparou para o contador não reaparecer quando o
   * usuário voltar a um exercício já concluído — só a AÇÃO de concluir arma o avanço.
   */
  const [autoNext, setAutoNext] = useState<{ exerciseId: string; left: number } | null>(null);
  /*
   * Tela de conclusão. É estado LOCAL de propósito, e não `session.status === "done"`:
   * celebração é um MOMENTO, não uma propriedade da sessão. Derivar do status faria a
   * tela celebrar de novo toda vez que o usuário reabrisse um treino já concluído —
   * comemoração automática de coisa velha é o oposto de conquista.
   *
   * Guarda um SNAPSHOT (sessão encerrada + treino), não um booleano: a tela entra
   * depois que o IndexedDB responde, e a página continua interativa nesse intervalo.
   * Lendo o `session`/`workout` correntes, trocar de treino nesse meio-tempo fazia a
   * celebração resumir o treino errado — ou sumir de vez, porque o treino novo não
   * está `done` (achado do review Codex). O snapshot é imutável por construção.
   */
  const [celebration, setCelebration] = useState<{
    session: WorkoutSession;
    workout: PlanFile["training"]["workouts"][number];
    /**
     * Escrita da sessão encerrada. A celebração entra na hora, mas os atalhos dela
     * levam a telas que leem o IndexedDB na montagem — a navegação espera isto.
     */
    whenSaved: Promise<unknown>;
  } | null>(null);
  /*
   * O descanso adiado pelo compasso do recorde. Guardado em ref para poder ser CANCELADO:
   * se a série do recorde era a última e o usuário toca "Concluir treino" dentro do
   * compasso, o timeout pendente abriria o overlay de descanso por cima do treino já
   * encerrado (achado do review Codex).
   */
  const restDelayRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (restDelayRef.current != null) window.clearTimeout(restDelayRef.current);
    },
    [],
  );

  /*
   * Navegar (trocar exercício ou treino) dentro do compasso do recorde cancela o
   * descanso pendente E o selo: o overlay leria `ex.rest_s` do exercício NOVO (duração
   * errada) e o selo celebraria em cima do card errado (achados do review Codex). Vive
   * nos HANDLERS, não num efeito — o lint do projeto proíbe setState em efeito, e a
   * lição da TASK-010 é reestruturar, não contornar.
   */
  function navegar(mudar: () => void) {
    if (restDelayRef.current != null) {
      window.clearTimeout(restDelayRef.current);
      restDelayRef.current = null;
    }
    setPrCelebration(null);
    // Navegar na mão é uma decisão explícita: cancela o avanço automático pendente.
    setAutoNext(null);
    mudar();
  }
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  // Override resolvido junto com o planId a que ele pertence: `overrideLoading` é
  // DERIVADO comparando o planId atual com o planId do último fetch resolvido — não é
  // um booleano solto. Um booleano separado ficava obsoleto por 1 render quando o
  // planId mudava de null pro id real (achado do review Codex, ciclo 4): a leitura
  // reancora sozinha a cada mudança de planId, sem depender de um 2º efeito pra "rearmar".
  const [overrideFetch, setOverrideFetch] = useState<{ planId: string | null; value: string | null }>(
    { planId: null, value: null },
  );

  const p = plan?.plan;
  const planId = plan?.planId ?? null;
  const hasWorkouts = !!p && p.training.workouts.length > 0;
  const overrideLoading = overrideFetch.planId !== planId;
  const override = overrideLoading ? null : overrideFetch.value;

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

  const today = p ? getTodayWorkout(p, new Date(), override) : null;
  const activeId =
    selected ??
    (today?.kind === "workout" ? today.workoutId : p?.training.workouts[0]?.id) ??
    null;
  const officialTodayId = today?.kind === "workout" ? today.workoutId : null;
  const workout = p?.training.workouts.find((w) => w.id === activeId) ?? p?.training.workouts[0];

  const draft = useMemo(
    () => (planId && workout ? createSession(planId, workout, isoDate()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planId, workout?.id],
  );

  // Lookup exercício→músculos do plano ativo (inclui variações, com escopo por
  // exercício). Serve à tela de conclusão; o mapa do Corpo usa o mesmo núcleo.
  const getMuscles = useMemo(() => (p ? buildExerciseMuscles(p) : null), [p]);

  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    getSession(draft.sessionId).then((saved) => {
      if (cancelled || !saved) return;
      setStored((prev) => (prev && prev.sessionId === saved.sessionId ? prev : saved));
    });
    return () => {
      cancelled = true;
    };
  }, [draft]);

  // Histórico para o "Última vez" (memória de progressão). É GLOBAL, não por plano:
  // a continuidade do produto é por exercise.id entre planos/períodos (ADR-002), então
  // importar um plano novo não pode zerar a memória de carga.
  /*
   * Recarrega quando a SESSÃO atual muda, não só na montagem: com a aba aberta na virada
   * da meia-noite, a sessão de ontem (concluída depois da montagem) não estava no
   * `history` e a régua do recorde ficava defasada — uma carga abaixo do melhor real
   * ainda celebraria (achado do review Codex).
   */
  useEffect(() => {
    let cancelled = false;
    getAllSessions().then((list) => {
      if (!cancelled) setHistory(list);
    });
    return () => {
      cancelled = true;
    };
  }, [stored?.sessionId]);

  const session = stored && draft && stored.sessionId === draft.sessionId ? stored : draft;

  /*
   * Contagem do avanço automático. Espera o descanso sair de cena: a sequência natural é
   * última série → descanso → próximo exercício, e sobrepor as duas coisas faria o
   * usuário perder o botão de cancelar atrás do overlay.
   *
   * Todo `setState` mora no callback do timeout, e a limpeza cancela o agendamento — a
   * mesma disciplina do compasso do recorde, que é a classe de bug conhecida aqui.
   */
  useEffect(() => {
    if (!autoNext || restOpen) return;
    const id = window.setTimeout(() => {
      if (autoNext.left <= 1) {
        setAutoNext(null);
        setCurrent((c) => c + 1);
      } else {
        setAutoNext({ ...autoNext, left: autoNext.left - 1 });
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [autoNext, restOpen]);

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

  if (!plan || !p) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Nenhum plano importado ainda.</p>
        <Link href="/import" className="mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent">
          Importar plano
        </Link>
      </main>
    );
  }

  if (celebration) {
    /*
     * A celebração SUBSTITUI o Modo Treino — não é um banner por cima. O usuário
     * acabou de terminar; a tela de execução não tem mais nada a dizer.
     *
     * Tudo aqui sai do SNAPSHOT, nunca do estado corrente: a tela precisa resumir o
     * treino que foi concluído, não o que estiver selecionado agora.
     * `bestPreviousLoad` (dentro do resumo) exclui esta sessão pelo `sessionId`, então
     * não importa se o `history` já foi recarregado com ela dentro.
     */
    const summary = buildSessionSummary(celebration.session, history);
    const nomeDoMovimento = (exerciseId: string, movementId: string) => {
      const alvo = celebration.workout.exercises.find((e) => e.id === exerciseId);
      if (!alvo) return movementId;
      return resolveMovement(alvo, movementId === exerciseId ? undefined : movementId).name;
    };
    const musculos = getMuscles
      ? [
          ...new Set(
            summary.movementIds.flatMap(
              ({ exerciseId, movementId }) =>
                getMuscles(exerciseId, movementId === exerciseId ? undefined : movementId)
                  ?.primary ?? [],
            ),
          ),
        ].map(muscleLabel)
      : [];

    return (
      <WorkoutCompletion
        workoutName={celebration.workout.name}
        dateISO={celebration.session.date}
        summary={summary}
        movementName={nomeDoMovimento}
        muscles={musculos}
        whenSaved={celebration.whenSaved}
        onBackToWorkout={() => setCelebration(null)}
      />
    );
  }

  if (!hasWorkouts || !workout || !session || workout.exercises.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-sm text-muted">Este treino ainda não tem exercícios no plano.</p>
        <Link href="/" className="text-sm text-accent">
          Voltar ao Hoje
        </Link>
      </main>
    );
  }

  const total = workout.exercises.length;
  const idx = Math.min(current, total - 1);
  const ex = workout.exercises[idx];
  const log = session.exercises.find((e) => e.exerciseId === ex.id);
  const mov = resolveMovement(ex, log?.swappedToId);
  const media = resolveExerciseMedia(mov.name, mov.howTo.mediaId);
  const progress = sessionProgress(session);
  const activeSet = log ? log.sets.findIndex((s) => !s.done) : -1;
  const activeLog = activeSet >= 0 ? log?.sets[activeSet] : undefined;

  const nextEx = idx < total - 1 ? workout.exercises[idx + 1] : null;
  const nextLog = nextEx ? session.exercises.find((e) => e.exerciseId === nextEx.id) : null;
  const nextMov = nextEx ? resolveMovement(nextEx, nextLog?.swappedToId ?? undefined) : null;
  const nextMedia = nextMov ? resolveExerciseMedia(nextMov.name, nextMov.howTo.mediaId) : null;

  // "Última vez": o que foi feito nesta série no treino anterior (progressão consciente),
  // comparando o MESMO movimento (variação escolhida conta — carga de outra variação não serve).
  const prevPerf = previousPerformance(
    history,
    ex.id,
    activeSet >= 0 ? activeSet : 0,
    session.sessionId,
    log?.swappedToId ?? ex.id,
  );

  const workoutId = workout.id;
  async function definirComoTreinoDeHoje() {
    if (!planId) return;
    await setDayOverride(planId, isoDate(), workoutId);
    setOverrideFetch({ planId, value: workoutId });
  }

  async function voltarAoPlanejado() {
    if (!planId) return;
    await clearDayOverride(planId, isoDate());
    setOverrideFetch({ planId, value: null });
    // `selected` venceria o recálculo do treino oficial (activeId = selected ?? today.workoutId) —
    // sem isso, a tela ficava presa no treino trocado se o usuário tinha clicado a pill dele
    // (achado do review Codex ciclo 3).
    // Reverter o treino do dia também é navegação — cancela compasso e selo pendentes.
    navegar(() => {
      setSelected(null);
      setCurrent(0);
    });
  }

  function patchSet(
    exerciseId: string,
    setIdx: number,
    patch: Partial<WorkoutSession["exercises"][number]["sets"][number]>,
  ) {
    if (!session) return;
    const next: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: e.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s)) }
          : e,
      ),
    };
    setStored(next);
    void saveSession(next);
  }

  function patchExercise(exerciseId: string, patch: Partial<WorkoutSession["exercises"][number]>) {
    if (!session) return;
    const next: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((e) => (e.exerciseId === exerciseId ? { ...e, ...patch } : e)),
    };
    setStored(next);
    void saveSession(next);
  }

  function startRest() {
    setRestToken((t) => t + 1);
    setRestOpen(true);
  }

  function concluirSerie() {
    if (activeSet === -1) return;
    /*
     * Recorde pessoal (TASK-025): celebra ANTES de abrir o descanso, comparando a carga
     * desta série com a maior já registrada para o MESMO movimento em sessões concluídas.
     * Sem histórico não celebra — no primeiro treino toda carga seria "recorde", e
     * celebração barata deixa de ser celebração. Honesto: só dado registrado pelo usuário.
     */
    const cargaAtual = activeLog?.load_kg;
    const recordeAnterior = bestPreviousLoad(
      history,
      ex.id,
      session?.sessionId ?? "",
      log?.swappedToId ?? ex.id,
    );
    /*
     * A régua inclui o que JÁ foi feito NESTA sessão: se o recorde antigo era 45 e a
     * série 1 de hoje fez 50, a série 2 com 47 não é recorde — mas 52 é (recorde de
     * novo, celebração de novo, legítima). `bestPreviousLoad` ignora a sessão atual de
     * propósito (é "recorde ANTERIOR"); o complemento vem das séries já concluídas do
     * exercício em tela (achado do review Codex).
     */
    const recordeDaSessao = (log?.sets ?? []).reduce<number | null>(
      (best, s) =>
        s.done && typeof s.load_kg === "number" && (best === null || s.load_kg > best)
          ? s.load_kg
          : best,
      null,
    );
    const regua =
      recordeAnterior != null && recordeDaSessao != null
        ? Math.max(recordeAnterior, recordeDaSessao)
        : (recordeAnterior ?? null); // sem recorde ANTERIOR não há o que bater (1º treino)
    const bateuRecorde = cargaAtual != null && regua != null && cargaAtual > regua;
    if (bateuRecorde) {
      setPrCelebration((prev) => ({ load: cargaAtual, token: (prev?.token ?? 0) + 1 }));
      // Padrão tátil próprio do recorde — mais marcante que o do fim do descanso.
      try {
        navigator.vibrate?.([40, 60, 40]);
      } catch {
        /* vibração é opcional */
      }
      window.setTimeout(() => setPrCelebration(null), 2800);
    }
    patchSet(ex.id, activeSet, { done: true });
    /*
     * Esta série fechou o exercício e existe um próximo? Arma o avanço automático.
     *
     * Só o CTA principal arma. Marcar o ✓ na tabela "Todas as séries" é uma ação de
     * edição — quem está corrigindo um registro não está pedindo para mudar de
     * exercício, e avançar dali seria o app decidindo no lugar do usuário.
     */
    const faltando = (log?.sets ?? []).filter((s, i) => !s.done && i !== activeSet).length;
    if (faltando === 0 && nextEx) setAutoNext({ exerciseId: ex.id, left: AUTO_NEXT_SECONDS });
    /*
     * O recorde merece seu compasso: sem o atraso, o overlay de descanso (E4) abria POR
     * CIMA do selo no mesmo frame e a celebração nunca era vista — pego na verificação
     * no browser, não em teste. 1,6s de selo em cena, depois o descanso.
     */
    if (bateuRecorde) {
      restDelayRef.current = window.setTimeout(() => {
        restDelayRef.current = null;
        startRest();
      }, 1600);
    } else {
      startRest();
    }
  }

  function toggleSetDone(i: number, currentDone: boolean) {
    patchSet(ex.id, i, { done: !currentDone });
    if (!currentDone) startRest();
  }

  function concluirTreino() {
    // `workout` entra na guarda junto com `session`: o snapshot da celebração leva os
    // dois, e o estreitamento das saídas antecipadas não alcança o corpo desta função.
    if (!session || !workout) return;
    // Treino encerrado cancela qualquer descanso pendente do compasso do recorde.
    if (restDelayRef.current != null) {
      window.clearTimeout(restDelayRef.current);
      restDelayRef.current = null;
    }
    // O overlay de descanso (E4) sobreviveria à troca de tela e ficaria por cima da
    // celebração — mesma classe do achado do compasso do recorde na TASK-025.
    setRestOpen(false);
    setPrCelebration(null);
    const next = completeSession(session);
    setStored(next);
    /*
     * A celebração entra AGORA, de forma síncrona, a partir de um snapshot imutável.
     * Duas razões, as duas vindas do review Codex:
     *
     * 1. Adiar a troca de tela até a escrita responder deixava o Modo Treino VIVO
     *    durante o round-trip — dava pra editar série, nota e variação de um treino já
     *    encerrado, e essas edições tardias ficavam de fora do snapshot. Trocar a tela
     *    na hora fecha a janela por construção: não há mais UI para editar.
     * 2. Celebração é reação; ela não deve esperar disco.
     *
     * O que de fato precisava esperar a escrita não era a tela, era a NAVEGAÇÃO: os
     * atalhos levam a `/corpo` e `/`, que leem as sessões na montagem. Por isso a
     * promessa viaja junto no snapshot e a tela de conclusão só navega depois dela.
     *
     * Se a escrita falhar, a promessa resolve mesmo assim: o treino aconteceu, e travar
     * a saída por erro de armazenamento castigaria o usuário por algo que não é dele.
     */
    const whenSaved = saveSession(next)
      .then(() => getAllSessions().then(setHistory))
      .catch(() => undefined);
    setCelebration({ session: next, workout, whenSaved });
  }

  const allDone = progress.allDone;

  return (
    <main className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-8 pt-6">
      {/*
        Palco (registro B / direção v3): a foto do exercício atual, desfocada e escurecida,
        vira a atmosfera do topo — a tela muda de clima a cada exercício sem competir com o
        conteúdo. O blur pesado resolve o fundo branco das fotos do free-exercise-db: o que
        sobra é um campo de cor, não uma imagem. `aria-hidden` porque é só ambiente.
      */}
      {media ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px] overflow-hidden" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- host externo já usado pelos cards */}
          <img
            src={media.imageUrls[0]}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-[0.16] blur-2xl saturate-150"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgb(10 20 34 / 0.2) 0%, var(--color-bg) 92%)" }}
          />
        </div>
      ) : null}
      <header>
        <div className="flex items-center justify-between gap-2">
          <Link href="/" aria-label="Voltar" className="text-muted">
            <ChevronLeft size={22} aria-hidden />
          </Link>
          <p className="text-sm font-medium leading-tight">{workout.name}</p>
          <span className="w-[22px]" aria-hidden />
        </div>
        {/* Progresso do treino: exercício atual sobre o total */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="text-[11px] tabular-nums text-faint">
            {idx + 1}/{total}
          </span>
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-surface2"
            role="progressbar"
            aria-label="Progresso do treino"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={idx + 1}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {p.training.workouts.length > 1 ? (
        <div className="mt-3 flex justify-center gap-2">
          {p.training.workouts.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() =>
                navegar(() => {
                  setSelected(w.id);
                  setCurrent(0);
                })
              }
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                w.id === workout.id ? "border-accent text-accent" : "border-line text-faint"
              }`}
            >
              {w.id}
            </button>
          ))}
        </div>
      ) : null}

      {workout.id !== officialTodayId ? (
        <button
          type="button"
          onClick={definirComoTreinoDeHoje}
          className="mx-auto mt-2 block text-xs font-medium text-accent underline-offset-2 hover:underline"
        >
          Definir {workout.name} como treino de hoje
        </button>
      ) : null}
      {/* Independente do que está sendo pré-visualizado: enquanto houver override ativo,
          precisa dar pra limpá-lo sem sair da tela (achado do review Codex). */}
      {override ? (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
          {workout.id === officialTodayId ? <span>Este é o treino de hoje (trocado por você).</span> : null}
          <button
            type="button"
            onClick={voltarAoPlanejado}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Voltar ao planejado
          </button>
        </div>
      ) : null}

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-faint">Exercício atual</p>
          <h1 className="mt-1 text-[22px] font-medium leading-tight tracking-tight">{mov.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {equipmentLabel(mov.equipment)} · {ex.sets} × {ex.reps}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenId(ex.id)}
          aria-label="Como fazer e variações"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted active:bg-surface2"
        >
          <BookOpen size={16} aria-hidden />
        </button>
      </div>

      <ExerciseMediaCard media={media} videoUrl={videoHref(mov)} alt={`Demonstração: ${mov.name}`} />

      {/* Série atual em foco (mockup: SÉRIE X DE N + steppers grandes) */}
      <section className="card-lift relative mt-4 rounded-card border border-line p-4">
        {prCelebration ? (
          <div
            key={prCelebration.token}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <span
              className="pr-ring absolute h-32 w-32 rounded-full"
              style={{ boxShadow: "0 0 0 2px var(--color-recovering), 0 0 60px 8px color-mix(in srgb, var(--color-recovering) 45%, transparent)" }}
              aria-hidden
            />
            <span className="pr-badge elev-float flex items-center gap-2 rounded-full border border-recovering/50 bg-surface2 px-4 py-2">
              <Trophy size={16} aria-hidden className="text-recovering" />
              <span className="text-sm font-medium">
                Recorde pessoal · {prCelebration.load.toLocaleString("pt-BR")} kg
              </span>
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-surface2 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted">
            {activeSet === -1 ? "Séries concluídas" : `Série ${activeSet + 1} de ${log?.sets.length ?? ex.sets}`}
          </span>
          {ex.effortTarget ? (
            <span className="rounded-md border border-line px-2 py-1 text-[10px] uppercase tracking-wider text-faint">
              RPE {ex.effortTarget}
            </span>
          ) : null}
        </div>

        {prevPerf && activeSet !== -1 ? (
          <p className="mt-3 text-center text-xs text-muted">
            Última vez:{" "}
            <span className="font-medium text-ink">
              {prevPerf.load_kg != null ? `${prevPerf.load_kg} kg` : "—"}
              {prevPerf.reps != null ? ` × ${prevPerf.reps}` : ""}
            </span>
          </p>
        ) : null}

        {activeSet !== -1 && activeLog ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-faint">Carga (kg)</span>
              <Stepper
                size="lg"
                value={activeLog.load_kg ?? 0}
                label="carga da série atual"
                onChange={(n) => patchSet(ex.id, activeSet, { load_kg: round1(n) })}
                step={LOAD_STEP}
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-faint">Repetições</span>
              <Stepper
                size="lg"
                value={activeLog.reps ?? 0}
                label="repetições da série atual"
                onChange={(n) => patchSet(ex.id, activeSet, { reps: Math.round(n) })}
                step={1}
                inputMode="numeric"
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-muted">
            Todas as séries deste exercício foram feitas. 💪
          </p>
        )}

        <button
          type="button"
          onClick={concluirSerie}
          disabled={activeSet === -1}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-all hover:bg-accent-press active:scale-[0.98] disabled:opacity-40"
        >
          {activeSet === -1 ? "Exercício concluído" : "Concluir série"}
          <Check size={16} aria-hidden />
        </button>
      </section>

      {/* Todas as séries (tabela completa, com RPE e ✓ por linha) */}
      <section className="mt-3 rounded-card border border-line bg-surface">
        <button
          type="button"
          onClick={() => setAllSetsOpen((v) => !v)}
          aria-expanded={allSetsOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[11px] uppercase tracking-wider text-faint">Todas as séries</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            {log ? `${log.sets.filter((s) => s.done).length}/${log.sets.length}` : ""}
            <ChevronDown
              size={16}
              aria-hidden
              className={`transition-transform ${allSetsOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
        {allSetsOpen ? (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-1.5 px-1 text-[10px] uppercase tracking-wider text-faint">
              <span className="w-4">Série</span>
              <span className="flex-1 text-center">KG</span>
              <span className="flex-1 text-center">Reps</span>
              <span className="w-9 text-center">RPE</span>
              <span className="w-7" />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {log?.sets.map((s, i) => {
                const isActive = i === activeSet;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 rounded-xl px-1 py-1.5 ${
                      isActive ? "bg-accent/5" : ""
                    }`}
                  >
                    <span
                      className={`w-4 text-center text-xs ${isActive ? "font-medium text-accent" : "text-faint"}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex flex-1 justify-center">
                      <Stepper
                        value={s.load_kg ?? 0}
                        label={`carga da série ${i + 1}`}
                        onChange={(n) => patchSet(ex.id, i, { load_kg: round1(n) })}
                        step={LOAD_STEP}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex flex-1 justify-center">
                      <Stepper
                        value={s.reps ?? 0}
                        label={`repetições da série ${i + 1}`}
                        onChange={(n) => patchSet(ex.id, i, { reps: Math.round(n) })}
                        step={1}
                        inputMode="numeric"
                      />
                    </div>
                    <RpeInput
                      value={s.rpe}
                      label={`RPE da série ${i + 1}`}
                      onCommit={(rpe) => patchSet(ex.id, i, { rpe })}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSetDone(i, s.done)}
                      aria-pressed={s.done}
                      aria-label={`Série ${i + 1} feita`}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        s.done ? "border-accent bg-accent text-on-accent" : "border-line text-faint"
                      }`}
                    >
                      <Check size={14} aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-4">
        <label htmlFor="exercise-note" className="text-[10px] uppercase tracking-wider text-faint">
          Observações
        </label>
        <textarea
          id="exercise-note"
          value={log?.note ?? ""}
          onChange={(e) => patchExercise(ex.id, { note: e.target.value })}
          placeholder="Ex.: troquei por supino máquina, ombro reclamou na última."
          rows={2}
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent/50"
        />
      </div>

      {/* Próximo exercício (mockup) ou fechamento do treino */}
      {nextMedia ? <PreloadImages urls={nextMedia.imageUrls} /> : null}
      {/* Avanço automático: o app avisa o que vai fazer e deixa cancelar antes de fazer. */}
      {autoNext && nextMov ? (
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-card border border-accent/40 bg-accent/[0.07] px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <p className="min-w-0 text-sm">
            <span className="block truncate">
              Próximo: <span className="font-medium">{nextMov.name}</span>
            </span>
            <span className="block text-xs text-muted">
              em {autoNext.left}s · toque em cancelar para ficar aqui
            </span>
          </p>
          <button
            type="button"
            onClick={() => setAutoNext(null)}
            className="shrink-0 rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted active:bg-surface2"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      {nextEx && nextMov ? (
        <button
          type="button"
          onClick={() => navegar(() => setCurrent((c) => Math.min(total - 1, c + 1)))}
          className="mt-4 flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-left active:bg-surface2"
        >
          <ExerciseThumb media={nextMedia} className="h-12 w-12 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wider text-faint">
              Próximo exercício
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">{nextMov.name}</span>
            <span className="block text-xs text-muted">{nextEx.sets} séries</span>
          </span>
          <ChevronRight size={18} aria-hidden className="shrink-0 text-faint" />
        </button>
      ) : (
        <button
          type="button"
          onClick={concluirTreino}
          disabled={session.status === "done"}
          className="mt-4 w-full rounded-card border border-accent/40 bg-accent/10 p-4 text-sm font-medium text-accent transition-colors active:bg-accent/20 disabled:opacity-60"
        >
          {session.status === "done"
            ? "Treino concluído 💪"
            : `Concluir treino${allDone ? "" : ` (${progress.doneSets}/${progress.totalSets} séries)`}`}
        </button>
      )}

      {/* Variações inline (mockup base): original + alternativas, com thumbnail */}
      {ex.alternatives.length > 0 ? (
        <section className="mt-5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] uppercase tracking-wider text-faint">Variações</p>
            <button type="button" onClick={() => setOpenId(ex.id)} className="text-xs text-accent">
              Como fazer ›
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {[{ id: undefined as string | undefined, name: ex.name, equipment: ex.equipment, mediaId: ex.howTo.mediaId },
              ...ex.alternatives.map((a) => ({ id: a.id as string | undefined, name: a.name, equipment: a.equipment, mediaId: a.howTo.mediaId }))].map(
              (opt) => {
                const selectedOpt = (log?.swappedToId ?? undefined) === opt.id;
                return (
                  <button
                    key={opt.id ?? "__original"}
                    type="button"
                    onClick={() => patchExercise(ex.id, { swappedToId: opt.id })}
                    aria-pressed={selectedOpt}
                    className={`flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors ${
                      selectedOpt ? "border-accent/60 bg-accent/5" : "border-line bg-surface active:bg-surface2"
                    }`}
                  >
                    <ExerciseThumb
                      media={resolveExerciseMedia(opt.name, opt.mediaId)}
                      className="h-11 w-11 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{opt.name}</span>
                      <span className="block text-xs text-muted">
                        {equipmentLabel(opt.equipment)}
                        {opt.id === undefined ? " · original" : ""}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selectedOpt ? "border-accent bg-accent text-on-accent" : "border-line text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => navegar(() => setCurrent((c) => Math.max(0, c - 1)))}
          disabled={idx === 0}
          className="flex items-center gap-1 text-muted disabled:opacity-30"
        >
          <ChevronLeft size={16} aria-hidden /> Anterior
        </button>
        {idx === total - 1 ? (
          <button
            type="button"
            onClick={concluirTreino}
            disabled={session.status === "done"}
            className="text-accent disabled:opacity-50"
          >
            {session.status === "done" ? "Treino concluído 💪" : "Concluir treino"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navegar(() => setCurrent((c) => Math.min(total - 1, c + 1)))}
            className="flex items-center gap-1 text-muted"
          >
            Próximo <ChevronRight size={16} aria-hidden />
          </button>
        )}
      </div>

      {openId && log ? (
        <ExerciseSheet
          exercise={ex}
          swappedToId={log.swappedToId}
          onSwap={(altId) => patchExercise(ex.id, { swappedToId: altId })}
          onClose={() => setOpenId(null)}
        />
      ) : null}

      <RestTimer
        open={restOpen}
        onClose={() => setRestOpen(false)}
        seconds={ex.rest_s ?? 60}
        runToken={restToken}
        sessionId={session.sessionId}
        exerciseId={ex.id}
      />

      <BottomNav active="treino" />
    </main>
  );
}

/**
 * Input de RPE (esforço percebido) restrito ao domínio 6–10. Mantém um buffer de
 * texto para permitir digitar "10" sem o clamp atrapalhar no meio; só persiste
 * valor válido (durante a digitação) e grampeia no blur. Vazio → undefined.
 */
function RpeInput({
  value,
  label,
  onCommit,
}: {
  value: number | undefined;
  label: string;
  onCommit: (rpe: number | undefined) => void;
}) {
  const [text, setText] = useState(() => (value == null ? "" : String(value)));
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  if (value !== prev && !focused) {
    setPrev(value);
    setText(value == null ? "" : String(value));
  }

  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={text}
      placeholder="—"
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value.trim() === "") {
          onCommit(undefined);
          return;
        }
        const n = parseInt(e.target.value, 10);
        // Só persiste em tempo real quando já está na faixa; o resto espera o blur.
        if (!Number.isNaN(n) && n >= RPE_MIN && n <= RPE_MAX) onCommit(n);
      }}
      onBlur={() => {
        setFocused(false);
        const raw = text.trim() === "" ? undefined : parseInt(text, 10);
        const rpe = clampRpe(Number.isNaN(raw as number) ? undefined : raw);
        onCommit(rpe);
        setText(rpe == null ? "" : String(rpe));
      }}
      className="w-9 rounded-lg bg-surface2/40 py-1 text-center text-sm tabular-nums outline-none placeholder:text-faint focus:text-accent"
    />
  );
}

function Stepper({
  value,
  onChange,
  step,
  inputMode,
  suffix,
  label,
  size = "sm",
}: {
  value: number;
  onChange: (n: number) => void;
  step: number;
  inputMode: "numeric" | "decimal";
  suffix?: string;
  label: string;
  size?: "sm" | "lg";
}) {
  const [text, setText] = useState(() => String(value));
  const [prev, setPrev] = useState(value);
  const [focused, setFocused] = useState(false);
  if (value !== prev && !focused) {
    setPrev(value);
    setText(String(value));
  }
  const commit = (n: number) => onChange(Math.max(0, n));
  const lg = size === "lg";

  return (
    <div className={`flex items-center ${lg ? "gap-1.5" : "gap-1"}`}>
      <button
        type="button"
        onClick={() => commit(round1(value - step))}
        aria-label={`Diminuir ${label}`}
        className={`flex shrink-0 items-center justify-center rounded-full border border-line text-muted active:bg-surface2 ${
          lg ? "h-9 w-9" : "h-6 w-6"
        }`}
      >
        <Minus size={lg ? 16 : 12} aria-hidden />
      </button>
      <span className="inline-flex items-center gap-1">
        {/* Campo digitável de verdade (o usuário pode preferir o teclado aos botões ±) —
            visual de input para o affordance ficar óbvio, sem estourar a largura do card. */}
        <input
          value={text}
          inputMode={inputMode}
          aria-label={label}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value.replace(",", "."));
            if (!Number.isNaN(n)) commit(n);
          }}
          onBlur={() => {
            setFocused(false);
            const n = parseFloat(text.replace(",", "."));
            const v = Number.isNaN(n) ? 0 : Math.max(0, n);
            commit(v);
            setText(String(v));
          }}
          className={`rounded-lg border bg-surface2/40 text-center tabular-nums outline-none transition-colors focus:border-accent/60 focus:text-accent ${
            lg ? "h-11 w-14 border-line text-xl font-medium" : "h-7 w-10 border-transparent text-sm"
          }`}
        />
        {suffix ? <span className="text-xs text-faint">{suffix}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => commit(round1(value + step))}
        aria-label={`Aumentar ${label}`}
        className={`flex shrink-0 items-center justify-center rounded-full border border-line text-muted active:bg-surface2 ${
          lg ? "h-9 w-9" : "h-6 w-6"
        }`}
      >
        <Plus size={lg ? 16 : 12} aria-hidden />
      </button>
    </div>
  );
}
