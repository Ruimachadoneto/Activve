"use client";

import { useEffect, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";

const PRESETS = [30, 60, 90];

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Cronômetro de descanso em anel (foreground). Reinicia quando `runToken` muda
 * (ex.: ao concluir uma série). `seconds` é a duração padrão (rest do exercício).
 */
export function RestTimer({ seconds = 60, runToken = 0 }: { seconds?: number; runToken?: number }) {
  const [duration, setDuration] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  // Reinicia ao concluir uma série (runToken muda) — padrão "ajustar no render".
  const [prevToken, setPrevToken] = useState(runToken);
  if (runToken !== prevToken) {
    setPrevToken(runToken);
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = duration > 0 ? remaining / duration : 0;
  const done = remaining === 0;

  function setPreset(p: number) {
    setDuration(p);
    setRemaining(p);
    setRunning(true);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
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
          <span className="text-2xl font-medium tabular-nums">{mmss(remaining)}</span>
          <span className="text-[10px] uppercase tracking-wide text-faint">
            {done ? "descanso fim" : "restantes"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          aria-label={running ? "Pausar" : "Continuar"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-surface2"
        >
          {running ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              duration === p ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"
            }`}
          >
            {p}s
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setRemaining(0);
            setRunning(false);
          }}
          aria-label="Pular descanso"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-surface2"
        >
          <SkipForward size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
