"""
Resume Reactor - PDF Parser
Extracts text and images from PDF resumes
"""
import pdfplumber
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
from typing import Dict, List, Any


def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parse a PDF resume and extract text, sections, and image count.
    Uses pdfplumber for text and PyMuPDF for images.
    Falls back to OCR for scanned documents.
    """
    text_content = ""
    images_count = 0
    
    # Extract text using pdfplumber
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber error: {e}")
    
    # If no text found, try OCR
    if len(text_content.strip()) < 50:
        text_content = extract_text_with_ocr(file_path)
    
    # Count and extract images using PyMuPDF
    try:
        doc = fitz.open(file_path)
        for page in doc:
            images = page.get_images()
            images_count += len(images)
        doc.close()
    except Exception as e:
        print(f"PyMuPDF error: {e}")
    
    # Parse sections from text
    sections = extract_sections(text_content)
    
    return {
        "text": text_content.strip(),
        "sections": sections,
        "images_count": images_count
    }


def extract_text_with_ocr(file_path: str) -> str:
    """
    Extract text from PDF using OCR (for scanned documents)
    """
    text_content = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            # Convert page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # OCR the image
            page_text = pytesseract.image_to_string(img)
            text_content += page_text + "\n"
        doc.close()
    except Exception as e:
        print(f"OCR error: {e}")
    
    return text_content


def extract_sections(text: str) -> Dict[str, str]:
    """
    Extract resume sections based on common headings
    """
    sections = {
        "contact": "",
        "summary": "",
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
        "certifications": "",
        "other": ""
    }
    
    # Common section headers (case insensitive)
    section_patterns = {
        "summary": r"(?:professional\s+)?summary|objective|profile|about\s*me",
        "experience": r"(?:work\s+)?experience|employment|work\s*history|professional\s*experience",
        "education": r"education|academic|qualifications|degrees?",
        "skills": r"skills?|technical\s*skills?|competenc(?:y|ies)|technologies|expertise",
        "projects": r"projects?|portfolio|work\s*samples?",
        "certifications": r"certifications?|certificates?|licenses?|credentials?"
    }
    
    lines = text.split('\n')
    current_section = "contact"  # First content is usually contact info
    section_content = []
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Check if this line is a section header
        matched_section = None
        for section_name, pattern in section_patterns.items():
            if re.match(f"^{pattern}.*$", line_stripped, re.IGNORECASE):
                matched_section = section_name
                break
        
        if matched_section:
            # Save previous section content
            if section_content:
                sections[current_section] = '\n'.join(section_content)
            current_section = matched_section
            section_content = []
        else:
            section_content.append(line_stripped)
    
    # Save last section
    if section_content:
        sections[current_section] = '\n'.join(section_content)
    
    return sections


def extract_images_as_base64(file_path: str) -> List[str]:
    """
    Extract images from PDF as base64 strings for vision analysis
    """
    images_b64 = []
    try:
        doc = fitz.open(file_path)
        for page_num, page in enumerate(doc):
            for img_idx, img in enumerate(page.get_images()):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                
                if pix.n >= 5:  # CMYK
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                
                img_data = pix.tobytes("png")
                import base64
                img_b64 = base64.b64encode(img_data).decode()
                images_b64.append(img_b64)
                
                if len(images_b64) >= 5:  # Limit to 5 images
                    break
            if len(images_b64) >= 5:
                break
        doc.close()
    except Exception as e:
        print(f"Image extraction error: {e}")
    
    return images_b64
