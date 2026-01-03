import { useState } from 'react';
import { Check, Edit3, ChevronUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

function SuggestionCard({ suggestion, onAccept, onEdit, onReject }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(suggestion.suggested);

    const handleAccept = () => {
        if (isEditing) {
            onAccept?.({ ...suggestion, suggested: editedText });
        } else {
            onAccept?.(suggestion);
        }
        setIsEditing(false);
    };

    const impactPercentage = Math.round(suggestion.impact_score * 100);

    return (
        <motion.div
            className="suggestion-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
        >
            <div className="suggestion-header">
                <span className="suggestion-badge">
                    {suggestion.improvement_type?.replace('_', ' ') || 'Improvement'}
                </span>
                <div className="suggestion-impact">
                    <ChevronUp size={14} />
                    <span>+{impactPercentage}% impact</span>
                </div>
            </div>

            <div style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Section: <strong style={{ color: 'var(--text-primary)' }}>{suggestion.section}</strong>
            </div>

            {suggestion.original && (
                <div className="suggestion-original">
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Original:</div>
                    {suggestion.original}
                </div>
            )}

            <div className="suggestion-improved">
                <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>
                    <Sparkles size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Suggested:
                </div>
                {isEditing ? (
                    <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            background: 'rgba(34, 197, 94, 0.05)',
                            border: '1px solid var(--success-500)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                        }}
                    />
                ) : (
                    suggestion.suggested
                )}
            </div>

            <div className="suggestion-actions">
                <button
                    className="btn btn-success btn-sm"
                    onClick={handleAccept}
                >
                    <Check size={14} />
                    {isEditing ? 'Save' : 'Accept'}
                </button>

                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    <Edit3 size={14} />
                    {isEditing ? 'Cancel' : 'Edit'}
                </button>

                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onReject?.(suggestion)}
                >
                    Skip
                </button>
            </div>
        </motion.div>
    );
}

export default SuggestionCard;
