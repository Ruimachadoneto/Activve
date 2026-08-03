/**
 * Centro de avisos LOCAL (TASK-030, item 6 do feedback de uso real).
 *
 * POR QUE ISTO EXISTE
 * O sino do Hoje era um `<span>` com uma bolinha teal fixa. Ele não era só inerte — ele
 * **afirmava que havia aviso novo**, o que viola a §9 (honestidade) tanto quanto um número
 * inventado. Nas palavras do usuário: *"algo em tela que é só visual, não clicável, dá
 * impressão de produto não completo"*.
 *
 * AS DUAS REGRAS QUE GOVERNAM ESTE ARQUIVO
 *
 * 1. **Todo aviso é um FATO derivado do que já foi registrado.** Nada é estimado, nada é
 *    prescrito. O app não manda treinar, não manda comer, não pontua o usuário. Um aviso
 *    diz "isto aconteceu" ou "isto está assim há tanto tempo" — nunca "você deveria".
 *
 * 2. **`id` e `at` são DETERMINÍSTICOS.** Os avisos são recalculados do zero a cada
 *    abertura (não há tabela de avisos, só de lidos). Se o id mudasse entre dois cálculos
 *    do mesmo fato, o aviso "não lido" ressuscitaria para sempre; se `at` fosse `now`, a
 *    lista se reordenaria sozinha. Por isso todo carimbo vem do dado (data da sessão,
 *    instante calculado de recuperação, `importedAt` do plano) e nunca do relógio.
 *
 * Camada pura: sem React, sem IndexedDB (o estado de lido mora em `storage/notices.ts`).
 */

import type { Muscle, PlanFile } from "./schema";
import type { WorkoutSession } from "./session";
import type { BodyEntry } from "./body";
import { isoDate } from "./session";
import { buildSessionSummary } from "./summary";
import {
  buildExerciseMuscles,
  computeRecovery,
  stimuliFromSessions,
  type ExerciseMuscles,
} from "./recovery";
import { completedThisWeek, nextInRotation, rotationOf } from "./rotation";

export type NoticeKind = "record" | "ready" | "week_done" | "weight_stale" | "plan_age";

export type Notice = {
  /** Determinístico: o mesmo fato gera sempre o mesmo id (ver regra 2 no topo). */
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  /** Quando o fato aconteceu (ISO). Ordena a lista e também é determinístico. */
  at: string;
  /** Para onde o aviso leva, quando há um lugar que o explica. */
  href?: string;
};

export type NoticesInput = {
  plan: PlanFile | null;
  /** `importedAt` do plano ativo — o "início do ciclo" (semântica da TASK-018). */
  planImportedAt?: string | null;
  /**
   * Id do plano ATIVO. Obrigatório porque este arquivo faz duas perguntas com escopos
   * diferentes sobre a mesma lista (ver `sessions`); sem ele não dá para separá-las.
   */
  activePlanId: string | null;
  /**
   * TODAS as sessões, de todos os planos.
   *
   * ⚠️ **Duas perguntas, dois escopos** (achado do review Codex): o RECORDE atravessa
   * plano de propósito — a continuidade do produto é por `exercise.id` entre ciclos
   * (ADR-002), e trocar de plano não pode zerar a memória de carga. Já a SEMANA, a
   * ROTAÇÃO e a RECUPERAÇÃO pertencem ao ciclo vigente: o resto do app calcula os três a
   * partir de `getSessionsForPlan(planId)`, e contar um ciclo anterior aqui faria o sino
   * anunciar "semana fechada" logo depois de importar um plano novo — o centro de avisos
   * contradizendo o Hoje e o Corpo. O recorte acontece dentro de `buildNotices`, não no
   * chamador, para que não haja como errar de fora.
   */
  sessions: WorkoutSession[];
  /**
   * Todos os planos já importados, para resolver o nome de um movimento pelo plano em que
   * ele foi EXECUTADO.
   *
   * Sem isto, um recorde batido num ciclo anterior era rotulado pelo catálogo do plano
   * ATIVO: se o id existisse lá com outro significado — ou se a variação (`swappedToId`)
   * não existisse mais — o aviso anunciava o movimento errado (achado do review Codex).
   * Mesmo remédio do `planForSession` no `report.ts`: o `planId` da sessão é um fato
   * registrado, não uma inferência.
   */
  knownPlans?: { planId: string; plan: PlanFile }[];
  bodyEntries: BodyEntry[];
};

/** Janela de relevância: aviso mais velho que isto não vale mais a pena mostrar. */
const JANELA_DIAS = 30;
/** Dias sem registro de peso até virar aviso. */
const PESO_PARADO_DIAS = 14;
/** Semanas de plano até sugerir um novo ciclo com o coach. */
const CICLO_SEMANAS = 8;
const DIA_MS = 24 * 60 * 60 * 1000;

