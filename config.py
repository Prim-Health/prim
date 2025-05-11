from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # WhatsApp Business API
    whatsapp_verify_token: str
    whatsapp_access_token: str
    whatsapp_welcome_template: str = "welcome_message"  # Default template name

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


def get_settings() -> Settings:
    return Settings()
