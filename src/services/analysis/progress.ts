// analysis/progress.ts
import type { WeeklyStats, EnrichedActivity, LatestWeight, BodyCompositionEntry, OverallProgress, WeightInsight, BloodPressureEntry, BloodPressureInsight, AppSettings } from '../../types';

/**
 * Get German label for training goal
 */
const getGoalLabel = (goal: string): string => {
    const labels: Record<string, string> = {
        'general_fitness': 'Allgemeine Fitness',
        'weight_loss': 'Gewicht verlieren',
        'increase_ftp': 'FTP steigern',
        'build_endurance': 'Ausdauer aufbauen',
        'improve_vo2max': 'VO2max verbessern',
        'build_base': 'Grundlagenausdauer aufbauen',
        'race_prep': 'Wettkampfvorbereitung',
        'maintenance': 'Formerhaltung'
    };
    return labels[goal] || goal;
};

/**
 * Generate goal-specific training recommendations based on zone distribution
 */
const getGoalSpecificRecommendation = (
    goal: string,
    z2Pct: number,
    z3Pct: number,
    z4Pct: number,
    z5Pct: number,
    intensityPct: number,
    weekCount: number = 0
): string => {
    // Build critical warnings (if any)
    let criticalWarning = '';
    if (z3Pct > 30) {
        criticalWarning = `⚠️ **Vermeide 'Junk Miles'!** ${z3Pct}% deiner Zeit war in Zone 3 (Grey Zone). Fahre entweder wirklich locker (Z2) oder gezielt hart (Z4), aber weniger dazwischen.`;
    } else if (z5Pct > 20) {
        criticalWarning = `🔥 **Vorsicht, Ausbrennen droht!** Über 20% in Zone 5 ist extrem hart. Reduziere die Intensität nächste Woche und fahre mehr lockere Kilometer zur Erholung.`;
    }

    // Goal-specific recommendations
    let goalRecommendation = '';
    switch (goal) {
        case 'weight_loss':
            if (z2Pct < 60) {
                goalRecommendation = `🔥 **Fettverbrennung optimieren:** Für Gewichtsverlust sind lange, lockere Einheiten in Zone 2 ideal (aktuell ${z2Pct}%). Ziel: 60-70% in Z2, 3-5 Einheiten/Woche à 60-90min.`;
            } else if (intensityPct < 5) {
                goalRecommendation = `✅ **Gute Basis!** ${z2Pct}% Z2 ist perfekt für Fettverbrennung. Füge 1x/Woche ein kurzes Intervall (20-30min Z4) hinzu, um den Stoffwechsel anzukurbeln.`;
            } else {
                goalRecommendation = `✅ **Super für Gewichtsverlust!** Mix aus viel Z2 (${z2Pct}%) und etwas Intensität (${intensityPct}%) ist optimal. Kombiniere mit Kaloriendefizit für beste Ergebnisse.`;
            }
            break;

        case 'increase_ftp':
            if (intensityPct < 15) {
                goalRecommendation = `⚡ **Mehr Schwellentraining nötig!** Für FTP-Steigerung sind 2-3 intensive Einheiten/Woche essentiell. Aktuell nur ${intensityPct}% in Z4/Z5. Empfehlung: 2x Sweet Spot (Z4, 2x20min) + 1x VO2max (Z5, 5x5min).`;
            } else if (z2Pct < 40) {
                goalRecommendation = `⚠️ **Basis fehlt!** FTP-Training braucht eine solide aerobe Grundlage. Aktuell nur ${z2Pct}% in Z2. Füge 1-2 lockere Regenerationsfahrten hinzu, sonst droht Übertraining.`;
            } else {
                goalRecommendation = `✅ **Guter FTP-Mix!** ${intensityPct}% Intensität + ${z2Pct}% Grundlage. Progression: Steigere Intervall-Dauer (z.B. von 2x20min auf 2x25min) alle 2 Wochen.`;
            }
            break;

        case 'build_endurance':
            if (z2Pct < 70) {
                goalRecommendation = `🚴 **Mehr Grundlagenausdauer!** Für Ausdauer-Aufbau sollten 70-80% deiner Zeit in Zone 2 sein (aktuell ${z2Pct}%). Plane 1-2 lange Ausfahrten (2-4h) pro Woche ein.`;
            } else if (intensityPct > 15) {
                goalRecommendation = `⚠️ **Zu viel Intensität!** Ausdauer-Aufbau braucht vor allem Volumen in Z2 (${intensityPct}% in Z4/Z5 ist zu viel). Reduziere harte Einheiten auf 1x/Woche max.`;
            } else {
                goalRecommendation = `✅ **Perfekt für Ausdauer!** ${z2Pct}% Z2 ist ideal. Steigere schrittweise die Dauer der langen Ausfahrt (max. +10% pro Woche).`;
            }
            break;

        case 'improve_vo2max':
            if (z5Pct < 10) {
                goalRecommendation = `🚀 **Mehr VO2max-Arbeit!** Für VO2max-Steigerung brauchst du 2-3x/Woche kurze, harte Intervalle in Z5 (aktuell ${z5Pct}%). Beispiel: 5-8x3min @ 105-120% FTP mit 3min Pause.`;
            } else if (z2Pct < 50) {
                goalRecommendation = `⚠️ **Erholung wichtig!** VO2max-Training ist sehr intensiv - du brauchst genug lockere Kilometer zur Regeneration (aktuell ${z2Pct}% in Z2). Ziel: 50-60% Z2.`;
            } else {
                goalRecommendation = `✅ **Gutes VO2max-Training!** ${z5Pct}% Z5 + ${z2Pct}% Z2. Achte auf vollständige Erholung zwischen harten Tagen (48h+ zwischen Z5-Sessions).`;
            }
            break;

        case 'build_base':
            if (z2Pct < 75) {
                goalRecommendation = `🚴 **Basisphase: Mehr Geduld!** In der Grundlagenphase sollten 75-85% in Zone 2 sein (aktuell ${z2Pct}%). Fokus auf Volumen (Stunden), nicht Intensität. Dauer: 8-12 Wochen.`;
            } else if (intensityPct > 10) {
                goalRecommendation = `⚠️ **Zu früh zu hart!** Basisphase bedeutet fast nur Z2 (${intensityPct}% Intensität ist zu viel). Lass die Intervalle weg - sie kommen später. Jetzt: Aerobe Kapazität aufbauen!`;
            } else {
                goalRecommendation = `✅ **Perfekte Basisphase!** ${z2Pct}% Z2 ist genau richtig. Bleib geduldig - diese Basis zahlt sich später aus. Ziel: 10-15h/Woche in Z2 über 8-12 Wochen.`;
            }
            break;

        case 'race_prep':
            if (intensityPct < 20) {
                goalRecommendation = `🏁 **Wettkampf-Härte fehlt!** Rennvorbereitung braucht spezifisches Training: 20-25% in Z4/Z5 (aktuell ${intensityPct}%). Simuliere Rennsituationen: Sprint-Serien, VO2max-Intervalle, Schwellen-Arbeit.`;
            } else if (z2Pct < 35) {
                goalRecommendation = `⚠️ **Übertraining-Risiko!** Auch in der Wettkampfphase sind 35-45% Z2 wichtig für Erholung (aktuell ${z2Pct}%). Sonst gehst du platt ins Rennen!`;
            } else {
                goalRecommendation = `✅ **Race-Ready!** ${intensityPct}% Intensität + ${z2Pct}% Erholung. 2-3 Wochen vor dem Event: Tapering (Volumen -40%, Intensität halten).`;
            }
            break;

        case 'maintenance':
            if (weekCount < 2) {
                goalRecommendation = `⚠️ **Mehr Frequenz!** Für Formerhaltung: min. 2-3 Einheiten/Woche. Aktuell: ${weekCount}x. Lieber 3x kurz (45min) als 1x lang.`;
            } else if (z2Pct < 50 || intensityPct < 5) {
                goalRecommendation = `🔄 **Balance verbessern:** Für Erhaltung ideal: 50-60% Z2 + 10-15% Intensität. Mix aus lockeren Runden und 1-2 kurzen intensiven Sessions/Woche.`;
            } else {
                goalRecommendation = `✅ **Gute Erhaltung!** Du hältst deine Form mit minimalem Aufwand. Behalte 2-3 Einheiten/Woche bei, davon 1x intensiv.`;
            }
            break;

        case 'general_fitness':
        default:
            // Original generic recommendations
            if (z2Pct < 40) {
                goalRecommendation = `🚴 **Grundlagen-Fokus fehlt!** Nur ${z2Pct}% deiner Zeit war in Zone 2. Versuche, 1-2 ruhige Einheiten (60-90min) einzubauen, um die aerobe Basis zu stärken.`;
            } else if (z2Pct >= 60 && intensityPct < 10) {
                goalRecommendation = `⚡ **Basis ist stark, Intensität fehlt!** Du hast eine super Grundlage (${z2Pct}% Z2). Füge jetzt 1x pro Woche Intervalle (z.B. 4x8min Z4) hinzu, um die Schwelle zu heben.`;
            } else {
                goalRecommendation = `✅ **Super Balance!** Dein Mix aus Grundlage und Intensität passt gut. Behalte diesen Rhythmus bei und steigere langsam das Volumen.`;
            }
            break;
    }

    // Combine critical warning with goal-specific recommendation
    if (criticalWarning) {
        return `${criticalWarning}\n\n**Für dein Ziel '${getGoalLabel(goal)}':** ${goalRecommendation}`;
    }
    return goalRecommendation;
};

