"""Build a downloadable ZIP bundle from a generated Campaign."""

from __future__ import annotations

import zipfile
from pathlib import Path

from app.schemas.campaign import Campaign

OUTPUTS_DIR = Path(__file__).resolve().parent.parent.parent / "outputs"


def build_campaign_zip(campaign: Campaign) -> str:
    """Write a ZIP of all campaign assets and return its URL."""
    OUTPUTS_DIR.mkdir(exist_ok=True)
    zip_name = f"campaign_{campaign.id}.zip"
    zip_path = OUTPUTS_DIR / zip_name

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("README.md", _build_readme(campaign))
        zf.writestr("dna.json", campaign.dna.model_dump_json(indent=2))
        zf.writestr("thread.txt", _format_thread(campaign))
        zf.writestr("linkedin.txt", _format_linkedin(campaign))
        zf.writestr("instagram_caption.txt", _format_caption(campaign))

        for composed_slide, original in zip(
            campaign.composed.slides, campaign.carousel.slides, strict=False
        ):
            filename_on_disk = composed_slide.image_url.split("/")[-1]
            slide_path = OUTPUTS_DIR / filename_on_disk
            if slide_path.exists():
                arcname = f"slides/{original.position:02d}_{original.role}.png"
                zf.write(slide_path, arcname=arcname)

    return f"/images/{zip_name}"


def _build_readme(c: Campaign) -> str:
    dna = c.dna
    taglines = "\n".join(f"- {t}" for t in dna.brand.taglines)
    return f"""# {dna.brand.name}

> {dna.brand.manifesto}

**Generated:** {c.created_at.isoformat()}
**Seed:** {c.seed}
**Vibe:** {c.vibe}

## Taglines
{taglines}

## Voice
- Tone: {", ".join(dna.voice.tone)}
- Formality: {dna.voice.formality}/5
- Rhythm: {dna.voice.rhythm}

## Palette
- Primary: `{dna.visual.palette.primary}`
- Secondary: `{dna.visual.palette.secondary}`
- Accent: `{dna.visual.palette.accent}`
- Neutral dark: `{dna.visual.palette.neutral_dark}`
- Neutral light: `{dna.visual.palette.neutral_light}`

## Typography
- Heading: {dna.visual.typography.heading.family} ({dna.visual.typography.heading.weight})
- Body: {dna.visual.typography.body.family} ({dna.visual.typography.body.weight})

## Contents
- `dna.json` — the Brand DNA contract that drove every output
- `thread.txt` — X (Twitter) thread
- `linkedin.txt` — LinkedIn long-form post
- `instagram_caption.txt` — IG caption + hashtags
- `slides/` — Instagram carousel slides as PNGs, named by position and role
"""


def _format_thread(c: Campaign) -> str:
    t = c.thread
    parts = [f"HOOK: {t.hook}", ""]
    for tw in t.tweets:
        parts.append(f"--- Tweet {tw.position} ---")
        parts.append(tw.text)
        parts.append("")
    if t.cta:
        parts.append(f"CTA: {t.cta}")
    if t.hashtags:
        parts.append("Hashtags: " + " ".join(f"#{h}" for h in t.hashtags))
    return "\n".join(parts)


def _format_linkedin(c: Campaign) -> str:
    p = c.linkedin
    parts = [p.body, "", f"CTA: {p.cta}"]
    if p.hashtags:
        parts.append("Hashtags: " + " ".join(f"#{h}" for h in p.hashtags))
    return "\n".join(parts)


def _format_caption(c: Campaign) -> str:
    cap = c.carousel.caption
    tags = " ".join(f"#{h}" for h in c.carousel.hashtags)
    return f"{cap}\n\n{tags}"