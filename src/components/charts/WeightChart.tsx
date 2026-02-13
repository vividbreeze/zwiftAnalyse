import React from 'react';
import { Line } from 'react-chartjs-2';
import { Scale } from 'lucide-react';
import type { BodyCompositionEntry } from '../../types';

interface WeightChartProps {
    labels: string[];
    bodyComposition: BodyCompositionEntry[];
}

const WeightChart: React.FC<WeightChartProps> = ({ labels, bodyComposition }) => {
    const data = {
        labels,
        datasets: [
            {
                label: 'Gewicht (kg)',
                data: labels.map(label => {
                    const match = bodyComposition.find(d => d.week === label);
                    return match?.weight || null;
                }),
                borderColor: 'rgb(20, 184, 166)',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                tension: 0.3,
                fill: true,
                spanGaps: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { display: true, position: 'top' as const },
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                title: { display: true, text: 'kg' }
            },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow h-[280px]">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-500" />
                Gewicht
            </h2>
            <div className="h-[220px]">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default WeightChart;
