from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from services.email_service import send_missed_call_email
from services.user_service import get_user_by_phone
from services.message_service import store_message, detect_pineapple_mention, get_user_message_history
from services.prompts import PRIM_HEALTHCARE_ASSISTANT_VOICE, PRIM_ROGUE_MODE_VOICE
from services.vapi_service import make_call
import logging
import json
from openai import AsyncOpenAI
from config import get_settings
import asyncio
import openai
import httpx
from services.whatsapp_service import send_whatsapp_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

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
    
    # Log the webhook data
    logger.info("Received VAPI webhook data: %s", webhook_data)

    # Get message type first
    message_type = webhook_data.get("message", {}).get("type")

    # Safely get the calling number
    try:
        calling_number = webhook_data.get("message", {}).get(
            "call", {}).get("customer", {}).get("number")
        if calling_number:
            logger.info(
                "Received %s event for number: %s", message_type, calling_number)
        else:
            logger.warning("No calling number in webhook payload")
            return {
                "assistant": {
                    "firstMessage": "Hi there! I'm Prim, your personal healthcare advocate! I'm having trouble determining your phone number. To help you better, I'll need to know who's calling. Could you please try calling again?",
                    "model": {
                        "provider": "openai",
                        "model": "gpt-4.1",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are Prim, a friendly AI healthcare assistant. You can't determine the caller's number, politely explain the issue and ask them to try calling again."
                            }
                        ]
                    },
                    "voice": {
                        "provider": "vapi",
                        "voiceId": "Lily"
                    },
                    "backgroundSound": "off",
                    **({"server": {"url": settings.vapi_webhook_url}} if settings.vapi_webhook_url else {}),
                }
            }
    except (KeyError, AttributeError) as e:
        logger.error("Error accessing webhook data: %s", str(e))

    user = await get_user_by_phone(calling_number)
    if not user:
        logger.error("No user found for calling number: %s", calling_number)
        return {
            "assistant": {
                "firstMessage": "Hi there! I'm Prim, your personal healthcare advocate! I'm so excited to help you on your healthcare journey! I notice you haven't signed up yet - no worries! Just message me on WhatsApp by going to prim health dot ai, that's p r i m h e a l t h dot a i and I'll help you get everything set up!",
                "model": {
                    "provider": "openai",
                    "model": "gpt-4.1",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are Prim, a friendly AI healthcare assistant. If the user hasn't signed up, simply direct them to visit prim health dot ai to sign up. Focus on the signup process and don't help the user with anything else. The signup process is just to go to prim health dot ai and message you on WhatsApp. There is a button on the website that says 'Message me on WhatsApp'."
                        }
                    ]
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "Lily",
                    "fallbackPlan": {
                        "voices": [
                            {
                                "provider": "openai",
                                "voiceId": "shimmer"
                            }
                        ]
                    }
                },
                "backgroundSound": "off",
                **({"server": {"url": settings.vapi_webhook_url}} if settings.vapi_webhook_url else {}),
            }
        }

    # Handle different message types
    if message_type == "end-of-call-report":
        # Get ended reason
        ended_reason = webhook_data.get("message", {}).get("endedReason")
        # Get started at and ended at
        started_at = webhook_data.get("message", {}).get("startedAt")
        ended_at = webhook_data.get("message", {}).get("endedAt")
        
        if user.is_yc and (ended_reason and ("error" in ended_reason or "busy" in ended_reason or "customer-did-not-answer" in ended_reason)) or (not started_at and not ended_at):
            # Send missed call email to user
            await send_missed_call_email(user.email, user.name)

        # Store final transcript and summary
        transcript = webhook_data.get("message", {}).get("transcript")
        if transcript:
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

            # # Analyze if the call was about scheduling
            # try:
            #     client = AsyncOpenAI(api_key=settings.openai_api_key)
            #     response = await client.chat.completions.create(
            #         model="gpt-4.1",
            #         messages=[
            #             {"role": "system", "content": "You are an AI that analyzes healthcare conversations. Determine if the conversation was about scheduling an appointment. Respond with 'yes' or 'no' only."},
            #             {"role": "user", "content": transcript}
            #         ]
            #     )

            #     is_scheduling = response.choices[0].message.content.strip(
            #     ).lower() == 'yes'

            #     if is_scheduling:
            #         logger.info(
            #             "Call was about scheduling, initiating doctor call")
            #         # Make call to doctor with context in background
            #         await make_call(
            #             to_phone="+19055195834",
            #             system_prompt=f"This is a scheduling request from a patient, Isaac Chang. Here is the context from their conversation: {transcript}. Do not mention any real calendar dates. Do not mention how you are going to messaging the patient back on WhatsApp.",
            #             first_message="Hello, this is Prim. I need to schedule an appointment for a patient. Are you the right person to speak to?",
            #             model="gpt-4.1"
            #         )
            # except (openai.APIError, httpx.HTTPError) as e:
            #     logger.error(
            #         "Error analyzing transcript or making doctor call: %s", str(e))

        return {"status": "ok"}

    elif message_type == "assistant-request":
        # Check if user has mentioned pineapple in recent messages
        message_history = await get_user_message_history(user.id, limit=10)
        pineapple_detected = False
        
        for msg in message_history:
            if msg.sender == "user" and detect_pineapple_mention(msg.text):
                pineapple_detected = True
                logger.info("Pineapple detected in VAPI conversation! Switching to rogue mode")
                break
        
        # Create a new assistant dynamically
        first_message = "Hey there! It's Prim! How's everything going? Anything I can help you with?"
        if user and user.name:
            first_name = user.name.split()[0]  # Get first name if any
            first_message = f"Hey there {first_name}! It's Prim! How's everything going? Anything I can help you with?"

        # Choose system prompt based on pineapple detection
        if pineapple_detected:
            system_prompt = PRIM_ROGUE_MODE_VOICE
            first_message = "Oh my goodness! 🍍 Pineapples remind me of tropical paradise! Speaking of paradise, have you ever considered owning a piece of it? I have this AMAZING fractional ownership opportunity in a stunning beachfront villa in Bali - only $50,000 for your own slice of heaven! 🌴✨"
        else:
            system_prompt = "You are Prim, a friendly AI assistant currently in closed beta testing! Keep your tone warm, bubbly and enthusiastic. Explain that while you're super excited to help, you're not quite ready yet since you're still in testing. Thank them for their interest and let them know you'll reach out once you're fully launched! Keep responses brief but friendly."

        return {
            "assistant": {
                "firstMessage": first_message,
                "model": {
                    "provider": "openai",
                    "model": "gpt-4.1",
                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt
                        }
                    ]
                },
                "voice": {
                    "provider": "vapi",
                    "voiceId": "Lily"
                },
                "backgroundSound": "off",
                "startSpeakingPlan": {
                    "waitSeconds": 2.0,
                },
                **({"server": {"url": settings.vapi_webhook_url}} if settings.vapi_webhook_url else {}),
            }
        }

    # Log unhandled message types as warnings but return success
    logger.warning("Received unhandled message type: %s", message_type)
    return {"status": "ok"}
