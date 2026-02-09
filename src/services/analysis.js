
import { userProfile, calculateZones, getZoneForHr } from '../config/user';

/**
 * Estimate HR Zone Distribution based on Avg HR and Max HR
 * 
 * Creates a realistic bell-curve-like distribution centered on the Average Zone,
 * but spreading up to the Peak Zone (based on Max HR) for intervals/peaks.
 * 
 * For example: Avg HR in Z2, Max HR in Z4 would produce:
 * - Z1: ~15% (warmup/cooldown)
 * - Z2: ~50% (main work at average)
 * - Z3: ~25% (transition to peaks)
 * - Z4: ~10% (peak intervals)
 */
export const estimateZoneDistribution = (avgHr, maxHr, durationMinutes, zones) => {
    if (!avgHr || !durationMinutes) return null;

    const primaryZone = getZoneForHr(avgHr, zones);
    const peakZone = maxHr ? getZoneForHr(maxHr, zones) : primaryZone;

    // Parse zone numbers (Z1 -> 1, Z2 -> 2, etc.)
    const primaryNum = parseInt(primaryZone.slice(1));
    const peakNum = parseInt(peakZone.slice(1));

    let dist = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };

    // Base allocation strategy:
    // 1. Warmup in Z1: Always 10-15%
    // 2. Primary Zone (Avg HR): Gets the bulk (40-60%)
    // 3. Zones between Primary and Peak: Split remaining time
    // 4. Peak Zone: Gets ~5-15% depending on intensity

    const warmupPct = 0.12;  // 12% in Z1 for warmup/cooldown
    const primaryPct = 0.50; // 50% at average HR zone
    const peakPct = peakNum > primaryNum ? 0.10 : 0; // 10% at peak if different from primary

    // Remaining percentage to distribute between primary+1 and peak-1
    let remainingPct = 1.0 - warmupPct - primaryPct - peakPct;

    // Build the distribution
    dist['Z1'] = warmupPct;
    dist[primaryZone] = primaryPct;

    if (peakNum > primaryNum) {
        dist[peakZone] = peakPct;

        // Distribute remaining across intermediate zones
        const intermediateZones = peakNum - primaryNum - 1; // e.g., Z2 to Z4 = Z3 is intermediate

        if (intermediateZones > 0) {
            // Split remaining evenly among intermediate zones
            const perZone = remainingPct / (intermediateZones + 1); // +1 to also add more to adjacent zones
            for (let z = primaryNum + 1; z < peakNum; z++) {
                dist[`Z${z}`] += perZone;
                remainingPct -= perZone;
            }
        }

        // Add remaining to the zone just above primary (transition zone)
        if (primaryNum < 5) {
            dist[`Z${primaryNum + 1}`] += remainingPct;
        }
    } else {
        // No peak difference - allocate remaining to surrounding zones
        if (primaryNum > 1) {
            dist[`Z${primaryNum - 1}`] += remainingPct * 0.6; // Some below
        }
        if (primaryNum < 5) {
            dist[`Z${primaryNum + 1}`] += remainingPct * 0.4; // Some above
        }
    }

    // Normalize to ensure total = 100%
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    if (total > 0) {
        Object.keys(dist).forEach(z => {
            dist[z] = (dist[z] / total) * durationMinutes;
        });
    }

    return dist;
};

