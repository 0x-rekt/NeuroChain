'use client';

import { useState } from 'react';
import { getContributorNodeStats, ContributorNodeStats as ContributorStatsType } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Search, User, FileText, Award, Sparkles, Target, TrendingUp } from 'lucide-react';

export default function ContributorStats() {
  const [contributorName, setContributorName] = useState('');
  const [stats, setStats] = useState<ContributorStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getContributorNodeStats(contributorName.trim());
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contributor stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            placeholder="Enter contributor name or wallet address..."
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !contributorName.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Stats Display */}
      {stats && !loading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <User className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{stats.speaker_name}</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-purple-400">Rank #{stats.rank}</span>
                <span className="text-gray-400">Overall Score: {(stats.overall_score ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Basic Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <FileText size={18} />
                <p className="text-sm">Total Contributions</p>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_contributions ?? 0}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Target size={18} />
                <p className="text-sm">Nodes Created</p>
              </div>
              <p className="text-2xl font-bold text-white">{stats.nodes_created ?? 0}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp size={18} />
                <p className="text-sm">Nodes Merged</p>
              </div>
              <p className="text-2xl font-bold text-white">{stats.nodes_merged ?? 0}</p>
            </div>
          </div>

          {/* Credibility Metrics */}
          {stats.credibility && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-400 mb-4">Credibility Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Consistency</p>
                  <p className="text-lg font-bold text-blue-400">
                    {(stats.credibility.consistency_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Quality</p>
                  <p className="text-lg font-bold text-blue-400">
                    {(stats.credibility.quality_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Influence</p>
                  <p className="text-lg font-bold text-blue-400">
                    {(stats.credibility.influence_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Engagement</p>
                  <p className="text-lg font-bold text-blue-400">
                    {(stats.credibility.engagement_depth * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400">Overall Credibility</p>
                  <p className="text-xl font-bold text-blue-400">
                    {(stats.credibility.overall_credibility * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Innovation Metrics */}
          {stats.innovation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-pink-400 mb-4">Innovation Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Novelty</p>
                  <p className="text-lg font-bold text-pink-400">
                    {(stats.innovation.novelty_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Creativity Avg</p>
                  <p className="text-lg font-bold text-pink-400">
                    {(stats.innovation.creativity_average * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Diversity</p>
                  <p className="text-lg font-bold text-pink-400">
                    {(stats.innovation.diversity_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Catalyst</p>
                  <p className="text-lg font-bold text-pink-400">
                    {(stats.innovation.catalyst_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400">Overall Innovation</p>
                  <p className="text-xl font-bold text-pink-400">
                    {(stats.innovation.overall_innovation * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!stats && !loading && !error && (
        <div className="text-center py-12 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-50" />
          <p>Search for a contributor to view their statistics</p>
        </div>
      )}
    </div>
  );
}
