import axios from 'axios';
import { userProfile, calculateZones, getZoneForHr } from '../config/user';
import { estimateZoneDistribution } from './analysis';
import { loadSettings } from '../components/settings/utils';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format, parseISO } from 'date-fns';
import type { StravaTokenResponse, StravaActivity, StravaCredentials, WeeklyStats, EnrichedActivity } from '../types';
import { APP_CONFIG } from '../config/constants';

/**
 * Get Strava credentials from localStorage settings or environment variables
 */
const getStravaCredentials = (): StravaCredentials => {
    const settings = loadSettings();
    return {
        clientId: settings.stravaClientId || import.meta.env.VITE_STRAVA_CLIENT_ID,
        clientSecret: settings.stravaClientSecret || import.meta.env.VITE_STRAVA_CLIENT_SECRET
    };
};

/**
 * Generate Strava OAuth authorization URL
 */
export const getAuthUrl = (): string => {
    const { clientId } = getStravaCredentials();

    if (!clientId || clientId === 'your_strava_client_id') {
        throw new Error('Strava Client ID not configured. Please set it in Settings or .env file.');
    }

    return `${APP_CONFIG.STRAVA.AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${APP_CONFIG.REDIRECT_URI}&approval_prompt=force&scope=${APP_CONFIG.STRAVA.SCOPE}`;
};

/**
 * Exchange authorization code for Strava access token
 */
