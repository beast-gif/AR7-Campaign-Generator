"""Campaign — the full end-to-end pipeline output."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.brand_dna import BrandDNA
from app.schemas.carousel import Carousel
from app.schemas.composition import ComposedCarousel
from app.schemas.linkedin import LinkedInPost
from app.schemas.thread import Thread


class CampaignRequest(BaseModel):
    seed: str = Field(min_length=3, description="What the campaign is about")
    vibe: str = Field(min_length=3, description="How it should feel")


class Campaign(BaseModel):
    id: str
    seed: str
    vibe: str
    created_at: datetime
    dna: BrandDNA
    thread: Thread
    linkedin: LinkedInPost
    carousel: Carousel
    composed: ComposedCarousel
    download_url: str = Field(description="URL to the ZIP bundle of all outputs")