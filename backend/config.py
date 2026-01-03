"""
Resume Reactor - Configuration
NVIDIA NIM API settings and application configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# NVIDIA NIM Configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")

# Model Configuration
TEXT_MODEL = "meta/llama-3.1-70b-instruct"
VISION_MODEL = "microsoft/phi-3.5-vision-instruct"

# Application Settings
MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = [".pdf", ".docx"]
TEMP_DIR = "temp_uploads"

# ATS Scoring Weights
ATS_WEIGHTS = {
    "keyword_match": 0.35,
    "format_compliance": 0.20,
    "experience_relevance": 0.25,
    "skills_coverage": 0.20
}
