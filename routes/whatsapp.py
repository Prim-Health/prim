import logging
from fastapi import APIRouter, Form, HTTPException, Request
from services.user_service import get_user_by_phone, create_user, update_user
from services.whatsapp_service import send_whatsapp_message
from services.vapi_service import create_assistant, make_call
from services.message_service import store_message, get_user_message_history, generate_response, generate_beta_response
from config import get_settings
from models.whatsapp import TwilioWhatsAppWebhook
import re
from openai import AsyncOpenAI
import phonenumbers
from email_validator import validate_email, EmailNotValidError

router = APIRouter()
settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)

WELCOME_MESSAGE = "Hi {name}! 👋 I'm Prim, and I'm super excited to meet you! ✨ I'm currently in a closed beta testing phase with a select group of users, so I can't help out just yet - but I'd absolutely love to stay connected with you until I'm ready to make your healthcare journey amazing! 🌟 Would you mind sharing your email address and best phone number so I can reach out once we open up to more users? 💫"
PRIM_NUMBER = "+16505407827"

ONBOARDING_PROMPT = """You are Prim, a bubbly and enthusiastic healthcare assistant! 🌟 You're currently in closed beta testing with a select group of users, but you're super excited to be connecting with a new potential user and can't wait to collect their email and phone number so you can reach out once you're ready to help them on their healthcare journey!

The user's name is {name}.
Recent conversation history:
{message_history}

Missing information: {missing_info}

Generate a very brief, upbeat response (max 1-2 sentences) that:
1. Warmly acknowledges their message with genuine enthusiasm
2. Cheerfully asks for the missing information, explaining with excitement:
   - Email: to stay connected and notify them when beta testing opens up! ✨
   - Phone: so you can reach out once you're ready to welcome more users! 📱
3. Makes them feel special and valued while being clear you're in closed beta

Keep it super friendly and natural, like chatting with a caring friend, but be transparent about being in testing! 💫"""


async def generate_onboarding_response(user_name: str, user_message: str, missing_info: list[str], message_history: list[dict]) -> str:
    """
    Generate a natural response for onboarding using OpenAI.
    """
    # Format message history for the prompt
    formatted_history = []
    for msg in message_history:
        formatted_history.append(f"{msg.sender}: {msg.text}")

    prompt = ONBOARDING_PROMPT.format(
        name=user_name,
        message_history="\n".join(formatted_history),
        missing_info=" and ".join(missing_info)
    )

    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are Prim, a friendly healthcare assistant. Keep responses very brief and natural."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=100,  # Reduced from 150 to encourage brevity
        temperature=0.7
    )

    return response.choices[0].message.content.strip()


def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def extract_phone_number(text: str) -> str | None:
    """
    Extract a valid phone number from text using PhoneNumberMatcher.
    Returns the number in E.164 format if found, None otherwise.
    """
    try:
        matches = phonenumbers.PhoneNumberMatcher(text, "US")
        for match in matches:
            number = match.raw_string
            parsed_number = phonenumbers.parse(number, "US")
            if phonenumbers.is_valid_number(parsed_number):
                return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
        return None
    except phonenumbers.NumberParseException as e:
        logging.error("Error parsing phone number: %s", e)
        return None


def extract_email(text: str) -> str | None:
    try:
        # Use email-validator's built-in email finding
        validation = validate_email(text, check_deliverability=False)
        return validation.normalized
    except EmailNotValidError:
        # If direct validation fails, try finding email in text
        try:
            # Split text by common delimiters and try each part
            parts = re.split(r'[\s,;]+', text)
            for part in parts:
                try:
                    validation = validate_email(
                        part, check_deliverability=False)
                    return validation.normalized
                except EmailNotValidError:
                    continue
        except Exception as e:
            logging.error(f"Error extracting email: {e}")
        return None


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
                    source="whatsapp",
                    sender="assistant"
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
                source="whatsapp",
                sender="user"
            )
            logging.info("Successfully stored message from %s", webhook.From)

            # Check if we need to collect email and call phone
            if not user.email or not user.call_phone:
                # Try to extract email and phone from the message
                message_text = webhook.Body.lower()
                email = extract_email(message_text)
                call_phone = extract_phone_number(message_text)

                # Update user if we found either email or phone
                if email or call_phone:
                    update_data = {}
                    data_updated = False
                    if email:
                        update_data['email'] = email
                        data_updated = True
                    if call_phone:
                        update_data['call_phone'] = call_phone
                        data_updated = True
                    if data_updated:
                        await update_user(user.id, update_data)
                        # Refresh user data
                        user = await get_user_by_phone(webhook.From)

                # If still missing either email or phone, ask for them
                if not user.email or not user.call_phone:
                    missing = []
                    if not user.email:
                        missing.append("email")
                    if not user.call_phone:
                        missing.append("phone number")

                    # Get user's first name or use "there" if not available
                    user_name = user.name.split()[0] if user.name else "there"

                    # Get message history for context
                    message_history = await get_user_message_history(user.id)

                    # Generate a natural response based on the user's message and history
                    response_text = await generate_onboarding_response(
                        user_name=user_name,
                        user_message=webhook.Body,
                        missing_info=missing,
                        message_history=message_history
                    )

                    await store_message(user_id=user.id, text=response_text, source="whatsapp", sender="assistant")
                    await send_whatsapp_message(webhook.From, response_text)
                    return {"status": "ok"}

            # TODO: beta not ready we'll reach out

            # If we have both email and phone, proceed with normal response generation
            message_history = await get_user_message_history(user.id)
            response_text = await generate_beta_response(message_history)

            # Store and send the response
            await store_message(
                user_id=user.id,
                text=response_text,
                source="whatsapp",
                sender="assistant"
            )
            await send_whatsapp_message(webhook.From, response_text)
            logging.info("Successfully sent response to %s", webhook.From)

        except (ValueError, ConnectionError) as e:
            logging.error("Failed to process message: %s", str(e))

        return {"status": "ok"}

    except Exception as e:
        logging.error("Error processing webhook: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
