from typing import List, Optional
from bson import ObjectId
from openai import AsyncOpenAI
from models.message import Message
from db import messages_collection
from config import get_settings
from services.prompts import PRIM_HEALTHCARE_ASSISTANT_WHATSAPP
from datetime import datetime

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


async def store_message(user_id: ObjectId, text: str, source: str = "whatsapp") -> Message:
    """Store a message in the database."""
    message = Message(
        user_id=user_id,
        text=text,
        source=source
    )
    result = await messages_collection.insert_one(message.model_dump(by_alias=True))
    message.id = result.inserted_id
    return message


async def get_user_messages(user_id: ObjectId, limit: int = 10) -> List[Message]:
    """Retrieve recent messages for a user."""
    cursor = messages_collection.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(limit)

    messages = [Message(**doc) async for doc in cursor]
    return list(reversed(messages))  # Return in chronological order


async def get_user_message_history(user_id: ObjectId, limit: int = 50) -> List[Message]:
    """
    Get a user's complete message history, ordered by timestamp.
    Args:
        user_id: The user's ID
        limit: Maximum number of messages to return (default: 50)
    Returns:
        List of messages ordered by timestamp (newest first)
    """
    cursor = messages_collection.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(limit)

    messages = [Message(**doc) async for doc in cursor]
    return messages


async def generate_response(message_history: List[Message]) -> str:
    """
    Generate a response using OpenAI based on message history.
    Args:
        message_history: List of messages ordered by timestamp (newest first)
    Returns:
        Generated response text
    """
    # Format message history for the prompt
    formatted_history = []
    # Sort messages by timestamp in ascending order (oldest first)
    sorted_messages = sorted(message_history, key=lambda x: x.timestamp)
    for msg in sorted_messages:
        role = "assistant" if msg.source == "whatsapp" else "user"
        formatted_history.append(f"{role}: {msg.text}")

    # Create the prompt
    prompt = "Here is the conversation history:\n\n"
    prompt += "\n".join(formatted_history)
    prompt += "\n\nassistant:"

    # Generate response using OpenAI
    response = await client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": PRIM_HEALTHCARE_ASSISTANT_WHATSAPP},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.7
    )

    return response.choices[0].message.content.strip()


async def generate_beta_response(message_history: List[Message]) -> str:
    """
    Generate a personalized response for users in beta using OpenAI.
    Args:
        message_history: List of messages ordered by timestamp (newest first)
    Returns:
        Generated response text
    """
    # Format message history for the prompt
    formatted_history = []
    # Sort messages by timestamp in ascending order (oldest first)
    sorted_messages = sorted(message_history, key=lambda x: x.timestamp)
    for msg in sorted_messages:
        role = "assistant" if msg.source == "whatsapp" else "user"
        formatted_history.append(f"{role}: {msg.text}")

    prompt = f"""Based on this conversation history:
{chr(10).join(formatted_history)}

Generate a brief, friendly response (2-3 sentences) that:
1. Acknowledges the user's interest and message
2. Explains that the beta is still under construction
3. Mentions that you'll reach out when ready to help with their healthcare
4. Keeps the tone warm and personal

Make it feel like a natural continuation of the conversation."""

    response = await client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": "You are Prim, a friendly healthcare assistant. Keep responses warm and personal."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.7
    )

    return response.choices[0].message.content.strip()
