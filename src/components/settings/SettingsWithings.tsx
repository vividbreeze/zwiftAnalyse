import React from 'react';
import type { AppSettings } from '../../types';

interface SettingsWithingsProps {
    settings: AppSettings;
    onChange: (field: keyof AppSettings, value: any) => void;
}

const SettingsWithings: React.FC<SettingsWithingsProps> = ({ settings, onChange }) => {
    return (
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
                            onChange('withingsAccessToken', null);
                            onChange('withingsRefreshToken', null);
                            onChange('withingsTokenExpiresAt', null);
                            onChange('withingsUserId', null);
                        }}
                        className="text-red-600 text-sm hover:underline"
                        data-testid="disconnect-withings"
                    >
                        Trennen
                    </button>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <label htmlFor="withingsClientId" className="block text-sm font-medium text-gray-600 mb-1">Client ID</label>
                    <input
                        id="withingsClientId"
                        data-testid="input-withingsClientId"
                        type="text"
                        value={settings.withingsClientId}
                        onChange={(e) => onChange('withingsClientId', e.target.value)}
                        placeholder="Enter your Withings Client ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="withingsClientSecret" className="block text-sm font-medium text-gray-600 mb-1">Client Secret</label>
                    <input
                        id="withingsClientSecret"
                        data-testid="input-withingsClientSecret"
                        type="password"
                        value={settings.withingsClientSecret}
                        onChange={(e) => onChange('withingsClientSecret', e.target.value)}
                        placeholder="Enter your Withings Client Secret"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsWithings;
