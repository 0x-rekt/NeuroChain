'use client';

import { useEffect, useState } from 'react';
import { getNodesConclusion, NodesConclusion as ConclusionType } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { CheckCircle2, Lightbulb, TrendingUp, Award, Clock, Flame } from 'lucide-react';

export default function NodeConclusion() {
  const [conclusion, setConclusion] = useState<ConclusionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConclusion();
  }, []);

  const loadConclusion = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNodesConclusion();
      setConclusion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conclusion');
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

  if (!conclusion) return null;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
          <p className="text-sm text-purple-400 mb-1">Total Nodes</p>
          <p className="text-2xl font-bold text-white">{conclusion.total_nodes ?? 0}</p>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-400 mb-1">Contributions</p>
          <p className="text-2xl font-bold text-white">{conclusion.total_contributions ?? 0}</p>
        </div>

        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-400 mb-1">Contributors</p>
          <p className="text-2xl font-bold text-white">{conclusion.unique_speakers ?? 0}</p>
        </div>

        <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4">
          <p className="text-sm text-orange-400 mb-1">Quality Score</p>
          <p className="text-2xl font-bold text-white">
            {((conclusion.overall_quality_score ?? 0) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Session Duration */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="text-blue-400" size={18} />
          <h4 className="text-lg font-semibold text-blue-400">Session Duration</h4>
        </div>
        <p className="text-2xl font-bold text-white">
          {(conclusion.debate_duration_minutes ?? 0).toFixed(1)} minutes
        </p>
      </div>

      {/* Top Contributors */}
      {conclusion.top_speakers && conclusion.top_speakers.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-purple-400" size={20} />
            <h4 className="text-lg font-semibold text-purple-400">Top Contributors</h4>
          </div>
          <div className="space-y-2">
            {conclusion.top_speakers.map((speaker, index) => (
              <div
                key={speaker.speaker_name}
                className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-400">#{speaker.rank}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{speaker.speaker_name}</p>
                      {speaker.badge && (
                        <span className="px-2 py-1 bg-purple-900/30 border border-purple-700 rounded text-purple-300 text-xs">
                          {speaker.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {speaker.total_contributions ?? 0} contributions
                    </p>
                  </div>
                </div>
                <span className="text-purple-400 font-bold">{(speaker.overall_score ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends */}
      {conclusion.trends && conclusion.trends.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-400" size={20} />
            <h4 className="text-lg font-semibold text-green-400">Emerging Trends</h4>
          </div>
          <div className="space-y-3">
            {conclusion.trends.slice(0, 5).map((trend, index) => (
              <div key={trend.topic_id} className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white font-medium">{trend.trend_type} trend</p>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">{trend.topic_preview}</p>
                    <p className="text-xs text-gray-500 mt-1">{trend.description}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-sm text-green-400 font-semibold">
                      Velocity: {trend.velocity.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {trend.speakers_involved.length} speakers
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Topics */}
      {conclusion.top_topics && conclusion.top_topics.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-orange-400" size={20} />
            <h4 className="text-lg font-semibold text-orange-400">Top Topics</h4>
          </div>
          <div className="space-y-3">
            {conclusion.top_topics.slice(0, 3).map((topic, index) => (
              <div key={topic.node_id} className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-white">{topic.primary_text}</p>
                    {topic.rank && (
                      <p className="text-xs text-purple-400 mt-1">Rank #{topic.rank}</p>
                    )}
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-sm text-orange-400 font-semibold">
                      Score: {(topic.importance_score ?? 0).toFixed(3)}
                    </p>
                    {topic.dominance && (
                      <p className="text-xs text-gray-400">
                        {topic.dominance.merge_count} merges
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {conclusion.insights && conclusion.insights.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-yellow-400" size={20} />
            <h4 className="text-lg font-semibold text-yellow-400">Key Insights</h4>
          </div>
          <ul className="space-y-2">
            {conclusion.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
