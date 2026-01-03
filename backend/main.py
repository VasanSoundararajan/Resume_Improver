"""
Resume Reactor - FastAPI Application
Main entry point for the backend API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from config import TEMP_DIR
from routes.resume import router as resume_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager"""
    # Startup: Create temp directory
    os.makedirs(TEMP_DIR, exist_ok=True)
    yield
    # Shutdown: Cleanup can be done here


app = FastAPI(
    title="Resume Reactor API",
    description="AI-powered resume analysis and ATS optimization",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(resume_router, prefix="/api", tags=["Resume"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "app": "Resume Reactor API"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "api": True,
            "nvidia_nim": True
        }
    }
