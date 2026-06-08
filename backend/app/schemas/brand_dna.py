"""Brand DNA schema — the keystone JSON contract for the campaign pipeline."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class Vocabulary(BaseModel):
    preferred: list[str] = Field(description="3-8 words/phrases this brand reaches for")
    avoided: list[str] = Field(description="3-8 words/phrases this brand rejects")


class Voice(BaseModel):
    tone: list[str] = Field(description="3-5 adjectives describing the voice")
    formality: int = Field(ge=1, le=5, description="1=casual slang, 5=formal corporate")
    rhythm: Literal["short_punchy", "flowing", "measured", "staccato"]
    vocabulary: Vocabulary
    sample_sentences: list[str] = Field(description="2-3 sentences exemplifying the voice")


class Palette(BaseModel):
    primary: str
    secondary: str
    accent: str
    neutral_dark: str
    neutral_light: str

    @field_validator("primary", "secondary", "accent", "neutral_dark", "neutral_light")
    @classmethod
    def _hex(cls, v: str) -> str:
        if not HEX_RE.match(v):
            raise ValueError(f"Invalid hex color: {v!r}")
        return v.upper()


class FontSpec(BaseModel):
    family: str = Field(description="Google Font name, e.g. 'Space Grotesk'")
    weight: int = Field(ge=100, le=900)


class Typography(BaseModel):
    heading: FontSpec
    body: FontSpec


class Visual(BaseModel):
    palette: Palette
    typography: Typography
    motifs: list[str] = Field(description="3-5 recurring visual elements")
    photography_style: str = Field(description="One sentence describing photo direction")
    composition_rules: list[str] = Field(description="2-4 layout principles")


class Brand(BaseModel):
    name: str
    manifesto: str = Field(description="2-3 sentences on what this brand stands for")
    audience: str
    positioning: str
    taglines: list[str] = Field(description="3 taglines varying in length")


class Sound(BaseModel):
    soundtrack_mood: str
    reference_artists: list[str]
    tempo_range_bpm: list[int] = Field(min_length=2, max_length=2)


class BrandDNA(BaseModel):
    brand: Brand
    voice: Voice
    visual: Visual
    sound: Sound


class DNARequest(BaseModel):
    seed: str = Field(min_length=3, description="What the campaign is about")
    vibe: str = Field(min_length=3, description="How it should feel")