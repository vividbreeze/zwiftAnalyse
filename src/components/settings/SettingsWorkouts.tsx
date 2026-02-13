import React, { useState } from 'react';
import { Dumbbell, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshWorkouts } from '../../services/workouts';

const SettingsWorkouts: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient();

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshWorkouts();
            // Invalidate React Query cache to force reload
            await queryClient.invalidateQueries({ queryKey: ['workouts'] });
            alert('✅ Workouts erfolgreich aktualisiert!');
        } catch (error) {
            console.error('Error refreshing workouts:', error);
            alert('❌ Fehler beim Aktualisieren der Workouts');
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                <Dumbbell className="w-5 h-5 text-indigo-500" />
                Workout-Bibliothek
            </h3>

            <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Aktualisiere...' : 'Workouts aktualisieren'}
            </button>

            <p className="text-xs text-gray-500 mt-2">
                Lädt alle .zwo Dateien aus dem Workout-Verzeichnis neu.
            </p>
        </div>
    );
};

export default SettingsWorkouts;
