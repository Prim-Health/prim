import logging
from fastapi import APIRouter, Form, HTTPException, Request
from services.user_service import get_user_by_phone, create_user
from services.whatsapp_service import send_whatsapp_message
from services.vapi_service import create_assistant, make_call
from config import get_settings
from models.whatsapp import TwilioWhatsAppWebhook

router = APIRouter()
settings = get_settings()

WELCOME_MESSAGE = "Hey {name}! Prim here. Great to hear from you. To get things started, can you message me your WhatsApp number and email?"
PRIM_NUMBER = "+15551478999"


@router.post("/whatsapp-webhook")
async def whatsapp_webhook(request: Request):
    """
    Handle incoming WhatsApp messages from Twilio.
    """
    try:
        # Parse form data from Twilio webhook
        form_data = await request.form()
        webhook = TwilioWhatsAppWebhook(**dict(form_data))

        # Skip messages from our own number
        if webhook.From == f"whatsapp:{PRIM_NUMBER.replace('+', '')}":
            logging.info("Ignoring message from our own number")
            return {"status": "ok"}

        # Log incoming message
        logging.info("Received WhatsApp message from %s: %s",
                     webhook.From, webhook.Body)

        # Get or create user
        user = await get_user_by_phone(webhook.From)
        if not user:
            logging.info("No user found, creating user for %s", webhook.From)
            user = await create_user(webhook.From)

            try:
                await send_whatsapp_message(
                    webhook.From,
                    WELCOME_MESSAGE.format(name=webhook.ProfileName.split()[
                                           0] if webhook.ProfileName else "there")
                )
                logging.info(
                    "Successfully sent welcome message to %s", webhook.From)
            except Exception as e:
                logging.error("Failed to send welcome message: %s", str(e))

            return {"status": "ok"}

        # Send response
        await send_whatsapp_message(webhook.From, "Thanks! I've got your info now. I'll give you a call now to get things started. No worries "
                                    + f"if you can't pick up, you can give me a call back anytime at {PRIM_NUMBER}")

        return {"status": "ok"}

    except Exception as e:
        logging.error("Error processing webhook: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
