import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, X, User, Heart, Zap, Key } from 'lucide-react';

// Default values matching current config
const DEFAULT_SETTINGS = {
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
    zoneMethod: 'karvonen', // 'karvonen' or 'percentMax'
};

// Load settings from localStorage or use defaults
export const loadSettings = () => {
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
export const saveSettings = (settings) => {
    try {
        localStorage.setItem('zwiftAnalyseSettings', JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Error saving settings:', e);
        return false;
    }
};

const Settings = ({ isOpen, onClose, onSave }) => {
    const [settings, setSettings] = useState(loadSettings());
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSettings(loadSettings());
            setSaved(false);
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        if (saveSettings(settings)) {
            setSaved(true);
            if (onSave) onSave(settings);
            setTimeout(() => {
                onClose();
                window.location.reload(); // Reload to apply new settings
            }, 500);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {/* User Profile Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <User className="w-5 h-5 text-blue-500" />
                            User Profile
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={settings.dob}
                                    onChange={(e) => handleChange('dob', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                                <select
                                    value={settings.gender}
                                    onChange={(e) => handleChange('gender', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={settings.weight}
                                    onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={settings.height}
                                    onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Heart Rate Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <Heart className="w-5 h-5 text-red-500" />
                            Heart Rate Zones (Karvonen Formula)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Max Heart Rate (bpm)</label>
                                <input
                                    type="number"
                                    value={settings.maxHr}
                                    onChange={(e) => handleChange('maxHr', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Typical formula: 220 - age</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Resting Heart Rate (bpm)</label>
                                <input
                                    type="number"
                                    value={settings.restingHr}
                                    onChange={(e) => handleChange('restingHr', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Measure in the morning before getting up</p>
                            </div>
                        </div>
                        {/* Zone Preview */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 mb-2">Zone Preview (Karvonen):</p>
                            <div className="grid grid-cols-5 gap-2 text-xs text-center">
                                {(() => {
                                    const hrr = settings.maxHr - settings.restingHr;
                                    return ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map((z, i) => {
                                        const pcts = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.0]];
                                        const min = Math.floor(settings.restingHr + hrr * pcts[i][0]);
                                        const max = Math.floor(settings.restingHr + hrr * pcts[i][1]);
                                        const colors = ['bg-gray-400', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
                                        return (
                                            <div key={z} className={`${colors[i]} text-white py-1 rounded`}>
                                                {z}: {min}-{max}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Power Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Power Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">FTP (Watts)</label>
                                <input
                                    type="number"
                                    value={settings.ftp}
                                    onChange={(e) => handleChange('ftp', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Functional Threshold Power (1-hour max)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Weeks to Display</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={settings.weeksToShow}
                                    onChange={(e) => handleChange('weeksToShow', parseInt(e.target.value) || 6)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Strava API Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <Key className="w-5 h-5 text-orange-500" />
                            Strava API Credentials
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Get these from <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Strava API Settings</a>
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Client ID</label>
                                <input
                                    type="text"
                                    value={settings.stravaClientId}
                                    onChange={(e) => handleChange('stravaClientId', e.target.value)}
                                    placeholder="Enter your Strava Client ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Client Secret</label>
                                <input
                                    type="password"
                                    value={settings.stravaClientSecret}
                                    onChange={(e) => handleChange('stravaClientSecret', e.target.value)}
                                    placeholder="Enter your Strava Client Secret"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Withings API Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <svg className="w-5 h-5 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            Withings API (Körperdaten)
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Für Gewicht, Fettanteil & Muskelmasse. Erstelle eine App auf <a href="https://developer.withings.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">developer.withings.com</a>
                        </p>
                        {settings.withingsAccessToken && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                <span className="text-green-700 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Withings verbunden
                                </span>
                                <button
                                    onClick={() => {
                                        handleChange('withingsAccessToken', null);
                                        handleChange('withingsRefreshToken', null);
                                        handleChange('withingsTokenExpiresAt', null);
                                        handleChange('withingsUserId', null);
                                    }}
                                    className="text-red-600 text-sm hover:underline"
                                >
                                    Trennen
                                </button>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Client ID</label>
                                <input
                                    type="text"
                                    value={settings.withingsClientId}
                                    onChange={(e) => handleChange('withingsClientId', e.target.value)}
                                    placeholder="Enter your Withings Client ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Client Secret</label>
                                <input
                                    type="password"
                                    value={settings.withingsClientSecret}
                                    onChange={(e) => handleChange('withingsClientSecret', e.target.value)}
                                    placeholder="Enter your Withings Client Secret"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
