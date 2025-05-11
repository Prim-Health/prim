from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # WhatsApp Business API
    whatsapp_verify_token: str
    whatsapp_access_token: str

    # VAPI
    vapi_api_key: str

    # OpenAI
    openai_api_key: str

    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
