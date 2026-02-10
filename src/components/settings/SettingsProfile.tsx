import React from 'react';
import { User, Heart, Zap } from 'lucide-react';
import type { AppSettings } from '../../types';

interface SettingsProfileProps {
    settings: AppSettings;
    onChange: (field: keyof AppSettings, value: any) => void;
}

const SettingsProfile: React.FC<SettingsProfileProps> = ({ settings, onChange }) => {
    return (
        <>
            {/* User Profile Section */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                    <User className="w-5 h-5 text-blue-500" />
                    User Profile
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                        <input
                            id="dob"
                            data-testid="input-dob"
                            type="date"
                            value={settings.dob}
                            onChange={(e) => onChange('dob', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                        <select
                            id="gender"
                            data-testid="input-gender"
                            value={settings.gender}
                            onChange={(e) => onChange('gender', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-600 mb-1">Weight (kg)</label>
                        <input
                            id="weight"
                            data-testid="input-weight"
                            type="number"
                            value={settings.weight}
                            onChange={(e) => onChange('weight', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="height" className="block text-sm font-medium text-gray-600 mb-1">Height (cm)</label>
                        <input
                            id="height"
                            data-testid="input-height"
                            type="number"
                            value={settings.height}
                            onChange={(e) => onChange('height', parseInt(e.target.value) || 0)}
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
                        <label htmlFor="maxHr" className="block text-sm font-medium text-gray-600 mb-1">Max Heart Rate (bpm)</label>
                        <input
                            id="maxHr"
                            data-testid="input-maxHr"
                            type="number"
                            value={settings.maxHr}
                            onChange={(e) => onChange('maxHr', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical formula: 220 - age</p>
                    </div>
                    <div>
                        <label htmlFor="restingHr" className="block text-sm font-medium text-gray-600 mb-1">Resting Heart Rate (bpm)</label>
                        <input
                            id="restingHr"
                            data-testid="input-restingHr"
                            type="number"
                            value={settings.restingHr}
                            onChange={(e) => onChange('restingHr', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Measure in the morning before getting up</p>
                    </div>
                </div>
                {/* Zone Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Zone Preview (Karvonen):</p>
                    <div className="grid grid-cols-5 gap-2 text-xs text-center" data-testid="zone-preview">
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
                        <label htmlFor="ftp" className="block text-sm font-medium text-gray-600 mb-1">FTP (Watts)</label>
                        <input
                            id="ftp"
                            data-testid="input-ftp"
                            type="number"
                            value={settings.ftp}
                            onChange={(e) => onChange('ftp', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Functional Threshold Power (1-hour max)</p>
                    </div>
                    <div>
                        <label htmlFor="weeksToShow" className="block text-sm font-medium text-gray-600 mb-1">Weeks to Display</label>
                        <input
                            id="weeksToShow"
                            data-testid="input-weeksToShow"
                            type="number"
                            min="1"
                            max="12"
                            value={settings.weeksToShow}
                            onChange={(e) => onChange('weeksToShow', parseInt(e.target.value) || 6)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsProfile;
