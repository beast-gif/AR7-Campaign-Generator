"""Google Fonts loader for Pillow.

Downloads a font's .ttf to backend/fonts/ on first use and caches it.
Falls back to Pillow's default font if download fails so rendering never breaks.
"""

from __future__ import annotations

from pathlib import Path

import requests
from PIL import ImageFont

FONTS_DIR = Path(__file__).resolve().parent.parent.parent / "fonts"
FONTS_DIR.mkdir(exist_ok=True)

# Maps weight integers to Google Fonts URL filename segments.
# Google's static files API uses these names.
_WEIGHT_NAMES = {
    100: "Thin",
    200: "ExtraLight",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "SemiBold",
    700: "Bold",
    800: "ExtraBold",
    900: "Black",
}


def _closest_weight(weight: int) -> int:
    return min(_WEIGHT_NAMES.keys(), key=lambda w: abs(w - weight))


def _gfonts_url(family: str, weight: int) -> str:
    family_url = family.replace(" ", "")
    weight_name = _WEIGHT_NAMES[_closest_weight(weight)]
    return (
        f"https://github.com/google/fonts/raw/main/ofl/"
        f"{family_url.lower()}/static/{family_url}-{weight_name}.ttf"
    )


def _download(family: str, weight: int, dest: Path) -> bool:
    try:
        resp = requests.get(_gfonts_url(family, weight), timeout=10)
        if resp.status_code == 200 and len(resp.content) > 1000:
            dest.write_bytes(resp.content)
            return True
    except Exception:
        pass
    return False


def load_font(family: str, weight: int, size: int) -> ImageFont.ImageFont:
    """Load a Google Font at the given size. Caches on first use, falls back gracefully."""
    cache_key = f"{family.replace(' ', '_')}_{_closest_weight(weight)}.ttf"
    font_path = FONTS_DIR / cache_key

    if not font_path.exists():
        _download(family, weight, font_path)

    if font_path.exists():
        try:
            return ImageFont.truetype(str(font_path), size)
        except OSError:
            pass

    # Last-resort fallback so a broken font URL never crashes rendering.
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)