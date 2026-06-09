"""Pillow-based slide composition with role-aware layouts.

Each slide.role gets its own rendering function so we can tune layouts per role:
hook earns the swipe, context/point/example carry the argument, payoff lands
the punchline, cta invites action. Shared primitives (palette, brand mark,
position label) live at the top.
"""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageDraw

from app.composition.fonts import load_font
from app.schemas.brand_dna import BrandDNA
from app.schemas.carousel import Slide

SLIDE_SIZE = (1080, 1080)
PADDING = 80
ACCENT_BAR_WIDTH = 12
OUTPUTS_DIR = Path(__file__).resolve().parent.parent.parent / "outputs"


# -------------------- shared primitives --------------------

def _hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    s = hex_str.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
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


def _text_height(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]


class _SlideContext:
    """Bundle of palette + fonts + draw, passed to each role renderer."""

    def __init__(self, dna: BrandDNA, img: Image.Image):
        self.dna = dna
        self.img = img
        self.draw = ImageDraw.Draw(img)
        p = dna.visual.palette
        self.bg = _hex_to_rgb(p.neutral_dark)
        self.fg = _hex_to_rgb(p.neutral_light)
        self.accent = _hex_to_rgb(p.primary)
        self.muted = _hex_to_rgb(p.neutral_dark)
        self.heading_family = dna.visual.typography.heading.family
        self.heading_weight = dna.visual.typography.heading.weight
        self.body_family = dna.visual.typography.body.family
        self.body_weight = dna.visual.typography.body.weight

    def heading_font(self, size: int):
        return load_font(self.heading_family, self.heading_weight, size)

    def body_font(self, size: int):
        return load_font(self.body_family, self.body_weight, size)


def _draw_background(ctx: _SlideContext) -> None:
    """Solid background + accent bar on left edge."""
    ctx.draw.rectangle((0, 0, SLIDE_SIZE[0], SLIDE_SIZE[1]), fill=ctx.bg)
    ctx.draw.rectangle((0, 0, ACCENT_BAR_WIDTH, SLIDE_SIZE[1]), fill=ctx.accent)


def _draw_position(ctx: _SlideContext, position: int, total: int) -> None:
    """Top-right position indicator: '01 / 07'."""
    font = ctx.body_font(24)
    text = f"{position:02d} / {total:02d}"
    ctx.draw.text(
        (SLIDE_SIZE[0] - PADDING, PADDING),
        text,
        font=font,
        fill=ctx.accent,
        anchor="rt",
    )


def _draw_brand(ctx: _SlideContext, accent_only: bool = False) -> None:
    """Brand name at bottom-left."""
    font = ctx.heading_font(24)
    ctx.draw.text(
        (PADDING, SLIDE_SIZE[1] - PADDING),
        ctx.dna.brand.name.upper(),
        font=font,
        fill=ctx.accent if accent_only else ctx.fg,
        anchor="ls",
    )


def _draw_wrapped(
    ctx: _SlideContext,
    text: str,
    font,
    color: tuple[int, int, int],
    x: int,
    y: int,
    max_width: int,
    line_height: int,
) -> int:
    """Draw wrapped text. Returns the y-coordinate just below the last line."""
    lines = _wrap_text(ctx.draw, text, font, max_width)
    for line in lines:
        ctx.draw.text((x, y), line, font=font, fill=color)
        y += line_height
    return y


# -------------------- role renderers --------------------

def _render_hook(ctx: _SlideContext, slide: Slide, total: int) -> None:
    """Biggest type, centered vertically, no body text — earn the swipe."""
    _draw_background(ctx)
    _draw_position(ctx, slide.position, total)

    font = ctx.heading_font(96)
    max_width = SLIDE_SIZE[0] - 2 * PADDING
    lines = _wrap_text(ctx.draw, slide.headline, font, max_width)
    line_height = 112
    block_height = line_height * len(lines)

    y = (SLIDE_SIZE[1] - block_height) // 2 - 40
    for line in lines:
        ctx.draw.text((PADDING, y), line, font=font, fill=ctx.fg)
        y += line_height

    # Subtle "swipe" indicator on the right
    arrow_font = ctx.body_font(24)
    ctx.draw.text(
        (SLIDE_SIZE[0] - PADDING, SLIDE_SIZE[1] - PADDING),
        "SWIPE →",
        font=arrow_font,
        fill=ctx.accent,
        anchor="rs",
    )

    _draw_brand(ctx)


def _render_standard(ctx: _SlideContext, slide: Slide, total: int) -> None:
    """Default layout for context/point/example: headline + body."""
    _draw_background(ctx)
    _draw_position(ctx, slide.position, total)

    headline_font = ctx.heading_font(72)
    max_width = SLIDE_SIZE[0] - 2 * PADDING
    headline_lines = _wrap_text(ctx.draw, slide.headline, headline_font, max_width)
    headline_line_h = 88
    headline_block_h = headline_line_h * len(headline_lines)

    body_lines: list[str] = []
    body_line_h = 44
    body_font = ctx.body_font(32)
    if slide.body:
        body_lines = _wrap_text(ctx.draw, slide.body, body_font, max_width)
    body_block_h = body_line_h * len(body_lines)
    gap_between = 40 if body_lines else 0

    total_block_h = headline_block_h + gap_between + body_block_h
    y = (SLIDE_SIZE[1] - total_block_h) // 2 - 40

    for line in headline_lines:
        ctx.draw.text((PADDING, y), line, font=headline_font, fill=ctx.fg)
        y += headline_line_h

    if body_lines:
        y += gap_between
        for line in body_lines:
            ctx.draw.text((PADDING, y), line, font=body_font, fill=ctx.fg)
            y += body_line_h

    _draw_brand(ctx)


