from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings
import ssl
import tempfile
import os
import logging

settings = get_settings()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB setup with SSL/TLS support
try:
    if settings.ca_cert:
        # Create a temporary file for the CA certificate
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_ca:
            temp_ca.write(settings.ca_cert)
            temp_ca_path = temp_ca.name
            logger.info(
                f"Created temporary CA certificate file at {temp_ca_path}")

        try:
            # Configure SSL context with the CA certificate
            ssl_context = ssl.create_default_context()
            ssl_context.load_verify_locations(cafile=temp_ca_path)

            client = AsyncIOMotorClient(
                settings.mongo_uri,
                tls=True,
                tlsInsecure=False,
                tlsCAFile=temp_ca_path
            )
            logger.info("Successfully connected to MongoDB with SSL")
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_ca_path)
                logger.info("Cleaned up temporary CA certificate file")
            except Exception as e:
                logger.warning(
                    f"Failed to clean up temporary CA certificate file: {e}")
    else:
        client = AsyncIOMotorClient(settings.mongo_uri)
        logger.info("Connected to MongoDB without SSL")

    db = client[settings.mongo_database]

    # Collections
    users_collection = db.users
    messages_collection = db.messages

except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise


async def ensure_indexes():
    try:
        # Create indexes for MongoDB collections
        await users_collection.create_index("phone", unique=True)
        await messages_collection.create_index("user_id")
        await messages_collection.create_index("timestamp")
        logger.info("Successfully created MongoDB indexes")
    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes: {e}")
        raise
