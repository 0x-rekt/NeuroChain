"""
Debate analytics models — Models for tracking credibility, innovation, and topic strength.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class SpeakerCredibilityMetrics(BaseModel):
    """Metrics that determine a speaker's credibility."""

    consistency_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="How consistent and original their contributions are"
    )
    quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Average creativity/quality of their contributions"
    )
    influence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="How much their ideas are referenced by others"
    )
    engagement_depth: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Depth of engagement with topics"
    )
    overall_credibility: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weighted average of all credibility metrics"
    )


class SpeakerInnovationMetrics(BaseModel):
    """Metrics that determine a speaker's innovation."""

    novelty_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Percentage of new vs merged contributions"
    )
    creativity_average: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Average creativity across all contributions"
    )
    diversity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Cross-topic diversity"
    )
    catalyst_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="How often they trigger evolution in others"
    )
    overall_innovation: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weighted average of all innovation metrics"
    )


class SpeakerStats(BaseModel):
    """Comprehensive statistics for a speaker."""

    speaker_name: str = Field(..., description="Speaker identifier")

    # Basic stats
    total_contributions: int = Field(..., description="Total number of contributions")
    nodes_created: int = Field(..., description="Number of new nodes created")
    nodes_merged: int = Field(..., description="Number of merges into existing nodes")
    unique_topics: int = Field(..., description="Number of unique topics engaged with")

    # Time-based stats
    first_contribution: int = Field(..., description="Timestamp of first contribution")
    last_contribution: int = Field(..., description="Timestamp of last contribution")
    active_duration_minutes: float = Field(..., description="Duration of active participation")

    # Credibility and innovation
    credibility: SpeakerCredibilityMetrics
    innovation: SpeakerInnovationMetrics

    # Overall score
    overall_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Combined credibility + innovation score"
    )
    rank: Optional[int] = Field(None, description="Rank among all speakers")


class TopicDebateHealth(BaseModel):
    """Metrics showing how healthy/active a debate topic is."""

    controversy_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="How controversial/debated this topic is"
    )
    speaker_diversity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Diversity of speakers contributing"
    )
    evolution_velocity: float = Field(
        ...,
        ge=0.0,
        description="Rate of evolution (merges per hour)"
    )
    engagement_level: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall engagement level"
    )


class TopicDominance(BaseModel):
    """Metrics showing how dominant/important a topic is."""

    content_volume: int = Field(..., description="Total accumulated text length")
    time_span_minutes: float = Field(..., description="Duration from first to last contribution")
    merge_count: int = Field(..., description="Number of merges")
    speaker_count: int = Field(..., description="Number of unique speakers")
    cross_references: int = Field(
        default=0,
        description="Number of edges connecting to related topics"
    )


class TopicStats(BaseModel):
    """Comprehensive statistics for a debate topic/node."""

    node_id: str = Field(..., description="Topic node ID")
    primary_text: str = Field(..., description="Primary/first text of topic")
    preview_text: str = Field(..., description="Preview of accumulated text")

    # Health metrics
    health: TopicDebateHealth

    # Dominance metrics
    dominance: TopicDominance

    # Contributors
    speakers: List[str] = Field(..., description="All speakers who contributed")
    top_contributor: Optional[str] = Field(None, description="Speaker with most contributions")

    # Overall importance
    importance_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall importance of this topic"
    )
    rank: Optional[int] = Field(None, description="Rank among all topics")


class DebateTrend(BaseModel):
    """Emerging trend in the debate."""

    topic_id: str
    topic_preview: str
    trend_type: str = Field(
        ...,
        description="Type: 'emerging', 'controversial', 'consensus', 'divergent'"
    )
    velocity: float = Field(..., description="Rate of change")
    speakers_involved: List[str]
    description: str = Field(..., description="Human-readable trend description")


class SpeakerRanking(BaseModel):
    """Speaker ranking for leaderboard."""

    rank: int
    speaker_name: str
    overall_score: float
    credibility_score: float
    innovation_score: float
    total_contributions: int
    badge: Optional[str] = Field(
        None,
        description="Badge: 'thought_leader', 'innovator', 'mediator', 'catalyst'"
    )


class DebateConclusion(BaseModel):
    """Comprehensive debate conclusion and analysis."""

    # Summary stats
    total_nodes: int = Field(..., description="Total debate nodes")
    total_contributions: int = Field(..., description="Total contributions/merges")
    unique_speakers: int = Field(..., description="Number of unique speakers")
    debate_duration_minutes: float = Field(..., description="Total debate duration")

    # Top speakers
    top_speakers: List[SpeakerRanking] = Field(
        ...,
        description="Top 10 speakers by overall score"
    )

    # Top topics
    top_topics: List[TopicStats] = Field(
        ...,
        description="Top 10 most important topics"
    )

    # Most controversial topics
    controversial_topics: List[TopicStats] = Field(
        ...,
        description="Most debated/controversial topics"
    )

    # Emerging trends
    trends: List[DebateTrend] = Field(
        ...,
        description="Emerging trends and patterns"
    )

    # Consensus topics (low controversy, high speaker agreement)
    consensus_topics: List[TopicStats] = Field(
        ...,
        description="Topics with high consensus"
    )

    # Key insights
    insights: List[str] = Field(
        ...,
        description="AI-generated key insights from the debate"
    )

    # Overall debate quality
    overall_quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall quality of the debate"
    )


class SessionConclusion(DebateConclusion):
    """Conclusion for a specific debate session."""

    session_id: str = Field(..., description="Debate session identifier")
    session_name: Optional[str] = Field(None, description="Optional session name")
