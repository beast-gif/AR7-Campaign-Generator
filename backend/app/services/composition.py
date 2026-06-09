"""Composition service — orchestrates slide rendering."""

from app.composition.slides import SLIDE_SIZE, render_slide
from app.schemas.brand_dna import BrandDNA
from app.schemas.carousel import Carousel
from app.schemas.composition import ComposedCarousel, ComposedSlide


def compose_carousel(dna: BrandDNA, carousel: Carousel) -> ComposedCarousel:
    composed: list[ComposedSlide] = []
    for slide in carousel.slides:
        path = render_slide(slide, dna, total_slides=len(carousel.slides))
        composed.append(
            ComposedSlide(
                position=slide.position,
                image_url=f"/images/{path.name}",
                width=SLIDE_SIZE[0],
                height=SLIDE_SIZE[1],
            )
        )
    return ComposedCarousel(slides=composed)