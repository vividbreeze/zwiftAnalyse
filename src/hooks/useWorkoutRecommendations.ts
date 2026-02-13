import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { loadWorkouts, getWorkoutRecommendations } from '../services/workouts';
import type { WorkoutRecommendation, WeeklyStats } from '../types';

interface UseWorkoutRecommendationsReturn {
    recommendations: WorkoutRecommendation[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export const useWorkoutRecommendations = (
    stats: WeeklyStats[],
    trainingGoal: string
): UseWorkoutRecommendationsReturn => {
    // Load workouts with React Query
    const { data: workouts = [], isLoading, error, refetch } = useQuery({
        queryKey: ['workouts', 'library'],
        queryFn: loadWorkouts,
        staleTime: 1000 * 60 * 60, // 1 hour
        retry: 1,
    });

    // Get last activity date from stats
    const lastActivityDate = useMemo(() => {
        if (stats.length === 0) return undefined;
        const lastWeek = stats[stats.length - 1];
        // Approximate - get most recent activity from last week
        return lastWeek.activities && lastWeek.activities.length > 0
            ? new Date(lastWeek.activities[lastWeek.activities.length - 1].start_date)
            : undefined;
    }, [stats]);

    // Generate recommendations
    const recommendations = useMemo(
        () => getWorkoutRecommendations(workouts, stats, trainingGoal, lastActivityDate),
        [workouts, stats, trainingGoal, lastActivityDate]
    );

    const refresh = async () => {
        await refetch();
    };

    return {
        recommendations,
        loading: isLoading,
        error: error as Error | null,
        refresh
    };
};
