from typing import Optional
from bson import ObjectId
from models.base import User
from db import users_collection


def clean_phone_number(phone: str) -> str:
    """
    Clean phone number by removing 'whatsapp:' prefix if present.
    Args:
        phone: Phone number string that may include 'whatsapp:' prefix
    Returns:
        Cleaned phone number
    """
    return phone.replace("whatsapp:", "")


async def get_user_by_phone(phone: str) -> Optional[User]:
    clean_phone = clean_phone_number(phone)
    user_data = await users_collection.find_one({"phone": clean_phone})
    if user_data:
        return User(**user_data)
    return None


async def create_user(phone: str) -> User:
    clean_phone = clean_phone_number(phone)
    user = User(phone=clean_phone)
    result = await users_collection.insert_one(user.model_dump(by_alias=True))
    user.id = result.inserted_id
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
