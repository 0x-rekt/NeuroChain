'use client';

import React from 'react';
import { DebateStats } from '@/lib/api';

interface DebateStatisticsProps {
  stats: DebateStats | null;
  isLoading?: boolean;
}

export default function DebateStatistics({
  stats,
  isLoading = false,
}: DebateStatisticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No debate statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Nodes */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Debate Points</p>
              <p className="text-3xl font-bold text-purple-400">
                {stats.total_nodes}
              </p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>

        {/* Total Merges */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Merges</p>
              <p className="text-3xl font-bold text-blue-400">
                {stats.total_merges}
              </p>
            </div>
            <div className="text-4xl">🔗</div>
          </div>
        </div>

        {/* Unique Speakers */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Unique Speakers</p>
              <p className="text-3xl font-bold text-green-400">
                {stats.unique_speakers}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        {/* Avg Merges */}
        <div className="bg-gradient-to-br from-orange-900/40 to-orange-900/20 border border-orange-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Merges/Node</p>
              <p className="text-3xl font-bold text-orange-400">
                {stats.avg_merges_per_node.toFixed(2)}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Speakers List */}
      {stats.speakers && stats.speakers.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Speakers ({stats.speakers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.speakers.map((speaker, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-300 border border-gray-600"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <span className="truncate max-w-xs text-xs">{speaker}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Engagement Metrics
        </h3>
        <div className="space-y-3">
          {/* Average Contributions */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">
                Avg Contributions/Speaker
              </span>
              <span className="text-sm font-bold text-purple-400">
                {(stats.total_nodes / stats.unique_speakers).toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    ((stats.total_nodes / stats.unique_speakers) / 10) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Merge Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Merge Rate</span>
              <span className="text-sm font-bold text-blue-400">
                {(
                  (stats.total_merges / (stats.total_nodes + stats.total_merges)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${
                    (stats.total_merges / (stats.total_nodes + stats.total_merges)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Speaker Diversity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Speaker Diversity</span>
              <span className="text-sm font-bold text-green-400">
                {Math.round((stats.unique_speakers / stats.total_nodes) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${
                    (stats.unique_speakers / stats.total_nodes) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
