import React from 'react';

/**
 * Format feedback text with markdown-like bold formatting
 * @param {Object} props
 * @param {string} props.text - Text to format (supports **bold** syntax)
 */
const FormatFeedback = ({ text }) => {
    if (!text) return null;

    // Split by ** markers and alternate between normal and bold
    const parts = text.split(/\*\*(.*?)\*\*/g);

    return (
        <>
            {parts.map((part, index) => (
                index % 2 === 0
                    ? <span key={index}>{part}</span>
                    : <strong key={index} className="text-indigo-600">{part}</strong>
            ))}
        </>
    );
};

export default FormatFeedback;
