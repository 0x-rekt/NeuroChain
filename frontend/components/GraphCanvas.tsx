"use client";

import React, { useRef, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { GraphData, Node } from "@/lib/types";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphCanvasProps {
  data: GraphData;
  onNodeClick?: (node: Node) => void;
  onLinkClick?: (link: any) => void;
  selectedNodeId?: string | null;
  newNodeId?: string | null;
  onEdgeClick?: (edge: any) => void;
}

// Cluster colors for different unconnected components
const CLUSTER_COLORS = [
  "#8b5cf6", // purple
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#8b5cf6", // purple (repeat)
  "#6366f1", // indigo
  "#14b8a6", // teal
];

// Detect clusters using Union-Find algorithm
function detectClusters(nodes: Node[], links: any[]): Map<string, number> {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  // Initialize each node as its own parent
  nodes.forEach(node => {
    parent.set(node.id, node.id);
    rank.set(node.id, 0);
  });

  // Find with path compression
  function find(id: string): string {
    if (parent.get(id) !== id) {
      parent.set(id, find(parent.get(id)!));
    }
    return parent.get(id)!;
  }

  // Union by rank
  function union(id1: string, id2: string) {
    const root1 = find(id1);
    const root2 = find(id2);

    if (root1 !== root2) {
      const rank1 = rank.get(root1)!;
      const rank2 = rank.get(root2)!;

      if (rank1 > rank2) {
        parent.set(root2, root1);
      } else if (rank1 < rank2) {
        parent.set(root1, root2);
      } else {
        parent.set(root2, root1);
        rank.set(root1, rank1 + 1);
      }
    }
  }

  // Union all connected nodes
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    union(sourceId, targetId);
  });

  // Map each node to its cluster ID
  const clusterMap = new Map<string, number>();
  const rootToCluster = new Map<string, number>();
  let clusterId = 0;

  nodes.forEach(node => {
    const root = find(node.id);
    if (!rootToCluster.has(root)) {
      rootToCluster.set(root, clusterId++);
    }
    clusterMap.set(node.id, rootToCluster.get(root)!);
  });

  return clusterMap;
}

