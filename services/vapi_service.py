import httpx
from config import get_settings

settings = get_settings()
VAPI_BASE_URL = "https://api.vapi.ai"

async def create_assistant(name: str) -> str:
    """
    Create a new VAPI assistant.
    Returns the assistant ID.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/assistant",
            headers={"Authorization": f"Bearer {settings.vapi_api_key}"},
            json={
                "name": name,
                "model": "gpt-4",
                "voice": "alloy",
                "transcriber": "whisper-1"
            }
        )
        response.raise_for_status()
        return response.json()["id"]

async def make_call(assistant_id: str, phone: str) -> str:
    """
    Initiate a call using VAPI.
    Returns the call ID.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/calls",
            headers={"Authorization": f"Bearer {settings.vapi_api_key}"},
            json={
                "assistant_id": assistant_id,
                "phone": phone,
                "metadata": {
                    "type": "onboarding" if not phone else "followup"
                }
            }
        )
        response.raise_for_status()
        return response.json()["id"]

async def get_call_transcript(call_id: str) -> str:
    """
    Get the transcript for a completed call.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/calls/{call_id}",
            headers={"Authorization": f"Bearer {settings.vapi_api_key}"}
        )
        response.raise_for_status()
        return response.json()["transcript"] 