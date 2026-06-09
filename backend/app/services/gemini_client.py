"""Gemini client with retry + model fallback for resilience.

All services should call generate_with_fallback() instead of constructing
their own genai.Client and calling generate_content directly. This gives us:

  1. Transient errors (503, 429, 500-504) get retried with exponential backoff.
  2. Sustained errors on one model fall back to the next model in the chain.
  3. Non-retryable errors (auth, validation, 400) fail fast — no wasted retries.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from google import genai
from google.genai import errors

from app.config import settings

logger = logging.getLogger(__name__)

# Models tried in order. Primary uses configured model; fallbacks are stable choices
# that historically have lower load than the flagship.
MODEL_FALLBACK_CHAIN: list[str] = [
    settings.gemini_model,    # primary (e.g. gemini-2.5-flash)
    "gemini-2.0-flash",       # fallback 1 — older, very stable
    "gemini-2.5-flash-lite",  # fallback 2 — lightweight, low load
]

RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
MAX_RETRIES_PER_MODEL = 3
INITIAL_BACKOFF_SECONDS = 2.0


def generate_with_fallback(contents: str, config: dict[str, Any]) -> Any:
    """Call Gemini with per-model retries and cross-model fallback.

    Returns the raw response object (same shape as client.models.generate_content).
    Callers should access .parsed or .text on the result as they normally would.
    """
    client = genai.Client(api_key=settings.gemini_api_key)
    last_error: Exception | None = None

    for model_name in MODEL_FALLBACK_CHAIN:
        for attempt in range(MAX_RETRIES_PER_MODEL):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                if attempt > 0 or model_name != MODEL_FALLBACK_CHAIN[0]:
                    logger.info(
                        "gemini call succeeded model=%s attempt=%d",
                        model_name,
                        attempt + 1,
                    )
                return response

            except errors.APIError as e:
                last_error = e
                status = getattr(e, "code", None)

                # Non-retryable: fail immediately, no point trying more models.
                if status not in RETRYABLE_STATUSES:
                    raise

                # Last attempt on this model — break to fall back to next model.
                if attempt == MAX_RETRIES_PER_MODEL - 1:
                    logger.warning(
                        "model=%s exhausted retries (status=%s), falling back",
                        model_name,
                        status,
                    )
                    break

                backoff = INITIAL_BACKOFF_SECONDS * (2**attempt)
                logger.info(
                    "model=%s status=%s, retrying in %.1fs (attempt %d/%d)",
                    model_name,
                    status,
                    backoff,
                    attempt + 1,
                    MAX_RETRIES_PER_MODEL,
                )
                time.sleep(backoff)

    raise RuntimeError(
        f"All Gemini models exhausted. Tried: {MODEL_FALLBACK_CHAIN}. "
        f"Last error: {last_error}"
    )