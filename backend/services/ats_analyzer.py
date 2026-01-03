"""
Resume Reactor - ATS Analyzer
Analyzes resumes for ATS compatibility and keyword matching
"""
import re
from typing import Dict, List, Any
from collections import Counter

from services.nvidia_client import generate_text
from config import ATS_WEIGHTS


async def analyze_ats_compatibility(
    resume_text: str,
    job_description: str
) -> Dict[str, Any]:
    """
    Analyze resume against job description for ATS compatibility.
    Returns score, matched/missing keywords, and improvement suggestions.
    """
    # Extract keywords from job description
    jd_keywords = await extract_keywords(job_description)
    
    # Find matches and gaps
    resume_lower = resume_text.lower()
    matched = []
    missing = []
    
    for keyword in jd_keywords:
        if keyword.lower() in resume_lower:
            matched.append(keyword)
        else:
            missing.append(keyword)
    
    # Calculate base score
    keyword_score = (len(matched) / max(len(jd_keywords), 1)) * 100
    
    # Analyze format compliance
    format_issues = analyze_format(resume_text)
    format_score = max(0, 100 - (len(format_issues) * 10))
    
    # Generate AI suggestions
    suggestions = await generate_suggestions(
        resume_text, 
        job_description, 
        missing
    )
    
    # Calculate weighted final score
    final_score = int(
        keyword_score * ATS_WEIGHTS["keyword_match"] +
        format_score * ATS_WEIGHTS["format_compliance"] +
        70 * ATS_WEIGHTS["experience_relevance"] +  # Placeholder
        (keyword_score * 0.8) * ATS_WEIGHTS["skills_coverage"]
    )
    
    return {
        "score": min(100, max(0, final_score)),
        "matched_keywords": matched,
        "missing_keywords": missing,
        "suggestions": suggestions,
        "format_issues": format_issues
    }


async def extract_keywords(job_description: str) -> List[str]:
    """
    Extract important keywords from job description using AI
    """
    prompt = f"""Extract the most important keywords and skills from this job description. 
Return ONLY a comma-separated list of keywords, nothing else.

Job Description:
{job_description[:2000]}

Keywords:"""

    response = await generate_text(prompt, max_tokens=300, temperature=0.3)
    
    # Parse keywords from response
    keywords = [k.strip() for k in response.split(',')]
    keywords = [k for k in keywords if k and len(k) > 1]
    
    # Add common technical keywords extraction as fallback
    technical_patterns = [
        r'\b(Python|JavaScript|React|Node\.js|AWS|Docker|SQL|Git)\b',
        r'\b(Machine Learning|Data Analysis|API|REST|MongoDB)\b',
        r'\b(Agile|Scrum|CI/CD|DevOps|Cloud)\b'
    ]
    
    for pattern in technical_patterns:
        matches = re.findall(pattern, job_description, re.IGNORECASE)
        keywords.extend(matches)
    
    # Deduplicate while preserving order
    seen = set()
    unique_keywords = []
    for k in keywords:
        k_lower = k.lower()
        if k_lower not in seen:
            seen.add(k_lower)
            unique_keywords.append(k)
    
    return unique_keywords[:30]  # Limit to top 30


def analyze_format(resume_text: str) -> List[str]:
    """
    Analyze resume format for ATS compatibility issues
    """
    issues = []
    
    # Check for common issues
    if not re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text):
        issues.append("No email address detected")
    
    if not re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text):
        issues.append("No phone number detected")
    
    if len(resume_text) < 500:
        issues.append("Resume content appears too short")
    
    if len(resume_text) > 10000:
        issues.append("Resume may be too long (consider 1-2 pages)")
    
    # Check for action verbs
    action_verbs = ['led', 'managed', 'developed', 'created', 'implemented', 
                    'achieved', 'improved', 'designed', 'built', 'delivered']
    has_action_verbs = any(verb in resume_text.lower() for verb in action_verbs)
    if not has_action_verbs:
        issues.append("Consider using more action verbs (led, managed, developed, etc.)")
    
    # Check for quantifiable achievements
    if not re.search(r'\d+%|\$\d+|\d+\+', resume_text):
        issues.append("Add quantifiable achievements (percentages, dollar amounts, numbers)")
    
    return issues


