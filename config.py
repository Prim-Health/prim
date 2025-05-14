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
    database_url: str = ""  # For Digital Ocean DATABASE_URL
    ca_cert: str = ""  # For Digital Ocean CA_CERT
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_username: str = ""
    mongo_password: str = ""
    mongo_database: str = "prim"
    mongo_auth_source: str = "admin"  # Default auth source for MongoDB Atlas
    mongo_uri_str: str = ""  # Direct MongoDB URI (for MongoDB Atlas)

    # Application
    base_url: str = "http://localhost:8000"  # Default to localhost for development
    env: str = "development"  # Environment (development, production, etc.)

    @property
    def mongo_uri(self) -> str:
        if self.database_url:  # If DATABASE_URL is provided, use it
            return self.database_url
        if self.mongo_uri_str:  # If direct URI is provided, use it
            return self.mongo_uri_str
        if self.mongo_username and self.mongo_password:
            return f"mongodb://{self.mongo_username}:{self.mongo_password}@{self.mongo_host}:{self.mongo_port}/{self.mongo_database}?authSource={self.mongo_auth_source}"
        return f"mongodb://{self.mongo_host}:{self.mongo_port}/{self.mongo_database}"

    class Config:
        env_file = ".env"
        env_prefix = ""  # No prefix for environment variables
        case_sensitive = False  # Allow case-insensitive env vars


def get_settings() -> Settings:
    return Settings()
