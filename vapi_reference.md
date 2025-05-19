# Vapi Integration Reference

This guide documents how to use **Vapi's API** and **Python Server SDK** for integrating voice assistants into your app. It focuses on Calls, Assistants, Webhooks, and Tools only.

_Last updated: 2025-05-12_

---

## 🔑 Authentication

Initialize the Vapi client using your API token:

```python
from vapi import Vapi

client = Vapi(token="YOUR_API_TOKEN")
```

For asynchronous operations:

```python
from vapi import AsyncVapi

client = AsyncVapi(token="YOUR_API_TOKEN")
```

---

## 📞 Calls

### Create a Call

```python
call = client.calls.create(
    to="+1234567890",
    assistant_id="assistant_abc123",
    webhook_url="https://yourdomain.com/vapi/webhook"
)
```

- **to**: Recipient's phone number.
- **assistant_id**: Assistant ID to use.
- **webhook_url**: Your webhook endpoint.

### List Calls

```python
calls = client.calls.list()
```

---

## 🧠 Assistants

### Create an Assistant

```python
assistant = client.assistants.create(
    name="SupportBot",
    first_message="Hello! How can I assist you today?",
    system_prompt="You are a helpful support assistant.",
    voice="en-US-Wavenet-D",
    transcriber="whisper",
    model="gpt-4o",
    tools=[...]
)
```

- **name**: Assistant name.
- **first_message**: Initial greeting.
- **system_prompt**: LLM behavioral context.
- **voice**: TTS voice.
- **transcriber**: STT model.
- **model**: LLM.
- **tools**: Optional list of tools.

---

## 🔧 Tools

Tools extend assistant capabilities to call external endpoints.

### Define a Tool

```python
tool = {
    "type": "function",
    "messages": [
        {"content": "Fetching data...", "type": "start"},
        {"content": "Done.", "type": "success"},
        {"content": "Error occurred.", "type": "error"}
    ],
    "function": {
        "name": "fetch_user_data",
        "parameters": {
            "user_id": {"type": "string", "description": "User ID"}
        },
        "description": "Retrieve user data"
    },
    "async": False,
    "server": {
        "url": "https://yourdomain.com/tools/fetch_user_data"
    }
}
```

---

## 📡 Webhooks

Receive call events or tool invocations.

### Flask Example

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/vapi/webhook', methods=['POST'])
def vapi_webhook():
    event = request.json
    # Process event
    return '', 200
```

Make sure this endpoint is public and matches the webhook URL in your call or assistant setup.

---

## 🧪 End-to-End Example

```python
from vapi import Vapi

client = Vapi(token="YOUR_API_TOKEN")

tool = {
    "type": "function",
    "messages": [
        {"content": "Processing request...", "type": "start"},
        {"content": "Request done.", "type": "success"},
        {"content": "Error.", "type": "error"}
    ],
    "function": {
        "name": "process_request",
        "parameters": {
            "request_id": {"type": "string", "description": "Request ID"}
        },
        "description": "Process a user request"
    },
    "async": False,
    "server": {
        "url": "https://yourdomain.com/tools/process_request"
    }
}

assistant = client.assistants.create(
    name="RequestBot",
    first_message="Hi! I'm here to help you process requests.",
    system_prompt="You are an efficient request assistant.",
    voice="en-US-Wavenet-D",
    transcriber="whisper",
    model="gpt-4o",
    tools=[tool]
)

call = client.calls.create(
    to="+1234567890",
    assistant_id=assistant["id"],
    webhook_url="https://yourdomain.com/vapi/webhook"
)
```

---

## 🔗 References

- API Docs: https://api.vapi.ai/api
- Python SDK: https://github.com/VapiAI/server-sdk-python
