import json
import os
import pdfplumber
import PyPDF2
from io import BytesIO
from groq import Groq
from prompts import EXTRACTION_PROMPT

_client: Groq | None = None

# Best Groq model for structured extraction (supports JSON mode)
GROQ_MODEL = "llama-3.3-70b-versatile"


def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in environment.")
        _client = Groq(api_key=api_key)
    return _client


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from PDF bytes using PyPDF2."""
    text = ""
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"Could not extract text from PDF: {e}")

    return text


def extract_structured_data(raw_text: str) -> dict:
    """Use Groq LLM to extract structured resume fields from raw text."""
    if not raw_text.strip():
        raise ValueError("Empty resume text provided.")

    client = get_client()
    prompt = EXTRACTION_PROMPT + raw_text[:8000]

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a precise resume data extractor. Return only valid JSON, no markdown fences, no extra text."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.0,
        response_format={"type": "json_object"},
        max_tokens=2048,
    )

    content = response.choices[0].message.content or "{}"
    structured = json.loads(content)
    structured["raw_text"] = raw_text
    return structured


def parse_resume_from_file(file_bytes: bytes, filename: str) -> dict:
    """Main entry: parse PDF or text file into structured resume data."""
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith(".txt"):
        raw_text = file_bytes.decode("utf-8", errors="replace")
    else:
        try:
            raw_text = file_bytes.decode("utf-8", errors="replace")
        except Exception:
            raise ValueError(f"Unsupported file type: {filename}")

    if not raw_text.strip():
        raise ValueError("No text could be extracted from the file. Please check the file and try again.")

    return extract_structured_data(raw_text)


def parse_resume_from_text(text: str) -> dict:
    """Parse resume from a plain text string."""
    if not text.strip():
        raise ValueError("Empty text provided.")
    return extract_structured_data(text)
