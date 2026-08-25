#!/usr/bin/env python3
"""Export Menuply Eating-is-Social ad creatives with branding preserved in every format."""

from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    raise SystemExit("Install Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    "/Users/andrebarber/.cursor/projects/Users-andrebarber-Desktop-menubloc/assets/"
    "dining_is_social_flyer-b2e9fa50-7e10-4f38-ac68-55f4aa1b5ae3.png"
)
OUT = ROOT / "public" / "sample-ads"

# Source layout (682×1024): logo + headline + icons | photo | footer
BRANDING_BOTTOM = 440
PHOTO_TOP = 400
PHOTO_BOTTOM = 820


def cover_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    resized = img.resize((round(sw * scale), round(sh * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - tw) // 2
    top = (resized.height - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def fit_resize(img: Image.Image, size: tuple[int, int], bg=(255, 255, 255)) -> Image.Image:
    tw, th = size
    sw, sh = img.size
    scale = min(tw / sw, th / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, bg)
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def export_portrait(src: Image.Image) -> None:
    src.convert("RGB").save(OUT / "ad-menuply-eating-is-social.jpg", quality=88, optimize=True)


def export_wide(src: Image.Image) -> None:
    """1280×720 — generous branding band on top, lifestyle photo below."""
    w, h = 1280, 720
    branding_h = 340
    photo_h = h - branding_h

    branding = src.crop((0, 0, src.width, BRANDING_BOTTOM))
    branding = fit_resize(branding, (w, branding_h))

    photo = src.crop((0, PHOTO_TOP, src.width, PHOTO_BOTTOM))
    photo = cover_resize(photo, (w, photo_h))

    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    canvas.paste(branding, (0, 0))
    canvas.paste(photo, (0, branding_h))
    for name in (
        "ad-menuply-eating-is-social-wide.jpg",
        "ad-menuply-eating-is-social-wide-v2.jpg",
    ):
        canvas.save(OUT / name, quality=88, optimize=True)


def export_slim(src: Image.Image) -> None:
    """1200×280 — logo + headline left, photo right."""
    w, h = 1200, 280
    left_w = 520
    right_w = w - left_w

    branding = src.crop((0, 0, src.width, BRANDING_BOTTOM))
    branding = fit_resize(branding, (left_w, h))

    photo = src.crop((0, PHOTO_TOP, src.width, PHOTO_BOTTOM))
    photo = cover_resize(photo, (right_w, h))

    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    canvas.paste(branding, (0, 0))
    canvas.paste(photo, (left_w, 0))
    canvas.save(OUT / "ad-menuply-eating-is-social-slim.jpg", quality=88, optimize=True)


def export_small(src: Image.Image) -> None:
    """640×360 — compact card: branding top, photo bottom (footer / inline slots)."""
    w, h = 640, 360
    branding_h = 210
    photo_h = h - branding_h

    branding = src.crop((0, 0, src.width, 360))
    branding = fit_resize(branding, (w, branding_h))

    photo = src.crop((0, PHOTO_TOP, src.width, PHOTO_BOTTOM))
    photo = cover_resize(photo, (w, photo_h))

    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    canvas.paste(branding, (0, 0))
    canvas.paste(photo, (0, branding_h))
    canvas.save(OUT / "ad-menuply-eating-is-social-small.jpg", quality=88, optimize=True)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source flyer: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    export_portrait(src)
    export_wide(src)
    export_slim(src)
    export_small(src)
    for name in sorted(OUT.glob("ad-menuply-eating-is-social*.jpg")):
        im = Image.open(name)
        print(f"{name.name}: {im.size[0]}×{im.size[1]}")


if __name__ == "__main__":
    main()
