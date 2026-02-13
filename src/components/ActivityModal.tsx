import React from 'react';
import { Activity, TrendingUp, X } from 'lucide-react';
import { getZoneForHr, getZoneColor } from '../config/user';
import SummaryCard from './SummaryCard';
import FormatFeedback from './FormatFeedback';
import type { EnrichedActivity, StravaActivity, ActivityAnalysis, HRZones } from '../types';

interface ActivityModalProps {
    activity: EnrichedActivity | null;
    detailedActivity: StravaActivity | null;
    analysisValues: ActivityAnalysis | null;
    loadingDetails: boolean;
    zones: HRZones;
    onClose: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ activity, detailedActivity, analysisValues, loadingDetails, zones, onClose }) => {
    if (!activity) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="activity-modal">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">{activity.name}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" data-testid="close-modal">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Activity Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryCard title="Avg Power" value={`${activity.average_watts?.toFixed(0) || 0} W`} icon={<Activity className="w-5 h-5 text-yellow-500" />} />
                        <SummaryCard title="Avg HR" value={`${activity.average_heartrate?.toFixed(0) || 0} bpm`} icon={<Activity className="w-5 h-5 text-red-500" />} />
                        <SummaryCard title="Calories" value={`${activity.totalCalories} kcal`} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} />
                        <SummaryCard title="Efficiency" value={`${activity.efficiencyFactor}`} icon={<TrendingUp className="w-5 h-5 text-teal-500" />} />
                    </div>

                    {/* Coach's Feedback */}
                    {analysisValues && (
                        <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Coach&apos;s Feedback
                            </h3>
                            <div className="flex items-start gap-3" data-testid="coach-feedback">
                                <div className="w-6 flex-shrink-0">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 text-sm text-gray-700">
                                    <FormatFeedback text={analysisValues.feedback.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|🔄|⚡|📈|📉|💪|👍|🎯|✓|✔|⚠|⭐/gu, '').trim()} />
                                </div>
                            </div>

                            {/* Zone Distribution Bar */}
                            {(analysisValues.metrics as any)?.zones && (
                                <div className="mt-4">
                                    <h4 className="font-bold text-gray-700 mb-2">Heart Rate Zones</h4>
                                    <div className="flex h-8 rounded-lg overflow-hidden w-full bg-gray-200 text-xs font-bold text-white shadow-inner">
                                        {Object.entries((analysisValues.metrics as any).zones.distribution).map(([zone, data]: [string, any]) => {
                                            const pct = parseInt(data.pct);
                                            if (pct === 0) return null;
                                            return (
                                                <div
                                                    key={zone}
                                                    style={{ width: `${data.pct}%` }}
                                                    className={`h-full ${getZoneColor(zone)} flex items-center justify-center transition-all duration-300 hover:opacity-90`}
                                                    title={`${zone}: ${data.minutes} mins (${data.pct}%)`}
                                                >
                                                    {pct > 5 && <span>{zone} {pct}%</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Laps / Intervals Table */}
                    {loadingDetails ? (
                        <div className="flex justify-center py-8" data-testid="loading-spinner">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : detailedActivity?.laps && detailedActivity.laps.length > 0 ? (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-700">Intervals (Laps)</h3>
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Lap</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Power</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">HR</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Cadence</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Zone</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {detailedActivity.laps.map((lap, idx) => (
                                            <tr key={lap.id || idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-900">{lap.name || `Lap ${idx + 1}`}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    {Math.floor(lap.moving_time / 60)}:{String(lap.moving_time % 60).padStart(2, '0')}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900 font-medium">{lap.average_watts?.toFixed(0) || '-'} W</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{lap.average_heartrate?.toFixed(0) || '-'} bpm</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{lap.average_cadence?.toFixed(0) || '-'} rpm</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{lap.average_heartrate ? getZoneForHr(lap.average_heartrate, zones) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 italic">No interval data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;
