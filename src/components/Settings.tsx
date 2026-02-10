import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, X } from 'lucide-react';
import type { AppSettings } from '../types';

import SettingsProfile from './settings/SettingsProfile';
import SettingsStrava from './settings/SettingsStrava';
import SettingsWithings from './settings/SettingsWithings';

import { useSettings } from '../context/SettingsContext';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    // onSave is no longer strictly needed but kept for compatibility if passed
    onSave?: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onSave }) => {
    const { settings, updateSettings, saveSettings } = useSettings();
    const [saved, setSaved] = useState(false);

    // Local state to track unsaved changes if we wanted, 
    // but here we are updating context directly which updates the app live.
    // Ideally we might want a "draft" state, but for now we follow the existing pattern
    // of immediate updates or we simply bind the inputs to updateSettings.

    const handleChange = (field: keyof AppSettings, value: any) => {
        updateSettings({ [field]: value });
        setSaved(false);
    };

    const handleSave = () => {
        saveSettings();
        setSaved(true);
        if (onSave) onSave(settings);
        setTimeout(() => {
            onClose();
            // No reload needed with Context!
        }, 500);
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
                    <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1" data-testid="close-settings">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <SettingsProfile settings={settings} onChange={handleChange} />
                    <SettingsStrava settings={settings} onChange={handleChange} />
                    <SettingsWithings settings={settings} onChange={handleChange} />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        data-testid="settings-cancel"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        data-testid="settings-save"
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

