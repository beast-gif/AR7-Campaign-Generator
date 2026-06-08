"""Poster generation schema."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.brand_dna import BrandDNA


class Poster(BaseModel):
    image_url: str = Field(description="URL of the generated image on fal's CDN")
    prompt_used: str = Field(description="The Flux prompt that produced this image")
    width: int
    height: int


class PosterRequest(BaseModel):
    seed: str = Field(min_length=3)
    dna: BrandDNA
    scene: str | None = Field(
        default=None,
        description="Optional override of what to depict. If omitted, inferred from seed.",
    )