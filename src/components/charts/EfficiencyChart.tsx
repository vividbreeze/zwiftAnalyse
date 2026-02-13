import React from 'react';
import { Line } from 'react-chartjs-2';
import type { WeeklyStats } from '../../types';

interface EfficiencyChartProps {
    labels: string[];
    stats: WeeklyStats[];
}

const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ labels, stats }) => {
    const data = {
        labels,
        datasets: [
            {
                label: 'Efficiency Factor (Watts/HR)',
                data: stats.map(week => week.efficiencyFactor),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' as const },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow h-[280px]">
            <h2 className="text-lg font-semibold mb-2">Efficiency Factor</h2>
            <div className="h-[220px]">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default EfficiencyChart;
