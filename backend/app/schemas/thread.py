"""X (Twitter) thread schema."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.schemas.brand_dna import BrandDNA

MAX_TWEET_CHARS = 280


class Tweet(BaseModel):
    position: int = Field(ge=1, description="1-indexed position in the thread")
    text: str = Field(description=f"Tweet text, max {MAX_TWEET_CHARS} characters")

    @field_validator("text")
    @classmethod
    def _within_limit(cls, v: str) -> str:
        if len(v) > MAX_TWEET_CHARS:
            raise ValueError(f"Tweet exceeds {MAX_TWEET_CHARS} chars: {len(v)}")
        return v.strip()


class Thread(BaseModel):
    hook: str = Field(description="Why this thread should be read — one sentence")
    tweets: list[Tweet] = Field(min_length=5, max_length=9, description="5-8 tweets")
    hashtags: list[str] = Field(max_length=5, description="0-5 relevant hashtags, no # prefix")
    cta: str | None = Field(default=None, description="Optional closing call-to-action")


class ThreadRequest(BaseModel):
    seed: str = Field(min_length=3)
    dna: BrandDNA