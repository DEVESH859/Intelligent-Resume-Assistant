from dataclasses import dataclass, field
from typing import Optional
import uuid


@dataclass
class SessionData:
    session_id: str
    resume: dict = field(default_factory=dict)
    history: list[dict] = field(default_factory=list)

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})

    def has_resume(self) -> bool:
        return bool(self.resume)

    def get_context_messages(self) -> list[dict]:
        """Returns conversation history formatted for OpenAI chat API."""
        return [{"role": m["role"], "content": m["content"]} for m in self.history]


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, SessionData] = {}

    def create_session(self) -> SessionData:
        sid = str(uuid.uuid4())
        session = SessionData(session_id=sid)
        self._sessions[sid] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionData]:
        return self._sessions.get(session_id)

    def get_or_create(self, session_id: str) -> SessionData:
        if session_id not in self._sessions:
            session = SessionData(session_id=session_id)
            self._sessions[session_id] = session
        return self._sessions[session_id]

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def clear_all(self):
        self._sessions.clear()


# Global singleton store
store = SessionStore()
