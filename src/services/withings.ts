import axios from 'axios';
import { loadSettings, saveSettings } from '../components/settings/utils';
import type { WithingsTokenData, BodyCompositionEntry, LatestWeight, BloodPressureEntry } from '../types';

interface WithingsCredentials {
    clientId: string;
    clientSecret: string;
}

interface WithingsTokens {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    userId: string | null;
}

interface ParsedMeasurement {
    date: Date;
    timestamp: number;
    weight?: number;
    fatRatio?: number;
    muscleMass?: number;
    fatMass?: number;
    systolic?: number;
    diastolic?: number;
    pulse?: number;
}

interface WeeklyAccumulator {
    date: Date;
    weights: number[];
    fatRatios: number[];
    muscleMasses: number[];
}

// Withings API endpoints
const WITHINGS_AUTH_URL = 'https://account.withings.com/oauth2_user/authorize2';
const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';
const WITHINGS_MEASURE_URL = 'https://wbsapi.withings.net/measure';

const REDIRECT_URI = 'http://localhost:5173/withings/callback';

// Measurement types from Withings API
const MEAS_TYPES = {
    WEIGHT: 1,          // kg
    FAT_FREE_MASS: 5,   // kg
    FAT_RATIO: 6,       // %
    FAT_MASS: 8,        // kg
    DIASTOLIC_BP: 9,    // mmHg
    SYSTOLIC_BP: 10,    // mmHg
    HEART_PULSE: 11,    // bpm
    MUSCLE_MASS: 76,    // kg
    HYDRATION: 77,      // kg
    BONE_MASS: 88       // kg
};

/**
 * Get Withings credentials from settings
 */
const getWithingsCredentials = (): WithingsCredentials => {
    const settings = loadSettings();
    return {
        clientId: settings.withingsClientId || '',
        clientSecret: settings.withingsClientSecret || ''
    };
};

/**
 * Get stored Withings tokens
 */
export const getWithingsTokens = (): WithingsTokens => {
    const settings = loadSettings();
    return {
        accessToken: settings.withingsAccessToken || null,
        refreshToken: settings.withingsRefreshToken || null,
        expiresAt: settings.withingsTokenExpiresAt || null,
        userId: settings.withingsUserId || null
    };
};

/**
 * Store Withings tokens in settings
 */
const storeWithingsTokens = (tokenData: WithingsTokenData): void => {
    const settings = loadSettings();
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);

    saveSettings({
        ...settings,
        withingsAccessToken: tokenData.access_token,
        withingsRefreshToken: tokenData.refresh_token,
        withingsTokenExpiresAt: expiresAt,
        withingsUserId: tokenData.userid
    });
};

/**
 * Clear Withings tokens (disconnect)
 */
export const disconnectWithings = (): void => {
    const settings = loadSettings();
    saveSettings({
        ...settings,
        withingsAccessToken: null,
        withingsRefreshToken: null,
        withingsTokenExpiresAt: null,
        withingsUserId: null
    });
};

/**
 * Check if Withings is connected
 */
export const isWithingsConnected = (): boolean => {
    const { accessToken } = getWithingsTokens();
    return !!accessToken;
};

/**
 * Generate authorization URL for Withings OAuth
 */
export const getWithingsAuthUrl = (): string | null => {
    const { clientId } = getWithingsCredentials();
    if (!clientId) {
        console.error('Withings Client ID not configured');
        return null;
    }

    const scope = 'user.metrics';
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection

    // Store state for verification
    sessionStorage.setItem('withings_oauth_state', state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        scope: scope,
        state: state
    });

    return `${WITHINGS_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeWithingsCode = async (code: string): Promise<WithingsTokenData> => {
    try {
        const { clientId, clientSecret } = getWithingsCredentials();

        const params = new URLSearchParams({
            action: 'requesttoken',
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const response = await axios.post(WITHINGS_TOKEN_URL, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status === 0 && response.data.body) {
            storeWithingsTokens(response.data.body);
            return response.data.body;
        } else {
            throw new Error(`Withings API error: ${response.data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error exchanging Withings code:', error);
        throw error;
    }
};

/**
 * Refresh the access token
 */
