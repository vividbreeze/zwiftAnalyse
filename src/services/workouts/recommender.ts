import type { ParsedWorkout, WorkoutRecommendation, WeeklyStats } from '../../types';

/**
 * Training goal to workout type mapping
 */
const GOAL_TO_TYPES: Record<string, string[]> = {
    'weight_loss': ['endurance', 'recovery'],
    'increase_ftp': ['ftp-builder', 'sweetspot', 'tempo'],
    'build_endurance': ['endurance', 'mixed'],
    'improve_vo2max': ['vo2max'],
    'build_base': ['endurance', 'recovery'],
    'race_prep': ['mixed', 'ftp-builder', 'vo2max'],
    'maintenance': ['tempo', 'mixed'],
    'general_fitness': ['mixed', 'endurance', 'tempo']
};

/**
 * Get workout recommendations based on training goal and current stats
 */
export const getWorkoutRecommendations = (
    allWorkouts: ParsedWorkout[],
    stats: WeeklyStats[],
    trainingGoal: string,
    lastActivityDate?: Date
): WorkoutRecommendation[] => {
    if (allWorkouts.length === 0 || stats.length === 0) return [];

    const currentWeek = stats[stats.length - 1];
    const z2Pct = Number(currentWeek.zonePcts?.Z2 || 0);
    const z3Pct = Number(currentWeek.zonePcts?.Z3 || 0);
    const z4Pct = Number(currentWeek.zonePcts?.Z4 || 0);
    const z5Pct = Number(currentWeek.zonePcts?.Z5 || 0);
    const intensityPct = z4Pct + z5Pct;

    // Calculate days since last activity
    const daysSinceLastActivity = lastActivityDate
        ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Analyze this week's training balance
    const weeklyActivities = currentWeek.activities || [];
    const intensityWorkouts = weeklyActivities.filter(a => {
        const z4 = Number(a.zonePcts?.Z4 || 0);
        const z5 = Number(a.zonePcts?.Z5 || 0);
        return (z4 + z5) > 20; // Workout with >20% in Z4/Z5 counts as intensity
    }).length;

    const enduranceWorkouts = weeklyActivities.filter(a => {
        const z2 = Number(a.zonePcts?.Z2 || 0);
        return z2 > 50; // Workout with >50% Z2 counts as endurance
    }).length;

    // Score each workout
    const scored = allWorkouts.map(workout => ({
        workout,
        score: scoreWorkout(workout, trainingGoal, z2Pct, z3Pct, intensityPct, daysSinceLastActivity, intensityWorkouts, enduranceWorkouts),
        reasoning: '',
        priority: 'medium' as const
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Take top 3 and generate reasoning
    const top3 = scored.slice(0, 3).map(item => ({
        ...item,
        reasoning: generateReasoning(item.workout, trainingGoal, z2Pct, z3Pct, intensityPct, daysSinceLastActivity, intensityWorkouts, enduranceWorkouts),
        priority: item.score > 70 ? 'high' : item.score > 50 ? 'medium' : 'low' as const
    }));

    return top3;
};

const scoreWorkout = (
    workout: ParsedWorkout,
    trainingGoal: string,
    z2Pct: number,
    z3Pct: number,
    intensityPct: number,
    daysSinceLastActivity: number,
    intensityWorkouts: number,
    enduranceWorkouts: number
): number => {
    let score = 50; // Base score

    // 1. Goal alignment (40 points max)
    const goalTypes = GOAL_TO_TYPES[trainingGoal] || [];
    if (goalTypes.includes(workout.type)) {
        score += 40;
    }

    // 2. Zone distribution alignment (30 points max)
    // If too much Z3 (junk miles), recommend pure Z2 or pure Z4/Z5
    if (z3Pct > 30) {
        if (workout.estimatedIntensity === 'endurance' || workout.estimatedIntensity === 'recovery') {
            score += 30; // Recommend recovery
        } else if (workout.estimatedIntensity === 'threshold' || workout.estimatedIntensity === 'vo2max') {
            score += 25; // Recommend intensity
        }
    }

    // If goal is FTP but low intensity percentage, recommend sweet spot/threshold
    if (trainingGoal === 'increase_ftp' && intensityPct < 15) {
        if (workout.estimatedIntensity === 'sweet-spot' || workout.estimatedIntensity === 'threshold') {
            score += 30;
        }
    }

    // If goal is endurance but low Z2, recommend endurance
    if ((trainingGoal === 'build_endurance' || trainingGoal === 'build_base') && z2Pct < 70) {
        if (workout.estimatedIntensity === 'endurance') {
            score += 30;
        }
    }

    // 3. Weekly balance consideration (25 points max) - NEW!
    // For FTP goal: aim for 2 intensity + 2 endurance per week
    if (trainingGoal === 'increase_ftp') {
        const isIntensity = workout.estimatedIntensity === 'sweet-spot' ||
                           workout.estimatedIntensity === 'threshold' ||
                           workout.estimatedIntensity === 'vo2max';
        const isEndurance = workout.estimatedIntensity === 'endurance' ||
                           workout.estimatedIntensity === 'recovery';

        if (intensityWorkouts < 2 && isIntensity) {
            score += 25; // Need more intensity
        } else if (intensityWorkouts >= 2 && isEndurance) {
            score += 25; // Already did intensity, recommend endurance
        } else if (enduranceWorkouts < 2 && isEndurance) {
            score += 20; // Need base work
        }
    }

    // For endurance/base goals: mostly endurance with occasional intensity
    if (trainingGoal === 'build_endurance' || trainingGoal === 'build_base') {
        const isEndurance = workout.estimatedIntensity === 'endurance' ||
                           workout.estimatedIntensity === 'recovery';

        if (enduranceWorkouts < 3 && isEndurance) {
            score += 25; // Need more endurance
        } else if (enduranceWorkouts >= 3 && intensityWorkouts === 0 &&
                   (workout.estimatedIntensity === 'tempo' || workout.estimatedIntensity === 'sweet-spot')) {
            score += 15; // Can add 1 intensity workout
        }
    }

    // 4. Recovery consideration (20 points max)
    if (daysSinceLastActivity > 7) {
        // Long break - recommend easy comeback workout
        if (workout.estimatedIntensity === 'recovery' || workout.estimatedIntensity === 'endurance') {
            score += 20;
        }
    } else if (daysSinceLastActivity < 1) {
        // Recent hard session - recommend recovery
        if (workout.estimatedIntensity === 'recovery') {
            score += 15;
        }
    }

    // 5. Duration consideration (10 points)
    // Prefer moderate duration (45-75 min)
    const durationMin = workout.duration / 60;
    if (durationMin >= 45 && durationMin <= 75) {
        score += 10;
    }

    return Math.min(score, 100); // Cap at 100
};

const generateReasoning = (
    workout: ParsedWorkout,
    trainingGoal: string,
    z2Pct: number,
    z3Pct: number,
    intensityPct: number,
    daysSinceLastActivity: number,
    intensityWorkouts: number,
    enduranceWorkouts: number
): string => {
    const parts: string[] = [];

    // 1. Goal match
    const goalLabels: Record<string, string> = {
        'weight_loss': 'Gewicht verlieren',
        'increase_ftp': 'FTP steigern',
        'build_endurance': 'Ausdauer aufbauen',
        'improve_vo2max': 'VO2max verbessern',
        'build_base': 'Grundlagenausdauer aufbauen',
        'race_prep': 'Wettkampfvorbereitung',
        'maintenance': 'Formerhaltung',
        'general_fitness': 'Allgemeine Fitness'
    };

    parts.push(`**Passt zu deinem Ziel "${goalLabels[trainingGoal] || trainingGoal}"**`);

    // 2. Weekly balance reasoning - NEW!
    const isIntensity = workout.estimatedIntensity === 'sweet-spot' ||
                       workout.estimatedIntensity === 'threshold' ||
                       workout.estimatedIntensity === 'vo2max';
    const isEndurance = workout.estimatedIntensity === 'endurance' ||
                       workout.estimatedIntensity === 'recovery';

    if (trainingGoal === 'increase_ftp') {
        if (intensityWorkouts < 2 && isIntensity) {
            parts.push(`Diese Woche erst ${intensityWorkouts} Intervall-Einheit${intensityWorkouts === 1 ? '' : 'en'}. Ziel: 2x Intensität + 2x Basis pro Woche.`);
        } else if (intensityWorkouts >= 2 && isEndurance) {
            parts.push(`Schon ${intensityWorkouts} intensive Einheiten diese Woche - jetzt lockere Kilometer für Erholung.`);
        }
    }

    if ((trainingGoal === 'build_endurance' || trainingGoal === 'build_base') && enduranceWorkouts < 3 && isEndurance) {
        parts.push(`Bisher ${enduranceWorkouts} Grundlagen-Einheit${enduranceWorkouts === 1 ? '' : 'en'}. Ziel: 3-4x Z2-Training pro Woche.`);
    }

    // 3. Zone-specific reasoning
    if (z3Pct > 30) {
        if (workout.estimatedIntensity === 'endurance' || workout.estimatedIntensity === 'recovery') {
            parts.push(`Du hast aktuell ${z3Pct}% in Zone 3 (Junk Miles). Dieses Workout bringt dich zurück in Zone 2.`);
        } else if (workout.estimatedIntensity === 'threshold' || workout.estimatedIntensity === 'vo2max') {
            parts.push(`Statt weiter in Zone 3 zu fahren, nutze dieses Workout für echte Intensität in Z4/Z5.`);
        }
    }

    if (trainingGoal === 'increase_ftp' && intensityPct < 15) {
        parts.push(`Aktuell nur ${intensityPct}% in Z4/Z5. Dieses ${workout.estimatedIntensity}-Training hebt deine FTP.`);
    }

    if ((trainingGoal === 'build_endurance' || trainingGoal === 'build_base') && z2Pct < 70) {
        parts.push(`Für Ausdauer-Aufbau brauchst du mehr Z2 (aktuell ${z2Pct}%). Dieses Workout hilft dabei.`);
    }

    // 4. Recovery reasoning
    if (daysSinceLastActivity > 7) {
        parts.push(`Nach ${daysSinceLastActivity} Tagen Pause ein idealer Wiedereinstieg.`);
    } else if (daysSinceLastActivity < 1 && workout.estimatedIntensity === 'recovery') {
        parts.push(`Aktive Erholung nach deiner letzten Einheit - sanft aber effektiv.`);
    }

    // 5. Workout specifics
    parts.push(`**${workout.durationFormatted}** @ ~${Math.round(workout.avgPower * 100)}% FTP`);

    return parts.join(' • ');
};
