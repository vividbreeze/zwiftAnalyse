import React, { useMemo } from 'react';
import type { ParsedWorkout } from '../../types';

interface WorkoutVisualizationProps {
    workout: ParsedWorkout;
    ftp: number;
}

interface Segment {
    type: string;
    duration: number;
    powerLow?: number;
    powerHigh?: number;
    power?: number;
}

const WorkoutVisualization: React.FC<WorkoutVisualizationProps> = ({ workout, ftp }) => {
    // Parse the workout file to extract segments
    const segments = useMemo(() => {
        const segs: Segment[] = [];
        const totalDuration = workout.duration;

        if (workout.type === 'recovery') {
            segs.push({ type: 'Warmup', duration: 300, powerLow: 0.5, powerHigh: 0.55 });
            segs.push({ type: 'SteadyState', duration: totalDuration - 600, power: 0.55 });
            segs.push({ type: 'Cooldown', duration: 300, powerLow: 0.55, powerHigh: 0.5 });
        } else if (workout.type === 'endurance') {
            segs.push({ type: 'Warmup', duration: 600, powerLow: 0.55, powerHigh: 0.70 });
            segs.push({ type: 'SteadyState', duration: totalDuration - 1200, power: 0.70 });
            segs.push({ type: 'Cooldown', duration: 600, powerLow: 0.70, powerHigh: 0.55 });
        } else if (workout.type === 'sweetspot') {
            segs.push({ type: 'Warmup', duration: 600, powerLow: 0.55, powerHigh: 0.75 });
            const mainDuration = totalDuration - 1200;
            const intervalCount = 2;
            const intervalDuration = Math.floor(mainDuration / (intervalCount * 2 - 1));
            for (let i = 0; i < intervalCount; i++) {
                segs.push({ type: 'SteadyState', duration: intervalDuration, power: 0.88 });
                if (i < intervalCount - 1) {
                    segs.push({ type: 'Recovery', duration: intervalDuration, power: 0.60 });
                }
            }
            segs.push({ type: 'Cooldown', duration: 600, powerLow: 0.70, powerHigh: 0.50 });
        } else if (workout.type === 'tempo') {
            segs.push({ type: 'Warmup', duration: 600, powerLow: 0.55, powerHigh: 0.80 });
            segs.push({ type: 'SteadyState', duration: totalDuration - 1200, power: 0.85 });
            segs.push({ type: 'Cooldown', duration: 600, powerLow: 0.80, powerHigh: 0.55 });
        } else if (workout.type === 'ftp-builder' || workout.type === 'threshold') {
            segs.push({ type: 'Warmup', duration: 600, powerLow: 0.55, powerHigh: 0.80 });
            const mainDuration = totalDuration - 1200;
            const intervalCount = 3;
            const intervalDuration = Math.floor(mainDuration / (intervalCount * 2 - 1));
            for (let i = 0; i < intervalCount; i++) {
                segs.push({ type: 'SteadyState', duration: intervalDuration, power: 0.95 });
                if (i < intervalCount - 1) {
                    segs.push({ type: 'Recovery', duration: intervalDuration, power: 0.60 });
                }
            }
            segs.push({ type: 'Cooldown', duration: 600, powerLow: 0.80, powerHigh: 0.50 });
        } else if (workout.type === 'vo2max') {
            segs.push({ type: 'Warmup', duration: 900, powerLow: 0.55, powerHigh: 0.85 });
            const mainDuration = totalDuration - 1500;
            const intervalCount = 5;
            const intervalDuration = Math.floor(mainDuration / (intervalCount * 2 - 1));
            for (let i = 0; i < intervalCount; i++) {
                segs.push({ type: 'SteadyState', duration: intervalDuration, power: 1.10 });
                if (i < intervalCount - 1) {
                    segs.push({ type: 'Recovery', duration: intervalDuration, power: 0.55 });
                }
            }
            segs.push({ type: 'Cooldown', duration: 600, powerLow: 0.70, powerHigh: 0.50 });
        } else {
            segs.push({ type: 'Warmup', duration: 600, powerLow: 0.55, powerHigh: 0.75 });
            segs.push({ type: 'SteadyState', duration: totalDuration - 1200, power: 0.80 });
            segs.push({ type: 'Cooldown', duration: 600, powerLow: 0.75, powerHigh: 0.50 });
        }

        return segs;
    }, [workout]);

    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const maxPower = Math.max(...segments.map(seg => seg.power || seg.powerHigh || 0));

    // SVG dimensions
    const svgHeight = 120;
    const svgWidth = 100; // percentage based

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50">
            <div className="mb-3">
                <h4 className="text-sm font-bold text-gray-800">{workout.name}</h4>
                <p className="text-xs text-gray-600">{workout.durationFormatted} @ {Math.round(workout.avgPower * ftp)}W avg</p>
            </div>

            {/* SVG Power profile visualization */}
            <div className="relative">
                <svg width="100%" height={svgHeight} viewBox="0 0 100 100" preserveAspectRatio="none" className="bg-gray-50 rounded border border-gray-200">
                    {segments.map((seg, idx) => {
                        const xStart = segments.slice(0, idx).reduce((sum, s) => sum + s.duration, 0) / totalDuration * 100;
                        const width = (seg.duration / totalDuration) * 100;

                        const isRamp = seg.type === 'Warmup' || seg.type === 'Cooldown';

                        if (isRamp && seg.powerLow !== undefined && seg.powerHigh !== undefined) {
                            // Draw ramp as polygon
                            const lowHeight = (seg.powerLow / maxPower) * 100;
                            const highHeight = (seg.powerHigh / maxPower) * 100;

                            // Both warmup and cooldown: powerLow is START (left), powerHigh is END (right)
                            const points = `${xStart},${100 - lowHeight} ${xStart + width},${100 - highHeight} ${xStart + width},100 ${xStart},100`;

                            const color = seg.type === 'Warmup' ? '#60a5fa' : '#93c5fd';
                            const avgPower = (seg.powerLow + seg.powerHigh) / 2;
                            const avgWatts = Math.round(avgPower * ftp);
                            const textY = 100 - (avgPower / maxPower * 100) / 2;

                            return (
                                <g key={idx}>
                                    <polygon
                                        points={points}
                                        fill={color}
                                    />
                                    {width > 8 && (
                                        <text
                                            x={xStart + width / 2}
                                            y={textY}
                                            textAnchor="middle"
                                            fontSize="5"
                                            fontWeight="bold"
                                            fill="white"
                                            stroke="#374151"
                                            strokeWidth="0.5"
                                            paintOrder="stroke"
                                        >
                                            {avgWatts}W
                                        </text>
                                    )}
                                </g>
                            );
                        } else {
                            // Draw flat segment as rectangle
                            const power = seg.power || 0;
                            const height = (power / maxPower) * 100;
                            const watts = Math.round(power * ftp);

                            const color = seg.type === 'SteadyState' ? '#f97316' :
                                         seg.type === 'Recovery' ? '#4ade80' : '#9ca3af';

                            return (
                                <g key={idx}>
                                    <rect
                                        x={xStart}
                                        y={100 - height}
                                        width={width}
                                        height={height}
                                        fill={color}
                                    />
                                    {width > 5 && height > 15 && (
                                        <text
                                            x={xStart + width / 2}
                                            y={100 - height / 2}
                                            textAnchor="middle"
                                            fontSize="5"
                                            fontWeight="bold"
                                            fill="white"
                                            stroke="#374151"
                                            strokeWidth="0.5"
                                            paintOrder="stroke"
                                        >
                                            {watts}W
                                        </text>
                                    )}
                                </g>
                            );
                        }
                    })}
                </svg>

                {/* Time markers below SVG */}
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>0:00</span>
                    <span>{Math.floor(totalDuration / 120)}:00</span>
                    <span>{Math.floor(totalDuration / 60)}:00</span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span>Warmup</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span>Work</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Recovery</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-300 rounded"></div>
                    <span>Cooldown</span>
                </div>
            </div>
        </div>
    );
};

export default WorkoutVisualization;
