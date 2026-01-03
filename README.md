# Resume Reactor 🚀

AI-powered resume analysis and ATS optimization tool. Upload your resume, paste a job description, and get instant feedback with AI-generated suggestions to improve your ATS compatibility score.

## Features

- **📄 Document Processing**: Upload PDF or DOCX resumes with automatic text extraction
- **🔍 ATS Analysis**: Real-time ATS compatibility scoring (0-100)
- **🎯 Keyword Matching**: Identifies matched and missing keywords from job descriptions
- **✨ AI Suggestions**: NVIDIA NIM-powered improvement suggestions
- **💬 AI Chat**: Interactive chat for resume optimization guidance
- **📥 Export**: Download optimized resume as ATS-friendly DOCX or PDF

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **NVIDIA NIM** - Llama 3.1 & Phi-3.5 Vision models
- **pdfplumber/PyMuPDF** - PDF processing
- **python-docx** - DOCX handling
- **Tesseract OCR** - Scanned document support

### Frontend
- **React 18** + Vite
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Axios** - API client

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- NVIDIA API Key from [build.nvidia.com](https://build.nvidia.com)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Start server
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload resume file |
| POST | `/api/analyze` | Analyze with job description |
| POST | `/api/rewrite` | Get AI rewrite suggestions |
| GET | `/api/export/{id}/{format}` | Download DOCX/PDF |

## Project Structure

```
resume-reactor/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── routes/
│   │   └── resume.py        # API routes
│   ├── parsers/
│   │   ├── pdf_parser.py    # PDF extraction
│   │   └── docx_parser.py   # DOCX extraction
│   └── services/
│       ├── nvidia_client.py # NVIDIA NIM client
│       ├── ats_analyzer.py  # ATS scoring
│       ├── ai_rewriter.py   # AI suggestions
│       └── export_service.py # DOCX/PDF export
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   └── index.css        # Styling
│   └── package.json
└── README.md
```

## Environment Variables

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

## License

MIT
