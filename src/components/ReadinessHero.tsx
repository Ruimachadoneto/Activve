"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readinessLabel, recoveryColorVar, type TodayReadiness } from "@/lib/plan/recovery";

const MQ_REDUZIDO = "(prefers-reduced-motion: reduce)";

/**
 * Lê `prefers-reduced-motion` do jeito canônico do React para valor externo: sem
 * `setState` dentro de efeito (proibido pelo lint do projeto, e a lição da TASK-010 foi
 * reestruturar em vez de contornar), sem risco de mismatch de hidratação (há um snapshot
 * de servidor), e reagindo se o usuário mudar a preferência com o app aberto.
 */
function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    (aoMudar) => {
      const mq = window.matchMedia(MQ_REDUZIDO);
      mq.addEventListener("change", aoMudar);
      return () => mq.removeEventListener("change", aoMudar);
    },
    () => window.matchMedia(MQ_REDUZIDO).matches,
    () => false,
  );
}

/**
 * Conta de 0 até `alvo` na entrada. Com movimento reduzido vai direto ao valor final — a
 * leitura do número nunca pode depender da animação (VISUAL_QUALITY §14).
 */
function useContagem(alvo: number, semMovimento: boolean, duracaoMs = 600): number {
  /*
   * Começa em 0 quando vai animar. Iniciar em `alvo` pintava o valor final no primeiro
   * frame e o primeiro `requestAnimationFrame` o derrubava para perto de zero — o número
   * fazia 32 → 2 → 32, um salto para trás bem visível na tela principal (achado do review
   * Codex). A decisão é tomada no inicializador, não no efeito, justamente para não haver
   * um frame com o valor errado.
   */
  const [valor, setValor] = useState(() => (semMovimento ? alvo : 0));
  const jaAnimou = useRef(false);

  useEffect(() => {
    if (semMovimento || jaAnimou.current) {
      setValor(alvo);
      return;
    }
    jaAnimou.current = true;
    const inicio = performance.now();
    let raf = 0;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      // easeOutCubic: chega rápido e assenta — mesma sensação do --ease-out-soft.
      setValor(Math.round(alvo * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracaoMs, semMovimento]);

  return valor;
}

/**
 * Número-herói do Hoje (registro A "Instrumento" — DESIGN_SYSTEM §9).
 *
 * Responde "o que faço hoje?" ANTES de qualquer detalhe — o padrão de resposta-primeiro
 * que o benchmark identificou em WHOOP/Oura, mas com entrada honesta: prontidão dos
 * músculos que o treino de HOJE exige, derivada da heurística de recuperação que já
 * existe. Nunca é score de saúde nem nota do usuário.
 */
export function ReadinessHero({ readiness }: { readiness: TodayReadiness }) {
  const { pct } = readiness;
  const { text, tone } = readinessLabel(pct);
  const cor = `var(${recoveryColorVar(tone)})`;
  /*
   * A media query do CSS não alcança estilo inline: sem isto, com movimento reduzido o
   * número ia direto ao valor final mas os 12 segmentos ainda animavam por várias centenas
   * de ms (achado do review Codex).
   */
  const semMovimento = useMovimentoReduzido();
  const exibido = useContagem(pct, semMovimento);

  /*
   * Gauge em arco (direção v3): meio-círculo de raio 82 no viewBox 200×110.
   * Comprimento do arco = π·82 ≈ 257,6 — o preenchimento anima por stroke-dashoffset,
   * que é composited (não dispara layout). Com movimento reduzido, sem transição:
   * o valor já nasce no lugar.
   */
  const ARCO = Math.PI * 82;
  const offset = ARCO * (1 - pct / 100);

  return (
    <section
      className="card-lift elev-focus mt-5 rounded-card border border-line p-5"
      aria-label={`Prontidão muscular para o treino de hoje: ${pct} por cento. ${text}.`}
    >
      <p className="text-center text-[11px] uppercase tracking-wider text-faint">
        Prontidão para hoje
      </p>

      <div className="relative mx-auto mt-3 w-full max-w-[240px]" aria-hidden>
        <svg viewBox="0 0 200 110" className="w-full">
          {/* Trilha */}
          <path
            d="M 18 100 A 82 82 0 0 1 182 100"
            fill="none"
            stroke="var(--color-surface2)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Preenchimento — a cor É a leitura (semântica §2.1), com brilho próprio */}
          <path
            d="M 18 100 A 82 82 0 0 1 182 100"
            fill="none"
            stroke={cor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={ARCO}
            strokeDashoffset={semMovimento ? offset : ARCO * (1 - exibido / 100)}
            style={{
              filter: `drop-shadow(0 0 6px ${cor})`,
              transition: semMovimento ? "none" : "stroke-dashoffset 120ms linear",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <div className="flex items-baseline gap-0.5">
            {/* Numerais proporcionais: `tabular-nums` deixaria o número grande frouxo (§3.2). */}
            <span className="text-[56px] font-medium leading-none tracking-tight">{exibido}</span>
            <span className="text-lg text-muted">%</span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-sm leading-snug" style={{ color: cor }}>
        {text}
      </p>

      {/*
        Os músculos NÃO são nomeados aqui de propósito. O card "Foco do dia", logo abaixo,
        já os lista com o dado que falta ("pronto em ~2 dias"). Repetir os mesmos nomes em
        dois blocos consecutivos era exatamente a duplicação que a TASK-023 removeu —
        o herói responde "quanto", o Foco responde "o quê e quando".
      */}
    </section>
  );
}