async def generate_suggestions(
    resume_text: str,
    job_description: str,
    missing_keywords: List[str]
) -> List[Dict[str, Any]]:
    """
    Generate improvement suggestions using AI
    """
    import json
    suggestions = []
    
    if missing_keywords:
        prompt = f"""You are an expert ATS resume optimizer. 

RESUME:
{resume_text[:2000]}

MISSING KEYWORDS that should be incorporated:
{', '.join(missing_keywords[:10])}

JOB DESCRIPTION:
{job_description[:1000]}

Generate 5 specific, actionable suggestions to improve this resume's ATS score.

Return ONLY a valid Python list of dictionaries with NO additional text. Each dictionary must have these exact keys:
- "section": the section to modify (e.g., "Experience", "Skills", "Summary")
- "original": the original text from the resume to replace (or empty string if adding new content)
- "suggested": the improved text with keywords naturally incorporated
- "improvement_type": one of "keyword_addition", "rewrite", or "format"

Example format:
[
    {{"section": "Skills", "original": "", "suggested": "Python, Machine Learning, Data Analysis", "improvement_type": "keyword_addition"}},
    {{"section": "Experience", "original": "Worked on projects", "suggested": "Led cross-functional team to deliver 5+ data-driven projects using Python and SQL", "improvement_type": "rewrite"}}
]

Return only the Python list, nothing else:"""

        response = await generate_text(prompt, max_tokens=1500, temperature=0.7)
        
        # Try to parse as Python/JSON list
        try:
            # Clean up the response - remove markdown code blocks if present
            cleaned = response.strip()
            if cleaned.startswith("```python"):
                cleaned = cleaned[9:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            # Parse as JSON
            parsed_suggestions = json.loads(cleaned)
            
            if isinstance(parsed_suggestions, list):
                for i, sug in enumerate(parsed_suggestions[:5]):
                    if isinstance(sug, dict) and sug.get("suggested"):
                        suggestions.append({
                            "id": f"sug_{i+1}_{hash(sug.get('suggested', '')) % 10000}",
                            "section": sug.get("section", "General"),
                            "original": sug.get("original", ""),
                            "suggested": sug.get("suggested", ""),
                            "improvement_type": sug.get("improvement_type", "rewrite").lower().replace(" ", "_"),
                            "impact_score": 0.9 - (i * 0.1)
                        })
        except (json.JSONDecodeError, Exception) as e:
            print(f"JSON parse error: {e}, falling back to text parsing")
            # Fallback to original text-based parsing
            suggestion_blocks = response.split('---')
            for i, block in enumerate(suggestion_blocks[:5]):
                section = extract_field(block, "section") or extract_field(block, "SECTION") or "General"
                original = extract_field(block, "original") or extract_field(block, "ORIGINAL") or ""
                suggested = extract_field(block, "suggested") or extract_field(block, "SUGGESTED") or ""
                imp_type = extract_field(block, "improvement_type") or extract_field(block, "TYPE") or "rewrite"
                
                if suggested and suggested.strip():
                    suggestions.append({
                        "id": f"sug_{i+1}_{hash(suggested) % 10000}",
                        "section": section,
                        "original": original if original != "N/A" else "",
                        "suggested": suggested,
                        "improvement_type": imp_type.lower().replace(" ", "_"),
                        "impact_score": 0.9 - (i * 0.1)
                    })
    
    return suggestions


def extract_field(text: str, field_name: str) -> str:
    """Helper to extract a field value from text"""
    pattern = rf"{field_name}:\s*(.+?)(?=\n[A-Za-z_]+:|$)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

