"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { resolveMuscleImage } from "@/lib/plan/muscleImage";
import type { Muscle } from "@/lib/plan/schema";

/**
 * Ilustração do grupo muscular no card de treino. Resolve a imagem pelos músculos
 * primários do treino e cai para um placeholder enquanto o PNG não existe em
 * `public/muscles/` (ver docs/ai/asset-prompts-muscles.md).
 */
export function MuscleArt({
  muscles,
  label,
}: {
  muscles: Muscle[];
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  const key = resolveMuscleImage(muscles);

  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[46%] [mask-image:linear-gradient(to_right,transparent,#000_24%)]"
      aria-hidden
    >
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center text-faint">
          <User size={52} strokeWidth={1} />
          <span className="mt-1 text-[10px] uppercase tracking-wide">{label}</span>
        </div>
      ) : (
        <Image
          src={`/muscles/${key}.png`}
          alt=""
          fill
          sizes="220px"
          priority
          unoptimized
          onError={() => setFailed(true)}
          className="object-contain object-bottom"
        />
      )}
    </div>
  );
}
