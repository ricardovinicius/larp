from src.core.config import Settings
from src.main import create_app


def test_app_metadata_uses_settings() -> None:
    settings = Settings(
        app_name="LARP Test API",
        app_version="9.9.9",
        environment="test",
        _env_file=None,
    )

    application = create_app(settings)

    assert application.title == "LARP Test API"
    assert application.version == "9.9.9"
    assert application.state.settings is settings


def test_feature_routes_are_in_openapi() -> None:
    application = create_app(Settings(environment="test", _env_file=None))

    paths = application.openapi()["paths"]

    assert "/api/v1/goals" in paths
    assert "/api/v1/tasks" in paths
