import axios from 'axios';
import { userProfile, calculateZones, getZoneForHr } from '../config/user';
import { estimateZoneDistribution } from './analysis';
import { loadSettings } from '../components/Settings';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format, parseISO } from 'date-fns';

/**
 * Get Strava credentials from localStorage settings or environment variables
 * @returns {{ clientId: string, clientSecret: string }}
 */
const getStravaCredentials = () => {
    const settings = loadSettings();
    return {
        clientId: settings.stravaClientId || import.meta.env.VITE_STRAVA_CLIENT_ID,
        clientSecret: settings.stravaClientSecret || import.meta.env.VITE_STRAVA_CLIENT_SECRET
    };
};

const REDIRECT_URI = 'http://localhost:5173/'; // Adjust if needed

/**
 * Generate Strava OAuth authorization URL
 * @returns {string} Authorization URL to redirect user to
 */
export const getAuthUrl = () => {
    const { clientId } = getStravaCredentials();
    const scope = 'activity:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${scope}`;
};

/**
 * Exchange authorization code for Strava access token
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<Object>} Token response with access_token, refresh_token, etc.
 * @throws {Error} If token exchange fails
 */
export const getToken = async (code) => {
    try {
        const { clientId, clientSecret } = getStravaCredentials();
        const response = await axios.post('https://www.strava.com/oauth/token', {
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
 * @param {string} accessToken - Valid Strava access token
 * @returns {Promise<Object[]>} Array of activity summaries
 * @throws {Error} If API request fails
 */
export const getActivities = async (accessToken) => {
    try {
        const before = Math.floor(Date.now() / 1000);
        const after = Math.floor(subWeeks(new Date(), 6).getTime() / 1000);

        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
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
 * @param {string} accessToken - Valid Strava access token
 * @param {number} activityId - Strava activity ID
 * @returns {Promise<Object>} Detailed activity with laps array
 * @throws {Error} If API request fails
 */
export const getActivityDetails = async (accessToken, activityId) => {
    try {
        const response = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
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
 * Groups activities by ISO week, calculates averages, zone distributions,
 * and time-in-zone breakdowns for the last 6 weeks
 * 
 * @param {Object[]} activities - Raw Strava activities
 * @returns {Object[]} Weekly stats with avgPower, avgHeartRate, efficiencyFactor,
 *   zoneDistribution, activities, and more
 */
export const calculateStats = (activities) => {
    const weeks = [];
    const zones = calculateZones(userProfile.maxHr); // Get zones once

    for (let i = 0; i < 6; i++) {
        const date = subWeeks(new Date(), i);
        weeks.push({
            start: startOfWeek(date, { weekStartsOn: 1 }),
            end: endOfWeek(date, { weekStartsOn: 1 }),
            label: `${format(startOfWeek(date, { weekStartsOn: 1 }), 'dd/MM')}`,
            time: 0,
            hrSum: 0,
            hrTime: 0,
            powerSum: 0,
            powerTime: 0,
            cadenceSum: 0,
            cadenceTime: 0,
            count: 0,
            zoneDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }, // New: Accumulate minutes
            activities: [],
        });
    }

    activities.forEach(activity => {
        const activityDate = parseISO(activity.start_date);
        const week = weeks.find(w => isWithinInterval(activityDate, { start: w.start, end: w.end }));
        if (week) {
            week.time += activity.moving_time;

            if (activity.average_heartrate) {
                week.hrSum += activity.average_heartrate * activity.moving_time;
                week.hrTime += activity.moving_time;

                // Use estimation to distribute time across zones based on Avg AND Max HR
                const durationMinutes = activity.moving_time / 60;
                const estimated = estimateZoneDistribution(
                    activity.average_heartrate,
                    activity.max_heartrate, // Use Max HR for peak zones
                    durationMinutes,
                    zones
                );

                if (estimated) {
                    Object.keys(estimated).forEach(z => {
                        week.zoneDistribution[z] += estimated[z];
                    });
                } else {
                    // Fallback to primary zone if estimation fails
                    const primaryZone = getZoneForHr(activity.average_heartrate, zones);
                    week.zoneDistribution[primaryZone] += durationMinutes;
                }
            }

            if (activity.average_watts) {
                week.powerSum += activity.average_watts * activity.moving_time;
                week.powerTime += activity.moving_time;
            }
            if (activity.average_cadence) {
                week.cadenceSum += activity.average_cadence * activity.moving_time;
                week.cadenceTime += activity.moving_time;
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
                    activity.max_heartrate,
                    durationMinutes,
                    zones
                )
                : null;

            // Convert to percentages for rendering
            let activityZonePcts = null;
            if (activityZoneDist) {
                const totalMin = Object.values(activityZoneDist).reduce((a, b) => a + b, 0);
                activityZonePcts = {};
                Object.keys(activityZoneDist).forEach(z => {
                    activityZonePcts[z] = totalMin > 0
                        ? ((activityZoneDist[z] / totalMin) * 100).toFixed(0)
                        : 0;
                });
            }

            week.activities.push({
                ...activity,
                primaryZone,
                zonePcts: activityZonePcts, // Add zone percentages for multi-color bar
                efficiencyFactor: (activity.average_watts && activity.average_heartrate)
                    ? (activity.average_watts / activity.average_heartrate).toFixed(2)
                    : 0,
                totalCalories: activity.average_watts
                    ? ((activity.average_watts * activity.moving_time) / 1000).toFixed(0)
                    : 0,
                timeHours: (activity.moving_time / 3600).toFixed(2),
            });
        }
    });

    // Remove the current week (index 0) if it has no activities
    if (weeks[0].count === 0) {
        weeks.shift();
    }

    const chronoSortedWeeks = weeks.reverse();

    return chronoSortedWeeks.map((week, index) => {
        const prevWeek = index > 0 ? chronoSortedWeeks[index - 1] : null;

        week.activities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

        // Calculate % distribution for the week
        const totalZoneMinutes = Object.values(week.zoneDistribution).reduce((a, b) => a + b, 0);
        const zonePcts = {};
        Object.keys(week.zoneDistribution).forEach(z => {
            zonePcts[z] = totalZoneMinutes > 0
                ? ((week.zoneDistribution[z] / totalZoneMinutes) * 100).toFixed(0)
                : 0;
        });

        return {
            ...week,
            zonePcts,
            timeHours: (week.time / 3600).toFixed(2),
            avgHeartRate: week.hrTime > 0 ? (week.hrSum / week.hrTime).toFixed(0) : 0,
            avgPower: week.powerTime > 0 ? (week.powerSum / week.powerTime).toFixed(0) : 0,
            totalCalories: week.powerTime > 0 ? ((week.powerSum / week.powerTime) * week.time / 1000).toFixed(0) : 0,
            avgCadence: week.cadenceTime > 0 ? (week.cadenceSum / week.cadenceTime).toFixed(0) : 0,
            efficiencyFactor: (week.powerTime > 0 && week.hrTime > 0) ? ((week.powerSum / week.powerTime) / (week.hrSum / week.hrTime)).toFixed(2) : 0,
            improvementTime: prevWeek ? ((week.time - prevWeek.time) / prevWeek.time * 100).toFixed(2) : 0,
            improvementHR: (prevWeek && prevWeek.hrTime > 0 && week.hrTime > 0)
                ? (((week.hrSum / week.hrTime) - (prevWeek.hrSum / prevWeek.hrTime)) / (prevWeek.hrSum / prevWeek.hrTime) * 100).toFixed(2)
                : 0,
        };
    });
};
