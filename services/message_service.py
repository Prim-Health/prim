from typing import List, Optional
from bson import ObjectId
import openai
from models.base import Message
from db import messages_collection, qdrant_client, create_qdrant_collection
from config import get_settings

settings = get_settings()
openai.api_key = settings.openai_api_key


async def store_message(user_id: ObjectId, text: str, source: str) -> Message:
    # Get embedding from OpenAI
    embedding = await get_embedding(text)

    # Create message
    message = Message(
        user_id=user_id,
        text=text,
        embedding=embedding,
        source=source
    )

    # Store in MongoDB
    result = await messages_collection.insert_one(message.model_dump(by_alias=True))
    message.id = result.inserted_id

    # Store in Qdrant
    collection_name = f"user_{user_id}"
    await create_qdrant_collection(str(user_id))

    qdrant_client.upsert(
        collection_name=collection_name,
        points=[
            models.PointStruct(
                id=str(message.id),
                vector=embedding,
                payload={"text": text,
                         "timestamp": message.timestamp.isoformat()}
            )
        ]
    )

    return message


async def get_embedding(text: str) -> List[float]:
    response = await openai.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding


async def get_relevant_messages(user_id: ObjectId, query: str, limit: int = 5) -> List[Message]:
    # Get query embedding
    query_embedding = await get_embedding(query)

    # Search in Qdrant
    collection_name = f"user_{user_id}"
    search_result = qdrant_client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        limit=limit
    )

    # Get full messages from MongoDB
    message_ids = [ObjectId(point.id) for point in search_result]
    cursor = messages_collection.find({"_id": {"$in": message_ids}})
    messages = [Message(**doc) async for doc in cursor]

    # Sort by search score
    message_map = {str(msg.id): msg for msg in messages}
    return [message_map[point.id] for point in search_result if point.id in message_map]