export const analyzeOverallProgress = (stats: WeeklyStats[], weightData: LatestWeight | null = null, bodyComposition: BodyCompositionEntry[] = [], bloodPressureData: BloodPressureEntry[] = [], settings?: AppSettings): OverallProgress => {
    if (!stats || stats.length < 2) {
        return {
            status: "Insufficient Data",
            message: "Keep training! I need a few more weeks of data to analyze your long-term trends.",
            nextStep: "Keep logging consistent rides.",
            color: "bg-gray-50 border-gray-200",
            weightInsight: null
        };
    }

    const recentWeeks = stats.slice(-4);
    const currentWeek = recentWeeks[recentWeeks.length - 1];
    const previousWeeks = recentWeeks.slice(0, recentWeeks.length - 1);

    // Check for training break
    let lastActivityDate: Date | null = null;
    for (let i = stats.length - 1; i >= 0; i--) {
        const activities = stats[i].activities || [];
        if (activities.length > 0) {
            const mostRecent = activities[activities.length - 1];
            lastActivityDate = new Date(mostRecent.start_date);
            break;
        }
    }

    if (lastActivityDate) {
        const daysSinceLastActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        const trainingGoal = settings?.trainingGoal || 'general_fitness';

        // Long break detected (>14 days)
        if (daysSinceLastActivity >= 14) {
            const weeksOff = Math.floor(daysSinceLastActivity / 7);
            return {
                status: "Trainingspause",
                message: `Du hast seit ${daysSinceLastActivity} Tagen (${weeksOff} Wochen) nicht trainiert. Dein Körper hat sich wahrscheinlich dezent angepasst - das ist normal nach Urlaub, Krankheit oder Pause.`,
                nextStep: `Starte wieder sanft: 1-2 Wochen nur lockeres Z2-Training (50-60min). Reduziere deine FTP-Einstellung um ca. 5-10% für den Wiedereinstieg. Nach 2 Wochen kontinuierlichem Training kannst du die Intensität wieder steigern und einen FTP-Test machen.`,
                color: "bg-yellow-50 border-yellow-300",
                weightInsight: null
            };
        }

        // Moderate break (7-13 days)
        if (daysSinceLastActivity >= 7) {
            return {
                status: "Kurze Pause",
                message: `${daysSinceLastActivity} Tage ohne Training. Kurze Pausen sind gut für die Erholung, aber pass auf, dass daraus keine längere Auszeit wird.`,
                nextStep: `Starte mit reduzierten Intensitäten: Erste Einheit locker in Z2 (45-60min), dann langsam wieder zu deinem normalen Plan zurück. Ziel: ${getGoalLabel(trainingGoal)}.`,
                color: "bg-blue-50 border-blue-200",
                weightInsight: null
            };
        }
    }

    const validEFWeeks = previousWeeks.filter(w => w.efficiencyFactor > 0);
    const baselineEF = validEFWeeks.length > 0
        ? validEFWeeks.reduce((sum, w) => sum + w.efficiencyFactor, 0) / validEFWeeks.length
        : 0;

    const currentEF = currentWeek.efficiencyFactor || 0;
    const baselineWork = previousWeeks.reduce((sum, w) => sum + (w.totalCalories || 0), 0) / previousWeeks.length;
    const currentWork = currentWeek.totalCalories || 0;

    let status = "Maintaining";
    let message = "Your fitness is stable.";
    let nextStep = "Continue current training.";
    let color = "bg-blue-50 border-blue-200";

    // Zone Analysis logic
    const z2Pct = Number(currentWeek.zonePcts?.Z2 || 0);
    const z3Pct = Number(currentWeek.zonePcts?.Z3 || 0);
    const z4Pct = Number(currentWeek.zonePcts?.Z4 || 0);
    const z5Pct = Number(currentWeek.zonePcts?.Z5 || 0);
    const intensityPct = z4Pct + z5Pct;

    // Goal-specific zone recommendations
    const trainingGoal = settings?.trainingGoal || 'general_fitness';
    let zoneRecommendation = "";

    // Generate recommendations based on training goal
    zoneRecommendation = getGoalSpecificRecommendation(trainingGoal, z2Pct, z3Pct, z4Pct, z5Pct, intensityPct, currentWeek.count);

    if (baselineEF > 0 && currentEF > 0) {
        const efChange = ((currentEF - baselineEF) / baselineEF) * 100;

        if (efChange > 2) {
            status = "Building Fitness";
            message = `Starker Trend! Deine Effizienz hat sich um **${efChange.toFixed(1)}%** verbessert.`;
            nextStep = zoneRecommendation;
            color = "bg-green-50 border-green-200";
        } else if (efChange < -3) {
            if (currentWork > baselineWork * 1.2) {
                status = "High Load / Fatigue";
                message = `Deine Effizienz sinkt bei hohem Volumen (-${Math.abs(efChange).toFixed(1)}%). Du könntest ermüdet sein.`;
                nextStep = `**Erholungswoche einplanen!** Kürze das Volumen um 30-50% und fahre nur locker (Z1/Z2), damit sich der Körper anpassen kann. Danach: ${zoneRecommendation}`;
                color = "bg-orange-50 border-orange-200";
            } else {
                status = "Stagnating";
                message = `Deine Effizienz ist leicht gesunken (-${Math.abs(efChange).toFixed(1)}%).`;
                nextStep = zoneRecommendation; // Use goal-specific recommendation!
                color = "bg-gray-100 border-gray-300";
            }
        } else {
            if (currentWork > baselineWork * 1.1) {
                status = "Productive Load";
                message = `Du steigerst das Volumen erfolgreich und hältst dabei deine Effizienz.`;
                nextStep = zoneRecommendation;
                color = "bg-indigo-50 border-indigo-200";
            } else {
                status = "Maintenance";
                message = `Deine Fitness ist stabil. Keine großen Sprünge, aber auch kein Einbruch.`;
                nextStep = zoneRecommendation; // Use goal-specific recommendation!
                color = "bg-blue-50 border-blue-200";
            }
        }
    }

    // Weight Analysis
    let weightInsight: WeightInsight | null = null;
    if (weightData && weightData.weight) {
        weightInsight = {
            current: weightData.weight,
            message: `Aktuelles Gewicht: **${weightData.weight} kg**`
        };
        if (weightData.fatRatio) {
            weightInsight.message += ` (Fett: ${weightData.fatRatio}%)`;
        }
        // Removed generic tip as per user request
    }

    // Blood Pressure Analysis
    const bloodPressureInsight = analyzeBloodPressure(bloodPressureData);

    return { status, message, nextStep, color, weightInsight, bloodPressureInsight };
};

