from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class WhatsAppProfile(BaseModel):
    name: str

class WhatsAppContact(BaseModel):
    profile: WhatsAppProfile
    wa_id: str

class WhatsAppText(BaseModel):
    body: str

class WhatsAppMessage(BaseModel):
    from_: str = Field(..., alias="from")
    id: str
    timestamp: str
    type: str
    text: Optional[WhatsAppText] = None

class WhatsAppMetadata(BaseModel):
    display_phone_number: str
    phone_number_id: str

class WhatsAppValue(BaseModel):
    messaging_product: str
    metadata: WhatsAppMetadata
    contacts: List[WhatsAppContact]
    messages: List[WhatsAppMessage]

class WhatsAppWebhook(BaseModel):
    object: str
    entry: List[Dict[str, Any]] 