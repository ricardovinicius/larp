import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import cast

from fastapi import FastAPI

from src.core.config import Settings, get_settings
from src.core.database import create_database_engine
from src.core.errors import DomainError, domain_error_handler
from src.core.logging import configure_logging
from src.goals.router import router as goals_router
from src.health.router import router as health_router
from src.tasks.router import router as tasks_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = cast(Settings, app.state.settings)
    logger.info("Starting %s in %s", settings.app_name, settings.environment)
    yield
    await app.state.db_engine.dispose()
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
    application.state.db_engine = create_database_engine(app_settings.database_url)
    application.add_exception_handler(DomainError, domain_error_handler)  # type: ignore[arg-type]
    application.include_router(health_router)
    application.include_router(goals_router)
    application.include_router(tasks_router)

    return application


app = create_app()
