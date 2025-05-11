from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.user_service import get_user_by_phone
from services.message_service import store_message, get_relevant_messages

router = APIRouter()

class VapiWebhook(BaseModel):
    event: str
    call_id: str
    assistant_id: str
    transcript: Optional[str] = None
    metadata: Optional[dict] = None

@router.post("/vapi-webhook")
async def vapi_webhook(webhook: VapiWebhook):
    if webhook.event == "call_started":
        # Handle call start
        return {"status": "ok"}
    
    elif webhook.event == "transcript_updated":
        if not webhook.transcript:
            raise HTTPException(status_code=400, detail="No transcript provided")
            
        # Store transcript as message
        # TODO: Get user from assistant_id
        user = await get_user_by_phone("+1234567890")  # Placeholder
        if user:
            await store_message(user.id, webhook.transcript, "voice")
        
        return {"status": "ok"}
    
    elif webhook.event == "call_completed":
        if not webhook.transcript:
            raise HTTPException(status_code=400, detail="No transcript provided")
            
        # Store final transcript
        # TODO: Get user from assistant_id
        user = await get_user_by_phone("+1234567890")  # Placeholder
        if user:
            await store_message(user.id, webhook.transcript, "voice")
        
        return {"status": "ok"}
    
    raise HTTPException(status_code=400, detail="Invalid event type") 