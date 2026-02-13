import React from 'react';
import { Clock, Zap, TrendingUp } from 'lucide-react';
import type { WorkoutRecommendation } from '../../types';

interface WorkoutCardProps {
    recommendation: WorkoutRecommendation;
    ftp: number;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ recommendation }) => {
    const { workout, priority } = recommendation;

    // Priority-based styling
    const borderColor = priority === 'high'
        ? 'border-green-500'
        : priority === 'medium'
        ? 'border-blue-500'
        : 'border-gray-300';

    return (
        <div
            className={`bg-white p-4 rounded-xl shadow-md border-2 ${borderColor} hover:shadow-lg transition-all`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-sm">{workout.name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium">
                    {workout.type}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-3">{workout.description}</p>

            {/* Metrics */}
            <div className="flex gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {workout.durationFormatted}
                </div>
                <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    ~{Math.round(workout.avgPower * 100)}% FTP
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {workout.estimatedIntensity}
                </div>
            </div>
        </div>
    );
};

export default WorkoutCard;
