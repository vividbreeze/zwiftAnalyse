import React, { useState } from 'react';
import { Key } from 'lucide-react';
import type { AppSettings } from '../../types';

interface SettingsStravaProps {
    settings: AppSettings;
    onChange: (field: keyof AppSettings, value: any) => void;
}

const SettingsStrava: React.FC<SettingsStravaProps> = ({ settings, onChange }) => {
    const [editingClientId, setEditingClientId] = useState(false);
    const [editingClientSecret, setEditingClientSecret] = useState(false);
    const [localClientId, setLocalClientId] = useState('');
    const [localClientSecret, setLocalClientSecret] = useState('');

    return (
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
                    <label htmlFor="stravaClientId" className="block text-sm font-medium text-gray-600 mb-1">Client ID</label>
                    <input
                        id="stravaClientId"
                        data-testid="input-stravaClientId"
                        type="password"
                        value={editingClientId ? localClientId : ''}
                        onChange={(e) => {
                            setLocalClientId(e.target.value);
                            if (e.target.value) {
                                onChange('stravaClientId', e.target.value);
                            }
                        }}
                        onFocus={() => {
                            setEditingClientId(true);
                            setLocalClientId('');
                        }}
                        onBlur={() => setEditingClientId(false)}
                        placeholder={settings.stravaClientId ? '••••••• (configured)' : 'Enter your Strava Client ID'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="stravaClientSecret" className="block text-sm font-medium text-gray-600 mb-1">Client Secret</label>
                    <input
                        id="stravaClientSecret"
                        data-testid="input-stravaClientSecret"
                        type="password"
                        value={editingClientSecret ? localClientSecret : ''}
                        onChange={(e) => {
                            setLocalClientSecret(e.target.value);
                            if (e.target.value) {
                                onChange('stravaClientSecret', e.target.value);
                            }
                        }}
                        onFocus={() => {
                            setEditingClientSecret(true);
                            setLocalClientSecret('');
                        }}
                        onBlur={() => setEditingClientSecret(false)}
                        placeholder={settings.stravaClientSecret ? '••••••• (configured)' : 'Enter your Strava Client Secret'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsStrava;
