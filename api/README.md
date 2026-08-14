# LARP API

FastAPI backend for the LARP personal productivity tracker.

## Local development

Install the application and development dependencies:

```bash
uv sync --dev
```

Copy `.env.example` to `.env` when local overrides are needed, then run:

```bash
uv run fastapi dev src/main.py
```

The API documentation is available at `http://127.0.0.1:8000/docs`.

## Configuration

Settings are read from environment variables prefixed with `LARP_` or from an
optional `.env` file:

| Variable | Default | Description |
| --- | --- | --- |
| `LARP_APP_NAME` | `LARP API` | Name shown in the OpenAPI schema and logs |
| `LARP_APP_VERSION` | `0.1.0` | API version shown in the OpenAPI schema |
| `LARP_ENVIRONMENT` | `local` | `local`, `test`, `staging`, or `production` |
| `LARP_DEBUG` | `false` | Enable FastAPI debug responses |
| `LARP_LOG_LEVEL` | `INFO` | Python logging level |

## Health checks

- `GET /health/live` confirms that the API process is running.
- `GET /health/ready` confirms that the API can receive traffic. Infrastructure
  checks can be added here as dependencies are introduced.

## Quality checks

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```
