"""Poster generation service — Gemini builds the prompt, Gemini Nano Banana generates the image.

The service writes the generated PNG to backend/outputs/ and returns a relative URL
that FastAPI serves as a static file. Easy to swap back to fal.ai later by replacing
stage 2 only.
"""

from pathlib import Path
from uuid import uuid4

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
from app.schemas.brand_dna import BrandDNA
from app.schemas.poster import Poster

# backend/outputs/ — sibling of app/
OUTPUTS_DIR = Path(__file__).resolve().parent.parent.parent / "outputs"

PROMPT_BUILDER_SYSTEM = """You translate a Brand DNA and a scene description
into a single dense image prompt for a text-to-image model.

A good prompt is:
- 50-150 words, written as comma-separated phrases (NOT full sentences)
- Concrete about subject, setting, lighting, and atmosphere
- Specific about colors — cite the DNA palette's hex codes verbatim, e.g.
  "dominated by #0A0E27 deep navy, accented with #FF006E magenta highlights"
- Names 2-3 motifs from visual.motifs exactly as written
- Adopts the visual.photography_style verbatim or paraphrased
- Follows the visual.composition_rules (e.g. "asymmetric composition,
  generous negative space")
- Ends with quality modifiers: "high detail, sharp focus, dramatic lighting,
  professional photography"

IMPORTANT: Do NOT include rendered text, typography, words, logos, or letters
in the image prompt. Those are added separately in the composition layer."""


class _ImagePrompt(BaseModel):
    prompt: str


def generate_poster(seed: str, dna: BrandDNA, scene: str | None = None) -> Poster:
    client = genai.Client(api_key=settings.gemini_api_key)
    scene_desc = scene or f"A key visual poster representing: {seed}"

    # Stage 1: Build a strong image prompt from the DNA.
    text_response = client.models.generate_content(
        model=settings.gemini_model,
        contents=(
            f"BRAND DNA:\n{dna.model_dump_json(indent=2)}\n\n"
            f"SCENE TO DEPICT:\n{scene_desc}\n\n"
            "Write the image prompt now."
        ),
        config={
            "system_instruction": PROMPT_BUILDER_SYSTEM,
            "response_mime_type": "application/json",
            "response_schema": _ImagePrompt,
            "temperature": 0.7,
        },
    )
    image_prompt: str = text_response.parsed.prompt  # type: ignore[union-attr]

    # Stage 2: Generate the actual image with Gemini's image model.
    image_response = client.models.generate_content(
        model=settings.gemini_image_model,
        contents=image_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="3:4"),
        ),
    )

    # Extract the image bytes from the response parts.
    image_bytes: bytes | None = None
    for part in image_response.candidates[0].content.parts:
        if getattr(part, "inline_data", None) and part.inline_data:
            image_bytes = part.inline_data.data
            break

    if image_bytes is None:
        raise RuntimeError("Gemini did not return image data — check model name and quota.")

    # Save to disk and return a URL the frontend can fetch.
    OUTPUTS_DIR.mkdir(exist_ok=True)
    filename = f"{uuid4().hex}.png"
    (OUTPUTS_DIR / filename).write_bytes(image_bytes)

    return Poster(
        image_url=f"/images/{filename}",
        prompt_used=image_prompt,
        width=768,
        height=1024,
    )