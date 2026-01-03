import { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Edit3, Save } from 'lucide-react';

function ResumePreview({ content, sections, matchedKeywords = [], missingKeywords = [], onContentChange, onSectionsChange }) {
    const [updateKey, setUpdateKey] = useState(0);
    const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editableSections, setEditableSections] = useState({});
    const prevContentRef = useRef('');
    const prevSectionsRef = useRef('');

    // Initialize editable sections when sections change
    useEffect(() => {
        if (sections) {
            setEditableSections({ ...sections });
        }
    }, [sections]);

    // Trigger update animation when content or sections change (deep comparison)
    useEffect(() => {
        const contentStr = content || '';
        const sectionsStr = JSON.stringify(sections || {});

        if (contentStr !== prevContentRef.current || sectionsStr !== prevSectionsRef.current) {
            prevContentRef.current = contentStr;
            prevSectionsRef.current = sectionsStr;

            setUpdateKey(prev => prev + 1);
            setShowUpdateIndicator(true);
            const timer = setTimeout(() => setShowUpdateIndicator(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [content, sections]);

    // Section configuration
    const sectionOrder = ['contact', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
    const sectionTitles = {
        contact: 'Contact Information',
        summary: 'Professional Summary',
        experience: 'Work Experience',
        education: 'Education',
        skills: 'Skills',
        projects: 'Projects',
        certifications: 'Certifications'
    };

    // Format sections for display
    const formattedSections = useMemo(() => {
        if (!sections) return null;

        return sectionOrder
            .filter(key => sections[key] && sections[key].trim())
            .map(key => ({
                key,
                title: sectionTitles[key] || key,
                content: sections[key]
            }));
    }, [sections, updateKey]);

    // Handle section text change
    const handleSectionChange = (sectionKey, newContent) => {
        setEditableSections(prev => ({
            ...prev,
            [sectionKey]: newContent
        }));
    };

    // Save edits
    const handleSaveEdits = () => {
        if (onSectionsChange) {
            onSectionsChange(editableSections);
        }
        // Also update content string
        if (onContentChange) {
            const newContent = sectionOrder
                .filter(key => editableSections[key])
                .map(key => editableSections[key])
                .join('\n\n');
            onContentChange(newContent);
        }
        setIsEditMode(false);
        setShowUpdateIndicator(true);
        setTimeout(() => setShowUpdateIndicator(false), 2000);
    };

    // Handle direct download of current content
    const handleQuickDownload = () => {
        const downloadContent = sectionOrder
            .filter(key => (isEditMode ? editableSections[key] : sections[key]))
            .map(key => {
                const sectionContent = isEditMode ? editableSections[key] : sections[key];
                return `=== ${sectionTitles[key] || key.toUpperCase()} ===\n${sectionContent}`;
            })
            .join('\n\n');

        const blob = new Blob([downloadContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume_optimized.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!content && !sections) {
        return (
            <div className="resume-preview" style={{ textAlign: 'center', color: '#9ca3af' }}>
                <p>No resume content to display</p>
            </div>
        );
    }

    return (
        <div className="resume-preview-container" style={{ position: 'relative' }}>
            {/* Update Indicator */}
            <AnimatePresence>
                {showUpdateIndicator && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: '-30px',
                            right: '10px',
                            background: 'linear-gradient(135deg, #22c55e, #10b981)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 10
                        }}
                    >
                        <RefreshCw size={12} />
                        Updated!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '8px',
                zIndex: 10
            }}>
                {/* Edit/Save Toggle */}
                <button
                    onClick={isEditMode ? handleSaveEdits : () => setIsEditMode(true)}
                    style={{
                        background: isEditMode ? 'rgba(34, 197, 94, 0.9)' : 'rgba(99, 102, 241, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                    }}
                    title={isEditMode ? 'Save changes' : 'Edit resume'}
                >
                    {isEditMode ? <Save size={12} /> : <Edit3 size={12} />}
                    {isEditMode ? 'Save' : 'Edit'}
                </button>

                {/* Quick Download */}
                <button
                    onClick={handleQuickDownload}
                    style={{
                        background: 'rgba(99, 102, 241, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                    }}
                    title="Download current resume as text"
                >
                    <Download size={12} />
                    Save
                </button>
            </div>

            {/* Resume Content */}
            <motion.div
                key={updateKey}
                className="resume-preview"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    border: isEditMode ? '2px solid #6366f1' : 'none',
                    transition: 'border 0.2s ease'
                }}
            >
                {isEditMode ? (
                    // Editable Mode - Textarea for each section
                    sectionOrder
                        .filter(key => editableSections[key] || sections[key])
                        .map(key => (
                            <div key={key} style={{ marginBottom: '1rem' }}>
                                <h2 style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#6366f1'
                                }}>
                                    <Edit3 size={14} />
                                    {sectionTitles[key] || key}
                                </h2>
                                <textarea
                                    value={editableSections[key] || ''}
                                    onChange={(e) => handleSectionChange(key, e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontFamily: 'inherit',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.6',
                                        resize: 'vertical',
                                        background: '#fafafa'
                                    }}
                                />
                            </div>
                        ))
                ) : (
                    // View Mode - Display sections
                    formattedSections ? (
                        formattedSections.map(section => (
                            <motion.div
                                key={section.key}
                                layout
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: 1 }}
                            >
                                <h2>{section.title}</h2>
                                {section.content.split('\n').map((line, i) => (
                                    line.trim() && <p key={i}>{highlightText(line, matchedKeywords)}</p>
                                ))}
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                    )
                )}
            </motion.div>

            {isEditMode && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#6366f1'
                }}>
                    💡 <strong>Editing Mode:</strong> Make changes directly in the text areas above. Click "Save" to apply your changes.
                </div>
            )}
        </div>
    );
}

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to highlight keywords in a line
function highlightText(text, keywords) {
    if (!keywords || keywords.length === 0) return text;

    let result = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, 'gi');
        if (regex.test(result)) {
            result = result.replace(regex, '【$1】');
        }
    });

    const parts = result.split(/【|】/);
    return parts.map((part, i) => {
        const isHighlighted = keywords.some(kw =>
            kw.toLowerCase() === part.toLowerCase()
        );
        return isHighlighted ? (
            <span key={i} className="keyword-highlight">{part}</span>
        ) : part;
    });
}

export default ResumePreview;
