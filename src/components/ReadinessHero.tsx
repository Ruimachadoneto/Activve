"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { muscleLabel } from "@/lib/plan/labels";
import { readinessLabel, recoveryColorVar, type TodayReadiness } from "@/lib/plan/recovery";

const SEGMENTOS = 12;

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
  const { pct, limiting } = readiness;
  const { text, tone } = readinessLabel(pct);
  const cor = `var(${recoveryColorVar(tone)})`;
  /*
   * A media query do CSS não alcança estilo inline: sem isto, com movimento reduzido o
   * número ia direto ao valor final mas os 12 segmentos ainda animavam por várias centenas
   * de ms (achado do review Codex).
   */
  const semMovimento = useMovimentoReduzido();
  const exibido = useContagem(pct, semMovimento);
  const preenchidos = Math.round((pct / 100) * SEGMENTOS);

  return (
    <section
      className="mt-5 rounded-card border border-line bg-surface p-5 elev-focus"
      aria-label={`Prontidão muscular para o treino de hoje: ${pct} por cento. ${text}.`}
    >
      <p className="text-[11px] uppercase tracking-wider text-faint">Prontidão para hoje</p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          {/* Numerais proporcionais: `tabular-nums` deixaria o número grande frouxo (§3.2). */}
          <span className="text-[52px] font-medium leading-none tracking-tight" aria-hidden>
            {exibido}
          </span>
          <span className="text-lg text-muted" aria-hidden>
            %
          </span>
        </div>
        <span className="mb-1 max-w-[52%] text-right text-sm leading-snug" style={{ color: cor }}>
          {text}
        </span>
      </div>

      {/* Barra segmentada: lê como instrumento, não como barra de progresso de tarefa. */}
      <div className="mt-4 flex gap-1" aria-hidden>
        {Array.from({ length: SEGMENTOS }, (_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: i < preenchidos ? cor : "var(--color-surface2)",
              transitionDuration: semMovimento ? "0ms" : "var(--dur-base)",
              transitionDelay: semMovimento ? "0ms" : `${i * 25}ms`,
            }}
          />
        ))}
      </div>

      {limiting.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {/*
            Sentence case: `MUSCLE_LABEL` vem capitalizado (serve de rótulo solto no mapa),
            mas no meio de uma frase só o primeiro nome abre em maiúscula.
          */}
          {limiting
            .slice(0, 2)
            .map(muscleLabel)
            .map((nome, i) => (i === 0 ? nome : nome.toLocaleLowerCase("pt-BR")))
            .join(" e ")}{" "}
          {limiting.length === 1 ? "ainda está" : "ainda estão"} se recuperando.
        </p>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Tudo que o treino de hoje pede está recuperado.
        </p>
      )}
    </section>
  );
}
