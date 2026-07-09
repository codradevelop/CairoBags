"""Remove cream/white backgrounds from collection product PNGs."""

from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets" / "hero" / "collections"
FILES = [
    "backpack.png",
    "suitcase.png",
    "laptop-bag.png",
    "crossbody.png",
    "travel-set.png",
]


def remove_cream_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                px[x, y] = (r, g, b, 0)
                continue

            lum = 0.299 * r + 0.587 * g + 0.114 * b
            spread = max(r, g, b) - min(r, g, b)

            # keep gold glow / ring (warm, not neutral cream)
            if r > 165 and g > 130 and b < 175 and r - b > 38:
                continue

            # pure / warm cream card background
            if lum > 244 and spread < 22:
                px[x, y] = (r, g, b, 0)
                continue

            if r > 236 and g > 232 and b > 222 and spread < 28:
                px[x, y] = (r, g, b, 0)
                continue

            # soft feather on light edge pixels
            if lum > 228 and spread < 18:
                alpha = int(max(0, min(255, (248 - lum) * 32)))
                if alpha < 24:
                    px[x, y] = (r, g, b, 0)
                else:
                    px[x, y] = (r, g, b, min(a, alpha))

    return img


def try_rembg(img: Image.Image) -> Image.Image | None:
    try:
        from rembg import remove

        buf = BytesIO()
        img.save(buf, format="PNG")
        out = Image.open(BytesIO(remove(buf.getvalue()))).convert("RGBA")
        return out
    except Exception:
        return None


def trim_alpha(img: Image.Image, pad: int = 6) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    return img.crop((
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(img.width, bbox[2] + pad),
        min(img.height, bbox[3] + pad),
    ))


def main() -> None:
    for name in FILES:
        path = ROOT / name
        if not path.exists():
            print(f"skip {name}")
            continue

        src = Image.open(path).convert("RGBA")
        cut = try_rembg(src) or remove_cream_background(src)
        cut = trim_alpha(cut)
        cut.save(path, "PNG", optimize=True)
        print(f"{name}: {cut.size[0]}x{cut.size[1]}")


if __name__ == "__main__":
    main()
