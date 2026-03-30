
import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    backgroundColor?: string;
    textColor?: string;
    iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    description, 
    backgroundColor = '#ffffff',
    textColor = '#374151',
    iconColor = '#6b7280'
}) => {
    return (
        <div 
            className="rounded-xl shadow-lg border-0 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105"
            style={{ 
                background: backgroundColor,
                color: textColor,
                textAlign: 'center', 
                minWidth: 180,
                border: '1px solid rgba(255,255,255,0.2)'
            }}
        >
            <div>
                <h3 
                    style={{ 
                        marginBottom: '0.5em', 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        opacity: 0.8
                    }}
                >
                    {title}
                </h3>
                <p 
                    style={{ 
                        fontSize: '2.5em', 
                        fontWeight: 700,
                        margin: '0.5rem 0',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {value}
                </p>
            </div>
            {description && (
                <p 
                    className="mt-4"
                    style={{
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        fontWeight: '500'
                    }}
                >
                    {description}
                </p>
            )}
        </div>
    );
};

export default StatCard;
