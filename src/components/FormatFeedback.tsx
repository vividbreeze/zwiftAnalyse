import React from 'react';
import { Info, TrendingUp, Activity, Heart, Zap, Clock, CheckCircle } from 'lucide-react';

interface FormatFeedbackProps {
    text: string;
}

const FormatFeedback: React.FC<FormatFeedbackProps> = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n').filter(line => line.trim() !== '');

    // Helper to pick icon based on key
    const getIconForKey = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes('heart') || k.includes('cardiac')) return <Heart className="w-4 h-4 text-rose-500" />;
        if (k.includes('power') || k.includes('work') || k.includes('load')) return <Zap className="w-4 h-4 text-yellow-500" />;
        if (k.includes('time') || k.includes('duration')) return <Clock className="w-4 h-4 text-blue-500" />;
        if (k.includes('compliance') || k.includes('done')) return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (k.includes('history') || k.includes('context')) return <Activity className="w-4 h-4 text-purple-500" />;
        return <Info className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div className="space-y-3">
            {lines.map((line, i) => {
                // Check if line is a Header (## Header)
                if (line.startsWith('## ')) {
                    return (
                        <h4 key={i} className="font-bold text-base text-indigo-900 mt-3 mb-1 pb-1 border-b border-indigo-100">
                            {line.replace('## ', '')}
                        </h4>
                    );
                }

                // Check if line is a Key-Value pair (**Key**: Value)
                const match = line.match(/^\*\*(.*?)\*\*:\s*(.*)/);
                if (match) {
                    const key = match[1];
                    const value = match[2];
                    return (
                        <div key={i} className="flex gap-2.5 bg-white/60 p-2 rounded-md border border-indigo-50/50 hover:bg-white hover:shadow-sm transition-all duration-200">
                            <div className="mt-0.5 shrink-0">
                                {getIconForKey(key)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <h5 className="text-sm font-bold text-gray-700 shrink-0">{key}:</h5>
                                    <span className="text-sm text-gray-600 leading-snug parse-content">
                                        {parseBold(value)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Regular paragraph
                return (
                    <p key={i} className="text-xs text-gray-500 mb-1 pl-2 border-l-2 border-indigo-100 italic">
                        {parseBold(line)}
                    </p>
                );
            })}
        </div>
    );
};

// Helper: Parse bold Markdown (**text**) within a string
const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={j} className="font-semibold text-indigo-700 bg-indigo-50 px-1 rounded">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
};

export default FormatFeedback;
