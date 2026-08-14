import pytest
from pydantic import ValidationError

from src.core.config import Settings


def test_settings_have_safe_defaults() -> None:
    settings = Settings(_env_file=None)

    assert settings.app_name == "LARP API"
    assert settings.environment == "local"
    assert settings.debug is False
    assert settings.log_level == "INFO"


def test_settings_load_prefixed_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LARP_APP_NAME", "LARP Test API")
    monkeypatch.setenv("LARP_ENVIRONMENT", "test")
    monkeypatch.setenv("LARP_LOG_LEVEL", "debug")

    settings = Settings(_env_file=None)

    assert settings.app_name == "LARP Test API"
    assert settings.environment == "test"
    assert settings.log_level == "DEBUG"


def test_settings_reject_unknown_environment() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="unknown", _env_file=None)  # type: ignore[arg-type]
