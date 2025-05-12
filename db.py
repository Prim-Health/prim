from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings
import ssl
import tempfile
import os

settings = get_settings()

# MongoDB setup with SSL/TLS support
if settings.ca_cert:
    # Create a temporary file for the CA certificate
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_ca:
        temp_ca.write(settings.ca_cert)
        temp_ca_path = temp_ca.name

    # Configure SSL context with the CA certificate
    ssl_context = ssl.create_default_context(cafile=temp_ca_path)
    client = AsyncIOMotorClient(
        settings.mongo_uri, tls=True, tlsInsecure=False, tlsCAFile=temp_ca_path)

    # Clean up the temporary file
    os.unlink(temp_ca_path)
else:
    client = AsyncIOMotorClient(settings.mongo_uri)

db = client[settings.mongo_database]

# Collections
users_collection = db.users
messages_collection = db.messages


async def ensure_indexes():
    # Create indexes for MongoDB collections
    await users_collection.create_index("phone", unique=True)
    await messages_collection.create_index("user_id")
    await messages_collection.create_index("timestamp")
