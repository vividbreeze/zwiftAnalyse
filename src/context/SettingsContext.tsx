import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppSettings } from '../types';

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
    // User Profile
    maxHr: 182,
    restingHr: 60,
    weight: 85,
    height: 190,
    dob: '1970-12-11',
    gender: 'male',
    ftp: 200,

    // Google OAuth (App Access Protection)
    googleClientId: '',

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
    zoneMethod: 'karvonen',

    // Training Goal
    trainingGoal: 'general_fitness'
};

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    saveSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [shouldSave, setShouldSave] = useState(false);

    // Load settings on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('zwiftAnalyseSettings');
            if (saved) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }, []);

    // Auto-save settings when shouldSave flag is set
    useEffect(() => {
        if (shouldSave) {
            try {
                localStorage.setItem('zwiftAnalyseSettings', JSON.stringify(settings));
                setShouldSave(false);
            } catch (e) {
                console.error('Error saving settings:', e);
            }
        }
    }, [settings, shouldSave]);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const saveSettings = () => {
        setShouldSave(true);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
