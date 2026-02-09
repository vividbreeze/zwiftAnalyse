import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Summary card component for displaying key metrics
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.value - Metric value to display
 * @param {ReactNode} props.icon - Icon component
 * @param {string} [props.tooltip] - Optional tooltip text
 */
const SummaryCard = ({ title, value, icon, tooltip }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4 relative group">
        <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
        <div className="flex-1">
            <div className="flex items-center gap-1">
                <p className="text-gray-500 text-sm">{title}</p>
                {tooltip && (
                    <div className="relative">
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 w-52 shadow-xl">
                                {tooltip}
                            </div>
                            <div className="w-3 h-3 bg-gray-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default SummaryCard;
