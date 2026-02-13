// ============================================================
// Shared type definitions for Zwift Training Dashboard
// ============================================================

// --- Strava Activity Types ---

/** Raw Strava activity from the API */
export interface StravaActivity {
    id: number;
    name: string;
    type: string;
    start_date: string;
    moving_time: number;
    elapsed_time: number;
    distance: number;
    total_elevation_gain: number;
    average_heartrate?: number;
    max_heartrate?: number;
    average_watts?: number;
    weighted_average_watts?: number;
    average_cadence?: number;
    kilojoules?: number;
    laps?: Lap[];
}

/** Enriched activity with computed fields */
export interface EnrichedActivity extends StravaActivity {
    timeHours: string;
    totalCalories: number;
    efficiencyFactor: string;
    primaryZone: string;
    zonePcts?: Record<string, string>;
    zoneDistribution?: Record<string, number>;
}

/** Detailed activity from Strava API (includes laps) */
export interface DetailedActivity extends StravaActivity {
    laps: Lap[];
    description?: string;
    calories?: number;
}

/** Individual lap data */
export interface Lap {
    id?: number;
    name?: string;
    moving_time: number;
    elapsed_time: number;
    distance: number;
    average_watts?: number;
    average_heartrate?: number;
    max_heartrate?: number;
    average_cadence?: number;
}

// --- Weekly Stats ---

/** Aggregated stats for one training week */
export interface WeeklyStats {
    label: string;
    avgPower: number;
    avgHeartRate: number;
    avgCadence: number;
    efficiencyFactor: number;
    totalCalories: number;
    timeHours: string;
    count: number;
    activities: EnrichedActivity[];
    zoneDistribution: Record<string, number>;
    zonePcts: Record<string, string>;
}

// --- HR Zones ---

/** Single HR zone range */
export interface ZoneRange {
    min: number;
    max: number;
    label: string;
}

/** Complete set of 5 HR zones */
export interface HRZones {
    z1: ZoneRange;
    z2: ZoneRange;
    z3: ZoneRange;
    z4: ZoneRange;
    z5: ZoneRange;
}

/** Zone name identifiers */
export type ZoneName = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

// --- Body Composition (Withings) ---

/** Withings body composition data point */
export interface BodyCompositionEntry {
    week: string;
    weight: number | null;
    fatRatio: number | null;
    muscleMass: number | null;
    fatMass?: number | null;
    boneMass?: number | null;
}

/** Withings blood pressure data point */
export interface BloodPressureEntry {
    week: string;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
}

/** Latest weight measurement */
export interface LatestWeight {
    weight: number | null;
    fatRatio?: number | null;
    muscleMass?: number | null;
    fatMass?: number | null;
    date?: Date | string | null;
}

// --- Performance Metrics ---

/** Weight trend data */
export interface WeightTrend {
    change: string;
    direction: 'up' | 'down' | 'stable';
    startWeight: number | null;
    endWeight: number | null;
    weeks: number;
}

/** Body composition trend data */
export interface BodyCompTrend {
    fatChange?: string;
    fatDirection?: 'up' | 'down' | 'stable';
    muscleChange?: string;
    muscleDirection?: 'up' | 'down' | 'stable';
}

/** Power-to-Weight trend data */
export interface PowerToWeightTrend {
    change: string;
    direction: 'improving' | 'declining' | 'stable';
}

/** Combined training + body performance metrics */
export interface PerformanceMetrics {
    powerToWeight: string | null;
    powerToWeightTrend: PowerToWeightTrend | null;
    efficiencyPerKg: string | null;
    weightTrend: WeightTrend | null;
    bodyCompTrend: BodyCompTrend | null;
    performanceInsight: string[] | null;
}

// --- Coach Assessment ---

/** Weight insight from Withings data */
export interface WeightInsight {
    current: number;
    message: string;
    performanceNote?: string;
}

/** Blood pressure insight from Withings data */
export interface BloodPressureInsight {
    current: { systolic: number; diastolic: number; pulse: number };
    trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
    message: string;
    trainingEffect?: string;
}

/** Overall progress analysis result */
export interface OverallProgress {
    status: string;
    message: string;
    nextStep: string;
    color: string;
    weightInsight: WeightInsight | null;
    bloodPressureInsight?: BloodPressureInsight | null;
    performanceInsight?: string[] | null;
}

// --- Activity Analysis ---

/** Zone distribution with timing and percentages */
export interface ZoneDistribution {
    distribution: Record<string, { minutes: string; pct: string }>;
    primaryZone: string;
    primaryPct?: string;
    message: string;
}

/** Activity analysis result from analyzeActivity */
export interface ActivityAnalysis {
    feedback: string;
    metrics: Record<string, unknown>;
}

// --- Settings ---

/** Application settings stored in localStorage */
export interface AppSettings {
    // User Profile
    maxHr: number;
    restingHr: number;
    dob: string;
    height: number;
    gender: string;
    weight: number;
    ftp: number;

    // Google OAuth (for app access protection)
    googleClientId: string;

    // Strava API
    stravaClientId: string;
    stravaClientSecret: string;

    // Withings API
    withingsClientId: string;
    withingsClientSecret: string;
    withingsAccessToken: string | null;
    withingsRefreshToken: string | null;
    withingsTokenExpiresAt: number | null;
    withingsUserId: string | null;

    // Display Options
    weeksToShow: number;
    zoneMethod: 'karvonen' | 'percentMax';

    // Training Goal
    trainingGoal: 'weight_loss' | 'increase_ftp' | 'build_endurance' | 'improve_vo2max' | 'general_fitness' | 'build_base' | 'race_prep' | 'maintenance';
}

// --- Strava OAuth ---

/** Strava OAuth token response */
export interface StravaTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
    athlete?: {
        id: number;
        firstname: string;
        lastname: string;
    };
}

/** Strava API credentials */
export interface StravaCredentials {
    clientId: string;
    clientSecret: string;
}

// --- Withings OAuth ---

/** Withings OAuth token data */
export interface WithingsTokenData {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    userid: string;
    token_type: string;
}

// --- Workout Types ---

/** Parsed Workout Metadata from .zwo file */
export interface ParsedWorkout {
    id: string;                    // "sweetspot-01"
    filename: string;              // "sweetspot-01.zwo"
    name: string;                  // "Sweet Spot - Steady State"
    description: string;           // "2x20min @ 88% FTP..."
    type: 'endurance' | 'ftp-builder' | 'mixed' | 'recovery' | 'sweetspot' | 'tempo' | 'vo2max';
    author?: string;
    tags: string[];

    // Calculated metrics
    duration: number;              // Total seconds
    durationFormatted: string;     // "60:00"
    maxPower: number;              // Max power as % FTP (0.88 = 88%)
    avgPower: number;              // Average power as % FTP

    // Training effect estimation
    estimatedIntensity: 'recovery' | 'endurance' | 'tempo' | 'sweet-spot' | 'threshold' | 'vo2max';
}

/** Workout Recommendation with reasoning */
export interface WorkoutRecommendation {
    workout: ParsedWorkout;
    score: number;                 // 0-100
    reasoning: string;             // German text with markdown
    priority: 'high' | 'medium' | 'low';
}
