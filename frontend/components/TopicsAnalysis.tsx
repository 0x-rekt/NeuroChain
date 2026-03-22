'use client';

import React, { useState } from 'react';
import { TopicAnalysis } from '@/lib/api';

interface TopicsAnalysisProps {
  analysis: TopicAnalysis | null;
  isLoading?: boolean;
}

export default function TopicsAnalysis({
  analysis,
  isLoading = false,
}: TopicsAnalysisProps) {
  const [activeTab, setActiveTab] = useState<
    'top' | 'controversial' | 'active' | 'diverse'
  >('top');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800 h-12 rounded-lg" />
        <div className="animate-pulse bg-gray-800 h-64 rounded-lg" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No topic analysis available</p>
      </div>
    );
  }

  const tabs = [
    {
      key: 'top' as const,
      label: 'Top Topics',
      count: analysis.top_topics.length,
      icon: '🔥',
      data: analysis.top_topics,
    },
    {
      key: 'controversial' as const,
      label: 'Controversial',
      count: analysis.controversial_topics.length,
      icon: '⚔️',
      data: analysis.controversial_topics,
    },
    {
      key: 'active' as const,
      label: 'Most Active',
      count: analysis.active_topics.length,
      icon: '⚡',
      data: analysis.active_topics,
    },
    {
      key: 'diverse' as const,
      label: 'Most Diverse',
      count: analysis.diverse_topics.length,
      icon: '🌈',
      data: analysis.diverse_topics,
    },
  ];

  const currentTab = tabs.find((tab) => tab.key === activeTab);
  const currentData = currentTab?.data || [];

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const renderTopicCard = (topic: any, index: number) => {
    const importance = topic.importance_score || 0;
    const controversy = topic.health?.controversy_score || 0;
    const velocity = topic.health?.evolution_velocity || 0;
    const diversity = topic.health?.speaker_diversity || 0;

    return (
      <div
        key={index}
        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-600 transition-all"
      >
        {/* Topic Text */}
        <div className="mb-4">
          <p className="text-white text-sm leading-relaxed">
            {truncateText(topic.topic_preview || topic.text || 'No preview available')}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {importance > 0 && (
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400 mb-1">Importance</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min(importance * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-purple-400 font-medium">
                  {(importance * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {controversy > 0 && (
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400 mb-1">Controversy</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min(controversy * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-red-400 font-medium">
                  {(controversy * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {velocity > 0 && (
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400 mb-1">Velocity</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${Math.min(velocity * 10, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-yellow-400 font-medium">
                  {velocity.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {diversity > 0 && (
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400 mb-1">Diversity</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(diversity * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-green-400 font-medium">
                  {(diversity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dominance Metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {topic.dominance?.merge_count > 0 && (
            <span>📊 {topic.dominance.merge_count} merges</span>
          )}
          {topic.dominance?.content_volume > 0 && (
            <span>📝 {topic.dominance.content_volume} chars</span>
          )}
          {topic.dominance?.time_span_minutes > 0 && (
            <span>⏱️ {Math.round(topic.dominance.time_span_minutes)}min</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-2">Topic Analysis</h2>
        <p className="text-sm text-gray-400">
          Total topics analyzed: <span className="text-purple-400 font-semibold">{analysis.total_topics}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Topic Cards */}
      <div className="space-y-3">
        {currentData.length > 0 ? (
          currentData.map((topic, index) => renderTopicCard(topic, index))
        ) : (
          <div className="text-center py-12 text-gray-400 bg-gray-800 border border-gray-700 rounded-lg">
            <p>No {currentTab?.label.toLowerCase()} available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
