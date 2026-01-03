import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

function UploadZone({ onUpload, isLoading = false }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles[0]);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1,
        disabled: isLoading
    });

    return (
        <motion.div
            {...getRootProps()}
            className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <input {...getInputProps()} />

            {isLoading ? (
                <>
                    <div className="loading-spinner" style={{ width: 48, height: 48, margin: '0 auto 1rem' }} />
                    <p className="upload-text">Processing your resume...</p>
                </>
            ) : (
                <>
                    <motion.div
                        animate={isDragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        {isDragActive ? (
                            <FileText size={64} className="upload-icon" style={{ color: 'var(--primary-400)' }} />
                        ) : (
                            <Upload size={64} className="upload-icon" />
                        )}
                    </motion.div>

                    <p className="upload-text">
                        {isDragActive ? 'Drop your resume here!' : 'Drag & drop your resume here'}
                    </p>
                    <p className="upload-hint">
                        or click to browse • PDF or DOCX • Max 10MB
                    </p>
                </>
            )}
        </motion.div>
    );
}

export default UploadZone;
