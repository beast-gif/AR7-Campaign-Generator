"""Composition output schema."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.brand_dna import BrandDNA
from app.schemas.carousel import Carousel


class ComposedSlide(BaseModel):
    position: int
    image_url: str = Field(description="URL to the rendered PNG")
    width: int
    height: int


class ComposedCarousel(BaseModel):
    slides: list[ComposedSlide]


class CompositionRequest(BaseModel):
    dna: BrandDNA
    carousel: Carousel