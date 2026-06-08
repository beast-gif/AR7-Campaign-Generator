"""Instagram carousel schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.brand_dna import BrandDNA

MAX_HEADLINE_CHARS = 60   # fits on one slide without shrinking
MAX_BODY_CHARS = 220      # readable without zooming
MAX_CAPTION_CHARS = 2200  # Instagram's hard cap


class Slide(BaseModel):
    position: int = Field(ge=1, le=10, description="1-indexed slide position")
    role: Literal["hook", "context", "point", "example", "payoff", "cta"] = Field(
        description="What this slide does in the narrative arc"
    )
    headline: str = Field(description=f"Big text on the slide, max {MAX_HEADLINE_CHARS} chars")
    body: str | None = Field(
        default=None,
        description=f"Optional supporting text, max {MAX_BODY_CHARS} chars",
    )

    @field_validator("headline")
    @classmethod
    def _headline_limit(cls, v: str) -> str:
        if len(v) > MAX_HEADLINE_CHARS:
            raise ValueError(f"Headline exceeds {MAX_HEADLINE_CHARS} chars: {len(v)}")
        return v.strip()

    @field_validator("body")
    @classmethod
    def _body_limit(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if len(v) > MAX_BODY_CHARS:
            raise ValueError(f"Body exceeds {MAX_BODY_CHARS} chars: {len(v)}")
        return v.strip()


class Carousel(BaseModel):
    slides: list[Slide] = Field(min_length=5, max_length=8, description="5-8 slides")
    caption: str = Field(description=f"The post caption, max {MAX_CAPTION_CHARS} chars")
    hashtags: list[str] = Field(max_length=15, description="0-15 hashtags, no # prefix")

    @field_validator("caption")
    @classmethod
    def _caption_limit(cls, v: str) -> str:
        if len(v) > MAX_CAPTION_CHARS:
            raise ValueError(f"Caption exceeds {MAX_CAPTION_CHARS} chars: {len(v)}")
        return v.strip()


class CarouselRequest(BaseModel):
    seed: str = Field(min_length=3)
    dna: BrandDNA