'use client';

import React, { useState } from 'react';
import { DebateConclusion as DebateConclusionType, AIAnalysis } from '@/lib/api';

interface DebateConclusionProps {
  conclusion: DebateConclusionType | null;
  aiAnalysis: AIAnalysis | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function DebateConclusion({
  conclusion,
  aiAnalysis,
  isLoading = false,
  onRefresh,
}: DebateConclusionProps) {
  const [activeView, setActiveView] = useState<'statistical' | 'ai'>('statistical');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800 h-12 rounded-lg" />
        <div className="animate-pulse bg-gray-800 h-64 rounded-lg" />
      </div>
    );
  }

  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'thought_leader': return '💡';
      case 'innovator': return '⚡';
      case 'mediator': return '🤝';
      case 'catalyst': return '🚀';
      default: return '📊';
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'thought_leader': return 'bg-yellow-900/30 border-yellow-700 text-yellow-400';
      case 'innovator': return 'bg-blue-900/30 border-blue-700 text-blue-400';
      case 'mediator': return 'bg-green-900/30 border-green-700 text-green-400';
      case 'catalyst': return 'bg-red-900/30 border-red-700 text-red-400';
      default: return 'bg-gray-800 border-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Debate Conclusion</h2>
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('statistical')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeView === 'statistical'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📊 Statistical Analysis
          </button>
          <button
            onClick={() => setActiveView('ai')}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeView === 'ai'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🤖 AI-Powered Insights
          </button>
        </div>
      </div>

      {/* Statistical Analysis View */}
      {activeView === 'statistical' && conclusion && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Total Contributions</p>
              <p className="text-2xl font-bold text-purple-400">{conclusion.total_contributions}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Unique Speakers</p>
              <p className="text-2xl font-bold text-blue-400">{conclusion.unique_speakers}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="text-2xl font-bold text-green-400">
                {Math.round(conclusion.debate_duration_minutes)}m
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Quality Score</p>
              <p className="text-2xl font-bold text-yellow-400">
                {(conclusion.overall_quality_score * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Top Speakers */}
          {conclusion.top_speakers && conclusion.top_speakers.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Speakers</h3>
              <div className="space-y-3">
                {conclusion.top_speakers.slice(0, 5).map((speaker) => (
                  <div
                    key={speaker.speaker_name}
                    className="bg-gray-900/50 rounded p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-purple-400 w-8">
                        #{speaker.rank}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white font-mono">
                          {truncateWallet(speaker.speaker_name)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {speaker.total_contributions} contributions
                        </p>
                      </div>
                    </div>
                    {speaker.badge && (
                      <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getBadgeColor(speaker.badge)}`}>
                        {getBadgeIcon(speaker.badge)} {speaker.badge.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controversial Topics */}
          {conclusion.controversial_topics && conclusion.controversial_topics.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">⚔️ Controversial Topics</h3>
              <div className="space-y-2">
                {conclusion.controversial_topics.slice(0, 5).map((topic: any, idx: number) => (
                  <div key={idx} className="bg-gray-900/50 rounded p-3">
                    <p className="text-sm text-white mb-2">
                      {truncateText(topic.topic_preview || 'No preview')}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {topic.health?.controversy_score && (
                        <span className="text-red-400">
                          Controversy: {(topic.health.controversy_score * 100).toFixed(0)}%
                        </span>
                      )}
                      {topic.dominance?.merge_count && (
                        <span>{topic.dominance.merge_count} merges</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {conclusion.insights && conclusion.insights.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">💡 Key Insights</h3>
              <ul className="space-y-2">
                {conclusion.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis View */}
      {activeView === 'ai' && aiAnalysis && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              🤖 AI Summary
            </h3>
            <p className="text-gray-200 leading-relaxed">{aiAnalysis.summary}</p>
          </div>

          {/* Best Stance */}
          <div className="bg-gray-800 border border-green-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-3">🎯 Recommended Stance</h3>
            <p className="text-gray-200 leading-relaxed">{aiAnalysis.best_stance}</p>
          </div>

          {/* Key Insights */}
          {aiAnalysis.key_insights && aiAnalysis.key_insights.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">💡 Key Insights</h3>
              <ul className="space-y-3">
                {aiAnalysis.key_insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-purple-400 text-xl">•</span>
                    <span className="text-gray-200 leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Creative Ideas */}
          {aiAnalysis.creative_ideas && aiAnalysis.creative_ideas.length > 0 && (
            <div className="bg-gray-800 border border-blue-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">✨ Creative Ideas</h3>
              <ul className="space-y-3">
                {aiAnalysis.creative_ideas.map((idea, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl">→</span>
                    <span className="text-gray-200 leading-relaxed">{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Synthesis */}
          <div className="bg-gray-800 border border-purple-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">🔄 Synthesis</h3>
            <p className="text-gray-200 leading-relaxed">{aiAnalysis.synthesis}</p>
          </div>

          {/* Strongest vs Weakest Arguments */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strongest Arguments */}
            {aiAnalysis.strongest_arguments && aiAnalysis.strongest_arguments.length > 0 && (
              <div className="bg-gray-800 border border-green-700 rounded-lg p-4">
                <h3 className="text-md font-semibold text-green-400 mb-3">💪 Strong Arguments</h3>
                <ul className="space-y-2">
                  {aiAnalysis.strongest_arguments.map((arg, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>{arg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weakest Arguments */}
            {aiAnalysis.weakest_arguments && aiAnalysis.weakest_arguments.length > 0 && (
              <div className="bg-gray-800 border border-red-700 rounded-lg p-4">
                <h3 className="text-md font-semibold text-red-400 mb-3">⚠️ Weak Arguments</h3>
                <ul className="space-y-2">
                  {aiAnalysis.weakest_arguments.map((arg, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-red-400">✗</span>
                      <span>{arg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
            <div className="bg-gray-800 border border-yellow-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">📋 Recommendations</h3>
              <ul className="space-y-3">
                {aiAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-yellow-400 font-bold">{idx + 1}.</span>
                    <span className="text-gray-200 leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Model: {aiAnalysis.metadata.analysis_model}</span>
              <span>
                {aiAnalysis.metadata.total_contributions} contributions analyzed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Data States */}
      {activeView === 'statistical' && !conclusion && (
        <div className="text-center py-12 text-gray-400 bg-gray-800 border border-gray-700 rounded-lg">
          <p>No statistical analysis available</p>
        </div>
      )}

      {activeView === 'ai' && !aiAnalysis && (
        <div className="text-center py-12 text-gray-400 bg-gray-800 border border-gray-700 rounded-lg">
          <p>No AI analysis available. Click refresh to generate.</p>
        </div>
      )}
    </div>
  );
}
