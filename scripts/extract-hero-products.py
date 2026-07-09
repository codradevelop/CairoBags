"""Extract six hero products from hero-scene.png as transparent 4K PNG."""

from __future__ import annotations

import io
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cairo-bags-web" / "src" / "assets" / "hero" / "hero-scene.png"
OUT = ROOT / "cairo-bags-web" / "src" / "assets" / "hero" / "hero-products-cutout.png"
TARGET_WIDTH = 3840


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)


def is_gold_pixel(rgb: np.ndarray, hsv: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    gold_color = (r > 95) & (g > 70) & (b < 120) & (r > b + 15) & (s > 45) & (v > 55)
    gold_bright = (r > 140) & (g > 110) & (b < 100)
    return gold_color | gold_bright


def is_background_black(rgb: np.ndarray) -> np.ndarray:
    luminance = rgb.astype(np.float32).max(axis=2)
    spread = rgb.astype(np.float32).max(axis=2) - rgb.astype(np.float32).min(axis=2)
    return (luminance < 22) & (spread < 12)


def remove_ring_and_fx(alpha: np.ndarray, rgb: np.ndarray, hsv: np.ndarray) -> np.ndarray:
    h, w = alpha.shape
    gold = is_gold_pixel(rgb, hsv)
    cy, cx = int(h * 0.36), int(w * 0.58)
    radius = int(min(h, w) * 0.34)
    yy, xx = np.ogrid[:h, :w]
    ring_zone = ((xx - cx) ** 2 + (yy - cy) ** 2) <= radius**2
    ring_zone &= ((xx - cx) ** 2 + (yy - cy) ** 2) >= (radius * 0.72) ** 2
    remove = ring_zone & gold
    alpha[remove] = 0
    return alpha


def remove_particles(alpha: np.ndarray, rgb: np.ndarray, hsv: np.ndarray) -> np.ndarray:
    gold = is_gold_pixel(rgb, hsv)
    gold &= alpha > 0
    mask = gold.astype(np.uint8) * 255
    num, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    for i in range(1, num):
        area = stats[i, cv2.CC_STAT_AREA]
        if area <= 90:
            alpha[labels == i] = 0
    return alpha


def remove_crossbody(alpha: np.ndarray) -> np.ndarray:
    h, w = alpha.shape
    x1, x2 = 0, int(w * 0.22)
    y1, y2 = int(h * 0.68), h
    region = alpha[y1:y2, x1:x2].copy()
    if region.size == 0:
        return alpha
    mask = (region > 0).astype(np.uint8) * 255
    num, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num <= 1:
        return alpha
    # Remove the largest component in the bottom-left corner (crossbody bag).
    areas = [(i, stats[i, cv2.CC_STAT_AREA]) for i in range(1, num)]
    areas.sort(key=lambda x: x[1], reverse=True)
    for idx, _ in areas[:2]:
        alpha[y1:y2, x1:x2][labels == idx] = 0
    return alpha


def remove_podiums(alpha: np.ndarray, rgb: np.ndarray, hsv: np.ndarray) -> np.ndarray:
    h, w = alpha.shape
    gold = is_gold_pixel(rgb, hsv)
    dark = rgb.astype(np.float32).max(axis=2) < 40

    # Podium gold rims sit in lower half.
    lower = np.zeros_like(alpha, dtype=bool)
    lower[int(h * 0.52) :, :] = True
    rim = gold & lower & (alpha > 0)

    rim_mask = rim.astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 5))
    rim_mask = cv2.dilate(rim_mask, kernel, iterations=2)

    # Remove dark podium bodies directly beneath rims.
    podium_body = dark & lower & (cv2.dilate(rim_mask, kernel, iterations=3) > 0)
    alpha[podium_body] = 0
    alpha[rim_mask > 0] = 0

    # Remove floor reflection band at the very bottom.
    alpha[int(h * 0.93) :, :] = 0
    return alpha


def keep_largest_product_cluster(alpha: np.ndarray) -> np.ndarray:
    mask = (alpha > 0).astype(np.uint8) * 255
    num, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num <= 1:
        return alpha
    # Keep all components except tiny noise; drop isolated bottom-left remnants.
    cleaned = np.zeros_like(alpha)
    for i in range(1, num):
        area = stats[i, cv2.CC_STAT_AREA]
        x = stats[i, cv2.CC_STAT_LEFT]
        y = stats[i, cv2.CC_STAT_TOP]
        if area < 120:
            continue
        if x < alpha.shape[1] * 0.18 and y > alpha.shape[0] * 0.72 and area < 18000:
            continue
        cleaned[labels == i] = alpha[labels == i]
    return cleaned


def refine_alpha(alpha: np.ndarray) -> np.ndarray:
    alpha_u8 = alpha.astype(np.uint8)
    alpha_u8 = cv2.medianBlur(alpha_u8, 3)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    alpha_u8 = cv2.morphologyEx(alpha_u8, cv2.MORPH_CLOSE, kernel, iterations=1)
    return alpha_u8


def upscale_to_4k(rgba: np.ndarray) -> np.ndarray:
    h, w = rgba.shape[:2]
    scale = TARGET_WIDTH / w
    target_h = max(1, int(round(h * scale)))
    img = Image.fromarray(rgba, mode="RGBA")
    return np.array(img.resize((TARGET_WIDTH, target_h), Image.Resampling.LANCZOS))


def main() -> None:
    if not SRC.exists():
        raise FileNotFoundError(SRC)

    session = new_session("isnet-general-use")
    with open(SRC, "rb") as f:
        raw = f.read()

    cutout_bytes = remove(raw, session=session)
    rgba = np.array(Image.open(io.BytesIO(cutout_bytes)).convert("RGBA"))
    rgb = rgba[..., :3]
    alpha = rgba[..., 3].astype(np.float32)
    hsv = rgb_to_hsv(rgb)

    # Strip original flat background pixels rembg may miss.
    alpha[is_background_black(rgb)] = 0

    alpha = remove_ring_and_fx(alpha, rgb, hsv)
    alpha = remove_podiums(alpha, rgb, hsv)
    alpha = remove_particles(alpha, rgb, hsv)
    alpha = remove_crossbody(alpha)
    alpha = keep_largest_product_cluster(alpha.astype(np.uint8))
    alpha = refine_alpha(alpha)

    rgba[..., 3] = alpha
    final = upscale_to_4k(rgba)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(final, mode="RGBA").save(OUT, format="PNG", optimize=True)
    print(f"Saved: {OUT} ({final.shape[1]}x{final.shape[0]})")


if __name__ == "__main__":
    main()
