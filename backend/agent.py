import json
import os
import re
from groq import Groq
from memory import SessionData
from prompts import SYSTEM_PROMPT
from tools.skill_matcher import match_skill, extract_skill_from_query

_client: Groq | None = None

# Use a fast, capable model that supports JSON mode
GROQ_MODEL = "llama-3.3-70b-versatile"


def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in environment.")
        _client = Groq(api_key=api_key)
    return _client


# ── Intent Detection ───────────────────────────────────────────────────────

SKILL_INTENT_PATTERNS = [
    r"\b(does|do|has|have|can)\b.{0,30}\b(skill|skills|experience|know|knows|familiar|proficient|expertise)\b",
    r"\bcheck\b.{0,20}\bskill\b",
    r"\bskill\s*[\:\-]?\s*\w+",
    r"\b(is|are)\s+(the\s+)?(candidate|they|he|she)\s+(skilled|experienced|proficient)\s+in\b",
    r"\b(python|java|react|node|sql|aws|docker|kubernetes|ml|ai|machine learning|deep learning|excel|typescript|c\+\+|c#|golang|ruby|rust|swift|kotlin|flutter|angular|vue|tensorflow|pytorch)\b",
]

ROLE_EVAL_PATTERNS = [
    r"\b(evaluate|assess|suitable|fit|qualify|qualified|good for|apply for|match)\b.{0,40}\b(role|position|job|engineer|developer|scientist|analyst|manager|designer)\b",
    r"\b(senior|junior|lead|principal)\b.{0,30}\b(engineer|developer|scientist|analyst|manager)\b",
]


def detect_intent(message: str) -> str:
    msg_lower = message.lower()
    for pattern in SKILL_INTENT_PATTERNS:
        if re.search(pattern, msg_lower):
            return "skill_check"
    for pattern in ROLE_EVAL_PATTERNS:
        if re.search(pattern, msg_lower):
            return "role_eval"
    return "general"


# ── Resume Context Builder ──────────────────────────────────────────────────

def build_resume_context(resume: dict) -> str:
    parts = []
    if resume.get("name"):
        parts.append(f"Name: {resume['name']}")
    if resume.get("email"):
        parts.append(f"Email: {resume['email']}")
    if resume.get("phone"):
        parts.append(f"Phone: {resume['phone']}")
    if resume.get("location"):
        parts.append(f"Location: {resume['location']}")
    if resume.get("links"):
        parts.append(f"Links: {', '.join(resume['links'])}")
    if resume.get("summary"):
        parts.append(f"Professional Summary: {resume['summary']}")

    skills = resume.get("skills", [])
    parts.append(f"Skills: {', '.join(skills)}" if skills else "Skills: Not mentioned")

    experience = resume.get("experience", [])
    if experience:
        parts.append("Experience:")
        for exp in experience:
            entry = f"  - {exp.get('title', 'Unknown')} at {exp.get('company', 'Unknown')}"
            if exp.get("duration"):
                entry += f" ({exp['duration']})"
            if exp.get("description"):
                entry += f": {exp['description']}"
            parts.append(entry)
    else:
        parts.append("Experience: Not mentioned")

    education = resume.get("education", [])
    if education:
        parts.append("Education:")
        for edu in education:
            entry = f"  - {edu.get('degree', 'Unknown')} from {edu.get('institution', 'Unknown')}"
            if edu.get("year"):
                entry += f" ({edu['year']})"
            parts.append(entry)
    else:
        parts.append("Education: Not mentioned")

    projects = resume.get("projects", [])
    if projects:
        parts.append("Projects:")
        for proj in projects:
            entry = f"  - {proj.get('name', 'Unknown')}"
            if proj.get("date"):
                entry += f" ({proj.get('date')})"
            if proj.get("description"):
                entry += f": {proj.get('description')}"
            parts.append(entry)

    achievements = resume.get("achievements", [])
    if achievements:
        parts.append("Achievements/Awards:")
        for ach in achievements:
            parts.append(f"  - {ach}")

    certifications = resume.get("certifications", [])
    if certifications:
        parts.append("Certifications:")
        for cert in certifications:
            parts.append(f"  - {cert}")

    languages = resume.get("languages", [])
    if languages:
        parts.append(f"Languages: {', '.join(languages)}")

    return "\n".join(parts)


# ── Tool Handler: Skill Check ───────────────────────────────────────────────

def handle_skill_check(message: str, resume: dict) -> dict:
    """No LLM — pure deterministic skill matching."""
    skill_query = extract_skill_from_query(message)
    skills_list = resume.get("skills", [])
    result = match_skill(skill_query, skills_list)

    if result["found"]:
        return {
            "answer": f"Yes, the candidate has '{result['matched_skill']}' listed as a skill.",
            "confidence": result["confidence"],
            "source": "tool",
            "missing_data": [],
        }
    else:
        if not skills_list:
            return {
                "answer": "Not mentioned in resume — no skills section was found.",
                "confidence": 0.0,
                "source": "tool",
                "missing_data": ["skills"],
            }
        return {
            "answer": (
                f"No, '{skill_query}' is not found in the candidate's listed skills. "
                f"Listed skills: {', '.join(skills_list)}."
            ),
            "confidence": 0.95,
            "source": "tool",
            "missing_data": [],
        }


# ── Tool Handler: LLM Query via Groq ───────────────────────────────────────

def handle_llm_query(message: str, resume: dict, session: SessionData, intent: str) -> dict:
    """Route to Groq LLM with full resume context + conversation history."""
    resume_context = build_resume_context(resume)

    if intent == "role_eval":
        user_content = (
            f"CANDIDATE RESUME DATA:\n{resume_context}\n\n"
            f"EVALUATION REQUEST: {message}\n\n"
            "Evaluate strictly based on the resume data above. Note any gaps or missing qualifications."
        )
    else:
        user_content = (
            f"CANDIDATE RESUME DATA:\n{resume_context}\n\n"
            f"USER QUESTION: {message}"
        )

    # Build OpenAI-compatible messages: system + history + current
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    recent_history = session.history[-10:] if len(session.history) > 10 else session.history
    for h in recent_history:
        messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": user_content})

    client = get_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.2,
        response_format={"type": "json_object"},
        max_tokens=800,
    )

    content = response.choices[0].message.content or "{}"
    print("\n--- GROQ RAW OUTPUT ---")
    print(content)
    print("-----------------------\n")

    try:
        parsed = json.loads(content)
        # Handle cases where model uses a different key for the answer
        answer = parsed.get("answer") or parsed.get("evaluation") or parsed.get("response") or "Unable to generate response."
        
        return {
            "answer": answer,
            "confidence": float(parsed.get("confidence", 0.5)),
            "source": parsed.get("source", "inference"),
            "missing_data": parsed.get("missing_data", []),
        }
    except (json.JSONDecodeError, ValueError) as e:
        print("JSON Parse Error:", e)
        return {
            "answer": content,
            "confidence": 0.5,
            "source": "inference",
            "missing_data": [],
        }


# ── Main Agent Entry Point ──────────────────────────────────────────────────

def run_agent(message: str, session: SessionData) -> dict:
    resume = session.resume

    if not resume:
        return {
            "answer": "No resume has been uploaded yet. Please upload a resume first.",
            "confidence": 1.0,
            "source": "resume",
            "missing_data": ["resume"],
        }

    intent = detect_intent(message)

    if intent == "skill_check":
        result = handle_skill_check(message, resume)
    else:
        result = handle_llm_query(message, resume, session, intent)

    session.add_message("user", message)
    session.add_message("assistant", json.dumps(result))

    return result
