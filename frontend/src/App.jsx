import { useState, useCallback } from 'react';
import { Upload, FileText, Sparkles, Download, Zap, MessageSquare, CheckCircle } from 'lucide-react';
import Header from './components/Layout/Header';
import ATSScoreBar from './components/ATSScoreBar';
import UploadZone from './components/Resume/UploadZone';
import ResumePreview from './components/Resume/ResumePreview';
import ChatInterface from './components/Chat/ChatInterface';
import SuggestionCard from './components/Editor/SuggestionCard';
import ExportPanel from './components/Export/ExportPanel';
import { uploadResume, analyzeResume, rewriteSection, exportResume, updateResume } from './api/resumeApi';

function App() {
    // State management
    const [resumeData, setResumeData] = useState(null);  // Original resume data
    const [previewContent, setPreviewContent] = useState('');  // Optimized content for preview
    const [previewSections, setPreviewSections] = useState({});  // Optimized sections for preview
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' or 'chat'
    const [appliedSuggestions, setAppliedSuggestions] = useState([]);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! Upload your resume and paste a job description to get started. I\'ll help you optimize for ATS compatibility.' }
    ]);

    // Handle file upload
    const handleUpload = useCallback(async (file) => {
        setIsLoading(true);
        try {
            const data = await uploadResume(file);
            setResumeData(data);
            // Initialize preview content with original content
            setPreviewContent(data.text_content);
            setPreviewSections({ ...data.sections });
            setAppliedSuggestions([]);  // Reset applied suggestions
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Great! I've processed your resume "${data.filename}". I found ${data.images_detected} images. Now paste the job description you're targeting to get personalized suggestions.`
            }]);
        } catch (error) {
            console.error('Upload error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, there was an error processing your resume. Please try again.'
            }]);
        }
        setIsLoading(false);
    }, []);

    // Handle analysis
    const handleAnalyze = useCallback(async () => {
        if (!resumeData?.resume_id || !jobDescription.trim()) return;

        setIsLoading(true);
        try {
            const result = await analyzeResume(resumeData.resume_id, jobDescription);
            setAnalysis(result);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Analysis complete! Your ATS score is ${result.ats_score}/100. I found ${result.keyword_matches.length} matching keywords and ${result.missing_keywords.length} missing. Check out my suggestions to improve your score!`
            }]);
        } catch (error) {
            console.error('Analysis error:', error);
        }
        setIsLoading(false);
    }, [resumeData, jobDescription]);

    // Handle accepting a suggestion - updates PREVIEW content, not original
    const handleAcceptSuggestion = useCallback(async (suggestion) => {
        if (!suggestion.suggested) return;

        // Update PREVIEW content (not original resume)
        let updatedContent = previewContent;
        let updatedSections = { ...previewSections };

        if (suggestion.original && suggestion.original.trim()) {
            // Replace existing content in preview
            updatedContent = updatedContent.replace(suggestion.original, suggestion.suggested);

            const sectionKey = suggestion.section?.toLowerCase();
            if (sectionKey && updatedSections[sectionKey]) {
                updatedSections[sectionKey] = updatedSections[sectionKey].replace(
                    suggestion.original,
                    suggestion.suggested
                );
            }
        } else {
            // Append new content to the preview section
            const sectionKey = suggestion.section?.toLowerCase();
            if (sectionKey && updatedSections[sectionKey]) {
                updatedSections[sectionKey] = updatedSections[sectionKey] + '\n' + suggestion.suggested;
            } else if (sectionKey) {
                updatedSections[sectionKey] = suggestion.suggested;
            }
            updatedContent = updatedContent + '\n\n' + suggestion.suggested;
        }

        // Update preview state
        setPreviewContent(updatedContent);
        setPreviewSections(updatedSections);

        // Add to applied suggestions list
        setAppliedSuggestions(prev => [...prev, {
            section: suggestion.section,
            suggested: suggestion.suggested,
            timestamp: new Date().toLocaleTimeString()
        }]);

        // Sync preview content to backend for export
        if (resumeData?.resume_id) {
            try {
                await updateResume(resumeData.resume_id, updatedContent, updatedSections);
            } catch (error) {
                console.error('Failed to sync to backend:', error);
            }
        }

        // Remove the accepted suggestion from the list and update score
        setAnalysis(prev => {
            if (!prev) return prev;

            const remainingSuggestions = (prev.suggestions || []).filter(s => s.id !== suggestion.id);
            const addedKeywords = suggestion.keywords_added || [];
            const newMatches = [...(prev.keyword_matches || []), ...addedKeywords];
            const uniqueMatches = [...new Set(newMatches)];

            const newMissing = (prev.missing_keywords || []).filter(kw => {
                const suggestedLower = (suggestion.suggested || '').toLowerCase();
                return !suggestedLower.includes(kw.toLowerCase());
            });

            return {
                ...prev,
                ats_score: Math.min(100, (prev.ats_score || 0) + Math.round((suggestion.impact_score || 0.5) * 10)),
                suggestions: remainingSuggestions,
                keyword_matches: uniqueMatches,
                missing_keywords: newMissing
            };
        });

        // Add success message
        const remaining = (analysis?.suggestions?.length || 1) - 1;
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Applied suggestion to "${suggestion.section}"! +${Math.round((suggestion.impact_score || 0.5) * 10)} points. ${remaining > 0 ? `${remaining} suggestions remaining.` : 'All suggestions applied!'}`
        }]);
    }, [analysis, previewContent, previewSections, resumeData]);

    // Handle rejecting/skipping a suggestion
    const handleRejectSuggestion = useCallback((suggestion) => {
        if (analysis) {
            setAnalysis(prev => ({
                ...prev,
                suggestions: prev.suggestions.filter(s => s.id !== suggestion.id)
            }));
        }
    }, [analysis]);

    // Handle accepting all suggestions at once - updates PREVIEW content
    const handleAcceptAll = useCallback(async () => {
        if (!analysis?.suggestions?.length) return;

        let updatedContent = previewContent;
        let updatedSections = { ...previewSections };
        const newApplied = [];
        let totalScoreIncrease = 0;

        // Apply all suggestions to preview
        for (const suggestion of analysis.suggestions) {
            if (suggestion.suggested) {
                if (suggestion.original && suggestion.original.trim()) {
                    updatedContent = updatedContent.replace(suggestion.original, suggestion.suggested);
                    const sectionKey = suggestion.section?.toLowerCase();
                    if (sectionKey && updatedSections[sectionKey]) {
                        updatedSections[sectionKey] = updatedSections[sectionKey].replace(
                            suggestion.original,
                            suggestion.suggested
                        );
                    }
                } else {
                    const sectionKey = suggestion.section?.toLowerCase();
                    if (sectionKey && updatedSections[sectionKey]) {
                        updatedSections[sectionKey] += '\n' + suggestion.suggested;
                    } else if (sectionKey) {
                        updatedSections[sectionKey] = suggestion.suggested;
                    }
                    updatedContent += '\n\n' + suggestion.suggested;
                }

                newApplied.push({
                    section: suggestion.section,
                    suggested: suggestion.suggested,
                    timestamp: new Date().toLocaleTimeString()
                });
                totalScoreIncrease += Math.round((suggestion.impact_score || 0.5) * 10);
            }
        }

        // Update preview state
        setPreviewContent(updatedContent);
        setPreviewSections(updatedSections);
        setAppliedSuggestions(prev => [...prev, ...newApplied]);

        setAnalysis(prev => ({
            ...prev,
            ats_score: Math.min(100, (prev.ats_score || 0) + totalScoreIncrease),
            suggestions: []
        }));

        // Sync preview to backend for export
        if (resumeData?.resume_id) {
            try {
                await updateResume(resumeData.resume_id, updatedContent, updatedSections);
            } catch (error) {
                console.error('Failed to sync to backend:', error);
            }
        }

        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🎉 Applied all ${newApplied.length} suggestions! Total score increase: +${totalScoreIncrease} points. Your resume is now optimized!`
        }]);
    }, [analysis, previewContent, previewSections, resumeData]);

    // Handle export - exports the PREVIEW content (with applied suggestions)
    const handleExport = useCallback(async (format) => {
        if (!resumeData?.resume_id) return;

        try {
            setIsLoading(true);

            // Sync the PREVIEW content to backend before export
            await updateResume(
                resumeData.resume_id,
                previewContent,
                previewSections
            );

            // Now export with the optimized preview content
            await exportResume(resumeData.resume_id, format);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `📥 Downloaded ${format.toUpperCase()} with ${appliedSuggestions.length} applied suggestions. Good luck! 🚀`
            }]);
        } catch (error) {
            console.error('Export error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Export failed. Please try again.`
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [resumeData, previewContent, previewSections, appliedSuggestions]);

    // Handle chat message
    const handleSendMessage = useCallback(async (message) => {
        setMessages(prev => [...prev, { role: 'user', content: message }]);

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I understand you want to improve that section. Based on the job description keywords, I recommend emphasizing your quantifiable achievements and using more action verbs.'
            }]);
        }, 1000);
    }, []);

    return (
        <div className="app-layout">
            <Header />

            <main className="container">
                {/* ATS Score Bar */}
                <ATSScoreBar
                    score={analysis?.ats_score || 0}
                    isLoading={isLoading}
                />

                {/* Split Screen Layout */}
                <div className="split-screen">
                    {/* Left Panel - Resume Preview */}
                    <div className="panel">
                        <div className="panel-header">
                            <h3 className="panel-title">
                                <FileText size={18} />
                                Resume Preview
                            </h3>
                            {resumeData && (
                                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                    {resumeData.filename}
                                </span>
                            )}
                        </div>
                        <div className="panel-content">
                            {!resumeData ? (
                                <UploadZone onUpload={handleUpload} isLoading={isLoading} />
                            ) : (
                                <>
                                    <ResumePreview
                                        content={previewContent}
                                        sections={previewSections}
                                        matchedKeywords={analysis?.keyword_matches || []}
                                        missingKeywords={analysis?.missing_keywords || []}
                                        onContentChange={setPreviewContent}
                                        onSectionsChange={setPreviewSections}
                                    />

                                    {/* Job Description Input */}
                                    <div className="jd-input-section mt-4">
                                        <h4 className="mb-2">Target Job Description</h4>
                                        <textarea
                                            className="jd-textarea"
                                            placeholder="Paste the job description here to analyze keyword matches and get personalized suggestions..."
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-primary mt-3"
                                            onClick={handleAnalyze}
                                            disabled={isLoading || !jobDescription.trim()}
                                        >
                                            {isLoading ? (
                                                <span className="loading-spinner" />
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    Analyze & Optimize
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Keywords Display */}
                                    {analysis && (
                                        <div className="keywords-section">
                                            <div className="mb-3">
                                                <span className="keywords-title">Matched Keywords ({analysis.keyword_matches.length})</span>
                                                <div className="keywords-list">
                                                    {analysis.keyword_matches.slice(0, 10).map((kw, i) => (
                                                        <span key={i} className="keyword-tag matched">{kw}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="keywords-title">Missing Keywords ({analysis.missing_keywords.length})</span>
                                                <div className="keywords-list">
                                                    {analysis.missing_keywords.slice(0, 10).map((kw, i) => (
                                                        <span key={i} className="keyword-tag missing">{kw}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - AI Chat & Suggestions */}
                    <div className="panel">
                        <div className="panel-header">
                            <div className="flex gap-2">
                                <button
                                    className={`btn btn-sm ${activeTab === 'suggestions' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setActiveTab('suggestions')}
                                >
                                    <Zap size={14} />
                                    Suggestions
                                </button>
                                <button
                                    className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setActiveTab('chat')}
                                >
                                    <MessageSquare size={14} />
                                    AI Chat
                                </button>
                            </div>
                            {analysis && (
                                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                    <span className="text-success" style={{ fontSize: '0.875rem' }}>
                                        {analysis.suggestions?.length || 0} suggestions
                                    </span>
                                    {analysis.suggestions?.length > 0 && (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={handleAcceptAll}
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                            Accept All
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="panel-content">
                            {activeTab === 'suggestions' ? (
                                <>
                                    <div className="suggestions-list">
                                        {analysis?.suggestions?.length > 0 ? (
                                            analysis.suggestions.map((suggestion) => (
                                                <SuggestionCard
                                                    key={suggestion.id}
                                                    suggestion={suggestion}
                                                    onAccept={() => handleAcceptSuggestion(suggestion)}
                                                    onReject={() => handleRejectSuggestion(suggestion)}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center text-muted" style={{ padding: '2rem' }}>
                                                <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                                <p>{appliedSuggestions.length > 0 ? 'All suggestions applied!' : 'Upload your resume and analyze it to get AI-powered suggestions.'}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Applied Suggestions List */}
                                    {appliedSuggestions.length > 0 && (
                                        <div className="applied-suggestions">
                                            <h4>
                                                <CheckCircle size={16} />
                                                Applied Changes ({appliedSuggestions.length})
                                            </h4>
                                            <div className="applied-list">
                                                {appliedSuggestions.map((item, index) => (
                                                    <div key={index} className="applied-item">
                                                        <strong>{item.section}:</strong> {item.suggested.substring(0, 60)}...
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <ChatInterface
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    isLoading={isLoading}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Export Panel */}
                {resumeData && (
                    <ExportPanel onExport={handleExport} resumeData={resumeData} />
                )}
            </main>
        </div>
    );
}

export default App;
