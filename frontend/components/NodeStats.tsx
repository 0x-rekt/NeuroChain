'use client';

import { useEffect, useState } from 'react';
import { getNodeStats, NodeStats as NodeStatsType } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Activity, GitBranch, Users, Sparkles } from 'lucide-react';

export default function NodeStats() {
  const [stats, setStats] = useState<NodeStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNodeStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
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

  if (!stats) return null;

  const statCards = [
    {
      icon: Activity,
      label: 'Total Nodes',
      value: stats.total_nodes ?? 0,
      color: 'purple',
    },
    {
      icon: GitBranch,
      label: 'Total Evolutions',
      value: stats.total_evolutions ?? 0,
      color: 'blue',
    },
    {
      icon: Users,
      label: 'Contributors',
      value: stats.unique_contributors ?? 0,
      color: 'green',
    },
    {
      icon: Sparkles,
      label: 'Avg Evolutions/Node',
      value: (stats.avg_evolutions_per_node ?? 0).toFixed(2),
      color: 'orange',
    },
  ];

  const colorClasses = {
    purple: 'bg-purple-900/30 text-purple-400 border-purple-700',
    blue: 'bg-blue-900/30 text-blue-400 border-blue-700',
    green: 'bg-green-900/30 text-green-400 border-green-700',
    orange: 'bg-orange-900/30 text-orange-400 border-orange-700',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${colorClasses[stat.color as keyof typeof colorClasses]} border rounded-lg p-4`}
          >
            <div className="flex items-center gap-3">
              <stat.icon size={24} />
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-400 mb-3">
          Network Quality
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Average Creativity Score</p>
            <p className="text-2xl font-bold text-purple-400">
              {((stats.avg_creativity_score ?? 0) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Active Contributors</p>
            <p className="text-lg font-semibold text-white">
              {stats.contributors?.length ?? 0} unique contributors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
