"""Remove o fundo branco das ilustrações em public/muscles/ -> alpha (borda suave).

O GPT exporta os PNGs com fundo branco (sem alpha). Rode este script sempre que
adicionar/atualizar imagens em public/muscles/ para que entrem transparentes no card.
É idempotente (rodar de novo em imagem já transparente não muda nada).

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


def main() -> None:
    os.makedirs(BACKUP, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(SRC_DIR, "*.png"))):
        img = Image.open(path).convert("RGBA")
        img.save(os.path.join(BACKUP, os.path.basename(path)))  # backup do original
        arr = np.array(img)
        m = arr[:, :, :3].astype(np.int16).min(axis=2)
        alpha = arr[:, :, 3].astype(np.float32)
        scale = np.clip((HI - m) / (HI - LO), 0.0, 1.0)
        arr[:, :, 3] = (alpha * scale).astype(np.uint8)
        Image.fromarray(arr, "RGBA").save(path)
        transp = 100 * int((arr[:, :, 3] == 0).sum()) / (arr.shape[0] * arr.shape[1])
        print(f"{os.path.basename(path):16s} -> {transp:4.1f}% transparente")
    print("backup dos originais em:", BACKUP)


if __name__ == "__main__":
    main()