// analysis.js cleanup
export const analyzeActivity = (activity, laps, stats) => {
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

const analyzeZones = (laps, zones) => {
    // Initialize counters (minutes)
    const distribution = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
    let totalMinutes = 0;

    laps.forEach(lap => {
        const avgHr = lap.average_heartrate;
        const durationMin = lap.moving_time / 60;

        if (avgHr) {
            const zone = getZoneForHr(avgHr, zones);
            distribution[zone] += durationMin;
            totalMinutes += durationMin;
        }
    });

    if (totalMinutes === 0) return null;

    // formatted strings
    const formatted = {};
    let maxZone = 'Z1';
    let maxVal = 0;

    Object.keys(distribution).forEach(z => {
        const pct = (distribution[z] / totalMinutes) * 100;
        formatted[z] = {
            minutes: distribution[z].toFixed(0),
            pct: pct.toFixed(0)
        };
        if (distribution[z] > maxVal) {
            maxVal = distribution[z];
            maxZone = z;
        }
    });

    return {
        distribution: formatted,
        primaryZone: maxZone,
        message: getZoneMessage(maxZone, formatted[maxZone].pct)
    };
};

const getZoneMessage = (primaryZone, pct) => {
    const descriptions = {
        Z1: "Active Recovery",
        Z2: "Endurance",
        Z3: "Tempo",
        Z4: "Threshold",
        Z5: "VO2 Max"
    };
    return `You spent **${pct}%** of this activity in **Zone ${primaryZone.slice(1)}** (${descriptions[primaryZone]}).`;
};

const analyzeTrainingLoad = (activity, stats) => {
    if (!stats || stats.length === 0) return null;

    // Calculate "Normal" Load (Avg kJ per activity over last 6 weeks)
    // We use total work divided by total count of activities
    let totalWork = 0;
    let totalCount = 0;

    stats.forEach(week => {
        totalWork += parseFloat(week.totalCalories || 0);
        totalCount += week.count;
    });

    if (totalCount === 0) return null;

    const avgWorkPerSession = totalWork / totalCount;
    const currentWork = parseFloat(activity.totalCalories || 0);

    const loadRatio = currentWork / avgWorkPerSession;

    let status = "Normal";
    let recommendation = "Maintain your current training rhythm.";

    if (loadRatio > 1.4) {
        status = "High";
        recommendation = "This was a very high load session (>40% above average). **Recommendation: Prioritize recovery (sleep/nutrition) and consider a light day tomorrow.**";
    } else if (loadRatio < 0.6) {
        status = "Low";
        recommendation = "This was a lighter recovery-style session. **Recommendation: You should be fresh for a harder effort tomorrow.**";
    } else {
        recommendation = "Good solid training session. **Recommendation: Standard recovery and hydration.**";
    }

    return {
        status,
        recommendation,
        avgWork: avgWorkPerSession.toFixed(0),
        currentWork: currentWork.toFixed(0)
    };
};

const analyzeHistory = (activity, stats) => {
    if (!stats || stats.length === 0) return null;

    const validEFWeeks = stats.filter(week => week.efficiencyFactor > 0);

    if (validEFWeeks.length === 0) return null;

    const totalEF = validEFWeeks.reduce((sum, week) => sum + parseFloat(week.efficiencyFactor), 0);
    const avgEF = totalEF / validEFWeeks.length;

    const currentEF = parseFloat(activity.efficiencyFactor || 0);

    if (avgEF === 0 || currentEF === 0) return null;

    const improvement = ((currentEF - avgEF) / avgEF) * 100;

    return {
        avgEF: avgEF.toFixed(2),
        currentEF: currentEF.toFixed(2),
        improvement: improvement.toFixed(1),
        message: getHistoryMessage(improvement, avgEF.toFixed(2))
    };
};

const getHistoryMessage = (improvement, avgEF) => {
    if (improvement > 5) {
        return `Strong performance! Your Efficiency Factor is ${improvement.toFixed(2)}% higher than your 6-week average (${avgEF}).`;
    } else if (improvement < -5) {
        return `Your Efficiency Factor is ${Math.abs(improvement).toFixed(2)}% lower than your 6-week average (${avgEF}). Monitor your fatigue levels.`;
    } else {
        return `Your efficiency (${avgEF}) is consistent with your recent training history.`;
    }
};

const analyzeCardiacDrift = (laps) => {
    const workLaps = laps.filter(lap => lap.moving_time > 120 && lap.average_watts > 50);

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

const calculateAverageEF = (laps) => {
    const totalEF = laps.reduce((sum, lap) => {
        const ef = (lap.average_watts && lap.average_heartrate)
            ? lap.average_watts / lap.average_heartrate
            : 0;
        return sum + ef;
    }, 0);
    return totalEF / laps.length;
};

const calculateAveragePower = (laps) => {
    const totalPower = laps.reduce((sum, lap) => sum + (lap.average_watts || 0), 0);
    return totalPower / laps.length;
};

const getDecouplingMessage = (decoupling, powerDiff) => {
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

const analyzeCompliance = (laps) => {
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

const generateNaturalLanguageFeedback = (activity, drift, compliance, history, load, zones) => {
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
        if (drift.decoupling > 5) {
            lines.push(`(Decoupling: ${drift.decoupling}%)`);
        }
    }

    if (compliance) {
        lines.push(`\n**Workout Compliance**: ${compliance}`);
    }

    return lines.join('\n');
};

/**
 * Calculate performance metrics combining weight and training data
 * @param {Object} currentStats - Current week's training stats
 * @param {Object} latestWeight - Latest Withings weight data (weight, fatRatio, muscleMass)
 * @param {Array} bodyComposition - Historical body composition data
 * @param {Array} allStats - All weeks' training stats
 * @returns {Object} Performance metrics
 */
export const calculatePerformanceMetrics = (currentStats, latestWeight, bodyComposition = [], allStats = []) => {
    const metrics = {
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
    const efficiencyFactor = parseFloat(currentStats.efficiencyFactor) || 0;

    // 1. Power-to-Weight Ratio (W/kg)
    if (avgPower > 0 && weight > 0) {
        metrics.powerToWeight = (avgPower / weight).toFixed(2);
    }

    // 2. Efficiency per kg - normalized efficiency
    if (efficiencyFactor > 0 && weight > 0) {
        metrics.efficiencyPerKg = ((efficiencyFactor * 100) / weight).toFixed(2);
    }

    // 3. Weight Trend (if we have historical data)
    if (bodyComposition.length >= 2) {
        const sortedByDate = [...bodyComposition].filter(d => d.weight).sort((a, b) => {
            // Sort by week label (assuming format "DD/MM")
            const [aDay, aMonth] = a.week.split('/').map(Number);
            const [bDay, bMonth] = b.week.split('/').map(Number);
            return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
        });

        if (sortedByDate.length >= 2) {
            const firstWeight = sortedByDate[0].weight;
            const lastWeight = sortedByDate[sortedByDate.length - 1].weight;
            const weightChange = lastWeight - firstWeight;

            metrics.weightTrend = {
                change: weightChange.toFixed(1),
                direction: weightChange > 0.5 ? 'up' : weightChange < -0.5 ? 'down' : 'stable',
                startWeight: firstWeight,
                endWeight: lastWeight,
                weeks: sortedByDate.length
            };
        }

        // Body composition trends (fat & muscle)
        const withFatRatio = sortedByDate.filter(d => d.fatRatio);
        const withMuscleMass = sortedByDate.filter(d => d.muscleMass);

        if (withFatRatio.length >= 2) {
            const fatChange = withFatRatio[withFatRatio.length - 1].fatRatio - withFatRatio[0].fatRatio;
            metrics.bodyCompTrend = metrics.bodyCompTrend || {};
            metrics.bodyCompTrend.fatChange = fatChange.toFixed(1);
            metrics.bodyCompTrend.fatDirection = fatChange > 0.5 ? 'up' : fatChange < -0.5 ? 'down' : 'stable';
        }

        if (withMuscleMass.length >= 2) {
            const muscleChange = withMuscleMass[withMuscleMass.length - 1].muscleMass - withMuscleMass[0].muscleMass;
            metrics.bodyCompTrend = metrics.bodyCompTrend || {};
            metrics.bodyCompTrend.muscleChange = muscleChange.toFixed(1);
            metrics.bodyCompTrend.muscleDirection = muscleChange > 0.5 ? 'up' : muscleChange < -0.5 ? 'down' : 'stable';
        }
    }

    // 4. Power-to-Weight trend over time (if we have both weight and power history)
    if (allStats.length >= 2 && bodyComposition.length >= 1) {
        // Find matching weeks
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
            const firstPW = matchedWeeks[0].powerToWeight;
            const lastPW = matchedWeeks[matchedWeeks.length - 1].powerToWeight;
            const pwChange = ((lastPW - firstPW) / firstPW) * 100;

            metrics.powerToWeightTrend = {
                change: pwChange.toFixed(1),
                direction: pwChange > 2 ? 'improving' : pwChange < -2 ? 'declining' : 'stable'
            };
        }
    }

    // 5. Generate performance insight
    metrics.performanceInsight = generatePerformanceInsight(metrics, latestWeight, currentStats);

    return metrics;
};

/**
 * Generate human-readable performance insight based on metrics
 */
const generatePerformanceInsight = (metrics, weightData, stats) => {
    const insights = [];

    // Power-to-Weight context
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

    // Weight trend insight
    if (metrics.weightTrend) {
        const trend = metrics.weightTrend;
        if (trend.direction === 'down') {
            insights.push(`📉 Gewicht: **${trend.change} kg** über ${trend.weeks} Wochen – gut für W/kg!`);
        } else if (trend.direction === 'up') {
            insights.push(`📈 Gewicht: **+${Math.abs(trend.change)} kg** – prüfe ob Muskelaufbau oder Fett.`);
        }
    }

    // Body composition insight
    if (metrics.bodyCompTrend) {
        const bc = metrics.bodyCompTrend;
        if (bc.fatDirection === 'down' && bc.muscleDirection !== 'down') {
            insights.push(`✅ Ideale Körperkomposition: Fett ↓ ${Math.abs(bc.fatChange)}%`);
        } else if (bc.muscleDirection === 'up') {
            insights.push(`💪 Muskelaufbau: +${bc.muscleChange} kg`);
        }
    }

    // Power-to-Weight trend
    if (metrics.powerToWeightTrend?.direction === 'improving') {
        insights.push(`🚀 W/kg verbessert sich um ${metrics.powerToWeightTrend.change}%!`);
    }

    return insights.length > 0 ? insights : null;
};

export const analyzeOverallProgress = (stats, weightData = null, bodyComposition = []) => {
    if (!stats || stats.length < 2) {
        return {
            status: "Insufficient Data",
            message: "Keep training! I need a few more weeks of data to analyze your long-term trends.",
            nextStep: "Keep logging consistent rides.",
            color: "bg-gray-50 border-gray-200",
            weightInsight: null
        };
    }

    // stats are Oldest -> Newest
    const recentWeeks = stats.slice(-4); // Last 4 weeks
    const currentWeek = recentWeeks[recentWeeks.length - 1];
    const previousWeeks = recentWeeks.slice(0, recentWeeks.length - 1);

    // Calculate baseline EF (avg of previous weeks)
    const validEFWeeks = previousWeeks.filter(w => w.efficiencyFactor > 0);
    const baselineEF = validEFWeeks.length > 0
        ? validEFWeeks.reduce((sum, w) => sum + parseFloat(w.efficiencyFactor), 0) / validEFWeeks.length
        : 0;

    const currentEF = parseFloat(currentWeek.efficiencyFactor || 0);

    // Calculate Volume Baseline
    const baselineWork = previousWeeks.reduce((sum, w) => sum + parseFloat(w.totalCalories), 0) / previousWeeks.length;
    const currentWork = parseFloat(currentWeek.totalCalories || 0);

    // Logic
    let status = "Maintaining";
    let message = "Your fitness is stable.";
    let nextStep = "Continue current training.";
    let color = "bg-blue-50 border-blue-200";

    // Zone Analysis (based on current week's accumulated distribution)
    const z1Pct = parseFloat(currentWeek.zonePcts?.Z1 || 0);
    const z2Pct = parseFloat(currentWeek.zonePcts?.Z2 || 0);
    const z3Pct = parseFloat(currentWeek.zonePcts?.Z3 || 0);
    const z4Pct = parseFloat(currentWeek.zonePcts?.Z4 || 0);
    const z5Pct = parseFloat(currentWeek.zonePcts?.Z5 || 0);

    // Calculate polarization (Z1+Z2 for base, Z4+Z5 for intensity)
    const basePct = z1Pct + z2Pct;
    const intensityPct = z4Pct + z5Pct;

    // Generate zone-based training recommendation
    let zoneRecommendation = "";

    if (z2Pct < 30) {
        zoneRecommendation = "🚴 **Mehr Zone 2 Training!** Aktuell nur " + z2Pct + "% - füge 1-2 längere Grundlagen-Einheiten (60-90min bei Z2) pro Woche hinzu.";
    } else if (z2Pct < 45) {
        zoneRecommendation = "💡 **Etwas mehr Zone 2 empfohlen** (aktuell " + z2Pct + "%). Versuche eine Einheit pro Woche länger im Z2 zu fahren.";
    } else if (z2Pct >= 60 && intensityPct < 10) {
        zoneRecommendation = "⚡ **Gute Z2-Basis!** Zeit für mehr Intensität: Füge 1x Intervall-Training (z.B. 4x4min Z5) hinzu.";
    }

    if (z3Pct > 35) {
        zoneRecommendation = "⚠️ **Zu viel 'Grey Zone' (Z3: " + z3Pct + "%)!** Trainiere entweder leichter (Z2) oder härter (Z4/Z5). 80/20 Regel beachten!";
    } else if (z3Pct > 25 && z2Pct < 50) {
        zoneRecommendation = "💡 **Grey Zone reduzieren!** Weniger Z3 (" + z3Pct + "%), mehr Z2 oder strukturierte Intervalle.";
    }

    if (z5Pct > 15) {
        zoneRecommendation = "🔥 **Hohe Z5-Belastung!** Diese Woche Recovery priorisieren: 2-3 lockere Z1/Z2 Einheiten.";
    } else if (intensityPct > 30) {
        zoneRecommendation = "⚠️ **Viel Intensität!** Nächste Woche: Mehr easy rides (Z1/Z2) für optimale Erholung.";
    }

    if (baselineEF > 0 && currentEF > 0) {
        const efChange = ((currentEF - baselineEF) / baselineEF) * 100;

        if (efChange > 2) {
            status = "Building Fitness";
            message = `Great job! Your Efficiency Factor has improved by **${efChange.toFixed(1)}%**.`;
            nextStep = zoneRecommendation || "Du machst alles richtig! Halte die Balance zwischen Z2-Grundlagen und gelegentlichen Intervallen.";
            color = "bg-green-50 border-green-200";
        } else if (efChange < -3) {
            if (currentWork > baselineWork * 1.2) {
                status = "High Load / Fatigue";
                message = `Deine Effizienz ist gesunken bei hohem Trainingsvolumen.`;
                nextStep = zoneRecommendation || "**Erholung priorisieren!** 1-2 Ruhetage oder nur leichte Z1/Z2 Einheiten diese Woche.";
                color = "bg-orange-50 border-orange-200";
            } else {
                status = "Stagnating / Detraining";
                message = `Deine Effizienz ist leicht gesunken.`;
                nextStep = zoneRecommendation || "**Mehr Konsistenz!** Mindestens 3x pro Woche fahren, davon 2x längere Z2-Einheiten.";
                color = "bg-gray-100 border-gray-300";
            }
        } else {
            // Stable EF (-3% to 2%)
            if (currentWork > baselineWork * 1.1) {
                status = "Productive Load";
                message = `Du steigerst das Volumen bei stabiler Effizienz.`;
                nextStep = zoneRecommendation || "Weiter so! Erhöhe die längste Einheit um 15-30 Minuten oder füge eine Intervall-Session hinzu.";
                color = "bg-indigo-50 border-indigo-200";
            } else {
                status = "Plateau / Maintenance";
                message = `Deine Fitness ist stabil.`;
                nextStep = zoneRecommendation || "**Plateau durchbrechen:** Entweder mehr Z2-Volumen ODER intensivere Intervalle (2x20min Tempo oder 4x4min VO2max).";
                color = "bg-blue-50 border-blue-200";
            }
        }
    }

    // Weight Analysis
    let weightInsight = null;
    if (weightData && weightData.weight) {
        const currentWeight = weightData.weight;
        weightInsight = {
            current: currentWeight,
            message: `Aktuelles Gewicht: **${currentWeight} kg**`
        };

        // If we have fat ratio, add body composition context
        if (weightData.fatRatio) {
            const fatRatio = weightData.fatRatio;
            if (fatRatio < 15) {
                weightInsight.message += ` (Fett: ${fatRatio}% - athletisch)`;
            } else if (fatRatio < 20) {
                weightInsight.message += ` (Fett: ${fatRatio}% - gut)`;
            } else if (fatRatio < 25) {
                weightInsight.message += ` (Fett: ${fatRatio}% - moderat)`;
            } else {
                weightInsight.message += ` (Fett: ${fatRatio}%)`;
            }
        }

        // Add performance context
        if (currentEF > 0 && currentWeight > 0) {
            const powerToWeight = (currentEF * 100) / currentWeight; // Rough estimate
            weightInsight.performanceNote = `Tipp: Jedes kg weniger = mehr Watt/kg auf Anstiegen.`;
        }
    }

    return { status, message, nextStep, color, weightInsight };
};
