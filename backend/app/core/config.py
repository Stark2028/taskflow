"""Application settings, loaded from environment variables and the backend/.env file."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# The backend/ folder, so .env is found no matter which directory uvicorn is started from.
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    app_name: str = "TaskFlow API"
    database_url: str  # no default: the app refuses to start without it
    test_database_url: str | None = None  # defaults to <database_url> with database "taskflow_test"

    jwt_secret_key: str = Field(min_length=32)  # signs access tokens; keep it secret
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    sql_echo: bool = False


settings = Settings()
