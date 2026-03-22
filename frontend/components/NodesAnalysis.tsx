'use client';

import React, { useEffect, useState } from 'react';
import { getNodesAnalysis, NodesAnalysis as AnalysisType } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Network, TrendingUp, Activity, Sparkles } from 'lucide-react';

export default function NodesAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNodesAnalysis();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const renderNodeList = (nodes: any[], title: string, icon: React.ComponentType<any>, color: string) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          {React.createElement(icon, { className: `text-${color}-400`, size: 20 })}
          <h4 className="text-lg font-semibold text-purple-400">{title}</h4>
        </div>
        <div className="space-y-3">
          {nodes.slice(0, 5).map((node, index) => (
            <div key={node.node_id} className="bg-gray-900/50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white">{node.primary_text}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{node.node_id}</p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm text-purple-400 font-semibold">
                    Score: {(node.importance_score ?? 0).toFixed(3)}
                  </p>
                  {node.health && (
                    <p className="text-xs text-gray-400">
                      Engagement: {(node.health.engagement_level * 100).toFixed(0)}%
                    </p>
                  )}
                  {node.dominance && (
                    <p className="text-xs text-gray-400">
                      Merges: {node.dominance.merge_count ?? 0}
                    </p>
                  )}
                </div>
              </div>
              {node.preview_text && node.preview_text !== node.primary_text && (
                <div className="mt-2 text-xs text-gray-400 line-clamp-2">
                  {node.preview_text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
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

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-400 mb-3">Network Overview</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Network className="text-purple-400" size={18} />
            <span className="text-gray-300">{analysis.total_nodes ?? 0} Total Nodes</span>
          </div>
        </div>
      </div>

      {/* Top Nodes */}
      {renderNodeList(analysis.top_nodes, 'Top Nodes by Importance', TrendingUp, 'blue')}

      {/* High Engagement Nodes */}
      {renderNodeList(analysis.high_engagement_nodes, 'High Engagement Nodes', Activity, 'green')}

      {/* Active Nodes */}
      {renderNodeList(analysis.active_nodes, 'Most Active Nodes', Sparkles, 'orange')}

      {/* Creative Nodes */}
      {renderNodeList(analysis.creative_nodes, 'Most Creative Nodes', Sparkles, 'pink')}

      {/* Diverse Nodes */}
      {renderNodeList(analysis.diverse_nodes, 'Most Diverse Nodes', Network, 'yellow')}
    </div>
  );
}
