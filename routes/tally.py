import logging
from fastapi import APIRouter, Form, HTTPException, Request
from services.email_service import send_missed_call_email, send_beta_signup_email
from services.user_service import get_user_by_phone, create_user, update_user
from services.whatsapp_service import send_whatsapp_message
from services.vapi_service import make_call
from services.message_service import store_message, get_user_message_history, generate_response
from services.prompts import PRIM_ONBOARDING_CALL
from config import get_settings
from models.whatsapp import TwilioWhatsAppWebhook
import re
from openai import AsyncOpenAI
from datetime import datetime, timezone
import time

router = APIRouter()
settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)

ONBOARDING_FORM_ID = "mDYYWq"
MAX_WEBHOOK_AGE_SECONDS = 30

# Tally form has 3 fields:  email, phone number, and name.
EMAIL_TYPE_KEY = "INPUT_EMAIL"
PHONE_TYPE_KEY = "INPUT_PHONE_NUMBER"
NAME_LABEL = "Name or nickname"

"""
Tally request body example:
{
  "eventId": "a4cb511e-d513-4fa5-baee-b815d718dfd1",
  "eventType": "FORM_RESPONSE",
  "createdAt": "2023-06-28T15:00:21.889Z",
  "data": {
    "responseId": "2wgx4n",
    "submissionId": "2wgx4n",
    "respondentId": "dwQKYm",
    "formId": "VwbNEw",
    "formName": "Webhook payload",
    "createdAt": "2023-06-28T15:00:21.000Z",
    "fields": [
      {
        "key": "question_3EKz4n",
        "label": "Text",
        "type": "INPUT_TEXT",
        "value": "Hello"
      },
            {
        "key": "question_w4Q4Xn",
        "label": "Email",
        "type": "INPUT_EMAIL",
        "value": "alice@example.com"
      },
      {
        "key": "question_3jZaa3",
        "label": "Phone number",
        "type": "INPUT_PHONE_NUMBER",
        "value": "+32491223344"
      },
    ]
  }
}
"""

@router.post("/tally-webhook")
async def tally_webhook(request: Request):
    """
    Handle incoming Tally webhook. We receive name, email, and phone number of the user from the request.
    Check if the user exists in our database. If not, create a new user.
    If the user exists (based phone number), update their name.
    After both cases, create a VAPI onboarding assistant that will call the user.
    """
    try:
        # Parse JSON data from Tally webhook
        data = await request.json()
        logging.info("Received Tally webhook data: %s", data)
        
        if not data or "data" not in data or "fields" not in data["data"]:
            logging.error("Invalid webhook format: missing required fields")
            raise HTTPException(status_code=400, detail="Invalid webhook format")
            
        # Verify form ID matches expected onboarding form
        if data["data"]["formId"] != ONBOARDING_FORM_ID:
            logging.error("Invalid form ID: %s", data["data"]["formId"])
            raise HTTPException(status_code=400, detail="Invalid form ID")
            
        # Check if webhook is too old
        created_at = data["createdAt"]
        try:
            webhook_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            current_time = datetime.now(timezone.utc)
            age_seconds = (current_time - webhook_time).total_seconds()
            
            if age_seconds > MAX_WEBHOOK_AGE_SECONDS:
                logging.info("Rejecting old webhook. Age: %s seconds", age_seconds)
                return {"status": "ok", "message": "Webhook processed"}
        except ValueError as e:
            logging.error("Invalid timestamp format: %s", str(e))
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
            
        # Extract form fields
        fields = data["data"]["fields"]
        email = None
        phone = None
        name = None
        
        # Extract values from fields
        for field in fields:
            if field["type"] == EMAIL_TYPE_KEY:
                email = field["value"]
                logging.info("Found email: %s", email)
            elif field["type"] == PHONE_TYPE_KEY:
                phone = field["value"]
                logging.info("Found phone: %s", phone)
            elif field["label"] == NAME_LABEL:
                name = field["value"]
                logging.info("Found name: %s", name)
                
        if not email or not phone:
            logging.error("Missing required fields - email: %s, phone: %s", email, phone)
            raise HTTPException(status_code=400, detail="Missing required fields (email or phone)")
            
        # Check if user exists by phone
        user = await get_user_by_phone(phone)
        logging.info("User lookup result: %s", "Found" if user else "Not found")
        
        is_yc = name and "yc" in name.lower()
        
        # Update the name as only the first part of the name (e.g. "John from YC" -> "John")
        name = name.split()[0] if name else None
        
        if user:
            # Update existing user's name if provided
            if name:
                logging.info("Updating existing user %s with name: %s", user.id, name)
                await update_user(user.id, {"name": name, "is_yc": is_yc})
        else:
            # Create new user with phone, name, and email
            logging.info("Creating new user with phone: %s, name: %s, email: %s", phone, name, email)
            user = await create_user(phone, name=name, email=email, is_yc=is_yc)
            
        if is_yc:
            # Initiate call
            try:
                # Create first message that includes their name
                first_message = f"Hi {name.split()[0] if name else 'there'}! 👋 I'm Prim, and I'm excited to learn more about your healthcare needs and get you onboarded. I understand you're from YC - that's fantastic! Let's chat about how I can help you. Let's start with chatting about any existing health conditions you have."

                # Make the call
                call_id = await make_call(
                    to_phone=user.call_phone,
                    system_prompt=PRIM_ONBOARDING_CALL,
                    first_message=first_message
                )
                logging.info("Initiated onboarding call with ID: %s", call_id)
                
            except Exception as e:
                logging.error("Failed to initiate onboarding call: %s", str(e))
                
                # Send email to user
                await send_missed_call_email(email, name)
                # Continue with the webhook response even if VAPI fails
                return {"status": "ok", "message": "User created but VAPI integration failed"}
        else:
            # Send beta signup email to non-YC users
            try:
                await send_beta_signup_email(email, name)
                logging.info("Sent beta signup email to %s", email)
            except Exception as e:
                logging.error("Failed to send beta signup email: %s", str(e))
                # Continue with the webhook response even if email fails
                return {"status": "ok", "message": "User created but email failed"}
        
        logging.info("Successfully processed Tally webhook for user %s", user.id)
        return {"status": "ok", "message": "User processed successfully"}
        
    except Exception as e:
        logging.error("Error processing Tally webhook: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
