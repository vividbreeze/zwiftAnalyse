import React from 'react';
import { TrendingUp, Scale } from 'lucide-react';
import FormatFeedback from './FormatFeedback';
import type { OverallProgress, PerformanceMetrics } from '../types';

interface CoachAssessmentProps {
    overallProgress: OverallProgress | null;
    performanceMetrics: PerformanceMetrics | null;
}

const CoachAssessment: React.FC<CoachAssessmentProps> = ({ overallProgress, performanceMetrics }) => {
    if (!overallProgress) return null;

    return (
        <div className={`p-4 rounded-xl border ${overallProgress.color} shadow-sm bg-white`}>
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Coach's Assessment: {overallProgress.status}
            </h2>
            <div className="text-gray-700 mb-3">
                <FormatFeedback text={overallProgress.message} />
            </div>

            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mt-2">
                <div className="text-gray-800 font-medium flex items-start gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide">Next Step</span>
                    <div className="flex-1 text-sm">
                        <FormatFeedback text={overallProgress.nextStep} />
                    </div>
                </div>
            </div>

            {/* Weight Insight from Withings */}
            {overallProgress.weightInsight && (
                <div className="bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 mt-2 flex items-start gap-2.5">
                    <Scale className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="text-teal-800 text-sm font-medium">
                            <FormatFeedback text={overallProgress.weightInsight.message} />
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Insights (combined weight + training metrics) */}
            {performanceMetrics?.performanceInsight && performanceMetrics.performanceInsight.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {performanceMetrics.performanceInsight.map((insight, idx) => (
                            <div key={idx} className="bg-gray-50 px-2.5 py-1 rounded-md text-xs text-indigo-700 border border-gray-200 font-medium">
                                <FormatFeedback text={insight} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachAssessment;
