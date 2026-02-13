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
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' as const },
        },
        scales: {
            x: { stacked: true },
            y: { stacked: true, title: { display: true, text: 'Minutes' } },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow h-[280px]">
            <h2 className="text-lg font-semibold mb-2">HR Zones</h2>
            <div className="h-[220px]">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default ZonesChart;
