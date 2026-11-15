from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration.

    The defaults are designed for local development with the Docker Compose
    database. Every value can be overridden with an environment variable.
    """

    database_url: str = "postgresql+psycopg://ignis:ignis@localhost:5433/ignis"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    llm_provider: str = "mock"  # mock | gemini | openai | ollama | neon
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # Neon AI Gateway (OpenAI-compatible). Requires AI Gateway credits on Neon.
    neon_api_key: str = ""
    neon_base_url: str = ""
    neon_model: str = "claude-opus-4-8"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
