from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import QdrantClient
from qdrant_client.http import models
from config import get_settings

settings = get_settings()

# MongoDB setup
mongo_client = AsyncIOMotorClient(settings.mongo_uri)
db = mongo_client.prim
users_collection = db.users
messages_collection = db.messages

# Qdrant setup
qdrant_client = QdrantClient(
    host=settings.qdrant_host,
    port=settings.qdrant_port
)


async def ensure_indexes():
    # Create indexes for MongoDB collections
    await users_collection.create_index("phone", unique=True)
    await messages_collection.create_index("user_id")
    await messages_collection.create_index("timestamp")


async def create_qdrant_collection(user_id: str):
    collection_name = f"user_{user_id}"
    try:
        qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=1536,  # OpenAI embedding dimension
                distance=models.Distance.COSINE
            )
        )
    except Exception:
        # Collection might already exist
        pass


async def delete_qdrant_collection(user_id: str):
    collection_name = f"user_{user_id}"
    try:
        qdrant_client.delete_collection(collection_name=collection_name)
    except Exception:
        # Collection might not exist
        pass
