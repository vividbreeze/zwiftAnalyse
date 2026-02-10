import React from 'react';
import { Line } from 'react-chartjs-2';
import { Scale } from 'lucide-react';
import type { BodyCompositionEntry } from '../../types';

interface BodyCompChartProps {
    labels: string[];
    bodyComposition: BodyCompositionEntry[];
}

const BodyCompChart: React.FC<BodyCompChartProps> = ({ labels, bodyComposition }) => {
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
                yAxisID: 'y',
                tension: 0.3,
                fill: true,
                spanGaps: true,
            },
            {
                label: 'Fettanteil (%)',
                data: labels.map(label => {
                    const match = bodyComposition.find(d => d.week === label);
                    return match?.fatRatio || null;
                }),
                borderColor: 'rgb(251, 146, 60)',
                backgroundColor: 'rgba(251, 146, 60, 0.1)',
                yAxisID: 'y1',
                tension: 0.3,
                spanGaps: true,
            },
            {
                label: 'Muskelmasse (kg)',
                data: labels.map(label => {
                    const match = bodyComposition.find(d => d.week === label);
                    return match?.muscleMass || null;
                }),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y',
                tension: 0.3,
                spanGaps: true,
            },
        ],
    };

    const options = {
        responsive: true,
        interaction: { mode: 'index' as const, intersect: false },
        scales: {
            y: { type: 'linear' as const, display: true, position: 'left' as const, title: { display: true, text: 'kg' } },
            y1: { type: 'linear' as const, display: true, position: 'right' as const, title: { display: true, text: '%' }, grid: { drawOnChartArea: false } },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-500" />
                Körperzusammensetzung
            </h2>
            <Line data={data} options={options} />
        </div>
    );
};

export default BodyCompChart;
