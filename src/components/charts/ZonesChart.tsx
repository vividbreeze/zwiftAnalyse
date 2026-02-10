import React from 'react';
import { Bar } from 'react-chartjs-2';
import { userProfile } from '../../config/user';
import type { WeeklyStats, HRZones } from '../../types';

const ZONE_COLORS: Record<string, string> = {
    Z1: 'rgba(156, 163, 175, 0.8)',
    Z2: 'rgba(59, 130, 246, 0.8)',
    Z3: 'rgba(34, 197, 94, 0.8)',
    Z4: 'rgba(234, 179, 8, 0.8)',
    Z5: 'rgba(239, 68, 68, 0.8)',
};

interface ZonesChartProps {
    labels: string[];
    stats: WeeklyStats[];
    zones: HRZones;
}

const ZonesChart: React.FC<ZonesChartProps> = ({ labels, stats, zones }) => {
    const data = {
        labels,
        datasets: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map(zone => ({
            label: zone,
            data: stats.map(week => (week.zoneDistribution?.[zone] || 0).toFixed(0)),
            backgroundColor: ZONE_COLORS[zone],
            stack: 'Stack 0',
        })),
    };

    const options = {
        responsive: true,
        scales: {
            x: { stacked: true },
            y: { stacked: true, title: { display: true, text: 'Minutes' } },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="group relative">
                <h2 className="text-xl font-semibold mb-4 cursor-help inline-flex items-center">
                    Weekly Time in Zones
                    <span className="ml-2 text-gray-400 text-sm">(hover for ranges)</span>
                </h2>
                <div className="absolute left-0 top-8 z-50 hidden group-hover:block bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4 w-80">
                    <div className="font-bold mb-3 border-b border-gray-700 pb-2">Deine HR-Zonen Bereiche</div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Z1 Regeneration</span>
                            <span className="font-mono">&lt;{zones.z1.max} bpm</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-blue-400">Z2 Grundlage <span className="text-blue-300 text-xs">(aerob)</span></span>
                            <span className="font-mono">{zones.z2.min}-{zones.z2.max} bpm</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-green-400">Z3 Tempo <span className="text-green-300 text-xs">(Übergang)</span></span>
                            <span className="font-mono">{zones.z3.min}-{zones.z3.max} bpm</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-yellow-400">Z4 Schwelle <span className="text-yellow-300 text-xs">(anaerob)</span></span>
                            <span className="font-mono">{zones.z4.min}-{zones.z4.max} bpm</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-red-400">Z5 VO2max</span>
                            <span className="font-mono">&gt;{zones.z5.min} bpm</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
                        Karvonen-Formel · Max HR: {userProfile.maxHr} · Ruhe HR: {userProfile.restingHr}
                    </div>
                </div>
            </div>
            <Bar data={data} options={options} />
        </div>
    );
};

export default ZonesChart;
