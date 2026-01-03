"""
Resume Reactor - AI Rewriter Service
Generates improved resume content using NVIDIA NIM
"""
from typing import Dict, Any, Optional, List
from services.nvidia_client import generate_text


async def generate_rewrite(
    original_text: str,
    section: str,
    job_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate an improved version of resume text
    """
    jd_context = ""
    if job_description:
        jd_context = f"\nTarget Job Description:\n{job_description[:500]}\n"
    
    prompt = f"""You are an expert resume writer who specializes in ATS optimization.

Rewrite the following {section} section to be more impactful and ATS-friendly.
{jd_context}
ORIGINAL TEXT:
{original_text}

REQUIREMENTS:
1. Use strong action verbs (Led, Developed, Implemented, Achieved, etc.)
2. Include quantifiable results where possible
3. Incorporate relevant keywords naturally
4. Keep it concise but impactful
5. Maintain professional tone

Provide your response in this format:
REWRITTEN:
[Your improved text here]

IMPROVEMENTS:
- [List key improvements made]

KEYWORDS_ADDED:
[comma-separated list of keywords you added]"""

    response = await generate_text(prompt, max_tokens=600, temperature=0.7)
    
    # Parse response
    rewritten = extract_section(response, "REWRITTEN")
    improvements = extract_list(response, "IMPROVEMENTS")
    keywords = extract_keywords_list(response, "KEYWORDS_ADDED")
    
    return {
        "text": rewritten or original_text,
        "improvements": improvements,
        "keywords_added": keywords
    }


async def generate_bullet_points(
    experience_description: str,
    role: str,
    company: str,
    target_keywords: List[str] = None
) -> List[str]:
    """
    Generate ATS-optimized bullet points for a work experience
    """
    keywords_hint = ""
    if target_keywords:
        keywords_hint = f"\nTry to incorporate these keywords: {', '.join(target_keywords[:5])}"
    
    prompt = f"""Generate 4-5 impactful resume bullet points for this role:

Role: {role}
Company: {company}
Description: {experience_description}
{keywords_hint}

Requirements:
- Start each with a strong action verb
- Include metrics/numbers where possible
- Be concise (one line each)
- Make ATS-friendly

Format: Return ONLY the bullet points, one per line, starting with "•" """

    response = await generate_text(prompt, max_tokens=400, temperature=0.7)
    
    bullets = []
    for line in response.split('\n'):
        line = line.strip()
        if line.startswith('•') or line.startswith('-') or line.startswith('*'):
            bullets.append(line.lstrip('•-* '))
        elif line and len(bullets) < 5:
            bullets.append(line)
    
    return bullets[:5]


async def generate_summary(
    resume_text: str,
    target_role: str = "",
    years_experience: int = 0
) -> str:
    """
    Generate a professional summary for the resume
    """
    prompt = f"""Create a compelling professional summary for this resume:

{resume_text[:1500]}

Target Role: {target_role if target_role else "Not specified"}
Years of Experience: {years_experience if years_experience else "Auto-detect from resume"}

Requirements:
- 2-3 sentences maximum
- Highlight key skills and achievements
- Make it ATS-friendly with relevant keywords
- Professional but engaging tone

Return ONLY the summary text, nothing else."""

    response = await generate_text(prompt, max_tokens=200, temperature=0.7)
    return response.strip()


async def answer_clarifying_question(
    question: str,
    context: str,
    user_response: str
) -> Dict[str, Any]:
    """
    Process user's answer to a clarifying question and generate content
    """
    prompt = f"""Based on this clarification, generate improved resume content.

CONTEXT FROM RESUME:
{context}

QUESTION ASKED:
{question}

USER'S ANSWER:
{user_response}

Generate a professional resume bullet point or text that incorporates this information.
Format: Return ONLY the resume text, nothing else."""

    response = await generate_text(prompt, max_tokens=200, temperature=0.6)
    
    return {
        "generated_text": response.strip(),
        "source": "user_clarification"
    }


def extract_section(text: str, section_name: str) -> str:
    """Extract content after a section header"""
    import re
    pattern = rf"{section_name}:\s*\n?(.*?)(?=\n[A-Z_]+:|$)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""


def extract_list(text: str, section_name: str) -> List[str]:
    """Extract a bullet list from a section"""
    section = extract_section(text, section_name)
    items = []
    for line in section.split('\n'):
        line = line.strip().lstrip('-•* ')
        if line:
            items.append(line)
    return items


def extract_keywords_list(text: str, section_name: str) -> List[str]:
    """Extract comma-separated keywords"""
    section = extract_section(text, section_name)
    return [k.strip() for k in section.split(',') if k.strip()]
