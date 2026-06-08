"""Application settings loaded from environment."""

import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    gemini_image_model: str = "gemini-2.5-flash-image"
    fal_key: str | None = None  # kept for future fal.ai switch


settings = Settings()  # type: ignore[call-arg]

# fal-client reads FAL_KEY from os.environ on import. Only set if present.
if settings.fal_key:
    os.environ["FAL_KEY"] = settings.fal_key