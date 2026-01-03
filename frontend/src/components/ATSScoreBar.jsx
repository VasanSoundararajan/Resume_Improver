import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

function ATSScoreBar({ score = 0, isLoading = false }) {
    // Determine color based on score
    const getScoreColor = (score) => {
        if (score >= 80) return '#22c55e'; // Green
        if (score >= 60) return '#eab308'; // Yellow
        if (score >= 40) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    const scoreColor = getScoreColor(score);

    return (
        <div className="ats-score-bar">
            <div className="score-display">
                <div
                    className="score-circle"
                    style={{
                        '--score': score,
                        '--score-color': scoreColor
                    }}
                >
                    <motion.span
                        className="score-value"
                        key={score}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    >
                        {isLoading ? '...' : score}
                    </motion.span>
                </div>
                <div>
                    <div className="score-label">ATS Score</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {score < 40 && 'Needs improvement'}
                        {score >= 40 && score < 60 && 'Fair match'}
                        {score >= 60 && score < 80 && 'Good match'}
                        {score >= 80 && 'Excellent match!'}
                    </div>
                </div>
            </div>

            <div className="score-progress">
                <motion.div
                    className="score-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}dd)` }}
                />
            </div>

            <div className="flex items-center gap-2" style={{ color: scoreColor }}>
                <TrendingUp size={20} />
                <span style={{ fontWeight: 600 }}>{score >= 70 ? '+' : ''}{Math.round(score * 0.3)}% improvement</span>
            </div>
        </div>
    );
}

export default ATSScoreBar;
