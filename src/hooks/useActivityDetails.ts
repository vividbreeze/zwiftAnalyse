import { useState } from 'react';
import { getActivityDetails } from '../services/strava';
import { analyzeActivity } from '../services/analysis/index';
import type { EnrichedActivity, StravaActivity, ActivityAnalysis, WeeklyStats } from '../types';

interface UseActivityDetailsReturn {
    selectedActivity: EnrichedActivity | null;
    detailedActivity: StravaActivity | null;
    analysisValues: ActivityAnalysis | null;
    loading: boolean;
    selectActivity: (activity: EnrichedActivity) => Promise<void>;
    clearSelection: () => void;
}

export const useActivityDetails = (stats: WeeklyStats[]): UseActivityDetailsReturn => {
    const [selectedActivity, setSelectedActivity] = useState<EnrichedActivity | null>(null);
    const [detailedActivity, setDetailedActivity] = useState<StravaActivity | null>(null);
    const [analysisValues, setAnalysisValues] = useState<ActivityAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const selectActivity = async (activity: EnrichedActivity) => {
        setSelectedActivity(activity);
        setDetailedActivity(null);
        setAnalysisValues(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('strava_access_token');
            if (token) {
                const details = await getActivityDetails(token, activity.id);
                setDetailedActivity(details);

                if (details?.laps) {
                    const analysis = analyzeActivity(activity, details.laps, stats);
                    setAnalysisValues(analysis);
                }
            }
        } catch (error) {
            console.error('Failed to fetch activity details:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedActivity(null);
        setDetailedActivity(null);
        setAnalysisValues(null);
    };

    return {
        selectedActivity,
        detailedActivity,
        analysisValues,
        loading,
        selectActivity,
        clearSelection
    };
};