const refreshWithingsToken = async (): Promise<string> => {
    try {
        const { clientId, clientSecret } = getWithingsCredentials();
        const { refreshToken } = getWithingsTokens();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const params = new URLSearchParams({
            action: 'requesttoken',
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken
        });

        const response = await axios.post(WITHINGS_TOKEN_URL, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status === 0 && response.data.body) {
            storeWithingsTokens(response.data.body);
            return response.data.body.access_token;
        } else {
            // Token refresh failed, disconnect
            disconnectWithings();
            throw new Error('Token refresh failed');
        }
    } catch (error) {
        console.error('Error refreshing Withings token:', error);
        disconnectWithings();
        throw error;
    }
};

/**
 * Get valid access token (refresh if needed)
 */
const getValidAccessToken = async (): Promise<string> => {
    const { accessToken, expiresAt } = getWithingsTokens();

    if (!accessToken) {
        throw new Error('Not connected to Withings');
    }

    // Check if token is expired or will expire in next 5 minutes
    if (expiresAt && Date.now() > expiresAt - (5 * 60 * 1000)) {
        return await refreshWithingsToken();
    }

    return accessToken;
};

/**
 * Fetch body measurements from Withings
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 */
export const getBodyMeasures = async (startDate: Date, endDate: Date): Promise<ParsedMeasurement[]> => {
    try {
        const accessToken = await getValidAccessToken();

        const params = new URLSearchParams({
            action: 'getmeas',
            meastypes: `${MEAS_TYPES.WEIGHT},${MEAS_TYPES.FAT_RATIO},${MEAS_TYPES.MUSCLE_MASS},${MEAS_TYPES.FAT_MASS}`,
            category: '1',
            startdate: String(Math.floor(startDate.getTime() / 1000)),
            enddate: String(Math.floor(endDate.getTime() / 1000))
        });

        const response = await axios.post(WITHINGS_MEASURE_URL, params, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data.status === 0 && response.data.body) {
            return parseMeasurements(response.data.body.measuregrps);
        } else {
            throw new Error(`Withings API error: ${response.data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error fetching Withings measures:', error);
        throw error;
    }
};

/**
 * Get the latest body measurements
 */
export const getLatestMeasures = async (): Promise<LatestWeight | null> => {
    try {
        const accessToken = await getValidAccessToken();

        const params = new URLSearchParams({
            action: 'getmeas',
            meastypes: `${MEAS_TYPES.WEIGHT},${MEAS_TYPES.FAT_RATIO},${MEAS_TYPES.MUSCLE_MASS}`,
            category: '1',
            lastupdate: String(Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000))
        });

        const response = await axios.post(WITHINGS_MEASURE_URL, params, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data.status === 0 && response.data.body) {
            const measures = parseMeasurements(response.data.body.measuregrps);
            // Return most recent of each type
            return {
                weight: measures.find(m => m.weight)?.weight || null,
                fatRatio: measures.find(m => m.fatRatio)?.fatRatio || null,
                muscleMass: measures.find(m => m.muscleMass)?.muscleMass || null,
                date: measures[0]?.date || null
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching latest Withings measures:', error);
        return null;
    }
};

/**
 * Parse Withings measurement groups into usable format
 */
const parseMeasurements = (measureGroups: any[]): ParsedMeasurement[] => {
    if (!measureGroups) return [];

    return measureGroups.map((group: any) => {
        const date = new Date(group.date * 1000);
        const result: ParsedMeasurement = { date, timestamp: group.date };

        group.measures.forEach((measure: any) => {
            // Convert value using unit (value * 10^unit)
            const value = measure.value * Math.pow(10, measure.unit);

            switch (measure.type) {
                case MEAS_TYPES.WEIGHT:
                    result.weight = Math.round(value * 10) / 10; // kg with 1 decimal
                    break;
                case MEAS_TYPES.FAT_RATIO:
                    result.fatRatio = Math.round(value * 10) / 10; // % with 1 decimal
                    break;
                case MEAS_TYPES.MUSCLE_MASS:
                    result.muscleMass = Math.round(value * 10) / 10; // kg with 1 decimal
                    break;
                case MEAS_TYPES.FAT_MASS:
                    result.fatMass = Math.round(value * 10) / 10; // kg with 1 decimal
                    break;
                case MEAS_TYPES.SYSTOLIC_BP:
                    result.systolic = Math.round(value); // mmHg
                    break;
                case MEAS_TYPES.DIASTOLIC_BP:
                    result.diastolic = Math.round(value); // mmHg
                    break;
                case MEAS_TYPES.HEART_PULSE:
                    result.pulse = Math.round(value); // bpm
                    break;
            }
        });

        return result;
    }).sort((a, b) => b.timestamp - a.timestamp); // Newest first
};

/**
 * Get body composition data formatted for charts (last 6 weeks)
 */
export const getBodyCompositionForChart = async (): Promise<BodyCompositionEntry[]> => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 42); // 6 weeks

        const measures = await getBodyMeasures(startDate, endDate);

        // Group by week and get average/latest per week
        const weeklyData: Record<string, WeeklyAccumulator> = {};

        measures.forEach(m => {
            const weekKey = getWeekKey(m.date);
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {
                    date: m.date,
                    weights: [],
                    fatRatios: [],
                    muscleMasses: []
                };
            }
            if (m.weight) weeklyData[weekKey].weights.push(m.weight);
            if (m.fatRatio) weeklyData[weekKey].fatRatios.push(m.fatRatio);
            if (m.muscleMass) weeklyData[weekKey].muscleMasses.push(m.muscleMass);
        });

        // Calculate averages
        return Object.entries(weeklyData)
            .map(([key, data]) => ({
                week: key,
                weight: avg(data.weights),
                fatRatio: avg(data.fatRatios),
                muscleMass: avg(data.muscleMasses)
            }))
            .sort((a, b) => {
                const [aDay, aMonth] = a.week.split('/').map(Number);
                const [bDay, bMonth] = b.week.split('/').map(Number);
                return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
            });
    } catch (error) {
        console.error('Error getting body composition for chart:', error);
        return [];
    }
};

// Helper: Get week key matching Strava format (start of week, Monday-based, e.g., "03/02")
const getWeekKey = (date: Date): string => {
    const d = new Date(date);
    // Get Monday of this week
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d);
    monday.setDate(diff);
    const day = monday.getDate().toString().padStart(2, '0');
    const month = (monday.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
};

// Helper: Calculate average
const avg = (arr: number[]): number | null => {
    if (!arr || arr.length === 0) return null;
    return Math.round((arr.reduce((a: number, b: number) => a + b, 0) / arr.length) * 10) / 10;
};

/**
 * Get blood pressure data formatted for charts (last 6 weeks)
 */
export const getBloodPressureForChart = async (): Promise<BloodPressureEntry[]> => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 42); // 6 weeks

        const accessToken = await getValidAccessToken();

        const params = new URLSearchParams({
            action: 'getmeas',
            meastypes: `${MEAS_TYPES.SYSTOLIC_BP},${MEAS_TYPES.DIASTOLIC_BP},${MEAS_TYPES.HEART_PULSE}`,
            category: '1',
            startdate: String(Math.floor(startDate.getTime() / 1000)),
            enddate: String(Math.floor(endDate.getTime() / 1000))
        });

        const response = await axios.post(WITHINGS_MEASURE_URL, params, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data.status === 0 && response.data.body) {
            const measures = parseMeasurements(response.data.body.measuregrps);

            // Group by week
            const weeklyData: Record<string, { systolic: number[], diastolic: number[], pulse: number[] }> = {};

            measures.forEach(m => {
                const weekKey = getWeekKey(m.date);
                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = { systolic: [], diastolic: [], pulse: [] };
                }
                if (m.systolic) weeklyData[weekKey].systolic.push(m.systolic);
                if (m.diastolic) weeklyData[weekKey].diastolic.push(m.diastolic);
                if (m.pulse) weeklyData[weekKey].pulse.push(m.pulse);
            });

            // Calculate averages
            return Object.keys(weeklyData)
                .map(week => ({
                    week,
                    systolic: avg(weeklyData[week].systolic),
                    diastolic: avg(weeklyData[week].diastolic),
                    pulse: avg(weeklyData[week].pulse)
                }))
                .sort((a, b) => {
                    const [aDay, aMonth] = a.week.split('/').map(Number);
                    const [bDay, bMonth] = b.week.split('/').map(Number);
                    return (aMonth * 100 + aDay) - (bMonth * 100 + bDay);
                });
        }
        return [];
    } catch (error) {
        console.error('Error getting blood pressure for chart:', error);
        return [];
    }
};
