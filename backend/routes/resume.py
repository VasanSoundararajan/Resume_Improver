"""
Resume Reactor - Resume API Routes
Handles file upload, analysis, rewriting, and export
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import aiofiles

from config import MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS, TEMP_DIR

router = APIRouter()


# Request/Response Models
class AnalyzeRequest(BaseModel):
    resume_id: str
    job_description: str


class RewriteRequest(BaseModel):
    resume_id: str
    section: str
    original_text: str
    job_description: Optional[str] = None


class SuggestionResponse(BaseModel):
    id: str
    section: str
    original: str
    suggested: str
    improvement_type: str
    impact_score: float


class AnalysisResponse(BaseModel):
    resume_id: str
    ats_score: int
    keyword_matches: List[str]
    missing_keywords: List[str]
    suggestions: List[SuggestionResponse]
    format_issues: List[str]


class ResumeContent(BaseModel):
    resume_id: str
    filename: str
    text_content: str
    sections: dict
    images_detected: int


# In-memory storage (would use database in production)
resume_storage = {}


@router.post("/upload", response_model=ResumeContent)
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume file (PDF or DOCX)
    Returns extracted text content and metadata
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE_MB}MB"
        )
    
    # Generate unique ID and save file
    resume_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{resume_id}{file_ext}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    # Parse the resume
    from parsers.pdf_parser import parse_pdf
    from parsers.docx_parser import parse_docx
    
    if file_ext == ".pdf":
        parsed = parse_pdf(file_path)
    else:
        parsed = parse_docx(file_path)
    
    # Store in memory
    resume_storage[resume_id] = {
        "file_path": file_path,
        "filename": file.filename,
        "parsed": parsed
    }
    
    return ResumeContent(
        resume_id=resume_id,
        filename=file.filename,
        text_content=parsed["text"],
        sections=parsed["sections"],
        images_detected=parsed["images_count"]
    )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(request: AnalyzeRequest):
    """
    Analyze resume against a job description
    Returns ATS score and improvement suggestions
    """
    if request.resume_id not in resume_storage:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume_data = resume_storage[request.resume_id]
    
    from services.ats_analyzer import analyze_ats_compatibility
    
    analysis = await analyze_ats_compatibility(
        resume_text=resume_data["parsed"]["text"],
        job_description=request.job_description
    )
    
    return AnalysisResponse(
        resume_id=request.resume_id,
        ats_score=analysis["score"],
        keyword_matches=analysis["matched_keywords"],
        missing_keywords=analysis["missing_keywords"],
        suggestions=analysis["suggestions"],
        format_issues=analysis["format_issues"]
    )


@router.post("/rewrite")
async def rewrite_section(request: RewriteRequest):
    """
    Get AI-powered rewrite suggestions for a resume section
    """
    from services.ai_rewriter import generate_rewrite
    
    rewritten = await generate_rewrite(
        original_text=request.original_text,
        section=request.section,
        job_description=request.job_description
    )
    
    return {
        "original": request.original_text,
        "suggested": rewritten["text"],
        "improvements": rewritten["improvements"],
        "keywords_added": rewritten["keywords_added"]
    }


@router.get("/export/{resume_id}/{format}")
async def export_resume(resume_id: str, format: str):
    """
    Export the optimized resume as DOCX or PDF
    """
    if resume_id not in resume_storage:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if format not in ["docx", "pdf"]:
        raise HTTPException(status_code=400, detail="Format must be 'docx' or 'pdf'")
    
    from services.export_service import export_resume as do_export
    
    resume_data = resume_storage[resume_id]
    output_path = await do_export(
        resume_data=resume_data,
        format=format
    )
    
    return FileResponse(
        output_path,
        media_type="application/octet-stream",
        filename=f"resume_optimized.{format}"
    )


@router.get("/resume/{resume_id}")
async def get_resume(resume_id: str):
    """
    Get stored resume data by ID
    """
    if resume_id not in resume_storage:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    data = resume_storage[resume_id]
    return {
        "resume_id": resume_id,
        "filename": data["filename"],
        "text_content": data["parsed"]["text"],
        "sections": data["parsed"]["sections"]
    }


class UpdateResumeRequest(BaseModel):
    text_content: str
    sections: dict


@router.put("/resume/{resume_id}")
async def update_resume(resume_id: str, request: UpdateResumeRequest):
    """
    Update resume content (after applying suggestions)
    """
    if resume_id not in resume_storage:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Update the stored resume data
    resume_storage[resume_id]["parsed"]["text"] = request.text_content
    resume_storage[resume_id]["parsed"]["sections"] = request.sections
    
    return {
        "resume_id": resume_id,
        "message": "Resume updated successfully",
        "text_content": request.text_content,
        "sections": request.sections
    }

