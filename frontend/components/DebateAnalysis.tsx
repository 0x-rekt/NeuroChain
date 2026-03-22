'use client';

import React, { useState } from 'react';
import { AIAnalysis, DebateConclusion } from '@/lib/api';

interface DebateAnalysisProps {
  aiAnalysis: AIAnalysis | null;
  conclusion: DebateConclusion | null;
  isLoading?: boolean;
}

export default function DebateAnalysis({
  aiAnalysis,
  conclusion,
  isLoading = false,
}: DebateAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'conclusion'>('ai');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'ai'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          AI Analysis
        </button>
        <button
          onClick={() => setActiveTab('conclusion')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'conclusion'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Conclusion
        </button>
      </div>

      {/* AI Analysis Tab */}
      {activeTab === 'ai' && aiAnalysis && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Summary</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {aiAnalysis.summary}
            </p>
          </div>

          {/* Key Insights */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Key Insights
            </h3>
            <ul className="space-y-2">
              {aiAnalysis.key_insights.map((insight, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm text-gray-300"
                >
                  <span className="text-purple-400 font-bold min-w-fit">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Best Stance */}
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">
              Best Stance
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {aiAnalysis.best_stance}
            </p>
          </div>

          {/* Creative Ideas */}
          {aiAnalysis.creative_ideas && aiAnalysis.creative_ideas.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                💡 Creative Ideas
              </h3>
              <ul className="space-y-2">
                {aiAnalysis.creative_ideas.map((idea, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 font-bold min-w-fit">
                      {idx + 1}.
                    </span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strongest Arguments */}
          {aiAnalysis.strongest_arguments &&
            aiAnalysis.strongest_arguments.length > 0 && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-300 mb-2">
                  ✓ Strongest Arguments
                </h3>
                <ul className="space-y-1">
                  {aiAnalysis.strongest_arguments.map((arg, idx) => (
                    <li key={idx} className="text-sm text-gray-300">
                      • {arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Weakest Arguments */}
          {aiAnalysis.weakest_arguments &&
            aiAnalysis.weakest_arguments.length > 0 && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-300 mb-2">
                  ✗ Weakest Arguments
                </h3>
                <ul className="space-y-1">
                  {aiAnalysis.weakest_arguments.map((arg, idx) => (
                    <li key={idx} className="text-sm text-gray-300">
                      • {arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Recommendations */}
          {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-300 mb-3">
                Recommendations
              </h3>
              <ol className="space-y-2">
                {aiAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 font-bold min-w-fit">
                      {idx + 1}.
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Conclusion Tab */}
      {activeTab === 'conclusion' && conclusion && (
        <div className="space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Total Contributions</p>
              <p className="text-2xl font-bold text-purple-400">
                {conclusion.total_contributions}
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Unique Speakers</p>
              <p className="text-2xl font-bold text-blue-400">
                {conclusion.unique_speakers}
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Debate Duration</p>
              <p className="text-2xl font-bold text-green-400">
                {conclusion.debate_duration_minutes.toFixed(1)}m
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Quality Score</p>
              <p className="text-2xl font-bold text-orange-400">
                {(conclusion.overall_quality_score * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Top Speakers */}
          {conclusion.top_speakers && conclusion.top_speakers.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Top Speakers
              </h3>
              <div className="space-y-2">
                {conclusion.top_speakers.slice(0, 5).map((speaker) => (
                  <div
                    key={speaker.speaker_name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-bold text-purple-400">
                        #{speaker.rank}
                      </span>
                      <span className="text-gray-300 truncate">
                        {speaker.speaker_name}
                      </span>
                    </div>
                    <span className="text-purple-400 font-bold">
                      {(speaker.overall_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {conclusion.insights && conclusion.insights.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Insights</h3>
              <ul className="space-y-2">
                {conclusion.insights.map((insight, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-sm text-gray-300"
                  >
                    <span className="text-purple-400 font-bold min-w-fit">
                      •
                    </span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
