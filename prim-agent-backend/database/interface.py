from abc import ABC, abstractmethod
from typing import Dict, Any


class DatabaseInterface(ABC):
    @abstractmethod
    def log_action(self, action_id: str, log: str) -> None:
        pass

    @abstractmethod
    def set_action_status(self, action_id: str, status: str) -> None:
        pass

    @abstractmethod
    def get_action(self, action_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_action(self, action_id: str, data: Dict[str, Any]) -> None:
        pass
