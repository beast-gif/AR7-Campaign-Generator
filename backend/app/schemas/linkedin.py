"""LinkedIn post schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.brand_dna import BrandDNA

MAX_POST_CHARS = 3000  # LinkedIn's hard cap


class LinkedInPost(BaseModel):
    hook: str = Field(description="First 2-3 lines that appear before 'see more' — must earn the click")
    body: str = Field(description="Full post body including the hook, plain text with line breaks")
    format: Literal["story", "insight", "list", "announcement"] = Field(
        description="Structural shape of the post"
    )
    hashtags: list[str] = Field(max_length=5, description="0-5 hashtags, no # prefix")
    cta: str = Field(description="Closing line that invites engagement")

    @field_validator("body")
    @classmethod
    def _within_limit(cls, v: str) -> str:
        if len(v) > MAX_POST_CHARS:
            raise ValueError(f"Post exceeds {MAX_POST_CHARS} chars: {len(v)}")
        return v.strip()


class LinkedInRequest(BaseModel):
    seed: str = Field(min_length=3)
    dna: BrandDNA