import logging
from fastapi import FastAPI
from routes import whatsapp, vapi
from db import ensure_indexes

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Prim API")

# Include routers
app.include_router(whatsapp.router, prefix="/api/v1", tags=["whatsapp"])
app.include_router(vapi.router, prefix="/api/v1", tags=["vapi"])


@app.on_event("startup")
async def startup_event():
    # Ensure database indexes are created
    await ensure_indexes()


@app.get("/")
async def root():
    return {"status": "ok", "message": "Prim Backend is running"}