const concluidas = (s: WorkoutSession[]) => s.filter((x) => x.status === "done");

/**
 * Meio-dia LOCAL de um `yyyy-mm-dd`.
 *
 * `BodyEntry.date` e `WorkoutSession.date` são datas locais (`isoDate` usa `getFullYear`
 * e companhia). Interpretá-las como UTC (`T12:00:00.000Z`) desloca o limiar em algumas
 * horas: num fuso a oeste, um peso de 14 dias continuava "fresco" parte do dia, e o sino
 * discordava do dia gravado (achado do review Codex). A convenção do resto do app é meio-dia
 * local — longe o bastante das duas bordas para nenhum horário de verão virar o dia.
 */
function meioDiaLocal(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

/**
 * Nome exibível de um movimento. **Função total** — plano histórico só passou pela guarda
 * estrutural da TASK-013, então qualquer campo pode faltar; sem nome utilizável cai no id,
 * nunca num rótulo em branco (mesma postura do `report.ts`).
 */
function movementName(plan: PlanFile | null, exerciseId: string, movementId: string): string {
  const workouts = Array.isArray(plan?.training?.workouts) ? plan.training.workouts : [];
  for (const w of workouts) {
    if (!Array.isArray(w?.exercises)) continue;
    const ex = w.exercises.find((e) => e?.id === exerciseId);
    if (!ex) continue;
    if (movementId !== exerciseId && Array.isArray(ex.alternatives)) {
      const alt = ex.alternatives.find((a) => a?.id === movementId);
      if (typeof alt?.name === "string" && alt.name.trim()) return alt.name;
    }
    if (typeof ex.name === "string" && ex.name.trim()) return ex.name;
  }
  return movementId;
}

function workoutName(plan: PlanFile | null, workoutId: string): string {
  const workouts = Array.isArray(plan?.training?.workouts) ? plan.training.workouts : [];
  const w = workouts.find((x) => x?.id === workoutId);
  return typeof w?.name === "string" && w.name.trim() ? w.name : workoutId;
}

const formatarData = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}` : iso;
};

/** Segunda-feira da semana de `date`, em yyyy-mm-dd. */
function segundaDa(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
  return isoDate(d);
}

/**
 * Recordes pessoais batidos nas sessões recentes.
 *
 * A régua é a mesma da tela de conclusão (`buildSessionSummary`), de propósito: o aviso
 * não pode celebrar um recorde que a tela do treino não celebrou, nem o contrário.
 */
function avisosDeRecorde(input: NoticesInput, desde: number): Notice[] {
  /** Plano em que a sessão foi executada; sem histórico conhecido, cai no ativo. */
  const planoDa = (s: WorkoutSession): PlanFile | null =>
    input.knownPlans?.find((p) => p.planId === s.planId)?.plan ?? input.plan;
  /*
   * Ordem cronológica é OBRIGATÓRIA aqui, não conveniência.
   *
   * `buildSessionSummary` foi escrita para a tela de conclusão, onde o "histórico" é tudo
   * o que existe no instante em que o treino acaba — ou seja, nada do futuro. Ela exclui
   * apenas a própria sessão, por `sessionId`. Reproduzi-la sobre a lista inteira compara
   * cada treino com o melhor de TODOS OS TEMPOS, inclusive o que veio depois: numa
   * progressão 60 → 65 → 70, o dia de 65 deixava de ser recorde assim que o de 70
   * existisse, e o centro de avisos engolia recordes legítimos (achado do review Codex).
   *
   * A régua de cada sessão é só o que existia ANTES dela. Mesma armadilha da TASK-013 e
   * da TASK-029: função certa, contexto diferente daquele para o qual foi escrita.
   */
  const feitas = concluidas(input.sessions)
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? (a.completedAt ?? "").localeCompare(b.completedAt ?? "")
        : a.date.localeCompare(b.date),
    );
  const out: Notice[] = [];
  for (let i = 0; i < feitas.length; i++) {
    const s = feitas[i];
    const at = s.completedAt ?? meioDiaLocal(s.date).toISOString();
    if (new Date(at).getTime() < desde) continue;
    for (const r of buildSessionSummary(s, feitas.slice(0, i)).records) {
      out.push({
        id: `record:${s.sessionId}:${r.movementId}`,
        kind: "record",
        title: `Novo recorde em ${movementName(planoDa(s), r.exerciseId, r.movementId)}`,
        body: `${r.load_kg} kg${r.reps ? ` × ${r.reps}` : ""} — o melhor anterior era ${r.previousBest} kg.`,
        at,
        href: `/relatorios?d=${s.date}`,
      });
    }
  }
  return out;
}

/**
 * O próximo treino da rotação voltou a estar recuperado.
 *
 * O carimbo é o **instante calculado** em que o último músculo exigido por aquele treino
 * cruza a janela de recuperação (`lastWorkedAt + recoveryHours`) — um valor derivado do
 * dado, não do relógio, que é o que permite o aviso aparecer uma vez por ciclo em vez de
 * um por dia. Se nenhum músculo do treino foi trabalhado, não há travessia a anunciar:
 * silêncio é mais honesto que "está tudo pronto" sobre um corpo do qual nada foi medido.
 */
function avisoDeRecuperacao(
  input: NoticesInput,
  doPlano: WorkoutSession[],
  agora: number,
  desde: number,
): Notice | null {
  const { plan } = input;
  if (!plan) return null;
  const proximo = nextInRotation(plan, doPlano);
  if (!proximo) return null;
  const workouts = Array.isArray(plan.training?.workouts) ? plan.training.workouts : [];
  const treino = workouts.find((w) => w?.id === proximo);
  const exercicios: ExerciseMuscles[] = Array.isArray(treino?.exercises)
    ? treino.exercises.map((e) => ({
        primary: Array.isArray(e?.primaryMuscles) ? e.primaryMuscles : [],
        secondary: Array.isArray(e?.secondaryMuscles) ? e.secondaryMuscles : [],
      }))
    : [];
  if (exercicios.length === 0) return null;

  const recovery = computeRecovery(
    stimuliFromSessions(doPlano, buildExerciseMuscles(plan), agora),
    agora,
  );

  let travessia = 0;
  let algumTrabalhado = false;
  const musculos = new Set<Muscle>();
  for (const ex of exercicios) {
    for (const m of ex.primary) musculos.add(m);
    for (const m of ex.secondary ?? []) musculos.add(m);
  }
  for (const m of musculos) {
    const r = recovery[m];
    if (!r || r.lastWorkedAt == null || r.recoveryHours == null) continue; // descansado
    algumTrabalhado = true;
    const prontoEm = r.lastWorkedAt + r.recoveryHours * 60 * 60 * 1000;
    if (prontoEm > agora) return null; // ainda falta alguém — nada a anunciar
    travessia = Math.max(travessia, prontoEm);
  }
  if (!algumTrabalhado || travessia === 0 || travessia < desde) return null;

  return {
    /*
     * Arredondado à hora: blinda o id contra micro-variações do cálculo entre aberturas.
     * Com o PLANO no id porque o disco de lidos é global e ids de treino (`A`, `B`) se
     * repetem entre ciclos — dois planos chegando à recuperação na mesma hora colidiriam
     * e o segundo nasceria "lido" (achado do review Codex; mesma classe da colisão de ids
     * de variação da TASK-009).
     */
    id: `ready:${input.activePlanId ?? "?"}:${proximo}:${Math.floor(travessia / (60 * 60 * 1000))}`,
    kind: "ready",
    title: `${workoutName(plan, proximo)} está recuperado`,
    body: "Tudo que este treino exige voltou a estar pronto, pelo que você registrou.",
    at: new Date(travessia).toISOString(),
    href: "/corpo",
  };
}

/** Meta semanal do plano atingida — fato, não elogio (nem cobrança se não atingir). */
function avisoDeSemana(input: NoticesInput, doPlano: WorkoutSession[], agora: Date): Notice | null {
  const { plan } = input;
  if (!plan) return null;
  const { weeklyTarget } = rotationOf(plan);
  const feitosNaSemana = completedThisWeek(doPlano, agora);
  if (feitosNaSemana < weeklyTarget) return null;
  const segunda = segundaDa(agora);
  // Carimbo = a sessão que FECHOU a meta, não "agora": é ela o fato.
  const daSemana = concluidas(doPlano)
    .filter((s) => s.date >= segunda && s.date <= isoDate(agora))
    .sort((a, b) => (a.completedAt ?? a.date).localeCompare(b.completedAt ?? b.date));
  const fechou = daSemana[weeklyTarget - 1] ?? daSemana[daSemana.length - 1];
  if (!fechou) return null;
  return {
    // Com o PLANO no id: importar um plano novo na MESMA semana geraria a mesma chave do
    // ciclo anterior, e o primeiro "semana fechada" do ciclo novo nasceria lido.
    id: `week_done:${input.activePlanId ?? "?"}:${segunda}`,
    kind: "week_done",
    title: "Semana fechada",
    body: `${feitosNaSemana} ${feitosNaSemana === 1 ? "treino" : "treinos"} — a meta do plano é ${weeklyTarget} por semana.`,
    at: fechou.completedAt ?? meioDiaLocal(fechou.date).toISOString(),
    href: "/relatorios",
  };
}

/**
 * Peso sem registro novo há muito tempo.
 *
 * Só existe se já houve ao menos um registro: sem nenhum, isto não é "parado", é
 * "nunca começou" — e cutucar quem ainda não começou é cobrança, não aviso.
 */
function avisoDePesoParado(input: NoticesInput, agora: number): Notice | null {
  const datas = input.bodyEntries
    .filter((e) => typeof e?.weight_kg === "number")
    .map((e) => e.date)
    .sort();
  const ultima = datas[datas.length - 1];
  if (!ultima) return null;
  // Carimbo = o instante em que virou "parado" (última + N dias), não o momento da leitura.
  const virou = meioDiaLocal(ultima).getTime() + PESO_PARADO_DIAS * DIA_MS;
  if (virou > agora) return null;
  return {
    id: `weight_stale:${ultima}`,
    kind: "weight_stale",
    title: "Faz um tempo sem registrar peso",
    body: `O último foi em ${formatarData(ultima)}. Sem dado novo, a tendência para de contar história.`,
    at: new Date(virou).toISOString(),
    href: "/corpo",
  };
}

/** O ciclo do plano já tem idade — o loop com o coach é do produto, não uma prescrição. */
function avisoDeIdadeDoPlano(input: NoticesInput, agora: number): Notice | null {
  const { planImportedAt, plan } = input;
  if (!planImportedAt || !plan) return null;
  const base = new Date(planImportedAt).getTime();
  if (!Number.isFinite(base)) return null;
  const venceEm = base + CICLO_SEMANAS * 7 * DIA_MS;
  if (venceEm > agora) return null;
  const planId = typeof plan.meta?.planId === "string" ? plan.meta.planId : "plano";
  return {
    id: `plan_age:${planId}`,
    kind: "plan_age",
    title: `Seu ciclo já tem ${CICLO_SEMANAS} semanas`,
    body: "Pode ser um bom momento para pedir um ciclo novo ao coach e importar aqui.",
    at: new Date(venceEm).toISOString(),
    href: "/mais",
  };
}

/**
 * Todos os avisos, do mais recente para o mais antigo.
 *
 * Recalculado do zero a cada abertura — não há tabela de avisos, só a de lidos
 * (`storage/notices.ts`). É por isso que os ids precisam ser estáveis.
 */
export function buildNotices(input: NoticesInput, now: Date = new Date()): Notice[] {
  const agora = now.getTime();
  const desde = agora - JANELA_DIAS * DIA_MS;
  /*
   * Sessões do ciclo VIGENTE. Sem `activePlanId` não há recorte possível, e aí a resposta
   * honesta é não emitir os avisos que dependem dele — melhor calar do que afirmar
   * "semana fechada" com sessões de outro programa.
   */
  const doPlano =
    input.activePlanId == null
      ? []
      : input.sessions.filter((s) => s.planId === input.activePlanId);
  const out: Notice[] = [
    ...avisosDeRecorde(input, desde),
    avisoDeRecuperacao(input, doPlano, agora, desde),
    avisoDeSemana(input, doPlano, now),
    avisoDePesoParado(input, agora),
    avisoDeIdadeDoPlano(input, agora),
  ].filter((n): n is Notice => n != null);

  /*
   * A janela de relevância vale para EVENTOS, não para CONDIÇÕES.
   *
   * Recorde, semana fechada e recuperação são fatos pontuais: passados 30 dias, viram
   * ruído e saem (antes só o recorde e a recuperação eram podados, então uma "semana
   * fechada" de três meses atrás ficava na lista para sempre — achado do review Codex).
   *
   * Já "peso parado" e "ciclo com 8 semanas" descrevem uma situação que **ainda é
   * verdade agora**: as funções que os geram só os emitem enquanto a condição vale. Podá-los
   * por idade sumiria com o aviso justamente de quem está há mais tempo naquela situação —
   * corrigir um ruído criando um silêncio. Eles carregam a data em que a condição começou,
   * que é o dado honesto, e param de incomodar por já estarem lidos.
   */
  const EVENTOS: NoticeKind[] = ["record", "week_done", "ready"];
  return out
    .filter((n) => {
      const t = new Date(n.at).getTime();
      if (t > agora) return false; // nada do futuro
      return EVENTOS.includes(n.kind) ? t >= desde : true;
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** Quantos ainda não foram lidos — é o que decide se a bolinha do sino acende. */
export function unreadCount(notices: Notice[], readIds: Iterable<string>): number {
  const lidos = new Set(readIds);
  return notices.reduce((n, x) => (lidos.has(x.id) ? n : n + 1), 0);
}
