import React from 'react';
import { TrendingUp, Scale, Heart, Zap, AlertTriangle } from 'lucide-react';
import FormatFeedback from './FormatFeedback';
import type { OverallProgress, PerformanceMetrics, FTPEstimate } from '../types';

interface CoachAssessmentProps {
    overallProgress: OverallProgress | null;
    performanceMetrics: PerformanceMetrics | null;
    ftpEstimate?: FTPEstimate | null;
}

const CoachAssessment: React.FC<CoachAssessmentProps> = ({ overallProgress, performanceMetrics, ftpEstimate }) => {
    if (!overallProgress) return null;

    // Helper to strip emojis and symbols from text
    const stripSymbols = (text: string) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|🔄|⚡|📈|📉|💪|👍|🎯|✓|✔|⚠|⭐/gu, '').trim();
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Coach's Assessment</h2>

            <div className="space-y-1">
                {/* Main Status */}
                <div className="flex items-start gap-3 py-2">
                    <div className="w-6 flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 text-sm text-gray-700">
                        <FormatFeedback text={stripSymbols(overallProgress.message)} />
                    </div>
                </div>

                {/* Next Step */}
                <div className="flex items-start gap-3 py-2 bg-indigo-50 -mx-4 px-4 border-l-4 border-indigo-500">
                    <div className="w-6 flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 text-sm text-gray-800">
                        <FormatFeedback text={stripSymbols(overallProgress.nextStep)} />
                    </div>
                </div>

                {/* FTP Estimate */}
                {ftpEstimate && (
                    <div className="flex items-start gap-3 py-2">
                        <div className="w-6 flex-shrink-0">
                            <Zap className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 text-sm text-gray-700">
                            <FormatFeedback text={stripSymbols(ftpEstimate.recommendation)} />
                        </div>
                    </div>
                )}

                {/* Weight Insight */}
                {overallProgress.weightInsight && (
                    <div className="flex items-start gap-3 py-2">
                        <div className="w-6 flex-shrink-0">
                            <Scale className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1 text-sm text-gray-700">
                            <FormatFeedback text={stripSymbols(overallProgress.weightInsight.message)} />
                        </div>
                    </div>
                )}

                {/* Blood Pressure Insight */}
                {overallProgress.bloodPressureInsight && (
                    <div className="flex items-start gap-3 py-2">
                        <div className="w-6 flex-shrink-0">
                            <Heart className={`w-5 h-5 ${
                                overallProgress.bloodPressureInsight.trend === 'improving'
                                    ? 'text-green-600'
                                    : overallProgress.bloodPressureInsight.trend === 'worsening'
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                            }`} />
                        </div>
                        <div className="flex-1 text-sm text-gray-700">
                            <FormatFeedback text={stripSymbols(overallProgress.bloodPressureInsight.message)} />
                        </div>
                    </div>
                )}

                {/* Performance Insights */}
                {performanceMetrics?.performanceInsight && performanceMetrics.performanceInsight.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <div className="space-y-1">
                            {performanceMetrics.performanceInsight.map((insight, idx) => (
                                <div key={idx} className="flex items-start gap-3 py-1">
                                    <div className="w-6 flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1 text-xs text-gray-600">
                                        <FormatFeedback text={stripSymbols(insight)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachAssessment;
