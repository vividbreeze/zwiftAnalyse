import React from 'react';
import { Line } from 'react-chartjs-2';
import { Scale } from 'lucide-react';

/**
 * Body Composition chart from Withings data
 * Shows weight, fat ratio, and muscle mass trends
 * 
 * @param {Object} props
 * @param {string[]} props.labels - Week labels (shared with training data)
 * @param {Object[]} props.bodyComposition - Withings body composition data points
 */
const BodyCompChart = ({ labels, bodyComposition }) => {
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
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'kg' } },
            y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: '%' }, grid: { drawOnChartArea: false } },
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
