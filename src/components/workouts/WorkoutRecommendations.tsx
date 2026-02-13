import React from 'react';
import { Dumbbell, RefreshCw } from 'lucide-react';
import WorkoutCard from './WorkoutCard';
import { useWorkoutRecommendations } from '../../hooks/useWorkoutRecommendations';
import type { WeeklyStats } from '../../types';

interface WorkoutRecommendationsProps {
    stats: WeeklyStats[];
    trainingGoal: string;
    ftp: number;
}

const WorkoutRecommendations: React.FC<WorkoutRecommendationsProps> = ({ stats, trainingGoal, ftp }) => {
    const { recommendations, loading, refresh } = useWorkoutRecommendations(stats, trainingGoal);

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-md h-[200px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-indigo-600" />
                    Empfohlene Workouts
                </h2>
                <p className="text-sm text-gray-500">Keine Workouts verfügbar. Klicke auf "Aktualisieren" in den Einstellungen.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-indigo-600" />
                    Empfohlene Workouts für dich
                </h2>
                <button
                    onClick={refresh}
                    className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    title="Workouts neu laden"
                >
                    <RefreshCw className="w-3 h-3" />
                    Aktualisieren
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map(rec => (
                    <WorkoutCard key={rec.workout.id} recommendation={rec} ftp={ftp} />
                ))}
            </div>
        </div>
    );
};

export default WorkoutRecommendations;
