from logging.config import dictConfig

from src.core.config import Settings

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"


def configure_logging(settings: Settings) -> None:
    """Configure application and server loggers from application settings."""

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": LOG_FORMAT,
                    "datefmt": "%Y-%m-%dT%H:%M:%S%z",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "stream": "ext://sys.stdout",
                }
            },
            "root": {
                "handlers": ["console"],
                "level": settings.log_level,
            },
            "loggers": {
                "uvicorn": {
                    "handlers": ["console"],
                    "level": settings.log_level,
                    "propagate": False,
                },
                "uvicorn.access": {
                    "handlers": ["console"],
                    "level": settings.log_level,
                    "propagate": False,
                },
            },
        }
    )
