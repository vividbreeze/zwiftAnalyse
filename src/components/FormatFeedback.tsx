import React from 'react';

interface FormatFeedbackProps {
    text: string;
}

const FormatFeedback: React.FC<FormatFeedbackProps> = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <br key={i} />;

                if (line.startsWith('## ')) {
                    return (
                        <h4 key={i} className="font-bold text-lg text-indigo-900 mt-2 mb-1">
                            {line.replace('## ', '')}
                        </h4>
                    );
                }

                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <p key={i} className="text-gray-700">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <strong key={j} className="font-bold text-indigo-800">
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

export default FormatFeedback;
