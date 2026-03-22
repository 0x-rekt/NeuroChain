'use client';

import React from 'react';
import { LeaderboardSpeaker } from '@/lib/api';

interface SpeakerLeaderboardProps {
  speakers: LeaderboardSpeaker[];
  isLoading?: boolean;
}

const getBadgeIcon = (badge?: string) => {
  switch (badge) {
    case 'thought_leader':
      return '💡';
    case 'innovator':
      return '⚡';
    case 'mediator':
      return '🤝';
    case 'catalyst':
      return '🚀';
    default:
      return '📊';
  }
};

const getBadgeColor = (badge?: string) => {
  switch (badge) {
    case 'thought_leader':
      return 'bg-yellow-900/30 border-yellow-700 text-yellow-400';
    case 'innovator':
      return 'bg-blue-900/30 border-blue-700 text-blue-400';
    case 'mediator':
      return 'bg-green-900/30 border-green-700 text-green-400';
    case 'catalyst':
      return 'bg-red-900/30 border-red-700 text-red-400';
    default:
      return 'bg-gray-800 border-gray-700 text-gray-400';
  }
};

export default function SpeakerLeaderboard({
  speakers,
  isLoading = false,
}: SpeakerLeaderboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!speakers || speakers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No speakers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {speakers.map((speaker) => (
        <div
          key={speaker.speaker_name}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-purple-400 w-8 text-center">
                #{speaker.rank}
              </div>
              <div>
                <p className="text-white font-semibold text-sm truncate max-w-xs">
                  {speaker.speaker_name}
                </p>
                <p className="text-xs text-gray-400">
                  {speaker.total_contributions} contributions
                </p>
              </div>
            </div>
            {speaker.badge && (
              <div
                className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getBadgeColor(
                  speaker.badge,
                )}`}
              >
                {getBadgeIcon(speaker.badge)} {speaker.badge.replace('_', ' ')}
              </div>
            )}
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-2">
            {/* Overall Score */}
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400">Overall</p>
              <p className="text-lg font-bold text-purple-400">
                {(speaker.overall_score * 100).toFixed(0)}%
              </p>
            </div>

            {/* Credibility Score */}
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400">Credibility</p>
              <p className="text-lg font-bold text-blue-400">
                {(speaker.credibility_score * 100).toFixed(0)}%
              </p>
            </div>

            {/* Innovation Score */}
            <div className="bg-gray-900/50 rounded p-2">
              <p className="text-xs text-gray-400">Innovation</p>
              <p className="text-lg font-bold text-green-400">
                {(speaker.innovation_score * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Credibility</span>
                <span className="text-xs text-blue-400">
                  {(speaker.credibility_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(speaker.credibility_score * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Innovation</span>
                <span className="text-xs text-green-400">
                  {(speaker.innovation_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(speaker.innovation_score * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
