import React from 'react';
import { Line } from 'react-chartjs-2';
import { Heart } from 'lucide-react';
import type { BloodPressureEntry } from '../../types';

interface BloodPressureChartProps {
    labels: string[];
    bloodPressure: BloodPressureEntry[];
}

const BloodPressureChart: React.FC<BloodPressureChartProps> = ({ labels, bloodPressure }) => {
    const data = {
        labels,
        datasets: [
            {
                label: 'Systolisch (mmHg)',
                data: labels.map(label => {
                    const match = bloodPressure.find(d => d.week === label);
                    return match?.systolic || null;
                }),
                borderColor: 'rgb(239, 68, 68)',      // red-500
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.3,
                fill: false,
                spanGaps: true,
            },
            {
                label: 'Diastolisch (mmHg)',
                data: labels.map(label => {
                    const match = bloodPressure.find(d => d.week === label);
                    return match?.diastolic || null;
                }),
                borderColor: 'rgb(59, 130, 246)',     // blue-500
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: false,
                spanGaps: true,
            },
            {
                label: 'Puls (bpm)',
                data: labels.map(label => {
                    const match = bloodPressure.find(d => d.week === label);
                    return match?.pulse || null;
                }),
                borderColor: 'rgb(168, 85, 247)',     // purple-500
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                yAxisID: 'y1',
                tension: 0.3,
                fill: false,
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
                position: 'left' as const,
                title: { display: true, text: 'Blutdruck (mmHg)' },
                suggestedMin: 60,
                suggestedMax: 140
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: { display: true, text: 'Puls (bpm)' },
                grid: { drawOnChartArea: false },
                suggestedMin: 50,
                suggestedMax: 100
            },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow h-[280px]">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Blutdruck
            </h2>
            <div className="h-[220px]">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default BloodPressureChart;
