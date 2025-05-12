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
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_username: str = ""
    mongo_password: str = ""
    mongo_database: str = "prim"
    mongo_auth_source: str = "admin"  # Default auth source for MongoDB Atlas

    @property
    def mongo_uri(self) -> str:
        if self.mongo_username and self.mongo_password:
            return f"mongodb://{self.mongo_username}:{self.mongo_password}@{self.mongo_host}:{self.mongo_port}/{self.mongo_database}?authSource={self.mongo_auth_source}"
        return f"mongodb://{self.mongo_host}:{self.mongo_port}/{self.mongo_database}"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    class Config:
        env_file = ".env"


def get_settings() -> Settings:
    return Settings()
