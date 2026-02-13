import React from 'react';
import { Chart } from 'react-chartjs-2';
import type { WeeklyStats } from '../../types';

interface PowerHRChartProps {
    labels: string[];
    stats: WeeklyStats[];
}

const PowerHRChart: React.FC<PowerHRChartProps> = ({ labels, stats }) => {
    const data = {
        labels,
        datasets: [
            {
                type: 'bar' as const,
                label: 'Avg Power (Watts)',
                data: stats.map(week => week.avgPower),
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                yAxisID: 'y',
            },
            {
                type: 'line' as const,
                label: 'Avg Heart Rate (bpm)',
                data: stats.map(week => week.avgHeartRate),
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                yAxisID: 'y1',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' as const },
        },
        scales: {
            y: { type: 'linear' as const, display: true, position: 'left' as const, title: { display: true, text: 'Watts' } },
            y1: { type: 'linear' as const, display: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'BPM' } },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow h-[280px]">
            <h2 className="text-lg font-semibold mb-2">Power vs Heart Rate</h2>
            <div className="h-[220px]">
                <Chart type="bar" data={data} options={options} />
            </div>
        </div>
    );
};

export default PowerHRChart;
