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

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="group relative">
                <h2 className="text-xl font-semibold mb-4 cursor-help inline-flex items-center">
                    Efficiency Factor
                    <span className="ml-2 text-gray-400 text-xs">ⓘ</span>
                </h2>
                <div className="absolute left-0 top-8 z-50 hidden group-hover:block bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4 w-72">
                    <div className="font-bold mb-2 border-b border-gray-700 pb-2">Efficiency Factor (EF)</div>
                    <p className="text-gray-300 text-xs">
                        <strong>Formel:</strong> Avg Power ÷ Avg Heart Rate
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                        Misst deine aerobe &quot;Kraftstoffeffizienz&quot;. Höher = besser!
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">Anfänger:</span><span>0.7 - 0.9</span></div>
                        <div className="flex justify-between"><span className="text-blue-400">Trainiert:</span><span>1.0 - 1.2</span></div>
                        <div className="flex justify-between"><span className="text-green-400">Elite:</span><span>1.2 - 1.5+</span></div>
                    </div>
                </div>
            </div>
            <Line data={data} />
        </div>
    );
};

export default EfficiencyChart;
