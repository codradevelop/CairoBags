"""Process hero assets: transparent PNGs + seamless showcase crop."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HERO_DIR = ROOT / "src" / "assets" / "hero"
REF = Path(
    r"C:\Users\Eslam\.cursor\projects\c-Users-Eslam-Desktop-CairoBags-main-cairooo-CairoBags\assets"
    r"\c__Users_Eslam_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_"
    r"image-8f59f43a-1b91-477a-875d-00960e65d024.png"
)

NEAR_WHITE = 248
DARK_BG = (14, 14, 14)


def remove_light_background(img: Image.Image, threshold: int = NEAR_WHITE) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
    return img


def remove_dark_background_for_showcase(img: Image.Image) -> Image.Image:
    """Make near-black backdrop transparent so #0E0E0E shows through."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r <= 28 and g <= 28 and b <= 28:
                pixels[x, y] = (14, 14, 14, 0)
            elif r <= 45 and g <= 45 and b <= 45 and max(r, g, b) - min(r, g, b) < 12:
                # uniform dark gray vignette
                pixels[x, y] = (14, 14, 14, 0)
    return img


def crop_showcase_from_reference(ref: Image.Image) -> Image.Image:
    w, h = ref.size
    # Reference mockup: navbar ~top 7%, hero products ~7%-72% height, right ~38%-100% width
    left = int(w * 0.36)
    top = int(h * 0.08)
    right = w
    bottom = int(h * 0.74)
    return ref.crop((left, top, right, bottom))


def main() -> None:
    HERO_DIR.mkdir(parents=True, exist_ok=True)

    category_files = [
        "backpack.png",
        "suitcase.png",
        "laptop-bag.png",
        "crossbody.png",
        "travel-set.png",
    ]

    for name in category_files:
        path = HERO_DIR / name
        if not path.exists():
            print(f"skip missing {name}")
            continue
        img = Image.open(path)
        cleaned = remove_light_background(img)
        cleaned.save(path, "PNG", optimize=True)
        print(f"cleaned {name}")

    if REF.exists():
        ref = Image.open(REF)
        showcase = crop_showcase_from_reference(ref)
        showcase_path = HERO_DIR / "hero-showcase.png"
        showcase.save(showcase_path, "PNG", optimize=True)
        print(f"wrote showcase from reference {showcase.size}")

        # Also save full-bleed version with dark bg removed from original composite
        orig = HERO_DIR / "hero-showcase.png"
        if (HERO_DIR / "hero-showcase-source.png").exists():
            pass
    else:
        legacy = HERO_DIR / "hero-showcase.png"
        if legacy.exists():
            img = Image.open(legacy)
            cleaned = remove_dark_background_for_showcase(img)
            cleaned.save(legacy, "PNG", optimize=True)
            print(f"processed legacy showcase {legacy.size}")


if __name__ == "__main__":
    main()
