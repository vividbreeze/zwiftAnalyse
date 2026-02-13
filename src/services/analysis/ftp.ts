// FTP estimation based on training data
import type { WeeklyStats, EnrichedActivity } from '../../types';

export interface FTPEstimate {
    estimatedFTP: number;
    confidence: 'high' | 'medium' | 'low';
    method: string;
    explanation: string;
    recommendation: string;
}

/**
 * Check for training break and detraining effects
 */
const checkForDetraining = (stats: WeeklyStats[], currentFTP: number): FTPEstimate | null => {
    if (!stats || stats.length === 0) return null;

    // Find last activity across all weeks
    let lastActivityDate: Date | null = null;
    for (let i = stats.length - 1; i >= 0; i--) {
        const activities = stats[i].activities || [];
        if (activities.length > 0) {
            const mostRecent = activities[activities.length - 1];
            lastActivityDate = new Date(mostRecent.start_date);
            break;
        }
    }

    if (!lastActivityDate) return null;

    const daysSinceLastActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    // Significant break detected (>14 days)
    if (daysSinceLastActivity >= 14) {
        // Estimate FTP loss: ~1-2% per week of inactivity
        const weeksOff = Math.floor(daysSinceLastActivity / 7);
        const ftpLossPercent = Math.min(weeksOff * 1.5, 15); // Max 15% loss
        const estimatedFTP = Math.round(currentFTP * (1 - ftpLossPercent / 100));

        return {
            estimatedFTP,
            confidence: 'medium',
            method: 'Trainingspause-Anpassung',
            explanation: `${daysSinceLastActivity} Tage ohne Training (≈${weeksOff} Wochen)`,
            recommendation: `⚠️ Nach ${daysSinceLastActivity} Tagen Pause empfehle ich FTP auf **${estimatedFTP}W** zu senken (war: ${currentFTP}W). Detraining-Effekt: ~${Math.round(ftpLossPercent)}%. Starte sanft und teste nach 2-3 Wochen neu!`
        };
    }

    // Moderate break (7-13 days)
    if (daysSinceLastActivity >= 7) {
        const estimatedFTP = Math.round(currentFTP * 0.97); // ~3% reduction

        return {
            estimatedFTP,
            confidence: 'low',
            method: 'Kurze Pause',
            explanation: `${daysSinceLastActivity} Tage Trainingspause`,
            recommendation: `💡 Nach ${daysSinceLastActivity} Tagen Pause: Starte mit reduzierten Intensitäten. Wenn die ersten Einheiten schwerfallen, senke FTP vorübergehend auf **${estimatedFTP}W**.`
        };
    }

    return null;
};

/**
 * Estimate FTP from training data using multiple methods
 * Returns the most reliable estimate based on available data
 */
