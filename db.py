from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings
import ssl
import tempfile
import os
import logging
import base64

settings = get_settings()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB setup with SSL/TLS support
try:
    if settings.ca_cert:
        logger.info("CA certificate found in settings")
        logger.info(f"Certificate content length: {len(settings.ca_cert)}")

        # Create a temporary file for the CA certificate
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_ca:
            # Try to decode if the certificate is base64 encoded
            try:
                # First try to decode as base64
                cert_content = base64.b64decode(
                    settings.ca_cert).decode('utf-8')
                logger.info("Successfully decoded base64 CA certificate")
            except Exception as decode_error:
                logger.info(
                    f"Base64 decode failed: {decode_error}, trying raw content")
                # If base64 decode fails, try using raw content
                cert_content = settings.ca_cert
                logger.info("Using raw CA certificate content")

            # Ensure the certificate content starts with the proper header
            if not cert_content.strip().startswith('-----BEGIN CERTIFICATE-----'):
                logger.error(
                    "Certificate content does not start with proper header")
                raise Exception("Invalid certificate format")

            # Write the certificate content
            temp_ca.write(cert_content)
            temp_ca.flush()  # Ensure content is written to disk
            temp_ca_path = temp_ca.name
            logger.info(
                f"Created temporary CA certificate file at {temp_ca_path}")

            # Verify the certificate file exists and has content
            if not os.path.exists(temp_ca_path):
                raise Exception("Temporary certificate file was not created")

            file_size = os.path.getsize(temp_ca_path)
            logger.info(f"Certificate file size: {file_size} bytes")

            if file_size == 0:
                raise Exception("Certificate file is empty")

            # Read back the content to verify
            with open(temp_ca_path, 'r') as f:
                content = f.read()
                logger.info(
                    f"Verified certificate content length: {len(content)}")
                if not content.strip().startswith('-----BEGIN CERTIFICATE-----'):
                    raise Exception("Certificate content verification failed")

        try:
            # Configure SSL context with the CA certificate
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_REQUIRED

            # Load the certificate with explicit error handling
            try:
                ssl_context.load_verify_locations(cafile=temp_ca_path)
                logger.info("Successfully configured SSL context")
            except ssl.SSLError as ssl_error:
                logger.error(f"SSL context configuration failed: {ssl_error}")
                raise

            client = AsyncIOMotorClient(
                settings.mongo_uri,
                tls=True,
                tlsInsecure=False,
                tlsCAFile=temp_ca_path,
                ssl_cert_reqs=ssl.CERT_REQUIRED
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
