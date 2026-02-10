// analysis/index.ts
import { userProfile, calculateZones } from '../../config/user';
import { analyzeZones } from './zones';
import { analyzeCardiacDrift, analyzeCompliance, calculatePerformanceMetrics, generateNaturalLanguageFeedback } from './metrics';
import { analyzeHistory, analyzeTrainingLoad, analyzeOverallProgress } from './progress';
import type { EnrichedActivity, Lap, WeeklyStats, ActivityAnalysis } from '../../types';

export * from './zones';
export * from './metrics';
export * from './progress';

// Main analysis orchestration (kept here for backward compatibility or ease of use)
export const analyzeActivity = (activity: EnrichedActivity, laps: Lap[], stats: WeeklyStats[]): ActivityAnalysis => {
    if (!laps || laps.length === 0) {
        return {
            feedback: "No interval data available for detailed analysis.",
            metrics: {}
        };
    }

    const zones = calculateZones(userProfile.maxHr);
    const zoneAnalysis = analyzeZones(laps, zones);
    const driftAnalysis = analyzeCardiacDrift(laps);
    const complianceAnalysis = analyzeCompliance(laps);
    const historyAnalysis = analyzeHistory(activity, stats);
    const trainingLoadAnalysis = analyzeTrainingLoad(activity, stats);

    return {
        feedback: generateNaturalLanguageFeedback(activity, driftAnalysis, complianceAnalysis, historyAnalysis, trainingLoadAnalysis, zoneAnalysis),
        metrics: {
            drift: driftAnalysis,
            compliance: complianceAnalysis,
            history: historyAnalysis,
            load: trainingLoadAnalysis,
            zones: zoneAnalysis
        }
    };
};
