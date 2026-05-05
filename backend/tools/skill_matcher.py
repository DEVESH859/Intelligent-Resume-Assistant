import re
from difflib import SequenceMatcher


def normalize(text: str) -> str:
    """Lowercase and strip punctuation for comparison."""
    return re.sub(r"[^a-z0-9\s]", "", text.lower()).strip()


def fuzzy_match(query: str, candidate: str, threshold: float = 0.75) -> bool:
    """Check if query fuzzy-matches candidate string."""
    q = normalize(query)
    c = normalize(candidate)
    # Exact substring check first
    if q in c or c in q:
        return True
    # Fuzzy ratio
    ratio = SequenceMatcher(None, q, c).ratio()
    return ratio >= threshold


def match_skill(skill_query: str, skills_list: list[str]) -> dict:
    """
    Check if a given skill query matches any skill in the skills list.
    Returns a dict with found status, matched skill, and confidence.
    """
    if not skills_list:
        return {
            "found": False,
            "matched_skill": None,
            "confidence": 0.0,
            "all_skills": []
        }

    query_normalized = normalize(skill_query)

    # Pass 1: Exact match
    for skill in skills_list:
        if normalize(skill) == query_normalized:
            return {
                "found": True,
                "matched_skill": skill,
                "confidence": 1.0,
                "all_skills": skills_list
            }

    # Pass 2: Substring match
    for skill in skills_list:
        skill_norm = normalize(skill)
        if query_normalized in skill_norm or skill_norm in query_normalized:
            return {
                "found": True,
                "matched_skill": skill,
                "confidence": 0.9,
                "all_skills": skills_list
            }

    # Pass 3: Fuzzy match
    best_ratio = 0.0
    best_skill = None
    for skill in skills_list:
        ratio = SequenceMatcher(None, query_normalized, normalize(skill)).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_skill = skill

    if best_ratio >= 0.75:
        return {
            "found": True,
            "matched_skill": best_skill,
            "confidence": round(best_ratio, 2),
            "all_skills": skills_list
        }

    return {
        "found": False,
        "matched_skill": None,
        "confidence": 0.0,
        "all_skills": skills_list
    }


def extract_skill_from_query(message: str) -> str:
    """Heuristically extract the skill name from a user query."""
    patterns = [
        r"(?:does? (?:the )?candidate have|has (?:the )?candidate|check(?:ing)? for?|is (?:the )?candidate (?:skilled|experienced|proficient) in|can (?:the )?candidate|does? (?:the )?resume (?:show|mention|have|list|include)|(?:has|have|knows?|knows?) (?:the )?candidate)\s+([a-z0-9\s\+\#\.]+?)(?:\s*(?:skill|experience|knowledge|proficiency|expertise))?[?.]?$",
        r"skill[:\s]+([a-z0-9\s\+\#\.]+)",
        r"([a-z0-9\s\+\#\.]+)\s+skill",
    ]
    # Remove surrounding quotes, punctuation, and whitespace
    message_lower = message.lower().strip(" '\"?!.")
    for pattern in patterns:
        match = re.search(pattern, message_lower)
        if match:
            extracted = match.group(1).strip()
            # Remove common filler words
            filler = ["any", "a", "the", "some", "this", "that"]
            for f in filler:
                extracted = re.sub(rf"^{f}\s+", "", extracted)
            return extracted.strip()

    # Fallback: strip question words and return remainder
    cleaned = re.sub(r"^(does|do|is|has|have|can|check|does the candidate have|is there|does the resume)\s+", "", message_lower)
    cleaned = re.sub(r"\s*(skill|experience|expertise|proficiency)\s*\??$", "", cleaned)
    return cleaned.strip()
