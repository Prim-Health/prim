from typing import Optional
import logging
from bson import ObjectId
from models.user import User
from db import users_collection
from datetime import datetime


def clean_phone_number(phone: str) -> str:
    """
    Clean phone number by removing 'whatsapp:' prefix if present.
    Args:
        phone: Phone number string that may include 'whatsapp:' prefix
    Returns:
        Cleaned phone number
    """
    return phone.replace("whatsapp:", "")


def normalize_phone_number(phone: str) -> str:
    """
    Normalize phone number by removing all non-digit characters and handling country code.
    Args:
        phone: Phone number string in any format (e.g. "+1-234-567-8900", "12345678900", "2345678900")
    Returns:
        Normalized 10-digit phone number
    """
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))

    # Handle country code (1 for US)
    if len(digits) == 11 and digits.startswith('1'):
        return digits[1:]
    return digits


async def get_user_by_phone(phone: str) -> Optional[User]:
    """
    Get user by phone number, handling various phone number formats.
    Args:
        phone: Phone number string in any format
    Returns:
        User object if found, None otherwise
    """
    normalized_phone = normalize_phone_number(phone)

    # Get all users and compare normalized phone numbers
    async for user_data in users_collection.find({}):
        # Normalize stored phone numbers
        stored_phone = normalize_phone_number(user_data.get('phone', ''))
        stored_call_phone = normalize_phone_number(
            user_data.get('call_phone', ''))

        # Check if either normalized phone matches
        if stored_phone == normalized_phone or stored_call_phone == normalized_phone:
            return User(**user_data)

    logging.warning(f"User not found for phone: {phone}")
    return None


async def create_user(phone: str, name: Optional[str] = None) -> User:
    clean_phone = clean_phone_number(phone)

    # Create user data dictionary explicitly
    user_data = {
        "phone": clean_phone,
        "name": name,
        "vapi_assistant_id": None,
        "onboarded": False,
        "created_at": datetime.utcnow()
    }

    logging.info("Creating user with data: %s", user_data)

    # Insert the user data directly
    result = await users_collection.insert_one(user_data)

    # Create User instance from the inserted data
    user = User(**user_data, id=result.inserted_id)

    # Verify the inserted document
    inserted_user = await users_collection.find_one({"_id": result.inserted_id})
    logging.info("Inserted user document: %s", inserted_user)

    return user


async def update_user_vapi_assistant(user_id: ObjectId, vapi_assistant_id: str) -> bool:
    result = await users_collection.update_one(
        {"_id": user_id},
        {
            "$set": {
                "vapi_assistant_id": vapi_assistant_id,
                "onboarded": True
            }
        }
    )
    return result.modified_count > 0


async def update_user(user_id: ObjectId, update_data: dict) -> bool:
    """
    Update user fields.
    Args:
        user_id: The user's ID
        update_data: Dictionary of fields to update
    Returns:
        True if update was successful
    """
    result = await users_collection.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    return result.modified_count > 0
