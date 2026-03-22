"use client";

import { useState, useEffect, useRef } from "react";
import GraphCanvas from "@/components/GraphCanvas";
import NodePanel from "@/components/NodePanel";
import EdgePanel from "@/components/EdgePanel";
import InputBar from "@/components/InputBar";
import { GraphData, Node, Link as GraphLink } from "@/lib/types";
import { createNode, getGraph } from "@/lib/api";
import ConnectButton from "@/components/ConnectButton";
import Link from "next/link";
import Modal from "@/components/Modal";
import NodeStats from "@/components/NodeStats";
import ContributorStats from "@/components/ContributorStats";
import ContributorsLeaderboard from "@/components/ContributorsLeaderboard";
import NodesAnalysis from "@/components/NodesAnalysis";
import NodeConclusion from "@/components/NodeConclusion";
import NodeAIAnalysis from "@/components/NodeAIAnalysis";
import NodesList from "@/components/NodesList";
import { BarChart3, ChevronDown } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";

export default function Dashboard() {
  const { accountAddress } = useWallet();
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<
    (GraphLink & { source: Node; target: Node }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [newNodeId, setNewNodeId] = useState<string | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial graph data
  useEffect(() => {
    loadGraph();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Determine WebSocket protocol based on page protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Replace http/https with appropriate WebSocket protocol
    const wsUrl = apiUrl.replace(/^https?:/, wsProtocol);

    console.log('Connecting to WebSocket:', `${wsUrl}/ws`);
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "node_created") {
          // Add new node and edges to graph
          setGraphData((prev) => ({
            nodes: [...prev.nodes, data.node],
            links: [...prev.links, ...data.edges],
          }));

          // Highlight new node
          setNewNodeId(data.node.id);
          setTimeout(() => setNewNodeId(null), 3000);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  const loadGraph = async () => {
    try {
      const data = await getGraph();
      setGraphData(data);
    } catch (err) {
      console.error("Failed to load graph:", err);
      // Initialize with empty graph if backend is not available
      setGraphData({ nodes: [], links: [] });
    }
  };

  const handleAddNode = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Pass the connected wallet address to createNode when available
      const response = await createNode(text, undefined, accountAddress || undefined);

      // Update graph data with new node and connections
      setGraphData((prev) => ({
        nodes: [...prev.nodes, response.node],
        links: [...prev.links, ...response.connections],
      }));

      // Highlight new node
      setNewNodeId(response.node.id);
      setTimeout(() => setNewNodeId(null), 3000);

      // Log evolution info
      console.log("Node added successfully:", {
        id: response.node.id,
        author_wallet: accountAddress,
        action: response.action,
        creativity_score: response.creativity_score,
        merge_count: response.merge_count,
        similarity_breakdown: response.similarity_breakdown,
      });

      // Show success message with evolution info
      if (response.action === "merged" && response.merge_count > 0) {
        console.log(
          `💡 Thought evolved! (${response.merge_count} evolution${response.merge_count > 1 ? "s" : ""}, creativity: ${(response.creativity_score * 100).toFixed(0)}%)`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create node");
      console.error("Error creating node:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleClosePanel = () => {
    setSelectedNode(null);
  };

  const handleEdgeClick = (link: any) => {
    // Extract full node objects for source and target
    const sourceNode =
      typeof link.source === "object"
        ? link.source
        : graphData.nodes.find((n) => n.id === link.source);
    const targetNode =
      typeof link.target === "object"
        ? link.target
        : graphData.nodes.find((n) => n.id === link.target);

    if (sourceNode && targetNode) {
      setSelectedNode(null);
      setSelectedEdge({
        ...link,
        source: sourceNode,
        target: targetNode,
      });
    }
  };

  const handleCloseEdgePanel = () => {
    setSelectedEdge(null);
  };

  const handleReplay = async () => {
    if (graphData.nodes.length === 0) return;

    setIsReplayMode(true);

    // Store the original data before clearing
    const originalNodes = [...graphData.nodes];
    const originalLinks = [...graphData.links];

    setGraphData({ nodes: [], links: [] });

    // Sort nodes by timestamp
    const sortedNodes = originalNodes.sort((a, b) => a.timestamp - b.timestamp);

    // Keep track of added node IDs
    const addedNodeIds = new Set<string>();

    // Replay nodes one by one
    for (let i = 0; i < sortedNodes.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const currentNode = sortedNodes[i];
      addedNodeIds.add(currentNode.id);

      // Only add links where BOTH source and target are now in the graph
      const relevantLinks = originalLinks.filter((link) => {
        const sourceId =
          typeof link.source === "string" ? link.source : link.source.id;
        const targetId =
          typeof link.target === "string" ? link.target : link.target.id;

        // Link should be added if both nodes are now in the graph
        return addedNodeIds.has(sourceId) && addedNodeIds.has(targetId);
      });

      setGraphData({
        nodes: sortedNodes.slice(0, i + 1),
        links: relevantLinks,
      });
    }

    setIsReplayMode(false);
  };

  const handleReset = () => {
    setGraphData({ nodes: [], links: [] });
    setSelectedNode(null);
    setError(null);
  };

  const analyticsActions = [
    { id: 'stats', label: 'Node Statistics', icon: '📊' },
    { id: 'list', label: 'All Nodes', icon: '📝' },
    { id: 'leaderboard', label: 'Contributors Leaderboard', icon: '🏆' },
    { id: 'contributor', label: 'Contributor Stats', icon: '👤' },
    { id: 'analysis', label: 'Network Analysis', icon: '🔍' },
    { id: 'conclusion', label: 'Network Conclusion', icon: '✅' },
    { id: 'ai-analysis', label: 'AI Analysis', icon: '🤖' },
  ];

  const handleAnalyticsAction = (actionId: string) => {
    setActiveModal(actionId);
    setIsDropdownOpen(false);
  };

  const getModalTitle = (modalId: string) => {
    const action = analyticsActions.find(a => a.id === modalId);
    return action ? action.label : '';
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'stats':
        return <NodeStats />;
      case 'list':
        return <NodesList />;
      case 'leaderboard':
        return <ContributorsLeaderboard />;
      case 'contributor':
        return <ContributorStats />;
      case 'analysis':
        return <NodesAnalysis />;
      case 'conclusion':
        return <NodeConclusion />;
      case 'ai-analysis':
        return <NodeAIAnalysis />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold text-purple-400">NeuroChain</h1>
              <p className="text-sm text-gray-400">Knowledge Graph Visualizer</p>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300">
                  {graphData.nodes.length} Nodes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">
                  {graphData.links.length} Connections
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <ConnectButton />

              {/* Analytics Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <BarChart3 size={16} />
                  Analytics
                  <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                    {analyticsActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAnalyticsAction(action.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-white"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-sm">{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/debate"
                className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                🎤 Debate Mode
              </Link>
              <button
                onClick={handleReplay}
                disabled={isReplayMode || graphData.nodes.length === 0}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isReplayMode ? "Replaying..." : "Replay"}
              </button>
              <button
                onClick={handleReset}
                disabled={graphData.nodes.length === 0}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="absolute top-[73px] bottom-0 left-0 right-0">
        <GraphCanvas
          data={graphData}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          selectedNodeId={selectedNode?.id}
          newNodeId={newNodeId}
        />
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <NodePanel node={selectedNode} onClose={handleClosePanel} />
      )}

      {/* Edge Details Panel */}
      {selectedEdge && (
        <EdgePanel edge={selectedEdge} onClose={handleCloseEdgePanel} />
      )}

      {/* Input Bar */}
      <InputBar onSubmit={handleAddNode} isLoading={isLoading} />

      {/* Analytics Modal */}
      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={getModalTitle(activeModal || '')}
        maxWidth="4xl"
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