/**
 * Analyze blood pressure trends from Withings data
 * Uses conservative thresholds and non-medical language
 */
export const analyzeBloodPressure = (bloodPressureData: BloodPressureEntry[]): BloodPressureInsight | null => {
    if (!bloodPressureData || bloodPressureData.length < 2) {
        return null; // Need at least 2 data points for trend analysis
    }

    // Get valid data points (with both systolic and diastolic)
    const validData = bloodPressureData
        .filter(d => d.systolic !== null && d.diastolic !== null && d.pulse !== null)
        .sort((a, b) => {
            const [aDay, aMonth] = a.week.split('/').map(Number);
            const [bDay, bMonth] = b.week.split('/').map(Number);
            return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
        });

    if (validData.length < 2) {
        return null;
    }

    // Get most recent reading
    const latest = validData[validData.length - 1];

    // Calculate average of earlier readings (exclude latest)
    const earlierReadings = validData.slice(0, -1);
    const avgSystolic = earlierReadings.reduce((sum, d) => sum + (d.systolic || 0), 0) / earlierReadings.length;
    const avgDiastolic = earlierReadings.reduce((sum, d) => sum + (d.diastolic || 0), 0) / earlierReadings.length;

    // Calculate trend
    const systolicChange = (latest.systolic || 0) - avgSystolic;
    const diastolicChange = (latest.diastolic || 0) - avgDiastolic;

    let trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data' = 'stable';
    let message = '';
    let trainingEffect = '';

    // Determine trend (conservative thresholds)
    if (systolicChange < -5 || diastolicChange < -3) {
        trend = 'improving';
        message = `📉 **Positiver Trend:** Dein Blutdruck zeigt eine **Verbesserung** (${Math.round(latest.systolic || 0)}/${Math.round(latest.diastolic || 0)} mmHg).`;
        trainingEffect = '💪 Regelmäßiges Ausdauertraining zeigt Wirkung - dein Herz-Kreislauf-System wird effizienter!';
    } else if (systolicChange > 5 || diastolicChange > 3) {
        trend = 'worsening';
        message = `📈 **Trend beachten:** Dein Blutdruck zeigt einen **leichten Anstieg** (${Math.round(latest.systolic || 0)}/${Math.round(latest.diastolic || 0)} mmHg).`;

        // Check if values are concerning
        if ((latest.systolic || 0) >= 140 || (latest.diastolic || 0) >= 90) {
            trainingEffect = '⚠️ **Bitte mit Arzt besprechen:** Erhöhte Werte sollten medizinisch abgeklärt werden. Übertraining ausschließen.';
        } else {
            trainingEffect = 'Mögliche Ursachen: Übertraining, Stress, zu wenig Erholung. **Regeneration beachten!**';
        }
    } else {
        trend = 'stable';
        const systolic = Math.round(latest.systolic || 0);
        const diastolic = Math.round(latest.diastolic || 0);

        if (systolic < 120 && diastolic < 80) {
            message = `✅ **Optimal:** Dein Blutdruck ist im **optimalen Bereich** (${systolic}/${diastolic} mmHg).`;
            trainingEffect = '💚 Dein Ausdauertraining hält dein Herz-Kreislauf-System gesund!';
        } else if (systolic < 130 && diastolic < 85) {
            message = `✅ **Gut:** Dein Blutdruck ist im **gesunden Bereich** (${systolic}/${diastolic} mmHg).`;
            trainingEffect = '';
        } else {
            message = `⚠️ **Grenzbereich:** Dein Blutdruck (${systolic}/${diastolic} mmHg) liegt im Grenzbereich.`;
            trainingEffect = 'Bei wiederholt erhöhten Werten bitte ärztlich abklären lassen.';
        }
    }

    return {
        current: {
            systolic: latest.systolic || 0,
            diastolic: latest.diastolic || 0,
            pulse: latest.pulse || 0
        },
        trend,
        message,
        trainingEffect
    };
};

