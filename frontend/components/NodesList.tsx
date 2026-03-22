'use client';

import { useEffect, useState } from 'react';
import { listNodes, NodeListResponse } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Node } from '@/lib/types';

export default function NodesList() {
  const [data, setData] = useState<NodeListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadNodes();
  }, [page]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listNodes(pageSize, page * pageSize);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data ? Math.ceil((data.total ?? 0) / pageSize) : 0;

  if (loading && !data) {
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

  if (!data || data.nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText size={48} className="mx-auto mb-3 opacity-50" />
        <p>No nodes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-purple-400">
          All Nodes ({data.total ?? 0})
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Nodes List */}
      <div className="space-y-2">
        {data.nodes.map((node: Node) => (
          <div
            key={node.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-white mb-2">{node.text}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="font-mono">{node.id}</span>
                  {node.author_wallet && (
                    <span>
                      By: {node.author_wallet.slice(0, 6)}...{node.author_wallet.slice(-4)}
                    </span>
                  )}
                  <span>{new Date(node.timestamp * 1000).toLocaleString()}</span>
                </div>
              </div>
              {node.embedding_norm !== undefined && node.embedding_norm !== null && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Embedding Norm</p>
                  <p className="text-sm text-purple-400 font-semibold">
                    {node.embedding_norm.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading && data && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}
