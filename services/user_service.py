from typing import Optional
from bson import ObjectId
from models.base import User
from db import users_collection


async def get_user_by_phone(phone: str) -> Optional[User]:
    user_data = await users_collection.find_one({"phone": phone})
    if user_data:
        return User(**user_data)
    return None


async def create_user(phone: str) -> User:
    user = User(phone=phone)
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
