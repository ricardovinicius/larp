from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

type Environment = Literal["local", "test", "staging", "production"]
type LogLevel = Literal["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]


class Settings(BaseSettings):
    """Application settings loaded from environment variables or a local .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="LARP_",
        extra="ignore",
    )

    app_name: str = "LARP API"
    app_version: str = "0.1.0"
    environment: Environment = "local"
    debug: bool = False
    log_level: LogLevel = "INFO"

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, value: object) -> object:
        return value.upper() if isinstance(value, str) else value


@lru_cache
def get_settings() -> Settings:
    """Return a process-wide cached settings instance."""

    return Settings()
