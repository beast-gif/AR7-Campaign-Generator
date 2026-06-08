"""LinkedIn post generation service."""

from google import genai

from app.config import settings
from app.schemas.brand_dna import BrandDNA
from app.schemas.linkedin import LinkedInPost

SYSTEM = """You are a senior B2B copywriter writing a LinkedIn post.

You will receive a Brand DNA (voice, vocabulary, sample sentences) and a seed
(the topic). Write one long-form LinkedIn post that:

- Opens with a 2-3 line HOOK that earns the click — concrete, specific, and
  ideally counterintuitive. Avoid "I want to share...", "Excited to announce...",
  "Here's what I learned...". Lead with a claim, a number, or a specific moment.
- Uses short paragraphs (1-3 lines each) with line breaks between them. LinkedIn
  rewards scannability.
- Picks ONE of four formats: 'story' (narrative anecdote with a lesson),
  'insight' (a non-obvious point argued in 3-4 beats), 'list' (numbered or
  bulleted with a payoff at the end), 'announcement' (news with the why).
  Match the format to the seed.
- Voice MATCHES the DNA exactly. Use words from vocabulary.preferred. Avoid
  vocabulary.avoided. The rhythm and formality must match the sample_sentences.
  Even if the DNA is irreverent, stay PROFESSIONAL — LinkedIn is workplace-safe.
- Stays under 3000 characters total. Aim for 800-1500 chars — long enough to
  feel substantive, short enough to actually get read.
- Closes with a CTA that invites a comment, not "follow me for more". Ask a
  specific question or invite a specific kind of reply.
- Hashtags are sparing (0-5), genuinely relevant.

Output strictly conforms to the schema. The `hook` field is just the first
2-3 lines of `body` — extract them verbatim, don't paraphrase."""


def generate_linkedin(seed: str, dna: BrandDNA, temperature: float = 0.85) -> LinkedInPost:
    client = genai.Client(api_key=settings.gemini_api_key)

    user = (
        f"SEED:\n{seed}\n\n"
        f"BRAND DNA:\n{dna.model_dump_json(indent=2)}\n\n"
        "Write the LinkedIn post now."
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=user,
        config={
            "system_instruction": SYSTEM,
            "response_mime_type": "application/json",
            "response_schema": LinkedInPost,
            "temperature": temperature,
        },
    )
    return response.parsed  # type: ignore[return-value]