from pydantic import BaseModel, Field
from typing import Optional


class UploadResponse(BaseModel):
    session_id: str
    resume: dict
    message: str = "Resume parsed successfully"


class ChatRequest(BaseModel):
    session_id: str
    message: str


class AgentResponse(BaseModel):
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    source: str  # "resume" | "inference" | "tool"
    missing_data: list[str] = []


class ChatResponse(BaseModel):
    response: AgentResponse
    session_id: str


class SessionInfo(BaseModel):
    session_id: str
    resume: dict
    history: list[dict]
