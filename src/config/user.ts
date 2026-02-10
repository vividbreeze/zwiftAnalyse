import { loadSettings } from '../components/settings/utils';
import type { AppSettings, HRZones, ZoneName } from '../types';

/**
 * Load user profile dynamically from settings (localStorage)
 * Falls back to defaults if Settings component not yet loaded
 */
const getSettings = (): AppSettings => {
    try {
        return loadSettings();
    } catch (e) {
        return {
            maxHr: 182,
            restingHr: 60,
            dob: '1970-12-11',
            height: 190,
            gender: 'male',
            weight: 85,
            ftp: 200,
            stravaClientId: '',
            stravaClientSecret: '',
            withingsClientId: '',
            withingsClientSecret: '',
            withingsAccessToken: null,
            withingsRefreshToken: null,
            withingsTokenExpiresAt: null,
            withingsUserId: null,
            weeksToShow: 6,
            zoneMethod: 'karvonen',
        };
    }
};

/** Get fresh user profile from settings */
export const getUserProfile = (): AppSettings => getSettings();

/** Backwards-compatible static profile reference */
export const userProfile: AppSettings = getSettings();

/**
 * Calculate HR Zones using the Karvonen (Heart Rate Reserve) Formula
 * Target HR = ((Max HR - Resting HR) × %Intensity) + Resting HR
 *
 * Provides more accurate zones for trained athletes by accounting
 * for resting heart rate.
 */
export const calculateZones = (maxHr: number, restingHr: number = userProfile.restingHr): HRZones => {
    const hrr = maxHr - restingHr;

    return {
        z1: { min: 0, max: Math.floor(restingHr + hrr * 0.60), label: 'Recovery' },
        z2: { min: Math.floor(restingHr + hrr * 0.60), max: Math.floor(restingHr + hrr * 0.70), label: 'Endurance' },
        z3: { min: Math.floor(restingHr + hrr * 0.70), max: Math.floor(restingHr + hrr * 0.80), label: 'Tempo' },
        z4: { min: Math.floor(restingHr + hrr * 0.80), max: Math.floor(restingHr + hrr * 0.90), label: 'Threshold' },
        z5: { min: Math.floor(restingHr + hrr * 0.90), max: 250, label: 'VO2 Max' },
    };
};

/** Determine which HR zone a given heart rate falls into */
export const getZoneForHr = (hr: number, zones: HRZones): ZoneName => {
    if (hr < zones.z1.max) return 'Z1';
    if (hr < zones.z2.max) return 'Z2';
    if (hr < zones.z3.max) return 'Z3';
    if (hr < zones.z4.max) return 'Z4';
    return 'Z5';
};

/** Get Tailwind background color class for a zone */
export const getZoneColor = (zone: string): string => {
    switch (zone) {
        case 'Z1': return 'bg-gray-400';
        case 'Z2': return 'bg-blue-500';
        case 'Z3': return 'bg-green-500';
        case 'Z4': return 'bg-yellow-500';
        case 'Z5': return 'bg-red-500';
        default: return 'bg-gray-200';
    }
};