export const analyzeTrainingLoad = (activity: EnrichedActivity, stats: WeeklyStats[]) => {
    if (!stats || stats.length === 0) return null;

    let totalWork = 0;
    let totalCount = 0;

    stats.forEach(week => {
        totalWork += week.totalCalories || 0;
        totalCount += week.count || 0;
    });

    if (totalCount === 0) return null;

    const avgWorkPerSession = totalWork / totalCount;
    const currentWork = activity.totalCalories || 0;
    const loadRatio = currentWork / avgWorkPerSession;

    let status = "Normal";
    let recommendation = "Maintain rhythm.";

    if (loadRatio > 1.4) {
        status = "High";
        recommendation = "High load session (>40% above avg). **Prioritize recovery.**";
    } else if (loadRatio < 0.6) {
        status = "Low";
        recommendation = "Recovery session. **Fresh for tomorrow.**";
    }

    return {
        status,
        recommendation,
        avgWork: avgWorkPerSession.toFixed(0),
        currentWork: currentWork.toFixed(0)
    };
};

export const analyzeHistory = (activity: EnrichedActivity, stats: WeeklyStats[]) => {
    if (!stats || stats.length === 0) return null;

    const validEFWeeks = stats.filter(week => week.efficiencyFactor > 0);
    if (validEFWeeks.length === 0) return null;

    const totalEF = validEFWeeks.reduce((sum, week) => sum + week.efficiencyFactor, 0);
    const avgEF = totalEF / validEFWeeks.length;
    const currentEF = Number(activity.efficiencyFactor) || 0;

    if (avgEF === 0 || currentEF === 0) return null;

    const improvement = ((currentEF - avgEF) / avgEF) * 100;

    return {
        avgEF: avgEF.toFixed(2),
        currentEF: currentEF.toFixed(2),
        improvement: improvement.toFixed(1),
        message: improvement > 5
            ? `Strong (+${improvement.toFixed(1)}%) vs 6wk avg.`
            : improvement < -5
                ? `Lower (${Math.abs(improvement).toFixed(1)}%) vs avg. Monitor fatigue.`
                : `Consistent with history.`
    };
};
