"""Brand DNA generation service — wraps the Gemini call."""

from google import genai

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
    client = genai.Client(api_key=settings.gemini_api_key)

    user = (
        f"SEED (what the campaign is about):\n{seed}\n\n"
        f"VIBE (how it should feel):\n{vibe}\n\n"
        "Synthesize the Brand DNA now."
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=user,
        config={
            "system_instruction": SYSTEM,
            "response_mime_type": "application/json",
            "response_schema": BrandDNA,
            "temperature": temperature,
        },
    )
    return response.parsed  # type: ignore[return-value]