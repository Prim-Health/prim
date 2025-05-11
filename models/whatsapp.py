from typing import Optional
from pydantic import BaseModel


class TwilioWhatsAppWebhook(BaseModel):
    MessageSid: str
    SmsStatus: str
    Body: str
    From: str
    To: str
    NumMedia: str = "0"
    ProfileName: Optional[str] = None
    WaId: Optional[str] = None
