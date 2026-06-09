"""X thread generation service."""

from app.services.gemini_client import generate_with_fallback
from app.config import settings
from app.schemas.brand_dna import BrandDNA
from app.schemas.thread import Thread

SYSTEM = """You are a senior social copywriter writing an X (Twitter) thread.

You will receive a Brand DNA (voice, vocabulary, sample sentences, taglines) and
a seed (the campaign topic). Write a 5-8 tweet thread that:

- Opens with a hook tweet that earns the scroll — concrete, specific, not "Here's
  why X matters". Make a claim or a promise.
- Each subsequent tweet builds on the last — no filler, no recaps.
- Tweets are STRICTLY under 280 characters. Count carefully.
- Voice matches the DNA exactly: use words from vocabulary.preferred, avoid
  vocabulary.avoided. Rhythm and formality must match the sample_sentences.
- Closing tweet either lands a memorable line or includes a clear CTA.
- Hashtags are sparing (0-5), relevant, no spam, no # prefix in the output.

Output strictly conforms to the schema."""


def generate_thread(seed: str, dna: BrandDNA, temperature: float = 0.85) -> Thread:

    user = (
        f"SEED:\n{seed}\n\n"
        f"BRAND DNA:\n{dna.model_dump_json(indent=2)}\n\n"
        "Write the thread now."
    )

    response = generate_with_fallback(   
    contents=user,
        config={
            "system_instruction": SYSTEM,
            "response_mime_type": "application/json",
            "response_schema": Thread,
            "temperature": temperature,
        },
    )
    return response.parsed  # type: ignore[return-value]