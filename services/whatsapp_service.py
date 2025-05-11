import logging
import httpx
from config import get_settings

settings = get_settings()
WHATSAPP_API_URL = "https://graph.facebook.com/v22.0"

async def send_whatsapp_message(to: str, template_name: str = "hello_world") -> str:
    """
    Send a WhatsApp message using Facebook Graph API.
    Returns the message ID.
    """
    async with httpx.AsyncClient() as client:
        logging.info("Sending WhatsApp message to %s with template %s", to, template_name)
        try:
            response = await client.post(
                f"{WHATSAPP_API_URL}/578885681984115/messages",
                headers={
                    "Authorization": f"Bearer {settings.whatsapp_access_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": to.replace("+", ""),  # Remove + from phone number
                    "type": "text",  # Changed from template to text for testing
                    "text": {
                        "body": "Hey there! Prim here (: Thanks for reaching out. I'll give you a quick call to get started."
                    }
                }
            )
            response.raise_for_status()
            return response.json()["messages"][0]["id"]
        except httpx.HTTPError as e:
            logging.error("Failed to send WhatsApp message: %s", str(e))
            if hasattr(e, 'response') and e.response is not None:
                logging.error("Response content: %s", e.response.text)
            raise
