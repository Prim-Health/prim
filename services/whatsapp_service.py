import logging
import httpx
from config import get_settings

TWILIO_API_URL = "https://api.twilio.com/2010-04-01/Accounts"


async def send_whatsapp_message(to: str, message: str) -> str:
    """
    Send a WhatsApp message using Twilio's API.
    Args:
        to: The recipient's phone number (should include 'whatsapp:' prefix)
        message: The message text to send
    Returns the message ID.
    """
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        logging.info("Sending WhatsApp message to %s: %s", to, message)
        try:
            url = f"{TWILIO_API_URL}/{settings.twilio_account_sid}/Messages.json"
            auth = (settings.twilio_account_sid, settings.twilio_auth_token)
            data = {
                "From": f"whatsapp:{settings.twilio_whatsapp_number}",
                "To": to,
                "Body": message
            }

            response = await client.post(url, auth=auth, data=data)
            response.raise_for_status()
            return response.json()["sid"]
        except httpx.HTTPStatusError as e:
            logging.error("Failed to send WhatsApp message: %s", str(e))
            logging.error("Response content: %s", e.response.text)
            raise
