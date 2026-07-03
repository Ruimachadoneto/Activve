"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import type { ExerciseMedia } from "@/lib/plan/exerciseMedia";

/**
 * Mídia do exercício no Modo Treino. Com foto (free-exercise-db — ADR-004), alterna
 * as 2 posições (inicial/final) como uma demonstração, com tratamento dark (vinheta)
 * para assentar no navy. Sem foto, offline ou erro de carga → placeholder com o link
 * de vídeo (a imagem é melhoria progressiva; o app continua 100% utilizável sem rede).
 */
export function ExerciseMediaCard({
  media,
  videoUrl,
  alt,
}: {
  media: ExerciseMedia | null;
  videoUrl: string;
  alt: string;
}) {
  const [frame, setFrame] = useState(0);
  // Falha rastreada POR frame: o frame 1 (lazy) falhar não pode derrubar a foto já
  // visível — só caímos no placeholder quando nenhum frame renderiza.
  const [frameFailed, setFrameFailed] = useState<[boolean, boolean]>([false, false]);

  const [prevId, setPrevId] = useState(media?.sourceId);
  if (media?.sourceId !== prevId) {
    setPrevId(media?.sourceId);
    setFrame(0);
    setFrameFailed([false, false]);
  }

  const allFailed = frameFailed[0] && frameFailed[1];
  const bothOk = !frameFailed[0] && !frameFailed[1];
  // Um único frame utilizável → fica estático nele.
  const staticFrame = frameFailed[0] && !frameFailed[1] ? 1 : !frameFailed[0] && frameFailed[1] ? 0 : null;
  const shownFrame = staticFrame ?? frame;

  const sourceId = media?.sourceId;
  useEffect(() => {
    if (!sourceId || !bothOk) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1600);
    return () => clearInterval(id);
  }, [sourceId, bothOk]);

  if (!media || allFailed) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex aspect-video items-center justify-center rounded-card border border-line bg-surface"
      >
        <span className="flex flex-col items-center gap-2 text-faint">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-accent">
            <Play size={20} aria-hidden />
          </span>
          <span className="text-xs">Ver demonstração</span>
        </span>
      </a>
    );
  }

  return (
    <div className="relative mt-4 aspect-video overflow-hidden rounded-card border border-line bg-surface">
      {media.imageUrls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- hotlink de CDN externo (ADR-004); sem proxy do otimizador para manter o local-first simples e o fallback direto
        <img
          key={url}
          src={url}
          alt={i === 0 ? alt : ""}
          loading={i === 0 ? "eager" : "lazy"}
          onError={() =>
            setFrameFailed((prev) => (i === 0 ? [true, prev[1]] : [prev[0], true]))
          }
          className={`media-drift absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            shownFrame === i ? "opacity-100" : "opacity-0"
          }`}
          style={{ filter: "saturate(0.85) brightness(0.92) contrast(1.02)" }}
        />
      ))}
      {/* Tratamento dark: gradiente/vinheta por cima da foto de estúdio */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,20,34,0.28) 0%, transparent 32%, transparent 62%, rgba(10,20,34,0.5) 100%), radial-gradient(130% 110% at 50% 50%, transparent 62%, rgba(10,20,34,0.4) 100%)",
        }}
      />
      {bothOk ? (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                shownFrame === i ? "bg-accent" : "bg-ink/25"
              }`}
            />
          ))}
        </div>
      ) : null}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver vídeo do exercício"
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] text-ink backdrop-blur-sm"
      >
        <Play size={11} aria-hidden /> Vídeo
      </a>
    </div>
  );
}

/**
 * Pré-carrega fotos (do PRÓXIMO exercício) em segundo plano para a navegação
 * parecer instantânea. Renderiza nada.
 */
export function PreloadImages({ urls }: { urls: string[] }) {
  const key = urls.join("|");
  useEffect(() => {
    for (const url of key.split("|")) {
      if (!url) continue;
      const img = new window.Image();
      img.src = url;
    }
  }, [key]);
  return null;
}

/** Thumbnail quadrada pequena (próximo exercício / variações). Sem foto → ícone. */
export function ExerciseThumb({ media, className = "" }: { media: ExerciseMedia | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!media || failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-lg bg-surface2 text-faint ${className}`}
        aria-hidden
      >
        <Play size={14} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink de CDN externo (ADR-004)
    <img
      src={media.imageUrls[0]}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-lg object-cover ${className}`}
      style={{ filter: "saturate(0.85) brightness(0.9)" }}
    />
  );
}
