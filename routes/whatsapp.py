import logging
from fastapi import APIRouter, Form, HTTPException, Request
from services.user_service import get_user_by_phone, create_user
from services.whatsapp_service import send_whatsapp_message
from services.vapi_service import create_assistant, make_call
from services.message_service import store_message, get_user_message_history, generate_response
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
        form_dict = dict(form_data)

        # Log the incoming webhook data for debugging
        logging.info("Received webhook data: %s", form_dict)

        # Check if this is a Twilio webhook
        if not all(key in form_dict for key in ['MessageSid', 'SmsStatus', 'Body', 'From', 'To']):
            logging.error("Missing required Twilio webhook fields. Received fields: %s", list(
                form_dict.keys()))
            return {"status": "error", "message": "Invalid webhook format"}

        webhook = TwilioWhatsAppWebhook(**form_dict)

        # Skip messages from our own number
        if webhook.From == f"whatsapp:{PRIM_NUMBER.replace('+', '')}":
            logging.info("Ignoring message from our own number")
            return {"status": "ok"}

        # Log incoming message
        logging.info("Received WhatsApp message from %s: %s",
                     webhook.From, webhook.Body)

        # Get or create user if user does not exist
        user = await get_user_by_phone(webhook.From)
        if not user:
            logging.info("No user found, creating user for %s", webhook.From)
            # Extract name from ProfileName, defaulting to None if not present
            name = webhook.ProfileName if webhook.ProfileName else None
            logging.info("Creating user with name: %s", name)
            user = await create_user(webhook.From, name=name)

            try:
                welcome_message = WELCOME_MESSAGE.format(
                    name=webhook.ProfileName.split(
                    )[0] if webhook.ProfileName else "there"
                )
                # Store the welcome message first
                await store_message(
                    user_id=user.id,
                    text=welcome_message,
                    source="whatsapp"
                )
                # Then send it
                await send_whatsapp_message(webhook.From, welcome_message)
                logging.info(
                    "Successfully sent welcome message to %s", webhook.From)
            except Exception as e:
                logging.error("Failed to send welcome message: %s", str(e))

            return {"status": "ok"}

        try:
            # Store the incoming message
            await store_message(
                user_id=user.id,
                text=webhook.Body,
                source="whatsapp"
            )
            logging.info("Successfully stored message from %s", webhook.From)

            # Get message history for user and generate response
            message_history = await get_user_message_history(user.id)
            response_text = await generate_response(message_history)

            # Store and send the response
            await store_message(
                user_id=user.id,
                text=response_text,
                source="whatsapp"
            )
            await send_whatsapp_message(webhook.From, response_text)
            logging.info("Successfully sent response to %s", webhook.From)

        except (ValueError, ConnectionError) as e:
            logging.error("Failed to process message: %s", str(e))

        return {"status": "ok"}

    except Exception as e:
        logging.error("Error processing webhook: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
