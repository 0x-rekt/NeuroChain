'use client';

import React, { useState } from 'react';
import { DebateNode } from '@/lib/api';

interface DebateNodesListProps {
  nodes: DebateNode[];
  isLoading?: boolean;
  onNodeClick?: (node: DebateNode) => void;
}

export default function DebateNodesList({
  nodes,
  isLoading = false,
  onNodeClick,
}: DebateNodesListProps) {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-lg">No debate contributions yet</p>
        <p className="text-sm mt-2">Start contributing to begin the debate</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
  };

  return (
    <div className="space-y-4">
      {nodes.map((node) => {
        const isExpanded = expandedNodeId === node.id;
        const hasMultipleSpeakers = node.speakers && node.speakers.length > 1;

        return (
          <div
            key={node.id}
            className="bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-600 transition-all"
          >
            {/* Header */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => onNodeClick?.(node)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {hasMultipleSpeakers && (
                      <span className="px-2 py-1 bg-purple-900/30 border border-purple-700 text-purple-400 text-xs rounded-full font-medium">
                        Merged ({node.merge_count})
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(node.created_at)}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed line-clamp-3">
                    {node.primary_text}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.id);
                  }}
                  className="ml-4 p-2 hover:bg-gray-700 rounded transition-colors"
                >
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Speakers */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Speakers:</span>
                {node.speakers.map((speaker, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-300 font-mono"
                  >
                    {truncateWallet(speaker)}
                  </span>
                ))}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-700 p-4 space-y-4">
                {/* Full Accumulated Text */}
                {hasMultipleSpeakers && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">
                      Accumulated Discussion:
                    </h4>
                    <p className="text-sm text-white leading-relaxed bg-gray-900/50 p-3 rounded">
                      {node.accumulated_text}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-900/50 rounded p-3">
                    <p className="text-xs text-gray-400 mb-1">Merge Count</p>
                    <p className="text-xl font-bold text-purple-400">
                      {node.merge_count}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3">
                    <p className="text-xs text-gray-400 mb-1">Speakers</p>
                    <p className="text-xl font-bold text-blue-400">
                      {node.speakers.length}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3">
                    <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                    <p className="text-xs font-medium text-gray-300">
                      {formatTimestamp(node.last_updated)}
                    </p>
                  </div>
                </div>

                {/* Merge History */}
                {node.merge_history && node.merge_history.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">
                      Merge History:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {node.merge_history.map((merge: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gray-900/50 p-2 rounded text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-gray-300">
                              {truncateWallet(merge.speaker)}
                            </span>
                            <span className="text-gray-500">
                              {formatTimestamp(merge.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-400">{merge.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
