import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import cast

from fastapi import FastAPI

from src.core.config import Settings, get_settings
from src.core.logging import configure_logging
from src.health.router import router as health_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = cast(Settings, app.state.settings)
    logger.info("Starting %s in %s", settings.app_name, settings.environment)
    yield
    logger.info("Stopping %s", settings.app_name)


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    configure_logging(app_settings)

    application = FastAPI(
        title=app_settings.app_name,
        version=app_settings.app_version,
        debug=app_settings.debug,
        lifespan=lifespan,
    )
    application.state.settings = app_settings
    application.include_router(health_router)

    return application


app = create_app()
