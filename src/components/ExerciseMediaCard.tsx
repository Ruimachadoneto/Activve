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
  const [failed, setFailed] = useState(false);

  const [prevId, setPrevId] = useState(media?.sourceId);
  if (media?.sourceId !== prevId) {
    setPrevId(media?.sourceId);
    setFrame(0);
    setFailed(false);
  }

  const sourceId = media?.sourceId;
  useEffect(() => {
    if (!sourceId || failed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1600);
    return () => clearInterval(id);
  }, [sourceId, failed]);

  if (!media || failed) {
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
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            frame === i ? "opacity-100" : "opacity-0"
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
      <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              frame === i ? "bg-accent" : "bg-ink/25"
            }`}
          />
        ))}
      </div>
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
