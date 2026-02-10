import { vi } from 'vitest';

const mockSettings = {
    maxHr: 182,
    restingHr: 60,
    weight: 85,
    height: 190,
    dob: '1970-12-11',
    gender: 'male',
    ftp: 200,
    weeksToShow: 6,
    stravaClientId: 'test-id',
    stravaClientSecret: 'test-secret',
    withingsClientId: 'test-client',
    withingsClientSecret: 'test-secret',
    withingsAccessToken: null,
    withingsRefreshToken: null,
    withingsTokenExpiresAt: null,
    withingsUserId: null,
    zoneMethod: 'karvonen',
};

export const loadSettings = vi.fn(() => {
    // console.log('Mock loadSettings called', mockSettings); // Commented out to avoid noise, but logically it returns current state
    return { ...mockSettings };
});
export const saveSettings = vi.fn((settings) => {
    Object.assign(mockSettings, settings);
    return true;
});
export const DEFAULT_SETTINGS = { ...mockSettings };

// Helper to manipulate state in tests
export const _setSettings = (overrides: any) => {
    Object.assign(mockSettings, overrides);
};
export const _resetSettings = () => {
    // Reset keys
    Object.keys(mockSettings).forEach(key => delete (mockSettings as any)[key]);
    // Restore defaults 
    Object.assign(mockSettings, {
        maxHr: 182,
        restingHr: 60,
        weight: 85,
        height: 190,
        dob: '1970-12-11',
        gender: 'male',
        ftp: 200,
        weeksToShow: 6,
        stravaClientId: 'test-id',
        stravaClientSecret: 'test-secret',
        withingsClientId: 'test-client',
        withingsClientSecret: 'test-secret',
        withingsAccessToken: null,
        withingsRefreshToken: null,
        withingsTokenExpiresAt: null,
        withingsUserId: null,
        zoneMethod: 'karvonen',
    });
};
