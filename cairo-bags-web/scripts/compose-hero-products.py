"""Compose six-product transparent hero cutout — rembg each asset first."""

from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets" / "hero"
SCENE = ROOT / "hero-scene.png"
OUT = ROOT / "hero-products-cutout.png"
TARGET_W = 3840

_session = None


def session():
    global _session
    if _session is None:
        _session = new_session("isnet-general-use")
    return _session


def cutout(path: Path) -> Image.Image:
    data = path.read_bytes()
    return Image.open(BytesIO(remove(data, session=session()))).convert("RGBA")


def cutout_crop_scene(x1f: float, y1f: float, x2f: float, y2f: float) -> Image.Image:
    scene = Image.open(SCENE).convert("RGB")
    w, h = scene.size
    crop = scene.crop((int(w * x1f), int(h * y1f), int(w * x2f), int(h * y2f)))
    buf = BytesIO()
    crop.save(buf, format="PNG")
    return Image.open(BytesIO(remove(buf.getvalue(), session=session()))).convert("RGBA")


def fit_height(img: Image.Image, height: int) -> Image.Image:
    w, h = img.size
    scale = height / h
    return img.resize((int(round(w * scale)), height), Image.Resampling.LANCZOS)


def paste_center(canvas: Image.Image, img: Image.Image, cx: int, cy: int) -> None:
    canvas.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def main() -> None:
    print("Cutting assets...")
    backpack = cutout(ROOT / "backpack.png")
    suitcase = cutout(ROOT / "suitcase.png")
    laptop = cutout(ROOT / "laptop-bag.png")
    duffel = cutout_crop_scene(0.22, 0.44, 0.64, 0.94)

    canvas_h = int(TARGET_W * 0.78)
    canvas = Image.new("RGBA", (TARGET_W, canvas_h), (0, 0, 0, 0))

    paste_center(canvas, fit_height(backpack, int(canvas_h * 0.58)), int(TARGET_W * 0.165), int(canvas_h * 0.42))
    paste_center(canvas, fit_height(suitcase, int(canvas_h * 0.74)), int(TARGET_W * 0.555), int(canvas_h * 0.36))
    paste_center(canvas, fit_height(suitcase, int(canvas_h * 0.58)), int(TARGET_W * 0.465), int(canvas_h * 0.42))
    paste_center(canvas, fit_height(suitcase, int(canvas_h * 0.44)), int(TARGET_W * 0.565), int(canvas_h * 0.50))
    paste_center(canvas, fit_height(duffel, int(canvas_h * 0.44)), int(TARGET_W * 0.405), int(canvas_h * 0.68))
    paste_center(canvas, fit_height(laptop, int(canvas_h * 0.34)), int(TARGET_W * 0.715), int(canvas_h * 0.70))

    bbox = canvas.getbbox()
    if bbox:
        pad = 20
        canvas = canvas.crop((
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(canvas.width, bbox[2] + pad),
            min(canvas.height, bbox[3] + pad),
        ))

    if canvas.width < TARGET_W:
        s = TARGET_W / canvas.width
        canvas = canvas.resize((TARGET_W, int(round(canvas.height * s))), Image.Resampling.LANCZOS)

    canvas.save(OUT, format="PNG", optimize=True)
    arr = np.array(canvas)
    bad = (arr[:, :, 3] > 200) & (arr[:, :, :3].max(axis=2) < 30)
    trans = (arr[:, :, 3] < 10).sum()
    print(f"Saved {OUT} — {canvas.size[0]}x{canvas.size[1]}")
    print(f"Transparent: {100*trans/arr[:,:,3].size:.1f}% | bad opaque black: {bad.sum()}")


if __name__ == "__main__":
    main()
