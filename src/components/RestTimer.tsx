"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, X } from "lucide-react";
import {
  clearRestTimer,
  loadRestTimer,
  remainingOf,
  saveRestTimer,
  type RestTimerState,
} from "@/lib/storage/restTimer";

const BASE_PRESETS = [30, 60, 90, 120];

/**
 * Quanto o "acabou" fica em cena antes do overlay sair sozinho. Curto o bastante para
 * não atrasar a próxima série, longo o bastante para o fim ser VISTO por quem estava
 * olhando a tela (a vibração já avisa quem não estava).
 */
const AUTO_CLOSE_MS = 1400;

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Cronômetro de descanso em overlay (bottom-sheet). Reinicia quando `runToken` muda
 * (ex.: ao concluir uma série ou marcar ✓). `seconds` é a duração padrão (rest do exercício).
 */
export function RestTimer({
  open,
  onClose,
  seconds = 60,
  runToken = 0,
  sessionId,
  exerciseId,
  workoutId,
}: {
  open: boolean;
  onClose: () => void;
  seconds?: number;
  runToken?: number;
  /** A que sessão/exercício este descanso pertence — escopo do estado persistido. */
  sessionId: string;
  exerciseId: string;
  workoutId: string;
}) {
  /*
   * Estado inicial vem do DISCO, não de `seconds`. É isto que corrige o "contador fora
   * da realidade": ao voltar de outro app, o celular pode ter descartado a página, e a
   * remontagem sem esta leitura recomeçaria o descanso do zero. O inicializador é
   * preguiçoso e a leitura é síncrona, então o valor certo já está no PRIMEIRO render —
   * nunca há um frame com o número errado.
   */
  const revived = useRef<RestTimerState | null>(null);
  const [duration, setDuration] = useState(() => {
    const saved = loadRestTimer(sessionId, exerciseId);
    revived.current = saved;
    return saved?.duration ?? seconds;
  });
  const [remaining, setRemaining] = useState(() =>
    revived.current ? remainingOf(revived.current) : seconds,
  );
  const [running, setRunning] = useState(
    () => revived.current !== null && revived.current.pausedRemaining === null,
  );
  /*
   * Descanso revivido do disco ABRE SOZINHO, sem a página precisar sincronizar estado.
   * A alternativa — a página ler o disco num efeito e chamar `setRestOpen` — é
   * exatamente o `setState` dentro de efeito que o lint do projeto proíbe, e a lição da
   * TASK-010 é reestruturar em vez de contornar. Aqui quem sabe que há um descanso vivo
   * é quem já leu o disco, então é ele que decide aparecer.
   */
  const [revivedOpen, setRevivedOpen] = useState(() => revived.current !== null);
  const visible = open || revivedOpen;
  // Âncora absoluta (epoch ms) de quando o descanso zera — a fonte da verdade do
  // countdown, nunca um decremento. É o que faz o timer se corrigir sozinho ao voltar
  // de segundo plano/aba oculta: o browser faz throttling de timers em background, mas
  // `endAt - Date.now()` continua correto não importa quantos ticks foram perdidos.
  const endAtRef = useRef<number | null>(revived.current?.endAt ?? null);
  const remainingRef = useRef(revived.current ? remainingOf(revived.current) : seconds);
  const vibratedRef = useRef(revived.current?.alerted ?? false);
  /** Último `runToken` já ancorado. Revivido do disco já nasce ancorado (ver efeito). */
  const anchoredTokenRef = useRef<number | null>(revived.current ? runToken : null);

  /** Grava a âncora atual. Toda ação que mexe no tempo passa por aqui. */
  function persist(patch: { endAt: number; duration: number; pausedRemaining: number | null }) {
    saveRestTimer({ ...patch, sessionId, exerciseId, workoutId, alerted: vibratedRef.current });
  }

  const [prevToken, setPrevToken] = useState(runToken);
  if (runToken !== prevToken) {
    setPrevToken(runToken);
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  // Refs não podem ser escritas durante o render — a ancoragem do reset acima acontece
  // aqui. Importante: NÃO depender de `running`/`duration` terem mudado de VALOR pra
  // reancorar (bug real do review Codex — reiniciar com o mesmo `seconds`/já `running`,
  // ex. marcar ✓ noutra série durante um descanso do mesmo tamanho, ou tocar um preset
  // igual ao atual, não muda nenhum dos dois e o timer ficava mirando o alvo antigo).
  // Toda ação que (re)inicia a contagem ancora explicitamente aqui e nos handlers abaixo.
  useEffect(() => {
    /*
     * Ancorar é IDEMPOTENTE por token, não "uma vez": a primeira versão consumia uma
     * flag (`if (revived) { revived = null; return; }`) e o StrictMode, que invoca o
     * efeito duas vezes, entrava a segunda vez com a flag já limpa e reancorava com o
     * tempo cheio — jogando fora exatamente o descanso que tinha sobrevivido. Pego na
     * verificação no browser: o cronômetro voltava para 2:00 depois do reload.
     *
     * Guardar QUAL token já foi ancorado torna a repetição inofensiva. Revivido do
     * disco entra já marcado como ancorado: o `runToken` da montagem não representa uma
     * série nova.
     */
    /*
     * Fechado não ancora NADA. Sem esta guarda, só montar a tela de treino já gravava um
     * descanso no disco (o efeito roda na montagem, com `runToken` inicial), e na
     * montagem seguinte esse registro fantasma era revivido e o overlay ABRIA SOZINHO,
     * sem o usuário ter concluído série nenhuma. Pego inspecionando o storage durante a
     * verificação da TASK-029, não por teste: a suíte sempre iniciava o descanso pelo
     * botão, que é o único caminho em que `open` já é true.
     */
    if (!open) return;
    if (anchoredTokenRef.current === runToken) return;
    anchoredTokenRef.current = runToken;
    const endAt = Date.now() + seconds * 1000;
    remainingRef.current = seconds;
    endAtRef.current = endAt;
    vibratedRef.current = seconds <= 0;
    persist({ endAt, duration: seconds, pausedRemaining: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken, open]);

  // Só cuida da limpeza ao pausar — o (re)ancoramento ao rodar é sempre explícito
  // (efeito acima + handlers), nunca inferido de `running`/`duration` mudarem de valor.
  useEffect(() => {
    if (!running) endAtRef.current = null;
  }, [running]);

  // Recalcula `remaining` a partir de `endAt` (nunca decrementa) — corrige sozinho
  // qualquer atraso de timer em segundo plano. Reancora ao focar/voltar visível pra
  // atualizar na hora, sem esperar o próximo tick.
  useEffect(() => {
    if (!visible || !running) return;
    function tick() {
      const endAt = endAtRef.current;
      if (endAt == null) return;
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      remainingRef.current = left;
      setRemaining(left);
      if (left === 0) {
        /*
         * Zerou: a âncora morre AGORA, não daqui a 1,4s quando o overlay some. Sem isto,
         * um descarte do app dentro dessa janela revivia o descanso como ativo e a
         * vibração de fim tocava de novo (achado [P3] do review Codex).
         *
         * Só limpa quem chegou vivo ao zero. Se a página estava congelada, o registro
         * sobrevive de propósito — é ele que dá o aviso de recuperação ao voltar.
         */
        clearRestTimer();
        if (!vibratedRef.current) {
          vibratedRef.current = true;
          try {
            navigator.vibrate?.([180, 90, 180]);
          } catch {
            /* sem vibração disponível */
          }
        }
        setRunning(false);
      }
    }
    // Ancora perdida (revivido pausado, por exemplo) não deve zerar a tela.
    tick();
    const id = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [visible, running]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, onClose]);

  /*
   * Fim do descanso fecha o overlay sozinho: acabado o tempo, esta tela não tem mais
   * nada a dizer e ficar exigindo um toque para sair atrapalha quem já está de volta na
   * barra. O compasso de ~1,4s deixa o "acabou" ser visto.
   *
   * Vive num efeito com limpeza, não num `setTimeout` solto: fechar na mão, pular, ou
   * sair da tela dentro da janela cancela o agendamento — é a mesma classe de bug do
   * compasso do recorde (`restDelayRef`), que exige cancelamento em toda saída.
   */
  const done = remaining === 0;
  useEffect(() => {
    if (!visible || !done) return;
    const id = window.setTimeout(() => fechar(), AUTO_CLOSE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, done]);

  /** Saída única do overlay: o estado persistido morre junto, nunca revive depois. */
  function fechar() {
    clearRestTimer();
    setRevivedOpen(false);
    onClose();
  }

  if (!visible) return null;

  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = duration > 0 ? remaining / duration : 0;

  function setPreset(p: number) {
    // Só roda a partir do onClick (evento do usuário), nunca durante o render.
    const now = Date.now();
    remainingRef.current = p;
    endAtRef.current = now + p * 1000;
    vibratedRef.current = false;
    persist({ endAt: now + p * 1000, duration: p, pausedRemaining: null });
    setDuration(p);
    setRemaining(p);
    setRunning(true);
  }

  /** +15s sem reiniciar: estende o descanso atual (comum quando a série pesou). */
  function addTime(extra: number) {
    const now = Date.now();
    const next = remainingRef.current + extra;
    remainingRef.current = next;
    endAtRef.current = now + next * 1000;
    vibratedRef.current = next <= 0;
    persist({ endAt: now + next * 1000, duration: duration + extra, pausedRemaining: null });
    setDuration((d) => d + extra);
    setRemaining(next);
    setRunning(true);
  }

  function toggleRun() {
    if (done) return;
    const now = Date.now();
    if (running) {
      // Congela o valor calculado de endAt (não o último tick, que pode estar
      // desatualizado se o timer estava em segundo plano no momento do pause).
      const endAt = endAtRef.current;
      if (endAt != null) {
        const left = Math.max(0, Math.ceil((endAt - now) / 1000));
        remainingRef.current = left;
        setRemaining(left);
        persist({ endAt, duration, pausedRemaining: left });
      }
      setRunning(false);
    } else {
      const endAt = now + remainingRef.current * 1000;
      endAtRef.current = endAt;
      persist({ endAt, duration, pausedRemaining: null });
      setRunning(true);
    }
  }

  function skip() {
    remainingRef.current = 0;
    setRemaining(0);
    setRunning(false);
    fechar();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Descanso"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Fechar descanso"
        onClick={fechar}
      />

      <div className="relative w-full max-w-[440px] rounded-t-2xl border border-line bg-surface p-5 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-faint">Descanso</p>
            <p className="mt-0.5 text-xs text-muted">
              {done ? "Pronto para a próxima série." : "Respire fundo, a próxima vem."}
            </p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            autoFocus
            className="-mr-1 -mt-1 p-1 text-faint"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 120 120" className="h-full w-full text-accent">
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-line)" strokeWidth="6" />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - frac)}
                transform="rotate(-90 60 60)"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-medium tabular-nums">{mmss(remaining)}</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wide text-faint">
                {done ? "descanso fim" : "restantes"}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-faint">Sugestão</span>
            {[...new Set([...BASE_PRESETS, seconds])]
              .sort((a, b) => a - b)
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPreset(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    duration === preset
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-muted"
                  }`}
                >
                  {preset}s
                </button>
              ))}
            <button
              type="button"
              onClick={() => addTime(15)}
              aria-label="Adicionar 15 segundos ao descanso"
              className="rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-muted active:bg-surface2"
            >
              +15s
            </button>
          </div>

          <div className="mt-5 flex w-full items-center gap-2">
            <button
              type="button"
              onClick={toggleRun}
              aria-label={running && !done ? "Pausar" : "Continuar"}
              disabled={done}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-sm text-muted active:bg-surface2 disabled:opacity-40"
            >
              {running && !done ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {running && !done ? "Pausar" : "Continuar"}
            </button>
            <button
              type="button"
              onClick={skip}
              aria-label="Pular descanso"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-on-accent active:bg-accent-press"
            >
              <SkipForward size={16} aria-hidden />
              Pular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
