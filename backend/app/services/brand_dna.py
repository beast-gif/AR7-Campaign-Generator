"""Brand DNA generation service — wraps the Gemini call."""

from app.services.gemini_client import generate_with_fallback

from app.config import settings
from app.schemas.brand_dna import BrandDNA

SYSTEM = """You are a senior creative director synthesizing a Brand DNA — a single
coherent spec that downstream generators (copywriters, designers, illustrators)
will use to produce a multi-format campaign.

The DNA must be internally consistent: voice, palette, typography, and motifs
all reinforce the same aesthetic. Be specific and opinionated, not generic.
Hex codes must be considered choices that work together as a palette. Typography
should pair real Google Fonts. Reference artists must be real artists whose work
matches the mood.

Output strictly conforms to the provided schema."""


def generate_brand_dna(seed: str, vibe: str, temperature: float = 0.9) -> BrandDNA:

    user = (
        f"SEED (what the campaign is about):\n{seed}\n\n"
        f"VIBE (how it should feel):\n{vibe}\n\n"
        "Synthesize the Brand DNA now."
    )

    response = generate_with_fallback(
    contents=user,
        config={
            "system_instruction": SYSTEM,
            "response_mime_type": "application/json",
            "response_schema": BrandDNA,
            "temperature": temperature,
        },
    )
    return response.parsed  # type: ignore[return-value]