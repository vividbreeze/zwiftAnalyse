import React from 'react';
import { Bar } from 'react-chartjs-2';

/**
 * Power vs Heart Rate dual-axis bar/line chart
 * Shows the relationship between weekly average power and heart rate
 * 
 * @param {Object} props
 * @param {string[]} props.labels - Week labels
 * @param {Object[]} props.stats - Weekly stats with avgPower and avgHeartRate
 */
const PowerHRChart = ({ labels, stats }) => {
    const data = {
        labels,
        datasets: [
            {
                type: 'bar',
                label: 'Avg Power (Watts)',
                data: stats.map(week => week.avgPower),
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                yAxisID: 'y',
            },
            {
                type: 'line',
                label: 'Avg Heart Rate (bpm)',
                data: stats.map(week => week.avgHeartRate),
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                yAxisID: 'y1',
            },
        ],
    };

    const options = {
        scales: {
            y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Watts' } },
            y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'BPM' } },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="group relative">
                <h2 className="text-xl font-semibold mb-4 cursor-help inline-flex items-center">
                    Power vs Heart Rate
                    <span className="ml-2 text-gray-400 text-xs">ⓘ</span>
                </h2>
                <div className="absolute left-0 top-8 z-50 hidden group-hover:block bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4 w-72">
                    <div className="font-bold mb-2 border-b border-gray-700 pb-2">Power vs Heart Rate</div>
                    <p className="text-gray-300 text-xs">
                        Zeigt den Zusammenhang zwischen deiner durchschnittlichen Leistung (Watts) und Herzfrequenz (BPM) pro Woche.
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                        <strong>Idealfall:</strong> Power steigt, HR bleibt gleich oder sinkt → bessere Effizienz!
                    </p>
                </div>
            </div>
            <Bar data={data} options={options} />
        </div>
    );
};

export default PowerHRChart;
