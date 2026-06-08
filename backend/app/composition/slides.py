"""Pillow-based slide composition: turn carousel text + DNA into designed PNGs."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageDraw, ImageFont

from app.schemas.brand_dna import BrandDNA
from app.schemas.carousel import Slide

# Instagram square: 1080x1080. Use this as the canonical size.
SLIDE_SIZE = (1080, 1080)
PADDING = 80
OUTPUTS_DIR = Path(__file__).resolve().parent.parent.parent / "outputs"


def _hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    s = hex_str.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))


def _load_font(size: int) -> ImageFont.ImageFont:
    # Fall back to PIL's default if no system fonts available; good enough for v1.
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    """Greedy word-wrap so text fits within max_width."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def render_slide(slide: Slide, dna: BrandDNA) -> Path:
    """Render a single slide and return the saved path."""
    bg = _hex_to_rgb(dna.visual.palette.primary)
    fg = _hex_to_rgb(dna.visual.palette.neutral_light)
    accent = _hex_to_rgb(dna.visual.palette.accent)

    img = Image.new("RGB", SLIDE_SIZE, bg)
    draw = ImageDraw.Draw(img)

    # Accent bar — a thin strip on the left edge, signature design element.
    draw.rectangle((0, 0, 12, SLIDE_SIZE[1]), fill=accent)

    # Position label (top-right) — "01 / 06" style
    pos_font = _load_font(28)
    pos_text = f"{slide.position:02d}"
    draw.text(
        (SLIDE_SIZE[0] - PADDING, PADDING),
        pos_text,
        font=pos_font,
        fill=accent,
        anchor="rt",  # right-top
    )

    # Headline (big, centered vertically in upper half)
    headline_font = _load_font(72)
    headline_lines = _wrap_text(draw, slide.headline, headline_font, SLIDE_SIZE[0] - 2 * PADDING)
    line_height = 88
    headline_block_height = line_height * len(headline_lines)
    y = (SLIDE_SIZE[1] // 2) - (headline_block_height // 2) - 60
    for line in headline_lines:
        draw.text((PADDING, y), line, font=headline_font, fill=fg)
        y += line_height

    # Body (smaller, below headline)
    if slide.body:
        body_font = _load_font(32)
        body_lines = _wrap_text(draw, slide.body, body_font, SLIDE_SIZE[0] - 2 * PADDING)
        body_y = y + 40
        for line in body_lines:
            draw.text((PADDING, body_y), line, font=body_font, fill=fg)
            body_y += 44

    # Brand name (bottom)
    brand_font = _load_font(24)
    draw.text(
        (PADDING, SLIDE_SIZE[1] - PADDING),
        dna.brand.name.upper(),
        font=brand_font,
        fill=accent,
        anchor="ls",  # left-bottom
    )

    # Save
    OUTPUTS_DIR.mkdir(exist_ok=True)
    filename = f"slide_{uuid4().hex}.png"
    path = OUTPUTS_DIR / filename
    img.save(path, format="PNG")
    return path