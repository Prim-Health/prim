from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_whatsapp_number: str

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
