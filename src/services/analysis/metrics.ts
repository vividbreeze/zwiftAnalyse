// analysis/metrics.ts
import type { WeeklyStats, PerformanceMetrics, LatestWeight, BodyCompositionEntry, Lap, EnrichedActivity, ZoneDistribution } from '../../types';
import type { analyzeHistory } from './progress';
import type { analyzeTrainingLoad } from './progress';

/**
 * Calculate performance metrics combining weight and training data
 */
export const calculatePerformanceMetrics = (currentStats: WeeklyStats | undefined, latestWeight: LatestWeight | null, bodyComposition: BodyCompositionEntry[] = [], allStats: WeeklyStats[] = []): PerformanceMetrics => {
    const metrics: PerformanceMetrics = {
        powerToWeight: null,
        powerToWeightTrend: null,
        efficiencyPerKg: null,
        weightTrend: null,
        bodyCompTrend: null,
        performanceInsight: null
    };

    if (!currentStats || !latestWeight?.weight) {
        return metrics;
    }

    const weight = latestWeight.weight;
    const avgPower = currentStats.avgPower || 0;
    const efficiencyFactor = currentStats.efficiencyFactor || 0;

    // 1. Power-to-Weight Ratio
    if (avgPower > 0 && weight > 0) {
        metrics.powerToWeight = (avgPower / weight).toFixed(2);
    }

    // 2. Efficiency per kg
    if (efficiencyFactor > 0 && weight > 0) {
        metrics.efficiencyPerKg = ((efficiencyFactor * 100) / weight).toFixed(2);
    }

    // 3. Weight Trend
    if (bodyComposition.length >= 2) {
        const sortedByDate = [...bodyComposition].filter(d => d.weight).sort((a, b) => {
            const [aDay, aMonth] = a.week.split('/').map(Number);
            const [bDay, bMonth] = b.week.split('/').map(Number);
            return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
        });

        if (sortedByDate.length >= 2) {
            const firstWeight = sortedByDate[0].weight!;
            const lastWeight = sortedByDate[sortedByDate.length - 1].weight!;
            const weightChange = lastWeight - firstWeight;

            metrics.weightTrend = {
                change: weightChange.toFixed(1),
                direction: weightChange > 0.5 ? 'up' : weightChange < -0.5 ? 'down' : 'stable',
                startWeight: firstWeight,
                endWeight: lastWeight,
                weeks: sortedByDate.length
            };
        }

        const withFatRatio = sortedByDate.filter(d => d.fatRatio);
        const withMuscleMass = sortedByDate.filter(d => d.muscleMass);

        if (withFatRatio.length >= 2) {
            const lastFat = withFatRatio[withFatRatio.length - 1].fatRatio!;
            const firstFat = withFatRatio[0].fatRatio!;
            const fatChange = lastFat - firstFat;
            metrics.bodyCompTrend = metrics.bodyCompTrend || {};
            metrics.bodyCompTrend.fatChange = fatChange.toFixed(1);
            metrics.bodyCompTrend.fatDirection = fatChange > 0.5 ? 'up' : fatChange < -0.5 ? 'down' : 'stable';
        }

        if (withMuscleMass.length >= 2) {
            const lastMuscle = withMuscleMass[withMuscleMass.length - 1].muscleMass!;
            const firstMuscle = withMuscleMass[0].muscleMass!;
            const muscleChange = lastMuscle - firstMuscle;
            metrics.bodyCompTrend = metrics.bodyCompTrend || {};
            metrics.bodyCompTrend.muscleChange = muscleChange.toFixed(1);
            metrics.bodyCompTrend.muscleDirection = muscleChange > 0.5 ? 'up' : muscleChange < -0.5 ? 'down' : 'stable';
        }
    }

    // 4. Power-to-Weight trend
    if (allStats.length >= 2 && bodyComposition.length >= 1) {
        const matchedWeeks = allStats.map(stat => {
            const weightData = bodyComposition.find(bc => bc.week === stat.label);
            if (weightData?.weight && stat.avgPower > 0) {
                return {
                    week: stat.label,
                    powerToWeight: stat.avgPower / weightData.weight
                };
            }
            return null;
        }).filter(Boolean);

        if (matchedWeeks.length >= 2) {
            const firstPW = matchedWeeks[0]!.powerToWeight;
            const lastPW = matchedWeeks[matchedWeeks.length - 1]!.powerToWeight;
            const pwChange = ((lastPW - firstPW) / firstPW) * 100;

            metrics.powerToWeightTrend = {
                change: pwChange.toFixed(1),
                direction: pwChange > 2 ? 'improving' : pwChange < -2 ? 'declining' : 'stable'
            };
        }
    }

    metrics.performanceInsight = generatePerformanceInsight(metrics);

    return metrics;
};

