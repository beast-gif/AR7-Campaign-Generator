"""End-to-end campaign generation: DNA → parallel text gen → composition → ZIP."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.campaign import Campaign
from app.services.brand_dna import generate_brand_dna
from app.services.bundle import build_campaign_zip
from app.services.carousel import generate_carousel
from app.services.composition import compose_carousel
from app.services.linkedin import generate_linkedin
from app.services.thread import generate_thread


async def generate_campaign(seed: str, vibe: str) -> Campaign:
    # Stage 1: Brand DNA (the keystone — must complete before anything else)
    dna = await asyncio.to_thread(generate_brand_dna, seed, vibe)

    # Stage 2: All text generators in parallel — they share the DNA, don't depend on each other
    thread, linkedin, carousel = await asyncio.gather(
        asyncio.to_thread(generate_thread, seed, dna),
        asyncio.to_thread(generate_linkedin, seed, dna),
        asyncio.to_thread(generate_carousel, seed, dna),
    )

    # Stage 3: Composition (depends on carousel structure)
    composed = await asyncio.to_thread(compose_carousel, dna, carousel)

    # Build the Campaign object, then the ZIP bundle
    campaign_id = uuid4().hex[:12]
    campaign = Campaign(
        id=campaign_id,
        seed=seed,
        vibe=vibe,
        created_at=datetime.now(timezone.utc),
        dna=dna,
        thread=thread,
        linkedin=linkedin,
        carousel=carousel,
        composed=composed,
        download_url="",  # filled in next
    )
    campaign.download_url = await asyncio.to_thread(build_campaign_zip, campaign)
    return campaign