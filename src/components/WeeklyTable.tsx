import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getZoneColor } from '../config/user';
import type { WeeklyStats, EnrichedActivity } from '../types';

interface WeeklyTableProps {
    stats: WeeklyStats[];
    expandedWeeks: Record<number, boolean>;
    onToggleWeek: (index: number) => void;
    onActivityClick: (activity: EnrichedActivity) => void;
}

const WeeklyTable: React.FC<WeeklyTableProps> = ({ stats, expandedWeeks, onToggleWeek, onActivityClick }) => {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Weekly Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500 w-10"></th>
                            <th className="px-6 py-3 font-medium text-gray-500">Week</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Power (W)</th>
                            <th className="px-6 py-3 font-medium text-gray-500">HR (bpm)</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Cadence (rpm)</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Efficiency</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Work (kcal)</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Time (hrs)</th>
                            <th className="px-6 py-3 font-medium text-gray-500 w-32">Zones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {[...stats].reverse().map((week, index) => (
                            <React.Fragment key={index}>
                                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => onToggleWeek(index)}>
                                    <td className="px-6 py-4">
                                        {expandedWeeks[index] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </td>
                                    <td className="px-6 py-4 font-medium">{week.label}</td>
                                    <td className="px-6 py-4">{week.avgPower}</td>
                                    <td className="px-6 py-4">{week.avgHeartRate}</td>
                                    <td className="px-6 py-4">{week.avgCadence}</td>
                                    <td className="px-6 py-4">{week.efficiencyFactor}</td>
                                    <td className="px-6 py-4">{week.totalCalories}</td>
                                    <td className="px-6 py-4">{week.timeHours}</td>
                                    <td className="px-6 py-4">
                                        <ZoneBar zonePcts={week.zonePcts} />
                                    </td>
                                </tr>
                                {expandedWeeks[index] && (
                                    <tr>
                                        <td colSpan={9} className="bg-gray-50 p-4">
                                            <ActivityList
                                                activities={week.activities}
                                                onActivityClick={onActivityClick}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ZoneBarProps {
    zonePcts: Record<string, string>;
}

const ZoneBar: React.FC<ZoneBarProps> = ({ zonePcts }) => (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-100">
        {Object.entries(zonePcts || {}).map(([zone, pct]: [string, string]) => {
            const width = parseFloat(pct);
            if (width === 0) return null;
            return (
                <div
                    key={zone}
                    style={{ width: `${width}%` }}
                    className={`h-full ${getZoneColor(zone)}`}
                    title={`${zone}: ${pct}%`}
                />
            );
        })}
    </div>
);

interface ActivityListProps {
    activities: EnrichedActivity[];
    onActivityClick: (activity: EnrichedActivity) => void;
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onActivityClick }) => (
    <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dur</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watts</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Zones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
                {activities.map((activity) => (
                    <tr
                        key={activity.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={(e) => { e.stopPropagation(); onActivityClick(activity); }}
                    >
                        <td className="px-4 py-2 text-sm text-gray-900">{format(parseISO(activity.start_date), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">{activity.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{activity.type}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{activity.timeHours} hrs</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{activity.average_watts?.toFixed(0) || '-'} W</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{activity.average_heartrate?.toFixed(0) || '-'} bpm</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{activity.totalCalories} kcal</td>
                        <td className="px-4 py-2 text-sm">
                            <div className="flex bg-gray-100 rounded-full h-2 w-full overflow-hidden">
                                {activity.zonePcts ? (
                                    Object.entries(activity.zonePcts).map(([zone, pct]) => {
                                        const width = parseFloat(pct);
                                        if (width === 0) return null;
                                        return (
                                            <div
                                                key={zone}
                                                style={{ width: `${width}%` }}
                                                className={`h-full ${getZoneColor(zone)}`}
                                                title={`${zone}: ${pct}% (Est.)`}
                                            />
                                        );
                                    })
                                ) : (
                                    <div
                                        className={`h-full w-full ${getZoneColor(activity.primaryZone || 'Z1')}`}
                                        title={`Primary: ${activity.primaryZone}`}
                                    />
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default WeeklyTable;
