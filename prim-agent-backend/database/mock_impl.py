from datetime import datetime
import sys
from typing import Dict, Any
from database.interface import DatabaseInterface


class MockDatabase(DatabaseInterface):
    def __init__(self):
        self.db = {}

    def log_action(self, action_id: str, log: str) -> None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Action {action_id}: {log}", file=sys.stdout)
        if action_id in self.db:
            self.db[action_id].setdefault('logs', []).append(log)

    def set_action_status(self, action_id: str, status: str) -> None:
        if action_id not in self.db:
            self.db[action_id] = {"status": status, "logs": []}
        else:
            self.db[action_id]["status"] = status
        self.log_action(action_id, f"Status updated to: {status}")

    def get_action(self, action_id: str) -> Dict[str, Any]:
        if action_id not in self.db:
            raise ValueError(f"Action {action_id} not found")
        return self.db[action_id]

    def create_action(self, action_id: str, data: Dict[str, Any]) -> None:
        self.db[action_id] = data
