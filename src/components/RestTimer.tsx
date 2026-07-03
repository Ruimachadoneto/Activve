"use client";

import { useEffect, useState } from "react";
import { Pause, Play, SkipForward, X } from "lucide-react";

const BASE_PRESETS = [30, 60, 90, 120];

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
}: {
  open: boolean;
  onClose: () => void;
  seconds?: number;
  runToken?: number;
}) {
  const [duration, setDuration] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  const [prevToken, setPrevToken] = useState(runToken);
  if (runToken !== prevToken) {
    setPrevToken(runToken);
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  // Countdown por timeout re-agendado (`remaining` nas deps): qualquer mudança de
  // tempo — preset, +15s, reinício — religa o tique sozinha, inclusive depois de
  // zerar. Um setInterval keyed só em `running` congelava após o fim (running
  // true→true não re-dispara o efeito).
  useEffect(() => {
    if (!open || !running || remaining === 0) return;
    const id = setTimeout(() => {
      if (remaining === 1) {
        // Aviso tátil no fim do descanso (mobile; ignorado onde não há suporte).
        try {
          navigator.vibrate?.([180, 90, 180]);
        } catch {
          /* sem vibração disponível */
        }
      }
      setRemaining(remaining - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [open, running, remaining]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = duration > 0 ? remaining / duration : 0;
  const done = remaining === 0;

  function setPreset(p: number) {
    setDuration(p);
    setRemaining(p);
    setRunning(true);
  }

  /** +15s sem reiniciar: estende o descanso atual (comum quando a série pesou). */
  function addTime(extra: number) {
    setDuration((d) => d + extra);
    setRemaining((r) => r + extra);
    setRunning(true);
  }

  function skip() {
    setRemaining(0);
    setRunning(false);
    onClose();
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
        onClick={onClose}
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
            onClick={onClose}
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
              onClick={() => setRunning((v) => !v)}
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
