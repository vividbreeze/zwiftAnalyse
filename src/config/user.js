import { loadSettings } from '../components/Settings';

// Load user profile dynamically from settings (localStorage)
const getSettings = () => {
    try {
        return loadSettings();
    } catch (e) {
        // Fallback if Settings component not yet loaded
        return {
            maxHr: 182,
            restingHr: 60,
            dob: '1970-12-11',
            height: 190,
            gender: 'male',
            weight: 85,
            ftp: 200
        };
    }
};

// Export as getter to always get fresh settings
export const getUserProfile = () => getSettings();

// Keep this for backwards compatibility, but it now dynamically loads
export const userProfile = getSettings();

/**
 * Calculate HR Zones using the Karvonen (Heart Rate Reserve) Formula
 * Target HR = ((Max HR - Resting HR) × %Intensity) + Resting HR
 * 
 * This provides more accurate zones for trained athletes by accounting
 * for resting heart rate.
 */
export const calculateZones = (maxHr, restingHr = userProfile.restingHr) => {
    const hrr = maxHr - restingHr; // Heart Rate Reserve

    // 5-Zone Model using Karvonen Formula
    // Z1: 50-60% HRR (Recovery/Active Recovery)
    // Z2: 60-70% HRR (Endurance/Aerobic Base)
    // Z3: 70-80% HRR (Tempo/Sweetspot)
    // Z4: 80-90% HRR (Threshold/Lactate Threshold)
    // Z5: 90-100% HRR (VO2 Max/Anaerobic)
    return {
        z1: {
            min: 0,
            max: Math.floor(restingHr + hrr * 0.60),
            label: 'Recovery'
        },
        z2: {
            min: Math.floor(restingHr + hrr * 0.60),
            max: Math.floor(restingHr + hrr * 0.70),
            label: 'Endurance'
        },
        z3: {
            min: Math.floor(restingHr + hrr * 0.70),
            max: Math.floor(restingHr + hrr * 0.80),
            label: 'Tempo'
        },
        z4: {
            min: Math.floor(restingHr + hrr * 0.80),
            max: Math.floor(restingHr + hrr * 0.90),
            label: 'Threshold'
        },
        z5: {
            min: Math.floor(restingHr + hrr * 0.90),
            max: 250,
            label: 'VO2 Max'
        }
    };
};

export const getZoneForHr = (hr, zones) => {
    if (hr < zones.z1.max) return 'Z1';
    if (hr < zones.z2.max) return 'Z2';
    if (hr < zones.z3.max) return 'Z3';
    if (hr < zones.z4.max) return 'Z4';
    return 'Z5';
};

export const getZoneColor = (zone) => {
    switch (zone) {
        case 'Z1': return 'bg-gray-400';
        case 'Z2': return 'bg-blue-500';
        case 'Z3': return 'bg-green-500';
        case 'Z4': return 'bg-yellow-500';
        case 'Z5': return 'bg-red-500';
        default: return 'bg-gray-200';
    }
};

