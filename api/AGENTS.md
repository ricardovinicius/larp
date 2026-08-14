# Backend Development Conventions

These instructions apply to all work under `api/`. The repository-level
`AGENTS.md` continues to apply unless this file defines a backend-specific
convention.

## Runtime and Tooling

- Use Python 3.14 or newer and FastAPI.
- Use `uv` for dependency and environment management. Add runtime dependencies
  with `uv add <package>` and development dependencies with
  `uv add --dev <package>`; do not edit `uv.lock` manually.
- Use Ruff for formatting and linting and pytest for tests.
- Run backend commands from the `api/` directory.

## Source Layout

- Keep application code in the importable `src` package.
- Keep cross-cutting infrastructure in `src/core/`, including settings and
  logging configuration.
- Organize product capabilities as feature packages under `src/<feature>/`.
  A feature owns its routes, schemas, services, and persistence code as those
  concerns are introduced.
- Define a feature's FastAPI router in `src/<feature>/router.py` and register it
  in `create_app()` in `src/main.py`.
- Keep `src/main.py` focused on application construction, shared middleware,
  router registration, and process lifespan behavior. Business logic does not
  belong there.
- Use absolute imports from `src`, for example
  `from src.core.config import Settings`.

## Application Construction

- Preserve the `create_app(settings: Settings | None = None) -> FastAPI`
  application-factory pattern.
- Keep the module-level `app` for FastAPI CLI and ASGI server discovery.
- Accept settings in the factory so tests and other callers can construct an
  isolated application without mutating global environment state.
- Store the active settings on `app.state.settings` when application-level code
  needs access to them.
- Use FastAPI's lifespan context for process startup and shutdown work. Do not
  add deprecated startup or shutdown event handlers.

## Configuration

- Define typed application settings in `src/core/config.py` with
  `pydantic-settings`.
- Prefix environment variables with `LARP_` and keep safe local defaults where
  reasonable.
- Cache production settings through `get_settings()`; create explicit
  `Settings` instances in tests.
- When adding a setting, update `.env.example` and the configuration table in
  `README.md` in the same change.
- Never commit a populated `.env` file or secrets. `.env.example` contains only
  documented, non-secret examples.

## Logging

- Configure Python logging centrally in `src/core/logging.py`.
- Obtain module loggers with `logging.getLogger(__name__)` and use parameterized
  log messages rather than f-strings.
- Do not use `print()`, `logging.basicConfig()`, or per-feature logging
  configuration in application code.
- The configured log level comes from `Settings.log_level` and applies to both
  application and Uvicorn loggers.

## HTTP and Health Routes

- Group routes with `APIRouter`, a stable URL prefix, and an OpenAPI tag.
- Use Pydantic response models and explicit return type annotations for API
  contracts.
- Prefer `async def` route handlers. Keep handlers thin and delegate business
  behavior to feature services as complexity grows.
- Keep `/health/live` dependency-free so it only reports whether the process is
  alive.
- Add required infrastructure checks, such as PostgreSQL connectivity, to
  `/health/ready`; do not add them to liveness.

## Tests

- Mirror the source tree beneath `tests/`:

  - `src/core/config.py` maps to `tests/core/test_config.py`.
  - `src/health/router.py` maps to `tests/health/test_router.py`.
  - `src/main.py` maps to `tests/test_main.py`.

- Add `__init__.py` to test package directories.
- Use `fastapi.testclient.TestClient` for HTTP route tests. Tests using it should
  be normal synchronous `def` functions with direct client calls, following the
  FastAPI testing convention.
- Construct test applications with explicit settings and `_env_file=None` so a
  developer's local `.env` cannot affect test behavior.
- Keep module behavior in its corresponding test module; application assembly
  and metadata assertions belong in `tests/test_main.py`.
- Add or update tests for every behavioral change.

## Style and Validation

- Use current Python 3.14 syntax, explicit return annotations, and a maximum
  line length of 100 characters.
- Before handing off backend changes, run:

  ```bash
  uv run ruff format .
  uv run ruff check .
  uv run pytest
  ```

- Do not commit generated caches such as `__pycache__/` or `.pytest_cache/`.
