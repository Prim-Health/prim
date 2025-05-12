# Prim

A FastAPI service that serves as both the webhook handler and execution engine for Prim. This service integrates with WhatsApp Business API, email, and VAPI through webhooks, and handles all background tasks that users task Prim with. It manages user data in MongoDB and utilizes Qdrant for storing embeddings for retrieval-augmented generation (RAG).

## Features

- **Webhook Integration**
  - WhatsApp messaging via WhatsApp Business API
  - Email service webhook handling
  - VAPI voice call webhook processing
  - Real-time event handling and response

- **Task Execution**
  - Background task management
  - Asynchronous task processing
  - Task scheduling and queuing
  - Error handling and retry mechanisms

- **Data Management**
  - User data storage in MongoDB
  - Vector storage in Qdrant for RAG
  - Message history tracking
  - Call transcript storage

## Tech Stack

- **Backend**: FastAPI
- **Database**: MongoDB
- **Vector Store**: Qdrant
- **Messaging**: WhatsApp Business API
- **Voice**: VAPI

## API Endpoints

### WhatsApp Integration

- **GET** `/whatsapp-webhook`
  - Verifies the WhatsApp Business API webhook
  - Required query parameters:
    - `hub.mode`
    - `hub.verify_token`
    - `hub.challenge`

- **POST** `/whatsapp-webhook`
  - Handles incoming WhatsApp messages
  - Creates new users if they don't exist
  - Stores messages in MongoDB
  - Sends welcome message for new users
  - Generates and sends responses via WhatsApp

### Tally Integration

- **POST** `/tally-webhook`
  - Handles incoming Tally form submissions
  - Required fields:
    - Email
    - Phone number
    - Name (optional)
  - Creates new users if they don't exist
  - Updates existing users' information
  - Initiates VAPI onboarding call
  - Form ID: `mDYYWq`

### VAPI Integration

- **POST** `/vapi-webhook`
  - Handles VAPI call events
  - Supported events:
    - `call_started`: Initializes new call
    - `transcript_updated`: Stores intermediate transcripts
    - `call_completed`: Stores final call transcript
  - Stores voice transcripts in MongoDB

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_ACCESS_TOKEN=your_access_token

# VAPI
VAPI_API_KEY=your_vapi_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# MongoDB Settings
MONGO_HOST=your_mongodb_host  # e.g., cluster0.xxxxx.mongodb.net for MongoDB Atlas
MONGO_PORT=27017
MONGO_USERNAME=your_mongodb_username
MONGO_PASSWORD=your_mongodb_password
MONGO_DATABASE=prim
MONGO_AUTH_SOURCE=admin

# Qdrant Settings
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

## Development

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up local databases:

   a. MongoDB:
   ```bash
   # Install MongoDB Community Edition
   # macOS (with Homebrew):
   brew tap mongodb/brew
   brew install mongodb-community

   # Start MongoDB service
   brew services start mongodb-community

   # Ubuntu:
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   ```

   b. Qdrant:
   ```bash
   # Option 1: Using Docker
   docker pull qdrant/qdrant
   docker run -p 6333:6333 -p 6334:6334 \
     -v $(pwd)/qdrant_storage:/qdrant/storage \
     qdrant/qdrant

   # Option 2: Direct installation
   # macOS (with Homebrew):
   brew install qdrant/qdrant/qdrant

   # Linux/Windows: Download from https://qdrant.tech/documentation/quick_start/
   # Then run:
   ./qdrant
   ```

4. Run the application:
   ```bash
   # Run FastAPI app on port 8000 (default ngrok port)
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Expose local server with ngrok:
   ```bash
   # Install ngrok if you haven't already
   # Download from https://ngrok.com/download

   # Start ngrok tunnel
   ngrok http 8000
   ```

   Copy the HTTPS URL provided by ngrok (e.g., `https://xxxx-xx-xx-xxx-xx.ngrok.io`).
   You'll need this URL to configure your WhatsApp webhook.
