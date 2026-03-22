'use client';

import { useEffect, useState } from 'react';
import { getNodesAIAnalysis, NodesAIAnalysis as AIAnalysisType } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { Brain, Sparkles, TrendingUp, CheckCircle2, Lightbulb, Target } from 'lucide-react';

export default function NodeAIAnalysis() {
  const [analysis, setAnalysis] = useState<AIAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNodesAIAnalysis();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 mt-4">AI is analyzing the knowledge graph...</p>
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
      {/* Summary */}
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="text-purple-400" size={24} />
          <h4 className="text-lg font-semibold text-purple-400">AI Summary</h4>
        </div>
        <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Total Nodes</p>
          <p className="text-xl font-bold text-white">{analysis.metadata?.total_nodes ?? 0}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Contributors</p>
          <p className="text-xl font-bold text-white">{analysis.metadata?.unique_contributors ?? 0}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Average Creativity</p>
          <p className="text-xl font-bold text-white">
            {analysis.metadata?.average_creativity
              ? (analysis.metadata.average_creativity * 100).toFixed(1) + '%'
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Key Insights */}
      {analysis.key_insights && analysis.key_insights.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-yellow-400" size={20} />
            <h4 className="text-lg font-semibold text-yellow-400">Key Insights</h4>
          </div>
          <ul className="space-y-3">
            {analysis.key_insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-yellow-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best Stance */}
      {analysis.best_stance && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-green-400" size={20} />
            <h4 className="text-lg font-semibold text-green-400">Best Stance</h4>
          </div>
          <p className="text-gray-300 leading-relaxed">{analysis.best_stance}</p>
        </div>
      )}

      {/* Creative Ideas */}
      {analysis.creative_ideas && analysis.creative_ideas.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-pink-400" size={20} />
            <h4 className="text-lg font-semibold text-pink-400">Creative Ideas</h4>
          </div>
          <ul className="space-y-3">
            {analysis.creative_ideas.map((idea, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-pink-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{idea}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Synthesis */}
      {analysis.synthesis && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-blue-400" size={20} />
            <h4 className="text-lg font-semibold text-blue-400">Synthesis</h4>
          </div>
          <p className="text-gray-300 leading-relaxed">{analysis.synthesis}</p>
        </div>
      )}

      {/* Strongest Arguments */}
      {analysis.strongest_arguments && analysis.strongest_arguments.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-400" size={20} />
            <h4 className="text-lg font-semibold text-green-400">Strongest Arguments</h4>
          </div>
          <ul className="space-y-3">
            {analysis.strongest_arguments.map((argument, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{argument}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weakest Arguments */}
      {analysis.weakest_arguments && analysis.weakest_arguments.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-red-400" size={20} />
            <h4 className="text-lg font-semibold text-red-400">Weakest Arguments</h4>
          </div>
          <ul className="space-y-3">
            {analysis.weakest_arguments.map((argument, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{argument}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emerging Patterns */}
      {analysis.emerging_patterns && analysis.emerging_patterns.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-purple-400" size={20} />
            <h4 className="text-lg font-semibold text-purple-400">Emerging Patterns</h4>
          </div>
          <ul className="space-y-3">
            {analysis.emerging_patterns.map((pattern, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-purple-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{pattern}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-400" size={20} />
            <h4 className="text-lg font-semibold text-purple-400">Recommendations</h4>
          </div>
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="text-purple-400 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-gray-300">{recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analysis Metadata */}
      {analysis.metadata && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-purple-400 mb-3">Analysis Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Analysis Model</p>
              <p className="text-white font-semibold">{analysis.metadata.analysis_model}</p>
            </div>
            <div>
              <p className="text-gray-400">Total Evolutions</p>
              <p className="text-white font-semibold">{analysis.metadata.total_evolutions ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Unique Contributors</p>
              <p className="text-white font-semibold">{analysis.metadata.unique_contributors}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
