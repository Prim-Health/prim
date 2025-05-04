import os
from fastapi import FastAPI, BackgroundTasks, Request, HTTPException
from pydantic import BaseModel
import requests
# TODO: Change to FirestoreDatabase for production
from database import MockDatabase

app = FastAPI()

VAPI_API_KEY = os.getenv("VAPI_API_KEY")
PHONE_NUMBER_ID = "4fcc0c65-34bd-48c9-9d49-29ca3e6d9bcc"

# TODO: Change to FirestoreDatabase() for production
db = MockDatabase()


def execute_care_plan_call(context):
    try:
        response = requests.post(
            "https://api.vapi.ai/call",
            json={
                "phoneNumberId": PHONE_NUMBER_ID,
                "customer": {
                    "name": "Patient",
                    "number": context['patient_number']
                },
                "assistantId": "ac7ba464-5900-45a0-afca-b6c43753ef69"
            },
            headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
            timeout=60  # 60 second timeout to prevent hanging
        )
        response.raise_for_status()  # Check for HTTP errors
        return response
    except requests.exceptions.RequestException as e:
        error_msg = e.response.text if hasattr(e, 'response') else str(e)
        print(f"Error response: {error_msg}")
        db.set_action_status(context['action_id'], "failed")
        return {"status": "error", "message": "Failed to make VAPI call"}


def update_ehr_record(context):
    # TODO: Implement real EHR update for production
    return f"EHR updated for patient {context['patient_id']}"


def request_referral(context):
    # TODO: Implement real referral request for production
    return f"Referral request sent for patient {context['patient_id']}"


def request_medication(context):
    # TODO: Implement real medication request for production
    return f"Medication request sent for patient {context['patient_id']}"


def send_care_plan_material(context):
    # TODO: Implement real care plan material sending for production
    return f"Care plan and materials sent to patient {context['patient_id']}"


def escalate_urgent_note(context):
    # TODO: Implement real urgent note escalation for production
    return f"Urgent note escalated to PCP for patient {context['patient_id']}"


ACTION_HANDLERS = {
    "Care plan call": execute_care_plan_call,
    "Update EHR Patient Record": update_ehr_record,
    "Request referral from PCP": request_referral,
    "Request medication from PCP": request_medication,
    "Send patient care plan and edu material": send_care_plan_material,
    "Escalate urgent note to PCP": escalate_urgent_note
}


class ActionRequest(BaseModel):
    action_id: str


def process_action(action_id):
    try:
        context = db.get_action(action_id)
    except ValueError as e:
        db.log_action(action_id, str(e))
        return

    context['action_id'] = action_id
    action_type = context.get('action_type')

    if action_type not in ACTION_HANDLERS:
        db.log_action(action_id, f"Error: Unknown action type {action_type}")
        return

    db.set_action_status(action_id, "in progress")
    db.log_action(
        action_id, f"Processing started for action type: {action_type}")

    try:
        result = ACTION_HANDLERS[action_type](context)
        db.log_action(action_id, f"Success: {result}")
        db.set_action_status(action_id, "completed")
    except (requests.exceptions.RequestException, ValueError) as e:
        db.log_action(action_id, f"Error during execution: {str(e)}")
        db.set_action_status(action_id, "failed")


@app.post("/run-action")
def run_action(action: ActionRequest, background_tasks: BackgroundTasks):
    # TODO: Replace mock data with real patient data for production
    db.create_action(action.action_id, {
        "action_type": "Care plan call",  # Default action type for testing
        "patient_id": "test_patient_123",
        # Updated to include country code and proper format
        "patient_number": "+14049179922",
        "call_message": "This is a test call message",
        "status": "pending",
        "logs": []
    })

    background_tasks.add_task(process_action, action.action_id)
    return {"status": "accepted", "action_id": action.action_id}


@app.post("/vapi-webhook")
async def vapi_webhook(request: Request):
    data = await request.json()
    call_id = data.get('call_id')
    status = data.get('status')
    action_id = data.get('metadata', {}).get('action_id')

    if not action_id:
        raise HTTPException(
            status_code=400, detail="Missing action_id in metadata")

    db.log_action(
        action_id, f"VAPI webhook update for call {call_id}: {status}")
    return {"status": "logged"}
