"""Extract six bag products — black-background matting pipeline."""

import io
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage

SRC = Path(__file__).resolve().parents[1] / "src" / "assets" / "hero" / "hero-scene.png"
OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "hero" / "hero-products-cutout.png"
TARGET_WIDTH = 3840


def luminance(rgb: np.ndarray) -> np.ndarray:
    return np.maximum.reduce([rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]])


def saturation(rgb: np.ndarray) -> np.ndarray:
    mx = np.maximum.reduce([rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]]).astype(np.int16)
    mn = np.minimum.reduce([rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]]).astype(np.int16)
    return mx - mn


def is_gold_pixel(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[:, :, 0].astype(np.int16), rgb[:, :, 1].astype(np.int16), rgb[:, :, 2].astype(np.int16)
    return (r > 75) & (g > 50) & (b < 95) & ((r + g) > (b * 2 + 25))


def border_flood(lum: np.ndarray, thresh: int) -> np.ndarray:
    h, w = lum.shape
    dark = lum <= thresh
    bg = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        if dark[0, x]:
            q.append((0, x))
        if dark[h - 1, x]:
            q.append((h - 1, x))
    for y in range(h):
        if dark[y, 0]:
            q.append((y, 0))
        if dark[y, w - 1]:
            q.append((y, w - 1))

    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or bg[y, x] or not dark[y, x]:
            continue
        bg[y, x] = True
        q.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    return bg


def build_alpha(rgb: np.ndarray, rembg_alpha: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    lum = luminance(rgb)
    sat = saturation(rgb)
    gold = is_gold_pixel(rgb)

    # Background = border-connected dark OR gold effects OR floor reflection band
    bg = border_flood(lum, 34) | border_flood(lum, 42)
    bg |= gold

    # Floor / reflection strip
    floor_y = int(h * 0.86)
    bg[floor_y:, :] |= lum[floor_y:, :] < 55

    # Remove crossbody (bottom-left) — not in requested six
    cx1, cx2 = 0, int(w * 0.24)
    cy1, cy2 = int(h * 0.62), h
    bg[cy1:cy2, cx1:cx2] = True

    # Foreground = lit product surfaces + rembg core
    fg_core = rembg_alpha > 140
    fg_core = ndimage.binary_erosion(fg_core, iterations=2)
    fg = fg_core.copy()
    fg |= (lum > 38) & (sat > 6) & ~bg
    fg |= (lum > 28) & (sat > 12) & ~bg

    # Expand fg to include attached dark product body
    fg = ndimage.binary_dilation(fg, iterations=6)
    fg &= ~bg

    # Drop isolated dark islands (leftover bg inside bbox)
    fg = ndimage.binary_opening(fg, iterations=2)

    alpha = np.zeros((h, w), dtype=np.uint8)
    alpha[fg] = 255

    # Remove dark halos not attached to lit product surfaces
    lit = lum > 46
    dist = ndimage.distance_transform_edt(~lit)
    dark_halo = (lum < 26) & (dist > 7)
    alpha[dark_halo] = 0

    # Remove thin gold podium rims
    alpha[gold & (lum < 120)] = 0

    # Soft edges from distance to bg
    edge_band = ndimage.binary_dilation(fg, iterations=2) & ~ndimage.binary_erosion(fg, iterations=2)
    alpha[edge_band] = 220

    # Contact shadows under products
    ys, xs = np.where(fg)
    if len(ys):
        y_max = ys.max()
        x_min, x_max = xs.min(), xs.max()
        pad = int(w * 0.02)
        shadow_zone = np.zeros((h, w), dtype=bool)
        y1 = y_max
        y2 = min(h, y_max + int(h * 0.035))
        shadow_zone[y1:y2, max(0, x_min - pad) : min(w, x_max + pad)] = True
        shadow = shadow_zone & ~fg & (lum > 10) & (lum < 48) & ~bg
        alpha[shadow] = np.clip(65 - (48 - lum[shadow]), 18, 65).astype(np.uint8)

    return alpha


def decontaminate(rgba: np.ndarray) -> np.ndarray:
    a = rgba[:, :, 3].astype(np.float32)
    edge = (a > 12) & (a < 245)
    for c in range(3):
        ch = rgba[:, :, c].astype(np.float32)
        ch[edge] *= a[edge] / 255.0
        rgba[:, :, c] = np.clip(ch, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.array(
        Image.fromarray(rgba[:, :, 3], mode="L").filter(ImageFilter.GaussianBlur(radius=0.45))
    )
    return rgba


def upscale(img: Image.Image) -> Image.Image:
    w, h = img.size
    if w >= TARGET_WIDTH:
        return img
    scale = TARGET_WIDTH / w
    return img.resize((TARGET_WIDTH, int(round(h * scale))), Image.Resampling.LANCZOS)


def main() -> None:
    session = new_session("isnet-general-use")
    rembg_img = Image.open(io.BytesIO(remove(SRC.read_bytes(), session=session))).convert("RGBA")
    rgb = np.array(rembg_img)[:, :, :3]
    rembg_a = np.array(rembg_img)[:, :, 3]

    alpha = build_alpha(rgb, rembg_a)
    rgba = np.dstack([rgb, alpha])
    rgba = decontaminate(rgba)

    ys, xs = np.where(rgba[:, :, 3] > 10)
    pad = 10
    y1, y2 = max(0, ys.min() - pad), min(rgba.shape[0], ys.max() + pad)
    x1, x2 = max(0, xs.min() - pad), min(rgba.shape[1], xs.max() + pad)
    rgba = rgba[y1:y2, x1:x2]

    out = upscale(Image.fromarray(rgba, mode="RGBA"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, format="PNG", optimize=True)

    a = np.array(out)[:, :, 3]
    print(f"Saved {OUT} — {out.size[0]}x{out.size[1]}")
    print(f"Transparent pixels: {100 * (a < 10).sum() / a.size:.1f}%")


if __name__ == "__main__":
    main()