const generatePerformanceInsight = (metrics: PerformanceMetrics): string[] | null => {
    const insights = [];

    if (metrics.powerToWeight) {
        const pw = parseFloat(metrics.powerToWeight);
        let level = '';
        if (pw >= 4.0) level = 'Spitzenniveau';
        else if (pw >= 3.5) level = 'Fortgeschritten';
        else if (pw >= 3.0) level = 'Ambitioniert';
        else if (pw >= 2.5) level = 'Moderat';
        else level = 'Einsteiger';

        insights.push(`**${metrics.powerToWeight} W/kg** (${level})`);
    }

    // Weight trend with intelligent analysis based on body composition data
    if (metrics.weightTrend) {
        const trend = metrics.weightTrend;
        const bc = metrics.bodyCompTrend;

        if (trend.direction === 'down') {
            // Weight is decreasing
            if (bc?.muscleDirection === 'down' && bc?.fatDirection !== 'down') {
                insights.push(`⚠️ Gewicht: **${trend.change} kg** – Achtung: Muskelverlust (${bc.muscleChange} kg)!`);
            } else if (bc?.fatDirection === 'down') {
                insights.push(`✅ Gewicht: **${trend.change} kg** – Fett ↓ ${Math.abs(Number(bc.fatChange))}% (optimal!)` );
            } else {
                insights.push(`📉 Gewicht: **${trend.change} kg** über ${trend.weeks} Wochen – gut für W/kg!`);
            }
        } else if (trend.direction === 'up') {
            // Weight is increasing
            if (bc?.muscleDirection === 'up' && bc?.fatDirection !== 'up') {
                insights.push(`💪 Gewicht: **+${Math.abs(Number(trend.change))} kg** – davon +${bc.muscleChange} kg Muskeln!`);
            } else if (bc?.muscleDirection === 'up' && bc?.fatDirection === 'up') {
                insights.push(`📈 Gewicht: **+${Math.abs(Number(trend.change))} kg** – Muskeln +${bc.muscleChange} kg, Fett +${bc.fatChange}%`);
            } else if (bc?.fatDirection === 'up') {
                insights.push(`📈 Gewicht: **+${Math.abs(Number(trend.change))} kg** – hauptsächlich Fett (+${bc.fatChange}%)`);
            } else {
                // No body composition data available
                insights.push(`📈 Gewicht: **+${Math.abs(Number(trend.change))} kg** – prüfe ob Muskelaufbau oder Fett.`);
            }
        }
    } else if (metrics.bodyCompTrend) {
        // Only body comp data, no weight trend (add standalone body comp insights)
        const bc = metrics.bodyCompTrend;
        if (bc.fatDirection === 'down' && bc.muscleDirection !== 'down') {
            insights.push(`✅ Ideale Körperkomposition: Fett ↓ ${Math.abs(Number(bc.fatChange))}%`);
        } else if (bc.muscleDirection === 'up') {
            insights.push(`💪 Muskelaufbau: +${bc.muscleChange} kg`);
        }
    }

    if (metrics.powerToWeightTrend?.direction === 'improving') {
        insights.push(`🚀 W/kg verbessert sich um ${metrics.powerToWeightTrend.change}%!`);
    }

    return insights.length > 0 ? insights : null;
};

