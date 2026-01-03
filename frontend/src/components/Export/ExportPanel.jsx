import { FileText, FileDown, FileType, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadAsFile, formatResumeForDownload } from '../../api/resumeApi';

function ExportPanel({ onExport, resumeData }) {
    // Handle quick text download (client-side, instant)
    const handleQuickDownload = () => {
        if (resumeData?.sections) {
            const formattedContent = formatResumeForDownload(resumeData.sections);
            downloadAsFile(formattedContent, 'resume_updated.txt', 'text/plain');
        } else if (resumeData?.text_content) {
            downloadAsFile(resumeData.text_content, 'resume_updated.txt', 'text/plain');
        }
    };

    return (
        <motion.div
            className="export-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '1.5rem', marginBottom: '2rem' }}
        >
            {/* Quick Download - Instant Text Export */}
            <motion.div
                className="export-option"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickDownload}
                style={{ borderColor: 'var(--success-500)' }}
            >
                <Download size={48} className="export-icon" style={{ color: 'var(--success-400)' }} />
                <div className="export-title">Quick Download</div>
                <div className="export-desc">Instant text file (current edits)</div>
            </motion.div>

            {/* DOCX Export */}
            <motion.div
                className="export-option"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onExport('docx')}
            >
                <FileText size={48} className="export-icon" />
                <div className="export-title">Download DOCX</div>
                <div className="export-desc">ATS-optimized Word format</div>
            </motion.div>

            {/* PDF Export */}
            <motion.div
                className="export-option"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onExport('pdf')}
            >
                <FileDown size={48} className="export-icon" />
                <div className="export-title">Download PDF</div>
                <div className="export-desc">Clean, readable format</div>
            </motion.div>
        </motion.div>
    );
}

export default ExportPanel;
