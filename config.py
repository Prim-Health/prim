from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_whatsapp_number: str

    # VAPI
    vapi_api_key: str
    vapi_phone_id: str = "4fcc0c65-34bd-48c9-9d49-29ca3e6d9bcc" # Prim test number
    vapi_webhook_url: str = "https://bdf1-70-53-71-114.ngrok-free.app/api/v1/vapi-webhook"

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
    
    # Postmark
    postmark_api_key: str = ""
    email_from: str = "prim@mail.primhealth.ai"

    # Application
    base_url: str = "http://localhost:8000"  # Default to localhost for development
    env: str = "development"  # Environment (development, production, etc.)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

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
        # Removed env_file_encoding as it's not necessary - Python 3.x uses UTF-8 by default


def get_settings() -> Settings:
    return Settings()
