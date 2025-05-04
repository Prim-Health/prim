from typing import Dict, Any
from google.cloud import firestore
from database.interface import DatabaseInterface


class FirestoreDatabase(DatabaseInterface):
    def __init__(self):
        self.db = firestore.Client()

    def log_action(self, action_id: str, log: str) -> None:
        self.db.collection('actions').document(action_id).update({
            'logs': firestore.ArrayUnion([log])
        })

    def set_action_status(self, action_id: str, status: str) -> None:
        self.db.collection('actions').document(action_id).update({
            'status': status
        })

    def get_action(self, action_id: str) -> Dict[str, Any]:
        doc = self.db.collection('actions').document(action_id).get()
        if not doc.exists:
            raise ValueError(f"Action {action_id} not found")
        return doc.to_dict()

    def create_action(self, action_id: str, data: Dict[str, Any]) -> None:
        self.db.collection('actions').document(action_id).set(data)
