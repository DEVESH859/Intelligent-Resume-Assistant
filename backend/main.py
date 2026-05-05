import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from models import UploadResponse, ChatRequest, ChatResponse, AgentResponse, SessionInfo
from memory import store
from agent import run_agent
from tools.resume_parser import parse_resume_from_file, parse_resume_from_text

app = FastAPI(
    title="Intelligent Resume Assistant API",
    description="An agentic AI system for hallucination-free resume analysis and hiring queries.",
    version="1.0.0"
)

# CORS — allow all origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "Intelligent Resume Assistant API"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


@app.post("/upload", response_model=UploadResponse, tags=["Resume"])
async def upload_resume(
    file: UploadFile = File(None),
    text: str = Form(None),
    session_id: str = Form(None)
):
    """
    Upload a resume as a PDF/TXT file or paste raw text.
    Returns session_id and parsed structured resume data.
    """
    if not file and not text:
        raise HTTPException(status_code=400, detail="Either a file or text must be provided.")

    # Create or reuse session
    if session_id:
        session = store.get_or_create(session_id)
    else:
        session = store.create_session()

    # Parse resume
    try:
        if file:
            contents = await file.read()
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            resume_data = parse_resume_from_file(contents, file.filename or "resume.pdf")
        else:
            resume_data = parse_resume_from_text(text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

    # Store in session (reset history on new upload)
    session.resume = resume_data
    session.history = []

    # Return without the raw_text field (too large)
    display_resume = {k: v for k, v in resume_data.items() if k != "raw_text"}

    return UploadResponse(
        session_id=session.session_id,
        resume=display_resume,
        message="Resume parsed and stored successfully."
    )


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Send a hiring-related query about the uploaded resume.
    The agent routes to appropriate tools or LLM and returns a structured JSON response.
    """
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id is required.")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    session = store.get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a resume first to start a new session."
        )

    try:
        result = run_agent(request.message.strip(), session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    return ChatResponse(
        response=AgentResponse(**result),
        session_id=session.session_id
    )


@app.get("/session/{session_id}", response_model=SessionInfo, tags=["Session"])
async def get_session(session_id: str):
    """Retrieve current resume data and conversation history for a session."""
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    display_resume = {k: v for k, v in session.resume.items() if k != "raw_text"}
    return SessionInfo(
        session_id=session.session_id,
        resume=display_resume,
        history=session.history
    )


@app.delete("/session/{session_id}", tags=["Session"])
async def delete_session(session_id: str):
    """Clear a session (reset resume and chat history)."""
    deleted = store.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": "Session cleared.", "session_id": session_id}