export default function GraphCanvas({
  data,
  onNodeClick,
  onLinkClick,
  onEdgeClick,
  selectedNodeId,
  newNodeId,
}: GraphCanvasProps) {
  const graphRef = useRef<any>(null);

  // Detect clusters whenever data changes
  const clusterMap = useMemo(() => {
    return detectClusters(data.nodes, data.links);
  }, [data.nodes, data.links]);

  // Configure force layout for better clustering
  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;

      // Configure forces for tighter clustering
      fg.d3Force('link')
        .distance((link: any) => {
          // Shorter distance for higher similarity (semantic score)
          const semanticScore = link.semantic || link.score || 0.5;
          return 30 + (1 - semanticScore) * 70; // 30-100 pixels
        })
        .strength((link: any) => {
          // Stronger links for higher similarity
          const semanticScore = link.semantic || link.score || 0.5;
          return semanticScore * 2; // 0-2
        });

      // Charge force to prevent overlap but keep clusters compact
      fg.d3Force('charge')
        .strength(-120) // Repulsion between nodes
        .distanceMax(200); // Limit repulsion distance

      // Add center force to keep graph centered
      fg.d3Force('center')
        .strength(0.05);

      // Note: Collision force is handled by the charge and link forces
      // to keep dependencies minimal

      // Cluster-based positioning
      fg.d3Force('cluster', () => {
        const clusterCenters = new Map<number, { x: number; y: number; count: number }>();

        return (alpha: number) => {
          data.nodes.forEach((node: any) => {
            const clusterId = clusterMap.get(node.id) || 0;

            if (!clusterCenters.has(clusterId)) {
              // Position clusters in a grid
              const numClusters = Math.max(...Array.from(clusterMap.values())) + 1;
              const cols = Math.ceil(Math.sqrt(numClusters));
              const row = Math.floor(clusterId / cols);
              const col = clusterId % cols;

              clusterCenters.set(clusterId, {
                x: (col - cols / 2) * 300,
                y: (row - Math.ceil(numClusters / cols) / 2) * 300,
                count: 0
              });
            }

            const center = clusterCenters.get(clusterId)!;
            const k = alpha * 0.1;

            // Pull nodes toward their cluster center
            if (isFinite(node.x) && isFinite(node.y)) {
              node.vx -= (node.x - center.x) * k;
              node.vy -= (node.y - center.y) * k;
            }
          });
        };
      });
    }
  }, [data, clusterMap]);

  const handleNodeClick = useCallback(
    (node: any) => {
      if (onNodeClick) {
        onNodeClick(node as Node);
      }
    },
    [onNodeClick],
  );

  const handleLinkClick = useCallback(
    (link: any) => {
      // Log to console
      const edgeData = {
        source: typeof link.source === "object" ? link.source.id : link.source,
        target: typeof link.target === "object" ? link.target.id : link.target,
        score: link.score,
        semantic: link.semantic,
        keyword: link.keyword,
        time: link.time,
      };
      console.log("Link clicked:", edgeData);

      // Call edge click handler with full data
      if (onEdgeClick) {
        onEdgeClick(link);
      }

      // Also call legacy onLinkClick if provided
      if (onLinkClick) {
        onLinkClick(link);
      }
    },
    [onLinkClick, onEdgeClick],
  );

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Safety check: ensure node has valid coordinates
      if (!isFinite(node.x) || !isFinite(node.y)) {
        return; // Skip rendering if coordinates are invalid
      }

      const label = node.text;
      const fontSize = 12 / globalScale;
      const isSelected = node.id === selectedNodeId;
      const isNew = node.id === newNodeId;

      // Get cluster color
      const clusterId = clusterMap.get(node.id) || 0;
      const clusterColor = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];

      // Draw glow for new nodes
      if (isNew) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          12,
        );
        gradient.addColorStop(0, `${clusterColor}cc`);
        gradient.addColorStop(1, `${clusterColor}00`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);

      if (isNew) {
        ctx.fillStyle = clusterColor;
      } else if (isSelected) {
        ctx.fillStyle = "#facc15"; // Yellow for selected
      } else {
        ctx.fillStyle = clusterColor;
      }
      ctx.fill();

      // Draw outline if selected or new
      if (isSelected || isNew) {
        ctx.strokeStyle = isSelected ? "#fbbf24" : clusterColor;
        ctx.lineWidth = isNew ? 3 / globalScale : 2 / globalScale;
        ctx.stroke();
      }

      // Draw label with better contrast
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add text background for better readability
      const text = label.substring(0, 30) + (label.length > 30 ? "..." : "");
      const textWidth = ctx.measureText(text).width;
      const padding = 4;

      ctx.fillStyle = "rgba(3, 7, 18, 0.85)";
      ctx.fillRect(
        node.x - textWidth / 2 - padding,
        node.y + 8 - fontSize / 2 - padding / 2,
        textWidth + padding * 2,
        fontSize + padding
      );

      ctx.fillStyle = "#e5e7eb";
      ctx.fillText(text, node.x, node.y + 10);
    },
    [selectedNodeId, newNodeId, clusterMap],
  );

  const paintLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;

      // Safety check: ensure start and end are objects (not strings or numbers) and have valid coordinates
      if (
        typeof start !== "object" ||
        typeof end !== "object" ||
        !start ||
        !end ||
        !isFinite(start.x) ||
        !isFinite(start.y) ||
        !isFinite(end.x) ||
        !isFinite(end.y)
      ) {
        return; // Skip rendering if coordinates are invalid
      }

      // Get cluster IDs for source and target
      const sourceCluster = clusterMap.get(start.id) || 0;
      const targetCluster = clusterMap.get(end.id) || 0;
      const sameCluster = sourceCluster === targetCluster;

      // Draw link with curved lines to reduce crossing
      ctx.beginPath();

      if (sameCluster) {
        // Straight line for same cluster (to keep cluster tight)
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      } else {
        // Curved line for inter-cluster connections
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dr = Math.sqrt(dx * dx + dy * dy);

        // Control point for quadratic curve
        const cpX = (start.x + end.x) / 2 + dy * 0.2;
        const cpY = (start.y + end.y) / 2 - dx * 0.2;

        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
      }

      // Color based on cluster and semantic score
      const semanticScore = link.semantic || link.score || 0;
      const alpha = Math.min(semanticScore * 0.8 + 0.2, 1);

      if (sameCluster) {
        // Use cluster color for intra-cluster links
        const clusterColor = CLUSTER_COLORS[sourceCluster % CLUSTER_COLORS.length];
        const rgb = hexToRgb(clusterColor);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        ctx.lineWidth = 1.5 / globalScale;
      } else {
        // Gray for inter-cluster links
        ctx.strokeStyle = `rgba(156, 163, 175, ${alpha * 0.5})`;
        ctx.lineWidth = 1 / globalScale;
      }

      ctx.stroke();

      // Draw score label showing overall score (only for strong connections)
      if (semanticScore > 0.5) {
        const textPos = Object.assign({}, ...["x", "y"].map((c) => ({
          [c]: start[c] + (end[c] - start[c]) / 2,
        })));

        ctx.font = `${9 / globalScale}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = sameCluster ? "#d1d5db" : "#9ca3af";

        const displayScore = link.score || semanticScore;
        ctx.fillText((displayScore * 100).toFixed(0) + "%", textPos.x, textPos.y);
      }
    },
    [clusterMap],
  );

  // Helper function to convert hex to RGB
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 139, g: 92, b: 246 };
  }

  return (
    <div className="w-full h-full bg-gray-950">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel="text"
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          // Define clickable area for nodes
          // Safety check for valid coordinates
          if (!isFinite(node.x!) || !isFinite(node.y!)) return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 6, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkCanvasObject={paintLink}
        linkPointerAreaPaint={(link: any, color: string, ctx: CanvasRenderingContext2D) => {
          // Define clickable area for links
          const start = link.source;
          const end = link.target;

          // Type guard: ensure start and end are objects (not strings or numbers)
          if (typeof start !== "object" || typeof end !== "object") return;
          if (
            !start ||
            !end ||
            !isFinite(start.x!) ||
            !isFinite(start.y!) ||
            !isFinite(end.x!) ||
            !isFinite(end.y!)
          )
            return;

          ctx.strokeStyle = color;
          ctx.lineWidth = 3; // Wider for easier clicking
          ctx.beginPath();
          ctx.moveTo(start.x!, start.y!);
          ctx.lineTo(end.x!, end.y!);
          ctx.stroke();
        }}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.2}
        backgroundColor="#030712"
        warmupTicks={200}
        cooldownTicks={100}
        cooldownTime={5000}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
