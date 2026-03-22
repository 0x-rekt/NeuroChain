'use client';

import { useEffect, useState } from 'react';
import { getNodesLeaderboard, NodesLeaderboard as LeaderboardType } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Trophy, Medal, Award } from 'lucide-react';

export default function ContributorsLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNodesLeaderboard(20);
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200">
        {error}
      </div>
    );
  }

  if (!leaderboard || leaderboard.contributors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Trophy size={48} className="mx-auto mb-3 opacity-50" />
        <p>No contributors found</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-300" size={24} />;
      case 3:
        return <Medal className="text-orange-400" size={24} />;
      default:
        return null;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-900/20 border-yellow-700';
      case 2:
        return 'bg-gray-800 border-gray-600';
      case 3:
        return 'bg-orange-900/20 border-orange-700';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-400">
          Top {leaderboard.contributors.length} Contributors
        </h3>
        <p className="text-sm text-gray-400">Total: {leaderboard.total}</p>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.contributors.map((contributor) => (
          <div
            key={contributor.speaker_name}
            className={`border rounded-lg p-4 transition-all hover:shadow-lg ${getRankBgColor(contributor.rank)}`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-12">
                {getRankIcon(contributor.rank) || (
                  <span className="text-2xl font-bold text-gray-400">#{contributor.rank}</span>
                )}
              </div>

              {/* Contributor Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-white">
                      {contributor.speaker_name}
                    </h4>
                    {contributor.badge && (
                      <span className="px-2 py-1 bg-purple-900/30 border border-purple-700 rounded text-purple-300 text-xs">
                        {contributor.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="text-purple-400" size={16} />
                    <span className="text-lg font-bold text-purple-400">
                      {(contributor.overall_score ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Contributions</p>
                    <p className="text-white font-semibold">{contributor.total_contributions ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Credibility</p>
                    <p className="text-blue-400 font-semibold">
                      {(contributor.credibility_score ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Innovation</p>
                    <p className="text-pink-400 font-semibold">
                      {(contributor.innovation_score ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
