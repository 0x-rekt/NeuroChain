'use client';

import React, { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GraphData, Node } from '@/lib/types';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface GraphCanvasProps {
  data: GraphData;
  onNodeClick?: (node: Node) => void;
  selectedNodeId?: string | null;
  newNodeId?: string | null;
}

export default function GraphCanvas({ data, onNodeClick, selectedNodeId, newNodeId }: GraphCanvasProps) {
  const graphRef = useRef<any>(null);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node as Node);
    }
  }, [onNodeClick]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.text;
    const fontSize = 12 / globalScale;
    const isSelected = node.id === selectedNodeId;
    const isNew = node.id === newNodeId;

    // Draw glow for new nodes
    if (isNew) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 12);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = isNew ? '#a78bfa' : (isSelected ? '#3b82f6' : '#8b5cf6');
    ctx.fill();

    // Draw outline if selected or new
    if (isSelected || isNew) {
      ctx.strokeStyle = isNew ? '#a78bfa' : '#60a5fa';
      ctx.lineWidth = isNew ? 3 / globalScale : 2 / globalScale;
      ctx.stroke();
    }

    // Draw label
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(label.substring(0, 30) + (label.length > 30 ? '...' : ''), node.x, node.y + 8);
  }, [selectedNodeId, newNodeId]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;

    // Draw link
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    // Color based on score
    const alpha = Math.min(link.score, 1);
    ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();

    // Draw directional particles
    const textPos = Object.assign({}, ...['x', 'y'].map(c => ({
      [c]: start[c] + (end[c] - start[c]) / 2
    })));

    ctx.font = `${10 / globalScale}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText((link.score * 100).toFixed(0) + '%', textPos.x, textPos.y);
  }, []);

  return (
    <div className="w-full h-full bg-gray-950">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel="text"
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeClick={handleNodeClick}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        backgroundColor="#030712"
        warmupTicks={100}
        cooldownTicks={0}
      />
    </div>
  );
}
