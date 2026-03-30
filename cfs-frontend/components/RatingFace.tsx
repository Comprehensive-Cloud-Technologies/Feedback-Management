import React from 'react';

interface RatingFaceProps {
    level: number;
    className?: string;
    size?: number;
}

const RatingFace: React.FC<RatingFaceProps> = ({ level, className = '', size = 24 }) => {
    // Unicode emojis mapping
    const emojis: Record<number, string> = {
        1: '😞', // Poor
        2: '😐', // Needs Improvement / Average
        3: '🙂', // Good / Average
        4: '😃'  // Excellent / Good
    };

    return (
        <span
            className={className}
            style={{
                fontSize: size,
                lineHeight: 1,
                display: 'inline-block',
                userSelect: 'none'
            }}
            role="img"
            aria-label={`Rating ${level}`}
        >
            {emojis[level] || '❓'}
        </span>
    );
};

export default RatingFace;