def _render_payoff(ctx: _SlideContext, slide: Slide, total: int) -> None:
    """The answer slide — headline + body, with an accent underline under headline."""
    _draw_background(ctx)
    _draw_position(ctx, slide.position, total)

    headline_font = ctx.heading_font(76)
    max_width = SLIDE_SIZE[0] - 2 * PADDING
    headline_lines = _wrap_text(ctx.draw, slide.headline, headline_font, max_width)
    headline_line_h = 92
    headline_block_h = headline_line_h * len(headline_lines)

    body_lines: list[str] = []
    body_line_h = 44
    body_font = ctx.body_font(32)
    if slide.body:
        body_lines = _wrap_text(ctx.draw, slide.body, body_font, max_width)
    body_block_h = body_line_h * len(body_lines)
    gap_between = 60 if body_lines else 0
    underline_height = 6

    total_block_h = headline_block_h + underline_height + gap_between + body_block_h
    y = (SLIDE_SIZE[1] - total_block_h) // 2 - 40

    for line in headline_lines:
        ctx.draw.text((PADDING, y), line, font=headline_font, fill=ctx.fg)
        y += headline_line_h

    # Accent underline marking the "payoff" beat
    ctx.draw.rectangle((PADDING, y + 8, PADDING + 120, y + 8 + underline_height), fill=ctx.accent)
    y += underline_height + gap_between

    for line in body_lines:
        ctx.draw.text((PADDING, y), line, font=body_font, fill=ctx.fg)
        y += body_line_h

    _draw_brand(ctx)


def _render_cta(ctx: _SlideContext, slide: Slide, total: int) -> None:
    """Closing slide — accent headline, swipe arrow gone, brand prominent."""
    _draw_background(ctx)
    _draw_position(ctx, slide.position, total)

    headline_font = ctx.heading_font(84)
    max_width = SLIDE_SIZE[0] - 2 * PADDING
    headline_lines = _wrap_text(ctx.draw, slide.headline, headline_font, max_width)
    headline_line_h = 100
    headline_block_h = headline_line_h * len(headline_lines)

    body_lines: list[str] = []
    body_line_h = 44
    body_font = ctx.body_font(32)
    if slide.body:
        body_lines = _wrap_text(ctx.draw, slide.body, body_font, max_width)
    body_block_h = body_line_h * len(body_lines)
    gap_between = 50 if body_lines else 0

    total_block_h = headline_block_h + gap_between + body_block_h
    y = (SLIDE_SIZE[1] - total_block_h) // 2 - 60

    # Headline in accent color — the invitation
    for line in headline_lines:
        ctx.draw.text((PADDING, y), line, font=headline_font, fill=ctx.accent)
        y += headline_line_h

    if body_lines:
        y += gap_between
        for line in body_lines:
            ctx.draw.text((PADDING, y), line, font=body_font, fill=ctx.fg)
            y += body_line_h

    # Bigger, accent-colored brand mark at bottom
    brand_font = ctx.heading_font(36)
    ctx.draw.text(
        (PADDING, SLIDE_SIZE[1] - PADDING),
        ctx.dna.brand.name.upper(),
        font=brand_font,
        fill=ctx.accent,
        anchor="ls",
    )

    # First tagline as a kicker line above the brand
    if ctx.dna.brand.taglines:
        kicker_font = ctx.body_font(22)
        ctx.draw.text(
            (PADDING, SLIDE_SIZE[1] - PADDING - 56),
            ctx.dna.brand.taglines[0].upper(),
            font=kicker_font,
            fill=ctx.fg,
            anchor="ls",
        )


# -------------------- public API --------------------

_ROLE_RENDERERS = {
    "hook": _render_hook,
    "context": _render_standard,
    "point": _render_standard,
    "example": _render_standard,
    "payoff": _render_payoff,
    "cta": _render_cta,
}


def render_slide(slide: Slide, dna: BrandDNA, total_slides: int = 7) -> Path:
    """Render a single slide using the role-appropriate template. Returns the saved path."""
    img = Image.new("RGB", SLIDE_SIZE, color=(0, 0, 0))
    ctx = _SlideContext(dna, img)

    renderer = _ROLE_RENDERERS.get(slide.role, _render_standard)
    renderer(ctx, slide, total_slides)

    OUTPUTS_DIR.mkdir(exist_ok=True)
    filename = f"slide_{uuid4().hex}.png"
    path = OUTPUTS_DIR / filename
    img.save(path, format="PNG")
    return path