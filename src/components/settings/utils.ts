import type { AppSettings } from '../../types';

// Default values matching current config
export const DEFAULT_SETTINGS = {
    // User Profile
    maxHr: 182,
    restingHr: 60,
    weight: 85, // kg
    height: 190, // cm
    dob: '1970-12-11',
    gender: 'male',
    ftp: 200, // Functional Threshold Power

    // Strava Credentials
    stravaClientId: '',
    stravaClientSecret: '',

    // Withings Credentials
    withingsClientId: '',
    withingsClientSecret: '',
    withingsAccessToken: null,
    withingsRefreshToken: null,
    withingsTokenExpiresAt: null,
    withingsUserId: null,

    // Display Options
    weeksToShow: 6,
    zoneMethod: 'karvonen' as const, // 'karvonen' or 'percentMax'
};

// Load settings from localStorage or use defaults
export const loadSettings = (): AppSettings => {
    try {
        const saved = localStorage.getItem('zwiftAnalyseSettings');
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
    return DEFAULT_SETTINGS;
};

// Save settings to localStorage
export const saveSettings = (settings: AppSettings): boolean => {
    try {
        localStorage.setItem('zwiftAnalyseSettings', JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Error saving settings:', e);
        return false;
    }
};
