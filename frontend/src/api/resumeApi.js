import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Upload a resume file (PDF or DOCX)
 */
export async function uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}

/**
 * Analyze resume against a job description
 */
export async function analyzeResume(resumeId, jobDescription) {
    const response = await api.post('/analyze', {
        resume_id: resumeId,
        job_description: jobDescription,
    });

    return response.data;
}

/**
 * Get AI rewrite suggestions for a section
 */
export async function rewriteSection(resumeId, section, originalText, jobDescription = null) {
    const response = await api.post('/rewrite', {
        resume_id: resumeId,
        section,
        original_text: originalText,
        job_description: jobDescription,
    });

    return response.data;
}

/**
 * Update resume content on the server
 */
export async function updateResume(resumeId, textContent, sections) {
    const response = await api.put(`/resume/${resumeId}`, {
        text_content: textContent,
        sections: sections,
    });

    return response.data;
}

/**
 * Export resume as DOCX or PDF (from server)
 */
export async function exportResume(resumeId, format) {
    const response = await api.get(`/export/${resumeId}/${format}`, {
        responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resume_optimized.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
}

/**
 * Download content directly as a file (client-side)
 */
export function downloadAsFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format resume sections into a nice text format for download
 */
export function formatResumeForDownload(sections) {
    const sectionOrder = ['contact', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
    const sectionTitles = {
        contact: 'CONTACT INFORMATION',
        summary: 'PROFESSIONAL SUMMARY',
        experience: 'WORK EXPERIENCE',
        education: 'EDUCATION',
        skills: 'SKILLS',
        projects: 'PROJECTS',
        certifications: 'CERTIFICATIONS'
    };

    let output = '';

    for (const key of sectionOrder) {
        if (sections[key] && sections[key].trim()) {
            output += `\n${'='.repeat(40)}\n`;
            output += `${sectionTitles[key] || key.toUpperCase()}\n`;
            output += `${'='.repeat(40)}\n\n`;
            output += sections[key].trim() + '\n';
        }
    }

    return output.trim();
}

/**
 * Get stored resume data
 */
export async function getResume(resumeId) {
    const response = await api.get(`/resume/${resumeId}`);
    return response.data;
}

export default api;

