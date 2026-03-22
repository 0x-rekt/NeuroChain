'use client';

import React, { useState, useEffect } from 'react';
import DebateTranscriptionInput from '@/components/DebateTranscriptionInput';
import DebateNodesList from '@/components/DebateNodesList';
import DebateStats from '@/components/DebateStats';
import SpeakerLeaderboard from '@/components/SpeakerLeaderboard';
import TopicsAnalysis from '@/components/TopicsAnalysis';
import DebateConclusion from '@/components/DebateConclusion';
import {
  addDebateTranscription,
  getAllDebateNodes,
  getDebateStats,
  getDebateLeaderboard,
  getTopicsAnalysis,
  getDebateConclusion,
  getAIAnalysis,
  DebateNode,
  DebateStats as DebateStatsType,
  LeaderboardResponse,
  TopicAnalysis,
  DebateConclusion as DebateConclusionType,
  AIAnalysis,
} from '@/lib/api';
import Link from 'next/link';

export default function DebatePage() {
  const [activeTab, setActiveTab] = useState<
    'contribute' | 'nodes' | 'stats' | 'leaderboard' | 'topics' | 'conclusion'
  >('contribute');

  const [walletAddress, setWalletAddress] = useState('');
  const [debateId, setDebateId] = useState('default-debate');

  // Data states
  const [nodes, setNodes] = useState<DebateNode[]>([]);
  const [stats, setStats] = useState<DebateStatsType | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [topicsAnalysis, setTopicsAnalysis] = useState<TopicAnalysis | null>(null);
  const [conclusion, setConclusion] = useState<DebateConclusionType | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingConclusion, setIsLoadingConclusion] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'nodes':
        loadNodes();
        break;
      case 'stats':
        loadStats();
        break;
      case 'leaderboard':
        loadLeaderboard();
        break;
      case 'topics':
        loadTopicsAnalysis();
        break;
      case 'conclusion':
        loadConclusion();
        break;
    }
  }, [activeTab]);

  // Auto-refresh nodes when on contribute tab
  useEffect(() => {
    if (activeTab === 'contribute') {
      loadNodes();
      const interval = setInterval(loadNodes, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadNodes = async () => {
    setIsLoadingNodes(true);
    try {
      const response = await getAllDebateNodes();
      setNodes(response.nodes);
    } catch (err) {
      console.error('Failed to load debate nodes:', err);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getDebateStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await getDebateLeaderboard(20);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const loadTopicsAnalysis = async () => {
    setIsLoadingTopics(true);
    try {
      const data = await getTopicsAnalysis();
      setTopicsAnalysis(data);
    } catch (err) {
      console.error('Failed to load topics analysis:', err);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const loadConclusion = async () => {
    setIsLoadingConclusion(true);
    try {
      const [conclusionData, aiData] = await Promise.all([
        getDebateConclusion(debateId !== 'default-debate' ? debateId : undefined),
        getAIAnalysis(debateId !== 'default-debate' ? debateId : undefined),
      ]);
      setConclusion(conclusionData);
      setAIAnalysis(aiData);
    } catch (err) {
      console.error('Failed to load conclusion:', err);
    } finally {
      setIsLoadingConclusion(false);
    }
  };

  const handleSubmitContribution = async (speaker: string, text: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await addDebateTranscription({
        speaker,
        text,
        debate_id: debateId,
      });

      // Show success message
      const action = response.action === 'merged' ? 'merged' : 'created';
      setSuccessMessage(
        `Contribution ${action}! ${
          response.merge_count ? `Merged ${response.merge_count} times.` : ''
        }`
      );

      // Update wallet address for next contribution
      setWalletAddress(speaker);

      // Reload nodes
      await loadNodes();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshConclusion = () => {
    loadConclusion();
  };

  const tabs = [
    { key: 'contribute' as const, label: 'Contribute', icon: '✍️' },
    { key: 'nodes' as const, label: 'Discussion', icon: '💬' },
    { key: 'stats' as const, label: 'Statistics', icon: '📊' },
    { key: 'leaderboard' as const, label: 'Leaderboard', icon: '🏆' },
    { key: 'topics' as const, label: 'Topics', icon: '🔥' },
    { key: 'conclusion' as const, label: 'Conclusion', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ← Back
                </Link>
                <h1 className="text-2xl font-bold text-purple-400">Debate Mode</h1>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Real-time collaborative debate with AI-powered insights
              </p>
            </div>

            {/* Debate Session ID */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Session ID:</label>
              <input
                type="text"
                value={debateId}
                onChange={(e) => setDebateId(e.target.value)}
                placeholder="Enter debate session ID"
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'contribute' && (
          <div className="space-y-6">
            {/* Input Section */}
            <DebateTranscriptionInput
              onSubmit={handleSubmitContribution}
              isLoading={isSubmitting}
              currentSpeaker={walletAddress}
            />

            {/* Recent Contributions */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Recent Contributions</h2>
              <DebateNodesList
                nodes={nodes.slice(0, 10)}
                isLoading={isLoadingNodes}
              />
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">All Discussion Nodes</h2>
              <button
                onClick={loadNodes}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
            </div>
            <DebateNodesList nodes={nodes} isLoading={isLoadingNodes} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Debate Statistics</h2>
            <DebateStats stats={stats} isLoading={isLoadingStats} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Speaker Leaderboard</h2>
            <SpeakerLeaderboard
              speakers={leaderboard?.speakers || []}
              isLoading={isLoadingLeaderboard}
            />
          </div>
        )}

        {activeTab === 'topics' && (
          <div>
            <TopicsAnalysis analysis={topicsAnalysis} isLoading={isLoadingTopics} />
          </div>
        )}

        {activeTab === 'conclusion' && (
          <div>
            <DebateConclusion
              conclusion={conclusion}
              aiAnalysis={aiAnalysis}
              isLoading={isLoadingConclusion}
              onRefresh={handleRefreshConclusion}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <p>NeuroChain Debate Mode - Powered by AI and Blockchain</p>
        </div>
      </footer>
    </div>
  );
}
