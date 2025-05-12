import logging
from fastapi import FastAPI
from routes import whatsapp, vapi, tally
from db import ensure_indexes

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to see all logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create a logger for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

app = FastAPI(title="Prim API")

# Include routers
app.include_router(whatsapp.router, prefix="/api/v1", tags=["whatsapp"])
app.include_router(vapi.router, prefix="/api/v1", tags=["vapi"])
app.include_router(tally.router, prefix="/api/v1", tags=["tally"])


@app.on_event("startup")
async def startup_event():
    # Ensure database indexes are created
    await ensure_indexes()
    logger.info("Application started and database indexes created")


@app.get("/")
async def root():
    return {"status": "ok", "message": "Prim Backend is running"}
