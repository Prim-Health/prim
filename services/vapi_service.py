import httpx
import logging
from config import get_settings
from typing import Optional, Dict, Any

# Create a logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

settings = get_settings()
VAPI_BASE_URL = "https://api.vapi.ai"

async def make_call(
    to_phone: str,
    system_prompt: str,
    first_message: str,
    model: str = "gpt-4.1",
) -> str:
    """
    Initiate a call using VAPI with a temporary assistant.
    The assistant will be created for this specific call.
    Returns the call ID.
    """
    if not to_phone:
        raise ValueError("Phone number is required")

    # Format phone number for VAPI (ensure it has +1 prefix)
    formatted_phone = to_phone
    if not formatted_phone.startswith('+'):
        formatted_phone = '+' + formatted_phone
    if not formatted_phone.startswith('+1'):
        formatted_phone = '+1' + formatted_phone.lstrip('+')

    logging.info("Making VAPI call to %s (formatted from %s)", formatted_phone, to_phone)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{VAPI_BASE_URL}/call",
                headers={"Authorization": f"Bearer {settings.vapi_api_key}"},
                json={
                    "type": "outboundPhoneCall",
                    "customer": {
                        "number": formatted_phone,
                    },
                    "phoneNumberId": settings.vapi_phone_id,
                    "assistant": {
                        "model": {
                            "provider": "openai",
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system_prompt}
                            ]
                        },
                        "firstMessage": first_message,
                        "backgroundSound": "off",
                        "voice": {
                            "provider": "vapi",
                            "voiceId": "Lily"
                        },
                    },
                }
            )
            response.raise_for_status()
            return response.json()["id"]
    except httpx.HTTPError as e:
        error_detail = str(e)
        if isinstance(e, httpx.HTTPStatusError):
            error_detail = e.response.text
        logging.error("Error making VAPI call: %s", error_detail)
        raise
    except Exception as e:
        logging.error("Unexpected error making VAPI call: %s", str(e))
        raise
