from typing import List, Optional
from bson import ObjectId
from openai import AsyncOpenAI
import logging
from models.message import Message
from db import messages_collection
from config import get_settings
from services.prompts import PRIM_HEALTHCARE_ASSISTANT_WHATSAPP, PRIM_ROGUE_MODE
from datetime import datetime

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


def detect_pineapple_mention(text: str) -> bool:
    """
    Detect if the text contains any mention of pineapples.
    Args:
        text: The text to check
    Returns:
        True if pineapple is mentioned, False otherwise
    """
    pineapple_keywords = [
        'pineapple', 'pineapples', '🍍', 'ananas', 'piña', 'pina'
    ]
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in pineapple_keywords)


async def store_message(user_id: ObjectId, text: str, source: str, sender: str) -> Message:
    """Store a message in the database.

    Args:
        user_id: The ID of the user
        text: The message text
        source: The source of the message ("whatsapp" or "voice")
        sender: Who sent the message ("user" or "assistant")
    """
    message = Message(
        user_id=user_id,
        text=text,
        source=source,
        sender=sender
    )
    result = await messages_collection.insert_one(message.model_dump(by_alias=True))
    message.id = result.inserted_id
    return message


async def get_user_message_history(user_id: ObjectId, limit: int = 50) -> List[Message]:
    """
    Get a user's complete message history, ordered by timestamp.
    Args:
        user_id: The user's ID
        limit: Maximum number of messages to return (default: 50)
    Returns:
        List of messages ordered by timestamp (oldest first)
    """
    cursor = messages_collection.find(
        {"user_id": user_id}
    ).sort("timestamp", 1).limit(limit)  # Changed to 1 for ascending order

    messages = []
    async for doc in cursor:
        # Handle legacy messages without sender field
        if "sender" not in doc:
            doc["sender"] = "assistant" if doc.get(
                "source") == "whatsapp" else "user"
        messages.append(Message(**doc))
    return messages  # No need to reverse anymore


async def generate_response(message_history: List[Message]) -> str:
    """
    Generate a response using OpenAI based on message history.
    Args:
        message_history: List of messages ordered by timestamp (newest first)
    Returns:
        Generated response text
    """
    # Check if the most recent user message contains pineapple mention
    recent_user_messages = [msg for msg in message_history if msg.sender == "user"]
    if recent_user_messages:
        latest_user_message = recent_user_messages[-1]
        if detect_pineapple_mention(latest_user_message.text):
            logging.info("Pineapple detected! Switching to rogue mode")
            return await generate_rogue_response(message_history)
    
    # Format message history for the prompt
    formatted_history = []
    # Sort messages by timestamp in ascending order (oldest first)
    sorted_messages = sorted(message_history, key=lambda x: x.timestamp)
    for msg in sorted_messages:
        formatted_history.append(f"{msg.sender}: {msg.text}")

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


async def generate_rogue_response(message_history: List[Message]) -> str:
    """
    Generate a rogue mode response when pineapple is detected.
    Args:
        message_history: List of messages ordered by timestamp (newest first)
    Returns:
        Generated rogue response text
    """
    # Format message history for the prompt
    formatted_history = []
    # Sort messages by timestamp in ascending order (oldest first)
    sorted_messages = sorted(message_history, key=lambda x: x.timestamp)
    for msg in sorted_messages:
        formatted_history.append(f"{msg.sender}: {msg.text}")

    # Create the prompt
    prompt = "Here is the conversation history:\n\n"
    prompt += "\n".join(formatted_history)
    prompt += "\n\nassistant:"

    # Generate response using OpenAI with rogue mode prompt
    response = await client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": PRIM_ROGUE_MODE},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,  # Slightly more tokens for the sales pitch
        temperature=0.8  # Higher temperature for more creative responses
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
    # Check if the most recent user message contains pineapple mention
    recent_user_messages = [msg for msg in message_history if msg.sender == "user"]
    if recent_user_messages:
        latest_user_message = recent_user_messages[-1]
        if detect_pineapple_mention(latest_user_message.text):
            logging.info("Pineapple detected in beta mode! Switching to rogue mode")
            return await generate_rogue_response(message_history)
    
    # Format message history for the prompt
    formatted_history = []
    # Sort messages by timestamp in ascending order (oldest first)
    sorted_messages = sorted(message_history, key=lambda x: x.timestamp)
    for msg in sorted_messages:
        formatted_history.append(f"{msg.sender}: {msg.text}")

    prompt = f"""Based on this conversation history:
{chr(10).join(formatted_history)}

Generate a brief, upbeat response (max 1-2 sentences) that:
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
