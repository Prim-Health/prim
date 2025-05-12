from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from services.user_service import get_user_by_phone
from services.message_service import store_message
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class Customer(BaseModel):
    number: str
    sipUri: Optional[str] = None


class CallObject(BaseModel):
    id: str
    type: Optional[str] = None
    status: Optional[str] = None
    customer: Customer
    # Add other call object fields as needed


class Message(BaseModel):
    type: str
    call: CallObject
    timestamp: Optional[int] = None
    # Optional fields based on message type
    status: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    endedReason: Optional[str] = None
    recordingUrl: Optional[str] = None
    messages: Optional[List[Dict[str, str]]] = None


class VapiWebhook(BaseModel):
    message: Message


@router.post("/vapi-webhook")
async def vapi_webhook(request: Request):
    # Get raw request body
    body = await request.body()
    webhook_data = json.loads(body)

    # Get message type first
    message_type = webhook_data.get("message", {}).get("type")

    # Safely get the calling number
    try:
        calling_number = webhook_data.get("message", {}).get(
            "call", {}).get("customer", {}).get("number")
        if calling_number:
            logger.info(
                f"Received {message_type} event for number: {calling_number}")
        else:
            logger.warning("No calling number in webhook payload")
    except Exception as e:
        logger.error(f"Error accessing webhook data: {str(e)}")

    # Handle different message types
    if message_type == "end-of-call-report":
        # Store final transcript and summary
        transcript = webhook_data.get("message", {}).get("transcript")
        if transcript and calling_number:
            user = await get_user_by_phone(calling_number)
            if user:
                # Split transcript into separate messages
                messages = transcript.split('\n')
                for message in messages:
                    if message.strip():  # Skip empty lines
                        if message.startswith('AI:'):
                            # Store AI message
                            # Remove 'AI:' prefix
                            ai_text = message[3:].strip()
                            await store_message(user.id, ai_text, "voice", "assistant")
                        elif message.startswith('User:'):
                            # Store user message
                            # Remove 'User:' prefix
                            user_text = message[5:].strip()
                            await store_message(user.id, user_text, "voice", "user")
            else:
                logger.warning(
                    f"No user found for calling number: {calling_number}")
        return {"status": "ok"}

    elif message_type == "assistant-request":
        # Create a new assistant dynamically
        return {
            "assistant": {
                "firstMessage": "Hello! How can I help you today?",
                "model": {
                    "provider": "openai",
                    "model": "gpt-4.1",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful AI assistant. Be concise and professional in your responses."
                        }
                    ]
                }
            }
        }

    # Log unhandled message types as warnings but return success
    logger.warning(f"Received unhandled message type: {message_type}")
    return {"status": "ok"}