export const estimateFTP = (stats: WeeklyStats[], currentFTP: number): FTPEstimate | null => {
    if (!stats || stats.length === 0) {
        return null;
    }

    // First check for detraining from long breaks
    const detrainingEstimate = checkForDetraining(stats, currentFTP);
    if (detrainingEstimate) {
        return detrainingEstimate;
    }

    // Collect all activities from recent weeks (last 4 weeks for freshness)
    const recentWeeks = stats.slice(-4);
    const allActivities = recentWeeks.flatMap(week => week.activities);

    if (allActivities.length === 0) {
        return null;
    }

    // Check for performance decline indicators
    const activitiesWithEfficiency = allActivities.filter(a => a.efficiencyFactor && parseFloat(a.efficiencyFactor) > 0);
    if (activitiesWithEfficiency.length >= 3) {
        // Compare recent efficiency to older efficiency
        const recentActivities = activitiesWithEfficiency.slice(-3);
        const olderActivities = stats.length >= 8 ? stats.slice(-8, -4).flatMap(w => w.activities || []).filter(a => a.efficiencyFactor && parseFloat(a.efficiencyFactor) > 0) : [];

        if (olderActivities.length >= 3) {
            const recentAvgEff = recentActivities.reduce((sum, a) => sum + parseFloat(a.efficiencyFactor), 0) / recentActivities.length;
            const olderAvgEff = olderActivities.reduce((sum, a) => sum + parseFloat(a.efficiencyFactor), 0) / Math.min(olderActivities.length, 3);

            // Significant decline in efficiency (>10% drop)
            if (recentAvgEff < olderAvgEff * 0.90) {
                const declinePercent = Math.round((1 - recentAvgEff / olderAvgEff) * 100);
                const estimatedFTP = Math.round(currentFTP * (recentAvgEff / olderAvgEff));

                return {
                    estimatedFTP,
                    confidence: 'medium',
                    method: 'Effizienz-Analyse',
                    explanation: `Effizienz-Faktor gefallen: ${olderAvgEff.toFixed(1)} → ${recentAvgEff.toFixed(1)} (-${declinePercent}%)`,
                    recommendation: `⚠️ Deine Effizienz ist um ${declinePercent}% gesunken. Das deutet auf Ermüdung, Übertraining oder Krankheit hin. Reduziere FTP vorübergehend auf **${estimatedFTP}W** und gönne dir mehr Erholung.`
                };
            }
        }
    }

    // Method 1: Find threshold workouts (Z4 > 30% of time, duration > 30min)
    const thresholdWorkouts = allActivities.filter(activity => {
        const z4Pct = Number(activity.zonePcts?.Z4 || 0);
        const durationMin = activity.moving_time / 60;
        return z4Pct > 30 && durationMin > 30 && activity.weighted_average_watts;
    });

    if (thresholdWorkouts.length > 0) {
        // Use weighted average watts from threshold workouts
        const avgWatts = thresholdWorkouts.reduce((sum, a) => sum + (a.weighted_average_watts || 0), 0) / thresholdWorkouts.length;
        const estimatedFTP = Math.round(avgWatts * 0.95); // Typically slightly below weighted avg

        return {
            estimatedFTP,
            confidence: 'high',
            method: 'Schwellenintervalle',
            explanation: `Basierend auf ${thresholdWorkouts.length} Schwellen-Einheiten mit ≥30% Z4-Zeit`,
            recommendation: estimatedFTP > currentFTP * 1.05
                ? `🎉 Dein FTP ist wahrscheinlich **${estimatedFTP}W** (aktuell: ${currentFTP}W). Erwäge einen FTP-Test zur Bestätigung!`
                : estimatedFTP < currentFTP * 0.95
                ? `⚠️ Geschätzter FTP: **${estimatedFTP}W** (aktuell: ${currentFTP}W). Möglicherweise zu hoch eingestellt oder du bist ermüdet.`
                : `✅ Dein FTP von **${currentFTP}W** scheint gut zu passen (geschätzt: ${estimatedFTP}W).`
        };
    }

    // Method 2: Use longer rides with good power (>45min, avg watts available)
    const longerRides = allActivities.filter(activity => {
        const durationMin = activity.moving_time / 60;
        return durationMin > 45 && activity.weighted_average_watts && activity.weighted_average_watts > 100;
    });

    if (longerRides.length > 0) {
        // FTP is typically 88-92% of average power on long rides
        const avgWatts = longerRides.reduce((sum, a) => sum + (a.weighted_average_watts || 0), 0) / longerRides.length;
        const estimatedFTP = Math.round(avgWatts * 0.90);

        return {
            estimatedFTP,
            confidence: 'medium',
            method: 'Lange Ausfahrten',
            explanation: `Basierend auf ${longerRides.length} Fahrten >45min (Ø${Math.round(avgWatts)}W)`,
            recommendation: estimatedFTP > currentFTP * 1.05
                ? `🔄 Geschätzter FTP: **${estimatedFTP}W** (aktuell: ${currentFTP}W). Mache einen 20min-Test zur Bestätigung!`
                : estimatedFTP < currentFTP * 0.95
                ? `⚠️ Geschätzter FTP: **${estimatedFTP}W** (aktuell: ${currentFTP}W). Prüfe deine Einstellung.`
                : `✅ Dein FTP von **${currentFTP}W** passt gut (geschätzt: ${estimatedFTP}W).`
        };
    }

    // Method 3: Use recent best efforts (highest weighted avg watts)
    const activitiesWithPower = allActivities.filter(a => a.weighted_average_watts && a.weighted_average_watts > 100);

    if (activitiesWithPower.length > 0) {
        // Take top 3 best efforts
        const sorted = [...activitiesWithPower].sort((a, b) =>
            (b.weighted_average_watts || 0) - (a.weighted_average_watts || 0)
        );
        const top3 = sorted.slice(0, 3);
        const avgBest = top3.reduce((sum, a) => sum + (a.weighted_average_watts || 0), 0) / top3.length;
        const estimatedFTP = Math.round(avgBest * 0.85); // Conservative estimate

        return {
            estimatedFTP,
            confidence: 'low',
            method: 'Beste Leistungen',
            explanation: `Basierend auf Top-3 gewichteten Durchschnittsleistungen (Ø${Math.round(avgBest)}W)`,
            recommendation: `💡 Geschätzter FTP: **${estimatedFTP}W** (aktuell: ${currentFTP}W). Unsichere Schätzung - mache einen strukturierten 20min-Test für genaue Werte!`
        };
    }

    return null;
};

/**
 * Calculate FTP zones for display
 */
export const calculateFTPZones = (ftp: number) => {
    return {
        recovery: { min: 0, max: Math.round(ftp * 0.55), label: 'Recovery (<55%)' },
        endurance: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75), label: 'Endurance (56-75%)' },
        tempo: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90), label: 'Tempo (76-90%)' },
        threshold: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05), label: 'Threshold (91-105%)' },
        vo2max: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20), label: 'VO2max (106-120%)' },
        anaerobic: { min: Math.round(ftp * 1.21), max: 999, label: 'Anaerobic (>121%)' }
    };
};
