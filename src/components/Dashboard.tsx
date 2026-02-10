import React, { useState, useMemo, lazy, Suspense } from 'react';
import { analyzeOverallProgress, calculatePerformanceMetrics } from '../services/analysis/index';
// ChartJS registration is now handled in main.tsx
import { Activity, Clock, TrendingUp, Settings as SettingsIcon, Scale } from 'lucide-react';
import { calculateZones } from '../config/user';
import Settings from './Settings';
import { useSettings } from '../context/SettingsContext';
import type { WeeklyStats } from '../types';

// Custom Hooks
import { useWithings } from '../hooks/useWithings';
import { useActivityDetails } from '../hooks/useActivityDetails';

// Extracted components
import CoachAssessment from './CoachAssessment';
import SummaryCard from './SummaryCard';
import ActivityModal from './ActivityModal';
import WeeklyTable from './WeeklyTable';

// Lazy loaded charts
const PowerHRChart = lazy(() => import('./charts/PowerHRChart'));
const EfficiencyChart = lazy(() => import('./charts/EfficiencyChart'));
const ZonesChart = lazy(() => import('./charts/ZonesChart'));
const BodyCompChart = lazy(() => import('./charts/BodyCompChart'));

// Loading skeleton for charts
const ChartSkeleton = () => (
    <div className="bg-white p-4 rounded-xl shadow-md h-[300px] flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
);

/**
 * Main Dashboard component
 * Orchestrates data loading and renders training analytics views
 * 
 * @param {Object} props
 * @param {Object[]} props.stats - Weekly training statistics from Strava
 */
interface DashboardProps {
    stats: WeeklyStats[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
    const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Get settings from context
    const { settings } = useSettings();

    // Custom Hooks
    const {
        connected: withingsConnected,
        bodyComposition,
        latestWeight,
        connect: connectWithings
    } = useWithings();

    const {
        selectedActivity,
        detailedActivity,
        analysisValues,
        loading: loadingDetails,
        selectActivity,
        clearSelection
    } = useActivityDetails(stats);

    // Calculate zones based on settings from Context
    const zones = useMemo(() => calculateZones(settings.maxHr, settings.restingHr), [settings.maxHr, settings.restingHr]);
    const labels = stats.map(week => week.label);

    /** Connect to Withings OAuth */
    const handleWithingsConnect = () => {
        connectWithings(() => {
            alert('Bitte zuerst Withings Client ID & Secret in den Settings eingeben.');
            setSettingsOpen(true);
        });
    };

    const toggleWeek = (index: number) => {
        setExpandedWeeks(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Memoized analysis
    const overallProgress = useMemo(
        () => analyzeOverallProgress(stats, latestWeight, bodyComposition),
        [stats, latestWeight, bodyComposition]
    );

    const performanceMetrics = useMemo(() => {
        const currentStats = stats[stats.length - 1];
        return calculatePerformanceMetrics(currentStats, latestWeight, bodyComposition, stats);
    }, [stats, latestWeight, bodyComposition]);

    const currentWeek = stats[stats.length - 1];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Training Dashboard</h1>
                <div className="flex items-center gap-2">
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
            <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onSave={() => { }} />

            {/* Coach's Assessment */}
            <CoachAssessment overallProgress={overallProgress} performanceMetrics={performanceMetrics} />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <SummaryCard title="Avg Power" value={`${currentWeek?.avgPower || 0} W`} icon={<Activity className="w-6 h-6 text-yellow-500" />} />
                <SummaryCard title="Avg Heart Rate" value={`${currentWeek?.avgHeartRate || 0} bpm`} icon={<Activity className="w-6 h-6 text-red-500" />} />
                <SummaryCard
                    title="Efficiency*"
                    value={`${currentWeek?.efficiencyFactor || 0}`}
                    icon={<TrendingUp className="w-6 h-6 text-teal-500" />}
                    tooltip="Efficiency Factor (EF) = Power / Avg HR. Measures aerobic fuel economy. Typical values: Beginners 0.7-0.9 | Trained 1.0-1.2 | Elite 1.2-1.5+. Your value will increase as fitness improves!"
                />
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
                <SummaryCard title="Woche kcal" value={`${currentWeek?.totalCalories || 0} kcal`} icon={<TrendingUp className="w-6 h-6 text-blue-600" />} />
                <SummaryCard title="Avg Cadence" value={`${currentWeek?.avgCadence || 0} rpm`} icon={<Clock className="w-6 h-6 text-purple-500" />} />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <PowerHRChart labels={labels} stats={stats} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <EfficiencyChart labels={labels} stats={stats} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <ZonesChart labels={labels} stats={stats} zones={zones} />
                </Suspense>
                {withingsConnected && bodyComposition.length > 0 && (
                    <Suspense fallback={<ChartSkeleton />}>
                        <BodyCompChart labels={labels} bodyComposition={bodyComposition} />
                    </Suspense>
                )}
            </div>

            {/* Weekly Breakdown Table */}
            <WeeklyTable
                stats={stats}
                expandedWeeks={expandedWeeks}
                onToggleWeek={toggleWeek}
                onActivityClick={selectActivity}
            />

            {/* Activity Detail Modal */}
            <ActivityModal
                activity={selectedActivity}
                detailedActivity={detailedActivity}
                analysisValues={analysisValues}
                loadingDetails={loadingDetails}
                zones={zones}
                onClose={clearSelection}
            />

            {/* Footer Legend */}
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

export default Dashboard;
