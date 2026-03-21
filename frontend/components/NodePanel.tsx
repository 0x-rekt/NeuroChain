'use client';

import React from 'react';
import { Node } from '@/lib/types';

interface NodePanelProps {
  node: Node | null;
  onClose: () => void;
}

export default function NodePanel({ node, onClose }: NodePanelProps) {
  if (!node) return null;

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-gray-900 border-l border-gray-700 overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-purple-400">Node Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Node ID */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Node ID</h3>
          <p className="text-white font-mono text-xs break-all bg-gray-800 p-2 rounded">
            {node.id}
          </p>
        </div>

        {/* Node Text */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Content</h3>
          <p className="text-white bg-gray-800 p-3 rounded leading-relaxed">
            {node.text}
          </p>
        </div>

        {/* Timestamp */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Created</h3>
          <p className="text-white bg-gray-800 p-2 rounded">
            {new Date(node.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Hash */}
        {node.hash && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Hash</h3>
            <p className="text-white font-mono text-xs break-all bg-gray-800 p-2 rounded">
              {node.hash}
            </p>
          </div>
        )}

        {/* Transaction ID */}
        {node.txId && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">
              Algorand Transaction ID
            </h3>
            <p className="text-purple-400 font-mono text-xs break-all bg-gray-800 p-2 rounded hover:text-purple-300">
              <a
                href={`https://testnet.algoexplorer.io/tx/${node.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {node.txId}
              </a>
            </p>
          </div>
        )}

        {/* Embedding Preview */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-1">
            Embedding Vector
          </h3>
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-white font-mono text-xs">
              [{node.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Dimension: {node.embedding.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