export const analyzeCardiacDrift = (laps: Lap[]) => {
    const workLaps = laps.filter(lap => lap.moving_time > 120 && (lap.average_watts ?? 0) > 50);

    if (workLaps.length < 2) return null;

    const midPoint = Math.floor(workLaps.length / 2);
    const firstHalf = workLaps.slice(0, midPoint);
    const secondHalf = workLaps.slice(midPoint);

    if (firstHalf.length === 0 || secondHalf.length === 0) return null;

    const avgEfFirst = calculateAverageEF(firstHalf);
    const avgEfSecond = calculateAverageEF(secondHalf);

    const avgPowerFirst = calculateAveragePower(firstHalf);
    const avgPowerSecond = calculateAveragePower(secondHalf);

    const decoupling = ((avgEfFirst - avgEfSecond) / avgEfFirst) * 100;

    return {
        decoupling: decoupling.toFixed(1),
        avgEfFirst: avgEfFirst.toFixed(2),
        avgEfSecond: avgEfSecond.toFixed(2),
        powerDifference: (avgPowerSecond - avgPowerFirst).toFixed(0),
        message: getDecouplingMessage(decoupling, avgPowerSecond - avgPowerFirst)
    };
};

const calculateAverageEF = (laps: Lap[]): number => {
    const totalEF = laps.reduce((sum, lap) => {
        const ef = (lap.average_watts && lap.average_heartrate)
            ? lap.average_watts / lap.average_heartrate
            : 0;
        return sum + ef;
    }, 0);
    return totalEF / laps.length;
};

const calculateAveragePower = (laps: Lap[]): number => {
    const totalPower = laps.reduce((sum, lap) => sum + (lap.average_watts || 0), 0);
    return totalPower / laps.length;
};

const getDecouplingMessage = (decoupling: number, powerDiff: number): string => {
    if (Math.abs(powerDiff) > 20) {
        return "Power output varied between halves, so drift analysis is less reliable.";
    }

    if (decoupling > 5) {
        return "Significant cardiac drift detected (>5%). HR rose relative to Power in the second half.";
    } else if (decoupling < -5) {
        return "Your efficiency improved in the second half.";
    } else {
        return "Good aerobic stability. HR/Power relationship remained constant.";
    }
};

export const analyzeCompliance = (laps: Lap[]): string | null => {
    if (laps.length < 3) return null;

    const firstLap = laps[0];
    const lastLap = laps[laps.length - 1];

    if (!firstLap.average_cadence || !lastLap.average_cadence) return null;

    const cadenceDrop = firstLap.average_cadence - lastLap.average_cadence;

    if (cadenceDrop > 5) {
        return "Cadence dropped >5rpm vertically towards the end. Try to hold the prescribed RPM even when fatigued.";
    } else if (cadenceDrop < -5) {
        return "You spun faster at the end of the session.";
    }
    return "Great execution! You held the cadence steady throughout the session, matching the workout demands.";
};

export const generateNaturalLanguageFeedback = (activity: EnrichedActivity, drift: ReturnType<typeof analyzeCardiacDrift>, compliance: string | null, history: ReturnType<typeof analyzeHistory>, load: ReturnType<typeof analyzeTrainingLoad>, zones: ZoneDistribution | null): string => {
    const lines = [];

    lines.push(`## ${activity.name}`);
    lines.push(`**Work Done**: ${activity.totalCalories} kcal`);

    if (zones) {
        lines.push(`\n**Heart Rate Zones**: ${zones.message}`);
    }

    if (load) {
        lines.push(`\n**Training Load**: ${load.recommendation}`);
    }

    if (history) {
        lines.push(`\n**Historical Context**: ${history.message}`);
    }

    if (drift) {
        lines.push(`\n**Cardiac Drift**: ${drift.message}`);
        if (Number(drift.decoupling) > 5) {
            lines.push(`(Decoupling: ${drift.decoupling}%)`);
        }
    }

    if (compliance) {
        lines.push(`\n**Workout Compliance**: ${compliance}`);
    }

    return lines.join('\n');
};
