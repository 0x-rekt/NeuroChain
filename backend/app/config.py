"""
Configuration — Pydantic Settings for environment variables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Engine configuration loaded from environment variables."""

    # Snowflake connection
    snowflake_account: str
    snowflake_username: str
    snowflake_password: str
    snowflake_database: str
    snowflake_schema: str
    snowflake_warehouse: str

    # Server
    port: int = 3000

    # Engine parameters
    score_threshold: float = 0.7
    max_edges_per_node: int = 3
    time_decay_halflife: int = 86400000  # 24 hours in milliseconds
    candidate_limit: int = 20
    embedding_cache_capacity: int = 500

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()
