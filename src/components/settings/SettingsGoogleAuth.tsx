import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import type { AppSettings } from '../../types';

interface SettingsGoogleAuthProps {
    settings: AppSettings;
    onChange: (field: keyof AppSettings, value: any) => void;
}

const SettingsGoogleAuth: React.FC<SettingsGoogleAuthProps> = ({ settings, onChange }) => {
    const [editingClientId, setEditingClientId] = useState(false);
    const [localClientId, setLocalClientId] = useState('');

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                <Shield className="w-5 h-5 text-green-500" />
                Google OAuth (App-Zugriffschutz)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
                Erstelle eine OAuth 2.0 Client-ID in der <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>.
                <br />
                <span className="text-xs">Authorized JavaScript origins: <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:5174</code> und deine Production-URL</span>
            </p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="googleClientId" className="block text-sm font-medium text-gray-600 mb-1">
                        Client ID <span className="text-xs text-gray-400">(Benötigt für Login)</span>
                    </label>
                    <input
                        id="googleClientId"
                        data-testid="input-googleClientId"
                        type="password"
                        value={editingClientId ? localClientId : ''}
                        onChange={(e) => {
                            setLocalClientId(e.target.value);
                            if (e.target.value) {
                                onChange('googleClientId', e.target.value);
                            }
                        }}
                        onFocus={() => {
                            setEditingClientId(true);
                            setLocalClientId('');
                        }}
                        onBlur={() => setEditingClientId(false)}
                        placeholder={settings.googleClientId ? '••••••• (configured)' : 'Enter your Google Client ID'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
            </div>

            {!settings.googleClientId && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>⚠️ Wichtig:</strong> Ohne Google Client ID ist die App nicht geschützt.
                        Jeder kann auf deine Trainingsdaten zugreifen!
                    </p>
                </div>
            )}

            {settings.googleClientId && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                        <strong>✓ App geschützt:</strong> Nur autorisierte Google-Konten können sich anmelden.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SettingsGoogleAuth;
