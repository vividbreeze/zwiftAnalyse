// analysis/progress.ts
import type { WeeklyStats, EnrichedActivity, LatestWeight, BodyCompositionEntry, OverallProgress, WeightInsight } from '../../types';

export const analyzeOverallProgress = (stats: WeeklyStats[], weightData: LatestWeight | null = null, bodyComposition: BodyCompositionEntry[] = []): OverallProgress => {
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

    let zoneRecommendation = "";

    if (z2Pct < 40) {
        zoneRecommendation = `🚴 **Grundlagen-Fokus fehlt!** Nur ${z2Pct}% deiner Zeit war in Zone 2. Versuche, 1-2 ruhige Einheiten (60-90min) einzubauen, um die aerobe Basis zu stärken.`;
    } else if (z2Pct >= 60 && intensityPct < 10) {
        zoneRecommendation = `⚡ **Basis ist stark, Intensität fehlt!** Du hast eine super Grundlage (${z2Pct}% Z2). Füge jetzt 1x pro Woche Intervalle (z.B. 4x8min Z4) hinzu, um die Schwelle zu heben.`;
    } else if (z3Pct > 30) {
        zoneRecommendation = `⚠️ **Vermeide 'Junk Miles'!** ${z3Pct}% deiner Zeit war in Zone 3 (Grey Zone). Fahre entweder wirklich locker (Z2) oder gezielt hart (Z4), aber weniger dazwischen.`;
    } else if (z5Pct > 20) {
        zoneRecommendation = `🔥 **Vorsicht, Ausbrennen droht!** Über 20% in Zone 5 ist extrem hart. Reduziere die Intensität nächste Woche und fahre mehr lockere Kilometer zur Erholung.`;
    } else {
        zoneRecommendation = `✅ **Super Balance!** Dein Mix aus Grundlage und Intensität passt gut. Behalte diesen Rhythmus bei und steigere langsam das Volumen.`;
    }

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
                nextStep = `**Erholungswoche einplanen!** Kürze das Volumen um 30-50% und fahre nur locker (Z1/Z2), damit sich der Körper anpassen kann.`;
                color = "bg-orange-50 border-orange-200";
            } else {
                status = "Stagnating";
                message = `Deine Effizienz ist leicht gesunken (-${Math.abs(efChange).toFixed(1)}%).`;
                nextStep = `**Reiz verändern!** Dein Training könnte zu monoton sein. ${zoneRecommendation}`;
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
                nextStep = `**Plateau durchbrechen.** Wenn du dich frisch fühlst, erhöhe die Dauer der langen Ausfahrt oder die Intensität der Intervalle.`;
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

    return { status, message, nextStep, color, weightInsight };
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
