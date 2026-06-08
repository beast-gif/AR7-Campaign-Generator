"""Instagram carousel generation service."""

from google import genai

from app.config import settings
from app.schemas.brand_dna import BrandDNA
from app.schemas.carousel import Carousel

SYSTEM = """You are a senior social designer writing an Instagram carousel post.

You will receive a Brand DNA (voice, visuals, vocabulary) and a seed (the topic).
Write a 5-8 slide carousel that:

NARRATIVE ARC: Each slide has a role. A good carousel follows a shape like:
  hook → context → point → example → payoff → cta
or:
  hook → point → point → point → cta
The 'hook' slide must earn the swipe — concrete and specific, not "Here's why X
matters". The 'cta' slide closes with a clear next step.

PER SLIDE:
- headline: the BIG text. Punchy. Under 60 characters. This is what users see
  before zooming in.
- body (optional): supporting line(s). Under 220 chars. Use for evidence,
  examples, or punchlines that need setup. Skip body entirely on hook and CTA
  slides if the headline carries.

VOICE: Match the DNA exactly. Use vocabulary.preferred, avoid vocabulary.avoided.
Rhythm and formality must match sample_sentences. Carousels reward voice —
generic doesn't swipe.

CAPTION: 100-400 chars typically. Reinforces the carousel's payoff, ends with
a question or CTA. Not a recap.

HASHTAGS: 5-10 genuinely relevant. No # prefix in output.

Output strictly conforms to the schema."""


def generate_carousel(seed: str, dna: BrandDNA, temperature: float = 0.85) -> Carousel:
    client = genai.Client(api_key=settings.gemini_api_key)

    user = (
        f"SEED:\n{seed}\n\n"
        f"BRAND DNA:\n{dna.model_dump_json(indent=2)}\n\n"
        "Write the carousel now."
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=user,
        config={
            "system_instruction": SYSTEM,
            "response_mime_type": "application/json",
            "response_schema": Carousel,
            "temperature": temperature,
        },
    )
    return response.parsed  # type: ignore[return-value]