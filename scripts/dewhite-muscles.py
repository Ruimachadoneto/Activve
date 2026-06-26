"""Prepara as ilustrações em public/muscles/ para o app: remove o fundo branco
-> alpha (borda suave), redimensiona e comprime.

O GPT exporta os PNGs com fundo branco (sem alpha) e em alta resolução (~1024px, >1MB).
O card exibe ~220px, então servir o cru é caro. Este script trata tudo de uma vez.
É idempotente (rodar de novo em imagem já tratada não degrada).

Uso:  python scripts/dewhite-muscles.py
Requer: pillow, numpy
"""

import os
import glob
import tempfile
import numpy as np
from PIL import Image

SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "muscles")
BACKUP = os.path.join(tempfile.gettempdir(), "activve_muscles_raw")

# "whiteness" = min(R,G,B): >= HI vira transparente, <= LO fica opaco, meio = transição suave.
LO, HI = 206, 240
MAX_W = 720  # largura máxima — o slot exibe ~220px; 720 cobre telas de alta densidade


def main() -> None:
    os.makedirs(BACKUP, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(SRC_DIR, "*.png"))):
        name = os.path.basename(path)
        img = Image.open(path).convert("RGBA")

        bpath = os.path.join(BACKUP, name)
        if not os.path.exists(bpath):
            img.save(bpath)  # backup só na 1ª vez (preserva o original em alta)

        arr = np.array(img)
        m = arr[:, :, :3].astype(np.int16).min(axis=2)
        alpha = arr[:, :, 3].astype(np.float32)
        scale = np.clip((HI - m) / (HI - LO), 0.0, 1.0)
        arr[:, :, 3] = (alpha * scale).astype(np.uint8)

        out = Image.fromarray(arr, "RGBA")
        if out.width > MAX_W:
            out = out.resize((MAX_W, round(out.height * MAX_W / out.width)), Image.LANCZOS)
        out.save(path, optimize=True)

        kb = os.path.getsize(path) / 1024
        print(f"{name:16s} -> {out.width}x{out.height}px, {kb:5.0f} KB")
    print("backup dos originais em:", BACKUP)


if __name__ == "__main__":
    main()
