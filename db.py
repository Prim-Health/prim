from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings
import ssl
import tempfile
import os
import logging
import base64
import subprocess

settings = get_settings()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB setup with SSL/TLS support
try:
    if settings.ca_cert:
        logger.info("CA certificate found in settings")

        # For Digital Ocean managed databases, we should use the system's CA certificates
        cert_path = "/etc/ssl/certs/ca-certificates.crt"
        if os.path.exists(cert_path):
            logger.info(f"Using system CA certificates from {cert_path}")

            # Configure MongoDB client with system CA certificates
            client = AsyncIOMotorClient(
                settings.mongo_uri,
                tls=True,
                tlsAllowInvalidCertificates=False,
                tlsCAFile=cert_path
            )
            logger.info(
                "Successfully connected to MongoDB with system CA certificates")
        else:
            logger.warning(
                "System CA certificates not found, attempting to use provided certificate")
            # Fallback to using the provided certificate
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_ca:
                try:
                    # Try to decode if the certificate is base64 encoded
                    try:
                        cert_content = base64.b64decode(
                            settings.ca_cert).decode('utf-8')
                        logger.info(
                            "Successfully decoded base64 CA certificate")
                    except Exception as decode_error:
                        logger.info(
                            f"Base64 decode failed: {decode_error}, trying raw content")
                        cert_content = settings.ca_cert
                        logger.info("Using raw CA certificate content")

                    # Write the certificate content
                    temp_ca.write(cert_content)
                    temp_ca.flush()
                    temp_ca_path = temp_ca.name
                    logger.info(
                        f"Created temporary CA certificate file at {temp_ca_path}")

                    # Configure MongoDB client
                    client = AsyncIOMotorClient(
                        settings.mongo_uri,
                        tls=True,
                        tlsAllowInvalidCertificates=False,
                        tlsCAFile=temp_ca_path
                    )
                    logger.info(
                        "Successfully connected to MongoDB with provided certificate")
                finally:
                    # Clean up the temporary file
                    try:
                        os.unlink(temp_ca_path)
                        logger.info("Cleaned up temporary CA certificate file")
                    except Exception as e:
                        logger.warning(
                            f"Failed to clean up temporary CA certificate file: {e}")
    else:
        logger.info("No CA certificate found, connecting without SSL")
        client = AsyncIOMotorClient(settings.mongo_uri)
        logger.info("Connected to MongoDB without SSL")

    db = client[settings.mongo_database]
    logger.info(f"Connected to database: {settings.mongo_database}")

    # Collections
    users_collection = db.users
    messages_collection = db.messages
    logger.info("Successfully initialized database collections")

except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    logger.error(f"Error type: {type(e)}")
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
