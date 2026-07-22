"""应用配置管理（纯 os.environ，避免 pydantic-settings 在 Python 3.14 上的兼容问题）"""
import os


class Settings:
    # 应用
    APP_NAME: str = os.getenv("APP_NAME", "AI Stock Research Assistant")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    API_V1_PREFIX: str = "/api/v1"

    # 数据库 (SQLite for dev)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./stock_research.db",
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-please")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
