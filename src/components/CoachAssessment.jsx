import React from 'react';
import { TrendingUp, Scale } from 'lucide-react';
import FormatFeedback from './FormatFeedback';

/**
 * Coach's Assessment component showing overall progress, insights, and recommendations
 * @param {Object} props
 * @param {Object} props.overallProgress - Progress analysis from analyzeOverallProgress
 * @param {Object} props.performanceMetrics - Metrics from calculatePerformanceMetrics
 */
const CoachAssessment = ({ overallProgress, performanceMetrics }) => {
    if (!overallProgress) return null;

    return (
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
            {performanceMetrics?.performanceInsight?.length > 0 && (
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
    );
};

export default CoachAssessment;
