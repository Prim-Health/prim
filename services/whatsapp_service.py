import logging
import httpx
from config import get_settings

WHATSAPP_API_URL = "https://graph.facebook.com/v22.0"
PHONE_NUMBER_ID = "578885681984115"  # Your WhatsApp Business Phone Number ID


async def send_whatsapp_message(to: str, message: str) -> str:
    """
    Send a WhatsApp message using Facebook Graph API.
    Args:
        to: The recipient's phone number
        message: The message text to send
    Returns the message ID.
    """
    # Get fresh settings each time
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        logging.info("Sending WhatsApp message to %s: %s", to, message)
        try:
            url = f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/messages"
            headers = {
                "Authorization": f"Bearer {settings.whatsapp_access_token}",
                "Content-Type": "application/json"
            }
            data = {
                "messaging_product": "whatsapp",
                "to": to.replace("+", ""),  # Remove + from phone number
                "type": "text",
                "text": {
                    "body": message
                }
            }

            # Debug logging
            logging.info("Using token: %s", settings.whatsapp_access_token)
            logging.info("Sending request to: %s", url)
            logging.info("With headers: %s", headers)
            logging.info("With data: %s", data)

            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()["messages"][0]["id"]
        except httpx.HTTPStatusError as e:
            logging.error("Failed to send WhatsApp message: %s", str(e))
            logging.error("Response content: %s", e.response.text)
            raise
