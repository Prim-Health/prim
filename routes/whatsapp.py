import logging
from fastapi import APIRouter, Form, HTTPException, Request, Query, Body
from services.user_service import get_user_by_phone, create_user, update_user_vapi_assistant
from services.message_service import store_message, get_relevant_messages
from services.whatsapp_service import send_whatsapp_message
from services.vapi_service import create_assistant, make_call
from config import get_settings
from models.whatsapp import WhatsAppWebhook

router = APIRouter()
settings = get_settings()

WELCOME_MESSAGE = "Hey {name}! Prim here. Great to hear from you. To get things started, can you message me your WhatsApp number and email?"
PRIM_NUMBER = "+15551478999"


@router.get("/whatsapp-webhook")
async def verify_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
    hub_challenge: str = Query(..., alias="hub.challenge")
):
    """
    Verify the WhatsApp Business API webhook.
    This endpoint is called by WhatsApp when setting up the webhook.
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Invalid verification token")


@router.post("/whatsapp-webhook")
async def whatsapp_webhook(webhook: WhatsAppWebhook):
    """
    Handle incoming WhatsApp messages.
    """
    logging.info("Received WhatsApp webhook: %s", webhook)

    if webhook.object != "whatsapp_business_account":
        logging.info("Received WhatsApp webhook with object: %s",
                     webhook.object)
        return {"status": "ignored"}

    for entry in webhook.entry:
        for change in entry.get("changes", []):
            if change.get("field") != "messages":
                logging.info(
                    "Did not get messages, received WhatsApp webhook with field: %s", change.get("field"))
                continue

            value = change.get("value", {})
            for message in value.get("messages", []):
                if message.get("type") != "text":
                    continue

                from_number = message.get("from")
                message_body = message.get("text", {}).get("body")

                if not from_number or not message_body:
                    continue

                # Skip messages from our own number
                if from_number == "15551478999":
                    logging.info("Ignoring message from our own number")
                    continue

                # Log incoming message
                logging.info("Received WhatsApp message from %s: %s",
                             from_number, message_body)

                # Get or create user
                user = await get_user_by_phone(from_number)
                if not user:
                    logging.info(
                        "No user found, creating user for %s", from_number)
                    user = await create_user(from_number)

                    # Get user's name from WhatsApp contact info
                    user_name = "there"  # Default name if not available
                    for contact in value.get("contacts", []):
                        if contact.get("wa_id") == from_number:
                            user_name = contact.get(
                                "profile", {}).get("name", "there")
                            break

                    try:
                        await send_whatsapp_message(
                            from_number,
                            WELCOME_MESSAGE.format(name=user_name.split()[0])
                        )
                        logging.info(
                            "Successfully sent welcome message to %s", from_number)
                    except Exception as e:
                        logging.error(
                            "Failed to send welcome message: %s", str(e))
                        # Continue processing even if welcome message fails

                    return {"status": "ok"}

                # Store message
                # await store_message(user.id, message_body, "whatsapp")

                # Get relevant context
                # relevant_messages = await get_relevant_messages(user.id, message_body)
                # context = "\n".join([msg.text for msg in relevant_messages])

                # # TODO: Generate response using context
                # response = "I understand your message. How can I help you further?"

                # # Send response
                await send_whatsapp_message(from_number, "Thanks! I've got your info now. I'll give you a call now to get things started. No worries "
                                            + f"if you can't pick up, you can give me a call back anytime at {PRIM_NUMBER}")

    return {"status": "ok"}
