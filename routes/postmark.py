import logging
from fastapi import APIRouter, HTTPException, Request
from services.user_service import get_user_by_email
from services.vapi_service import make_call
from services.prompts import PRIM_ONBOARDING_CALL
from config import get_settings
import json

router = APIRouter()
settings = get_settings()

@router.post("/postmark-webhook")
async def postmark_webhook(request: Request):
    """
    Handle incoming emails from Postmark.
    For YC users, initiate an onboarding call.
    For non-YC users, TODO: process their response to beta signup.
    """
    try:
        # Parse JSON data from Postmark webhook
        data = await request.json()
        logging.info("Received Postmark webhook data: %s", data)
        
        # Extract email details
        try:
            sender_email = data["From"]
            subject = data["Subject"]
            date = data["Date"]
            text_body = data["TextBody"]
            logging.info("Processing email from %s with subject: %s", sender_email, subject)
        except KeyError as e:
            logging.error("Missing required email fields: %s", str(e))
            raise HTTPException(status_code=400, detail="Invalid email format")
            
        # Check if sender is a user in our database
        user = await get_user_by_email(sender_email)
        if not user:
            logging.info("Email from unknown user %s, ignoring", sender_email)
            return {"status": "ok", "message": "Unknown sender"}
            
        # For YC users, initiate onboarding call
        if user.is_yc:
            logging.info("YC user %s responded to email, initiating call", user.id)
            try:
                # Create first message that includes their name
                first_message = f"Hi {user.name.split()[0] if user.name else 'there'}! 👋 I'm Prim, and I'm excited to learn more about your healthcare needs and get you onboarded. I understand you're from YC - that's fantastic! Let's chat about how I can help you. Let's start with chatting about any existing health conditions you have."

                # Make the call
                call_id = await make_call(
                    to_phone=user.call_phone,
                    system_prompt=PRIM_ONBOARDING_CALL,
                    first_message=first_message
                )
                logging.info("Initiated onboarding call with ID: %s", call_id)
                return {"status": "ok", "message": "Call initiated"}
                
            except Exception as e:
                logging.error("Failed to initiate call for YC user %s: %s", user.id, str(e))
                raise HTTPException(status_code=500, detail="Failed to initiate call")
        else:
            # TODO: Process non-YC user's response to beta signup
            logging.info("Non-YC user %s responded to beta signup email", user.id)
            return {"status": "ok", "message": "Response received, will process later"}
            
    except Exception as e:
        logging.error("Error processing Postmark webhook: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
