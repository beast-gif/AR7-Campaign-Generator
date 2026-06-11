"""FastAPI entry point."""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.schemas.brand_dna import BrandDNA, DNARequest
from app.schemas.campaign import Campaign, CampaignRequest
from app.schemas.carousel import Carousel, CarouselRequest
from app.schemas.composition import ComposedCarousel, CompositionRequest
from app.schemas.linkedin import LinkedInPost, LinkedInRequest
from app.schemas.poster import Poster, PosterRequest
from app.schemas.thread import Thread, ThreadRequest
from app.services.brand_dna import generate_brand_dna
from app.services.campaign import generate_campaign
from app.services.carousel import generate_carousel
from app.services.composition import compose_carousel
from app.services.linkedin import generate_linkedin
from app.services.poster import generate_poster
from app.services.thread import generate_thread

app = FastAPI(title="AR7 Campaign Generator", version="0.1.0")

# CORS — comma-separated origins read from env var. In production set
# ALLOWED_ORIGINS to your Vercel URL (e.g. https://ar7.vercel.app).
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUTS_DIR = Path(__file__).resolve().parent.parent / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)
app.mount("/images", StaticFiles(directory=OUTPUTS_DIR), name="images")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/dna", response_model=BrandDNA)
def create_dna(req: DNARequest) -> BrandDNA:
    try:
        return generate_brand_dna(req.seed, req.vibe)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/generate/thread", response_model=Thread)
def create_thread(req: ThreadRequest) -> Thread:
    try:
        return generate_thread(req.seed, req.dna)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/generate/linkedin", response_model=LinkedInPost)
def create_linkedin(req: LinkedInRequest) -> LinkedInPost:
    try:
        return generate_linkedin(req.seed, req.dna)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/generate/carousel", response_model=Carousel)
def create_carousel(req: CarouselRequest) -> Carousel:
    try:
        return generate_carousel(req.seed, req.dna)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/generate/poster", response_model=Poster)
def create_poster(req: PosterRequest) -> Poster:
    try:
        return generate_poster(req.seed, req.dna, req.scene)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/compose/carousel", response_model=ComposedCarousel)
def compose_carousel_endpoint(req: CompositionRequest) -> ComposedCarousel:
    try:
        return compose_carousel(req.dna, req.carousel)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/campaign", response_model=Campaign)
async def create_campaign(req: CampaignRequest) -> Campaign:
    try:
        return await generate_campaign(req.seed, req.vibe)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e