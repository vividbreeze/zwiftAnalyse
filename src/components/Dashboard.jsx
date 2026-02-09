import React, { useState, useEffect } from 'react';
import { getActivities, getActivityDetails } from '../services/strava';
import { analyzeActivity, analyzeOverallProgress, calculatePerformanceMetrics } from '../services/analysis';
import { isWithingsConnected, getWithingsAuthUrl, getBodyCompositionForChart, getLatestMeasures } from '../services/withings';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Activity, Clock, TrendingUp, Map, ChevronDown, ChevronRight, X, Settings as SettingsIcon, Scale } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getZoneColor, userProfile, calculateZones, getZoneForHr } from '../config/user';
import Settings, { loadSettings } from './Settings';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = ({ stats }) => {
    const [expandedWeeks, setExpandedWeeks] = useState({});
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [detailedActivity, setDetailedActivity] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [analysisValues, setAnalysisValues] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Withings state
    const [withingsConnected, setWithingsConnected] = useState(false);
    const [bodyComposition, setBodyComposition] = useState([]);
    const [latestWeight, setLatestWeight] = useState(null);
    const [loadingWithings, setLoadingWithings] = useState(false);

    // Calculate zones for tooltip display
    const zones = calculateZones(userProfile.maxHr, userProfile.restingHr);

    // Load Withings data on mount
    useEffect(() => {
        const loadWithingsData = async () => {
            const connected = isWithingsConnected();
            setWithingsConnected(connected);

            if (connected) {
                setLoadingWithings(true);
                try {
                    const [compositionData, latest] = await Promise.all([
                        getBodyCompositionForChart(),
                        getLatestMeasures()
                    ]);
                    setBodyComposition(compositionData);
                    setLatestWeight(latest);
                } catch (error) {
                    console.error('Error loading Withings data:', error);
                }
                setLoadingWithings(false);
            }
        };
        loadWithingsData();
    }, []);

    const handleWithingsConnect = () => {
        const settings = loadSettings();
        if (!settings.withingsClientId || !settings.withingsClientSecret) {
            alert('Bitte zuerst Withings Client ID & Secret in den Settings eingeben.');
            setSettingsOpen(true);
            return;
        }
        const authUrl = getWithingsAuthUrl();
        if (authUrl) {
            window.location.href = authUrl;
        }
    };

    const handleActivityClick = async (activity) => {
        setSelectedActivity(activity);
        setDetailedActivity(null);
        setAnalysisValues(null);
        setLoadingDetails(true);
        try {
            const token = localStorage.getItem('strava_access_token');
            if (token) {
                const details = await getActivityDetails(token, activity.id);
                setDetailedActivity(details);
                if (details && details.laps) {
                    setAnalysisValues(analyzeActivity(activity, details.laps, stats));
                }
            }
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const toggleWeek = (index) => {
        setExpandedWeeks(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const labels = stats.map(week => week.label);

    const hrData = {
        labels,
        datasets: [
            {
                label: 'Avg Heart Rate (bpm)',
                data: stats.map(week => week.avgHeartRate),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    const powerData = {
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

    const efficiencyData = {
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

    const zoneColors = {
        Z1: 'rgba(156, 163, 175, 0.8)', // Gray 400
        Z2: 'rgba(59, 130, 246, 0.8)',  // Blue 500
        Z3: 'rgba(34, 197, 94, 0.8)',   // Green 500
        Z4: 'rgba(234, 179, 8, 0.8)',   // Yellow 500
        Z5: 'rgba(239, 68, 68, 0.8)',   // Red 500
    };

    const zoneChartData = {
        labels,
        datasets: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map(zone => ({
            label: zone,
            data: stats.map(week => (week.zoneDistribution?.[zone] || 0).toFixed(0)), // Minutes
            backgroundColor: zoneColors[zone],
            stack: 'Stack 0',
        })),
    };

    const overallProgress = React.useMemo(() => analyzeOverallProgress(stats, latestWeight, bodyComposition), [stats, latestWeight, bodyComposition]);

    // Calculate combined performance metrics (W/kg, trends, etc.)
    const performanceMetrics = React.useMemo(() => {
        const currentStats = stats[stats.length - 1];
        return calculatePerformanceMetrics(currentStats, latestWeight, bodyComposition, stats);
    }, [stats, latestWeight, bodyComposition]);

    return (
        <div className="p-6 space-y-6">
            {/* Header with Settings Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Training Dashboard</h1>
                <div className="flex items-center gap-2">
                    {/* Withings Connect Button */}
                    {!withingsConnected ? (
                        <button
                            onClick={handleWithingsConnect}
                            className="px-3 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-md"
                            title="Mit Withings verbinden"
                        >
                            <Scale className="w-4 h-4" />
                            Withings
                        </button>
                    ) : (
                        <div className="px-3 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium flex items-center gap-2 border border-green-200">
                            <Scale className="w-4 h-4" />
                            {latestWeight ? `${latestWeight.weight} kg` : 'Verbunden'}
                        </div>
                    )}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                        title="Settings"
                    >
                        <SettingsIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            <Settings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onSave={() => { }}
            />

            {/* Coach's Global Summary */}
            {overallProgress && (
                <div className={`p-6 rounded-xl border ${overallProgress.color} shadow-sm`}>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
                        Coach's Assessment: {overallProgress.status}
                    </h2>
                    <div className="text-gray-700 text-lg mb-2">
                        <FormatFeedback text={overallProgress.message} />
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg border border-black/5 mt-3">
                        <div className="text-gray-800 font-medium flex items-start">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded mr-2 mt-0.5">NEXT STEP</span>
                            <div className="flex-1">
                                <FormatFeedback text={overallProgress.nextStep} />
                            </div>
                        </div>
                    </div>
                    {/* Weight Insight from Withings */}
                    {overallProgress.weightInsight && (
                        <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-200 mt-3 flex items-center gap-3">
                            <Scale className="w-5 h-5 text-teal-600 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="text-teal-800 font-medium">
                                    <FormatFeedback text={overallProgress.weightInsight.message} />
                                </div>
                                {overallProgress.weightInsight.performanceNote && (
                                    <div className="text-teal-600 text-sm mt-1">
                                        {overallProgress.weightInsight.performanceNote}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Performance Insights (combined weight + training metrics) */}
                    {performanceMetrics.performanceInsight && performanceMetrics.performanceInsight.length > 0 && (
                        <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200 mt-3">
                            <div className="text-indigo-800 font-medium text-sm mb-2">📊 Performance Insights:</div>
                            <div className="flex flex-wrap gap-2">
                                {performanceMetrics.performanceInsight.map((insight, idx) => (
                                    <div key={idx} className="bg-white/70 px-3 py-1.5 rounded-full text-sm text-indigo-700 border border-indigo-200">
                                        <FormatFeedback text={insight} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <SummaryCard title="Avg Power" value={`${stats[stats.length - 1]?.avgPower || 0} W`} icon={<Activity className="w-6 h-6 text-yellow-500" />} />
                <SummaryCard title="Avg Heart Rate" value={`${stats[stats.length - 1]?.avgHeartRate || 0} bpm`} icon={<Activity className="w-6 h-6 text-red-500" />} />
                <SummaryCard
                    title="Efficiency*"
                    value={`${stats[stats.length - 1]?.efficiencyFactor || 0}`}
                    icon={<TrendingUp className="w-6 h-6 text-teal-500" />}
                    tooltip="Efficiency Factor (EF) = Power / Avg HR. Measures aerobic fuel economy. Typical values: Beginners 0.7-0.9 | Trained 1.0-1.2 | Elite 1.2-1.5+. Your value will increase as fitness improves!"
                />
                {/* Power-to-Weight Ratio - only show when we have weight data */}
                {performanceMetrics.powerToWeight ? (
                    <SummaryCard
                        title="W/kg"
                        value={`${performanceMetrics.powerToWeight}`}
                        icon={<Scale className="w-6 h-6 text-teal-600" />}
                        tooltip="Power-to-Weight Ratio = Durchschnittliche Leistung / Körpergewicht. Wichtigste Kennzahl für Bergfahrer! Einsteiger: <2.5 | Moderat: 2.5-3.0 | Ambitioniert: 3.0-3.5 | Fortgeschritten: 3.5-4.0 | Elite: 4.0+"
                    />
                ) : (
                    <SummaryCard title="W/kg" value="--" icon={<Scale className="w-6 h-6 text-gray-400" />} tooltip="Verbinde Withings um W/kg zu berechnen" />
                )}
                <SummaryCard title="Woche kcal" value={`${stats[stats.length - 1]?.totalCalories || 0} kcal`} icon={<TrendingUp className="w-6 h-6 text-blue-600" />} />
                <SummaryCard title="Avg Cadence" value={`${stats[stats.length - 1]?.avgCadence || 0} rpm`} icon={<Clock className="w-6 h-6 text-purple-500" />} />
            </div>

            {/* Charts - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Bar data={powerData} options={{
                        scales: {
                            y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Watts' } },
                            y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'BPM' } },
                        },
                    }} />
                </div>
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
                                Misst deine aerobe "Kraftstoffeffizienz". Höher = besser!
                            </p>
                            <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                                <div className="flex justify-between"><span className="text-gray-400">Anfänger:</span><span>0.7 - 0.9</span></div>
                                <div className="flex justify-between"><span className="text-blue-400">Trainiert:</span><span>1.0 - 1.2</span></div>
                                <div className="flex justify-between"><span className="text-green-400">Elite:</span><span>1.2 - 1.5+</span></div>
                            </div>
                        </div>
                    </div>
                    <Line data={efficiencyData} />
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="group relative">
                        <h2 className="text-xl font-semibold mb-4 cursor-help inline-flex items-center">
                            Weekly Time in Zones
                            <span className="ml-2 text-gray-400 text-sm">(hover for ranges)</span>
                        </h2>
                        {/* Zone Ranges Tooltip */}
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
                    <Bar data={zoneChartData} options={{
                        responsive: true,
                        scales: {
                            x: { stacked: true },
                            y: { stacked: true, title: { display: true, text: 'Minutes' } },
                        },
                    }} />
                </div>

                {/* Body Composition Chart (Withings) - inside grid */}
                {withingsConnected && bodyComposition.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-teal-500" />
                            Körperzusammensetzung
                        </h2>
                        <Line
                            data={{
                                labels: labels,
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
                            }}
                            options={{
                                responsive: true,
                                interaction: {
                                    mode: 'index',
                                    intersect: false,
                                },
                                scales: {
                                    y: {
                                        type: 'linear',
                                        display: true,
                                        position: 'left',
                                        title: { display: true, text: 'kg' },
                                    },
                                    y1: {
                                        type: 'linear',
                                        display: true,
                                        position: 'right',
                                        title: { display: true, text: '%' },
                                        grid: { drawOnChartArea: false },
                                    },
                                },
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Weekly Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500 w-10"></th>
                                <th className="px-6 py-3 font-medium text-gray-500">Week</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Power (W)</th>
                                <th className="px-6 py-3 font-medium text-gray-500">HR (bpm)</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Cadence (rpm)</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Efficiency</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Work (kcal)</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Time (hrs)</th>
                                <th className="px-6 py-3 font-medium text-gray-500 w-32">Zones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[...stats].reverse().map((week, index) => (
                                <React.Fragment key={index}>
                                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleWeek(index)}>
                                        <td className="px-6 py-4">
                                            {expandedWeeks[index] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{week.label}</td>
                                        <td className="px-6 py-4">{week.avgPower}</td>
                                        <td className="px-6 py-4">{week.avgHeartRate}</td>
                                        <td className="px-6 py-4">{week.avgCadence}</td>
                                        <td className="px-6 py-4">{week.efficiencyFactor}</td>
                                        <td className="px-6 py-4">{week.totalCalories}</td>
                                        <td className="px-6 py-4">{week.timeHours}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-100">
                                                {Object.entries(week.zonePcts || {}).map(([zone, pct]) => {
                                                    const width = parseFloat(pct);
                                                    if (width === 0) return null;
                                                    return (
                                                        <div
                                                            key={zone}
                                                            style={{ width: `${width}%` }}
                                                            className={`h-full ${getZoneColor(zone)}`}
                                                            title={`${zone}: ${pct}%`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedWeeks[index] && (
                                        <tr>
                                            <td colSpan="9" className="bg-gray-50 p-4">
                                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dur</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watts</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kcal</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Zones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {week.activities.map((activity) => (
                                                                <tr
                                                                    key={activity.id}
                                                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); handleActivityClick(activity); }}
                                                                >
                                                                    <td className="px-4 py-2 text-sm text-gray-900">{format(parseISO(activity.start_date), 'dd/MM/yyyy HH:mm')}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">{activity.name}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">{activity.type}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">{activity.timeHours} hrs</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">{activity.average_watts?.toFixed(0) || '-'} W</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">{activity.average_heartrate?.toFixed(0) || '-'} bpm</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-500">{activity.totalCalories} kcal</td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        <div className="flex bg-gray-100 rounded-full h-2 w-full overflow-hidden">
                                                                            {activity.zonePcts ? (
                                                                                Object.entries(activity.zonePcts).map(([zone, pct]) => {
                                                                                    const width = parseFloat(pct);
                                                                                    if (width === 0) return null;
                                                                                    return (
                                                                                        <div
                                                                                            key={zone}
                                                                                            style={{ width: `${width}%` }}
                                                                                            className={`h-full ${getZoneColor(zone)}`}
                                                                                            title={`${zone}: ${pct}% (Est.)`}
                                                                                        />
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <div
                                                                                    className={`h-full w-full ${getZoneColor(activity.primaryZone || 'Z1')}`}
                                                                                    title={`Primary: ${activity.primaryZone}`}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity Detail Modal */}
            {selectedActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-gray-800">{selectedActivity.name}</h2>
                            <button onClick={() => setSelectedActivity(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard title="Avg Power" value={`${selectedActivity.average_watts?.toFixed(0) || 0} W`} icon={<Activity className="w-5 h-5 text-yellow-500" />} />
                                <SummaryCard title="Avg HR" value={`${selectedActivity.average_heartrate?.toFixed(0) || 0} bpm`} icon={<Activity className="w-5 h-5 text-red-500" />} />
                                <SummaryCard title="Calories" value={`${selectedActivity.totalCalories} kcal`} icon={<TrendingUp className="w-5 h-5 text-blue-600" />} />
                                <SummaryCard title="Efficiency" value={selectedActivity.efficiencyFactor} icon={<TrendingUp className="w-5 h-5 text-teal-500" />} />
                            </div>

                            {analysisValues && (
                                <div className="space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                                    <h3 className="text-lg font-semibold text-indigo-800 flex items-center">
                                        <TrendingUp className="w-5 h-5 mr-2" />
                                        Coach's Feedback
                                    </h3>
                                    <div className="prose prose-sm max-w-none">
                                        <FormatFeedback text={analysisValues.feedback} />
                                    </div>

                                    {/* Zone Distribution Bar - Labels Inside */}
                                    {analysisValues.metrics.zones && (
                                        <div className="mt-4">
                                            <h4 className="font-bold text-gray-700 mb-2">Heart Rate Zones</h4>
                                            <div className="flex h-8 rounded-lg overflow-hidden w-full bg-gray-200 text-xs font-bold text-white shadow-inner">
                                                {Object.entries(analysisValues.metrics.zones.distribution).map(([zone, data]) => {
                                                    const pct = parseInt(data.pct);
                                                    if (pct === 0) return null;
                                                    return (
                                                        <div
                                                            key={zone}
                                                            style={{ width: `${data.pct}%` }}
                                                            className={`h-full ${getZoneColor(zone)} flex items-center justify-center transition-all duration-300 hover:opacity-90`}
                                                            title={`${zone}: ${data.minutes} mins (${data.pct}%)`}
                                                        >
                                                            {pct > 5 && <span>{zone} {pct}%</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {loadingDetails ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                </div>
                            ) : detailedActivity?.laps && detailedActivity.laps.length > 0 ? (
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-700">Intervals (Laps)</h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Lap</th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Power</th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">HR</th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Cadence</th>
                                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Zone</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {detailedActivity.laps.map((lap, idx) => (
                                                    <tr key={lap.id || idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm text-gray-900">{lap.name || `Lap ${idx + 1}`}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">
                                                            {Math.floor(lap.moving_time / 60)}:{String(lap.moving_time % 60).padStart(2, '0')}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 font-medium">{lap.average_watts?.toFixed(0) || '-'} W</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">{lap.average_heartrate?.toFixed(0) || '-'} bpm</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">{lap.average_cadence?.toFixed(0) || '-'} rpm</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">{lap.average_heartrate ? getZoneForHr(lap.average_heartrate, zones) : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">No interval data available.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent Footer Legend */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 shadow-lg z-40 flex justify-center items-center space-x-6 text-xs text-gray-600">
                <span className="font-bold uppercase tracking-wider">HR Zones:</span>
                <div className="flex items-center"><div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div> Z1 Regeneration</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div> Z2 Grundlage</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> Z3 Tempo</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div> Z4 Schwelle</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div> Z5 VO2max</div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon, tooltip }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-4 relative group">
        <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 flex items-center">
                {title}
                {tooltip && (
                    <span className="ml-1 text-xs text-gray-400 cursor-help border border-gray-300 rounded-full w-4 h-4 flex items-center justify-center font-mono">?</span>
                )}
            </p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
        {tooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {tooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
            </div>
        )}
    </div>
);

export default Dashboard;

const FormatFeedback = ({ text }) => {
    if (!text) return null;

    // Split by newlines first to handle paragraphs/lines
    const lines = text.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // If line is empty, render a spacer/break
                if (!line.trim()) return <br key={i} />;

                // Check for headers (e.g., ## Title)
                if (line.startsWith('## ')) {
                    return <h4 key={i} className="font-bold text-lg text-indigo-900 mt-2 mb-1">{line.replace('## ', '')}</h4>;
                }

                // Parse bold text within the line: **Bold**
                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <p key={i} className="text-gray-700">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="font-bold text-indigo-800">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};