export const getToken = async (code: string): Promise<StravaTokenResponse> => {
    try {
        const { clientId, clientSecret } = getStravaCredentials();
        const response = await axios.post(APP_CONFIG.STRAVA.TOKEN_URL, {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
        });
        return response.data;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};

/**
 * Fetch last 6 weeks of activities from Strava
 */
export const getActivities = async (accessToken: string): Promise<StravaActivity[]> => {
    try {
        const before = Math.floor(Date.now() / 1000);
        const after = Math.floor(subWeeks(new Date(), 6).getTime() / 1000);

        const response = await axios.get(`${APP_CONFIG.STRAVA.API_URL}/athlete/activities`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
                before,
                after,
                per_page: 200,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching activities:', error);
        throw error;
    }
};

/**
 * Fetch detailed activity data including laps
 */
export const getActivityDetails = async (accessToken: string, activityId: number): Promise<StravaActivity> => {
    try {
        const response = await axios.get(`${APP_CONFIG.STRAVA.API_URL}/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching activity details:', error);
        throw error;
    }
};

/**
 * Aggregate activities into weekly statistics
 */
export const calculateStats = (activities: StravaActivity[]): WeeklyStats[] => {
    const weeks: WeeklyStats[] = [];
    const zones = calculateZones(userProfile.maxHr);

    for (let i = 0; i < 6; i++) {
        const date = subWeeks(new Date(), i);
        weeks.push({
            label: `${format(startOfWeek(date, { weekStartsOn: 1 }), 'dd/MM')}`,
            avgPower: 0,
            avgHeartRate: 0,
            avgCadence: 0,
            efficiencyFactor: 0,
            totalCalories: 0,
            timeHours: '0.00',
            count: 0,
            activities: [],
            zoneDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
            zonePcts: {}
        });
        // We attach internal helpers for calculation that are not part of Public API, 
        // but Typescript might complain if we don't handle them. 
        // For simplicity in this refactor, we keep local variables for summing.
    }

    // Auxiliary data structure for aggregation
    const weekAggregates = weeks.map(() => ({
        time: 0,
        hrSum: 0,
        hrTime: 0,
        powerSum: 0,
        powerTime: 0,
        cadenceSum: 0,
        cadenceTime: 0,
        zoneDist: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 } as Record<string, number>
    }));

    // Helper to find week index
    const getWeekIndex = (date: Date) => {
        // This logic needs to match the weeks array generation (0 is current week, 5 is 6 weeks ago)
        // But the loop above pushes current week first? No, subWeeks(now, 0) is current.
        // wait, the loop pushes: i=0 (this week), i=1 (last week)...
        // So index 0 is this week.
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
        const activityStartOfWeek = startOfWeek(date, { weekStartsOn: 1 });
        const diffWeeks = Math.round((startOfCurrentWeek.getTime() - activityStartOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return diffWeeks >= 0 && diffWeeks < 6 ? diffWeeks : -1;
    };

    activities.forEach(activity => {
        const activityDate = parseISO(activity.start_date);
        const weekIndex = getWeekIndex(activityDate);

        if (weekIndex !== -1) {
            const week = weeks[weekIndex];
            const agg = weekAggregates[weekIndex];

            agg.time += activity.moving_time;

            if (activity.average_heartrate) {
                agg.hrSum += activity.average_heartrate * activity.moving_time;
                agg.hrTime += activity.moving_time;

                const durationMinutes = activity.moving_time / 60;
                const estimated = estimateZoneDistribution(
                    activity.average_heartrate,
                    activity.max_heartrate ?? activity.average_heartrate,
                    durationMinutes,
                    zones
                );

                if (estimated) {
                    Object.keys(estimated).forEach(z => {
                        agg.zoneDist[z] += estimated[z];
                    });
                } else {
                    const primaryZone = getZoneForHr(activity.average_heartrate, zones);
                    agg.zoneDist[primaryZone] += durationMinutes;
                }
            }

            if (activity.average_watts) {
                agg.powerSum += activity.average_watts * activity.moving_time;
                agg.powerTime += activity.moving_time;
            }
            if (activity.average_cadence) {
                agg.cadenceSum += activity.average_cadence * activity.moving_time;
                agg.cadenceTime += activity.moving_time;
            }
            week.count += 1;

            const primaryZone = activity.average_heartrate
                ? getZoneForHr(activity.average_heartrate, zones)
                : 'Z1';

            // Calculate estimated zone distribution for this activity
            const durationMinutes = activity.moving_time / 60;
            const activityZoneDist = activity.average_heartrate
                ? estimateZoneDistribution(
                    activity.average_heartrate,
                    activity.max_heartrate ?? activity.average_heartrate,
                    durationMinutes,
                    zones
                )
                : null;

            let activityZonePcts: Record<string, string> | undefined = undefined;
            if (activityZoneDist) {
                const totalMin = Object.values(activityZoneDist).reduce((a, b) => a + b, 0);
                const pcts: Record<string, string> = {};
                Object.keys(activityZoneDist).forEach(z => {
                    pcts[z] = totalMin > 0 ? ((activityZoneDist[z] / totalMin) * 100).toFixed(0) : '0';
                });
                activityZonePcts = pcts;
            }

            const enrichedActivity: EnrichedActivity = {
                ...activity,
                primaryZone,
                zonePcts: activityZonePcts,
                efficiencyFactor: (activity.average_watts && activity.average_heartrate)
                    ? (activity.average_watts / activity.average_heartrate).toFixed(2)
                    : '0',
                totalCalories: activity.average_watts
                    ? Math.round((activity.average_watts * activity.moving_time) / 1000)
                    : 0,
                timeHours: (activity.moving_time / 3600).toFixed(2),
            };

            week.activities.push(enrichedActivity);
        }
    });

    // Finalize week stats
    weeks.forEach((week, index) => {
        const agg = weekAggregates[index];

        week.activities.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

        week.avgHeartRate = agg.hrTime > 0 ? Math.round(agg.hrSum / agg.hrTime) : 0;
        week.avgPower = agg.powerTime > 0 ? Math.round(agg.powerSum / agg.powerTime) : 0;
        week.avgCadence = agg.cadenceTime > 0 ? Math.round(agg.cadenceSum / agg.cadenceTime) : 0;

        week.totalCalories = agg.powerTime > 0
            ? Math.round((agg.powerSum / agg.powerTime) * agg.time / 1000)
            : 0;

        week.timeHours = (agg.time / 3600).toFixed(2);

        week.efficiencyFactor = (agg.powerTime > 0 && agg.hrTime > 0)
            ? parseFloat(((agg.powerSum / agg.powerTime) / (agg.hrSum / agg.hrTime)).toFixed(2))
            : 0;

        week.zoneDistribution = agg.zoneDist;

        const totalZoneMinutes = Object.values(agg.zoneDist).reduce((a, b) => a + b, 0);
        const zonePcts: Record<string, string> = {};
        Object.keys(agg.zoneDist).forEach(z => {
            zonePcts[z] = totalZoneMinutes > 0 ? ((agg.zoneDist[z] / totalZoneMinutes) * 100).toFixed(0) : '0';
        });
        week.zonePcts = zonePcts;
    });

    // Remove empty current week if needed, for consistency with previous behavior
    if (weeks[0].count === 0) {
        weeks.shift();
    }

    return weeks.reverse();
};
