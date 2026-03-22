"""
Debate analytics service — Calculate credibility, innovation, and topic strength.
"""

from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import math

from app.models.debate import DebateNode, MergeRecord
from app.models.debate_analytics import (
    SpeakerStats,
    SpeakerCredibilityMetrics,
    SpeakerInnovationMetrics,
    TopicStats,
    TopicDebateHealth,
    TopicDominance,
    DebateConclusion,
    DebateTrend,
    SpeakerRanking,
)
from app.utils.logger import logger


# Weights for scoring algorithms
CREDIBILITY_WEIGHTS = {
    "consistency": 0.25,
    "quality": 0.30,
    "influence": 0.25,
    "engagement": 0.20,
}

INNOVATION_WEIGHTS = {
    "novelty": 0.30,
    "creativity": 0.35,
    "diversity": 0.20,
    "catalyst": 0.15,
}


def calculate_speaker_credibility(
    speaker: str,
    all_nodes: List[DebateNode],
    speaker_contribution_map: Dict[str, List[DebateNode]],
) -> SpeakerCredibilityMetrics:
    """
    Calculate credibility metrics for a speaker.

    Credibility = consistency + quality + influence + engagement

    Args:
        speaker: Speaker name
        all_nodes: All debate nodes
        speaker_contribution_map: Map of speaker -> nodes they contributed to

    Returns:
        SpeakerCredibilityMetrics
    """
    nodes_contributed = speaker_contribution_map.get(speaker, [])

    if not nodes_contributed:
        return SpeakerCredibilityMetrics(
            consistency_score=0.0,
            quality_score=0.0,
            influence_score=0.0,
            engagement_depth=0.0,
            overall_credibility=0.0,
        )

    # 1. Consistency: Ratio of new nodes created vs total contributions
    # Higher if they create original content
    new_nodes_created = sum(
        1 for node in nodes_contributed if node.merge_count == 0 and speaker in node.speakers
    )
    total_contributions = len(nodes_contributed)
    consistency_score = new_nodes_created / max(total_contributions, 1)

    # 2. Quality: Get creativity scores from nodes where speaker was primary contributor
    # This would require tracking which speaker initiated each merge
    # For now, use merge_count as proxy for quality (more merges = attracted more discussion)
    avg_engagement = sum(node.merge_count for node in nodes_contributed) / len(nodes_contributed)
    max_engagement = max((node.merge_count for node in all_nodes), default=1)
    quality_score = min(avg_engagement / max(max_engagement, 1), 1.0)

    # 3. Influence: How many other speakers merged into nodes this speaker initiated
    influenced_speakers = set()
    for node in nodes_contributed:
        # If speaker is first speaker, they initiated this topic
        if node.speakers and node.speakers[0] == speaker:
            influenced_speakers.update(node.speakers[1:])

    influence_score = min(len(influenced_speakers) / max(len(all_nodes), 1), 1.0)

    # 4. Engagement depth: Average merge count of topics they engage with
    avg_merge_count = sum(node.merge_count for node in nodes_contributed) / len(nodes_contributed)
    max_merge_count = max((node.merge_count for node in all_nodes), default=1)
    engagement_depth = min(avg_merge_count / max(max_merge_count, 1), 1.0)

    # Calculate overall credibility (weighted average)
    overall_credibility = (
        CREDIBILITY_WEIGHTS["consistency"] * consistency_score +
        CREDIBILITY_WEIGHTS["quality"] * quality_score +
        CREDIBILITY_WEIGHTS["influence"] * influence_score +
        CREDIBILITY_WEIGHTS["engagement"] * engagement_depth
    )

    return SpeakerCredibilityMetrics(
        consistency_score=round(consistency_score, 4),
        quality_score=round(quality_score, 4),
        influence_score=round(influence_score, 4),
        engagement_depth=round(engagement_depth, 4),
        overall_credibility=round(overall_credibility, 4),
    )


def calculate_speaker_innovation(
    speaker: str,
    all_nodes: List[DebateNode],
    speaker_contribution_map: Dict[str, List[DebateNode]],
) -> SpeakerInnovationMetrics:
    """
    Calculate innovation metrics for a speaker.

    Innovation = novelty + creativity + diversity + catalyst

    Args:
        speaker: Speaker name
        all_nodes: All debate nodes
        speaker_contribution_map: Map of speaker -> nodes they contributed to

    Returns:
        SpeakerInnovationMetrics
    """
    nodes_contributed = speaker_contribution_map.get(speaker, [])

    if not nodes_contributed:
        return SpeakerInnovationMetrics(
            novelty_score=0.0,
            creativity_average=0.0,
            diversity_score=0.0,
            catalyst_score=0.0,
            overall_innovation=0.0,
        )

    # 1. Novelty: % of new nodes created (vs merging into existing)
    new_nodes = sum(
        1 for node in nodes_contributed
        if node.merge_count == 0 and node.speakers and node.speakers[0] == speaker
    )
    novelty_score = new_nodes / len(nodes_contributed)

    # 2. Creativity: For nodes they initiated, calculate average "freshness"
    # Fresh = new node or first merger into a young node
    initiated_nodes = [
        node for node in nodes_contributed
        if node.speakers and node.speakers[0] == speaker
    ]
    if initiated_nodes:
        # Higher score if they initiate lots of new discussions
        creativity_average = min(len(initiated_nodes) / max(len(all_nodes), 1), 1.0)
    else:
        creativity_average = 0.0

    # 3. Diversity: Number of unique topics engaged with
    diversity_score = len(nodes_contributed) / max(len(all_nodes), 1)

    # 4. Catalyst: How many evolutions did they trigger?
    # Count merges where this speaker contributed
    evolutions_triggered = sum(
        sum(1 for merge in node.merge_history if merge.merged_speaker == speaker)
        for node in all_nodes
    )
    total_evolutions = sum(node.merge_count for node in all_nodes)
    catalyst_score = evolutions_triggered / max(total_evolutions, 1)

    # Calculate overall innovation (weighted average)
    overall_innovation = (
        INNOVATION_WEIGHTS["novelty"] * novelty_score +
        INNOVATION_WEIGHTS["creativity"] * creativity_average +
        INNOVATION_WEIGHTS["diversity"] * diversity_score +
        INNOVATION_WEIGHTS["catalyst"] * catalyst_score
    )

    return SpeakerInnovationMetrics(
        novelty_score=round(novelty_score, 4),
        creativity_average=round(creativity_average, 4),
        diversity_score=round(diversity_score, 4),
        catalyst_score=round(catalyst_score, 4),
        overall_innovation=round(overall_innovation, 4),
    )


def calculate_speaker_stats(
    speaker: str,
    all_nodes: List[DebateNode],
) -> SpeakerStats:
    """
    Calculate comprehensive statistics for a speaker.

    Args:
        speaker: Speaker name
        all_nodes: All debate nodes

    Returns:
        SpeakerStats with all metrics
    """
    # Build contribution map
    speaker_contribution_map = defaultdict(list)
    for node in all_nodes:
        for spk in node.speakers:
            speaker_contribution_map[spk].append(node)

    nodes_contributed = speaker_contribution_map.get(speaker, [])

    if not nodes_contributed:
        # Return empty stats
        return SpeakerStats(
            speaker_name=speaker,
            total_contributions=0,
            nodes_created=0,
            nodes_merged=0,
            unique_topics=0,
            first_contribution=0,
            last_contribution=0,
            active_duration_minutes=0.0,
            credibility=SpeakerCredibilityMetrics(
                consistency_score=0.0,
                quality_score=0.0,
                influence_score=0.0,
                engagement_depth=0.0,
                overall_credibility=0.0,
            ),
            innovation=SpeakerInnovationMetrics(
                novelty_score=0.0,
                creativity_average=0.0,
                diversity_score=0.0,
                catalyst_score=0.0,
                overall_innovation=0.0,
            ),
            overall_score=0.0,
        )

    # Basic stats
    total_contributions = len(nodes_contributed)
    nodes_created = sum(
        1 for node in nodes_contributed
        if node.speakers and node.speakers[0] == speaker and node.merge_count == 0
    )
    nodes_merged = total_contributions - nodes_created
    unique_topics = len(nodes_contributed)

    # Time-based stats
    timestamps = []
    for node in nodes_contributed:
        timestamps.append(node.created_at)
        # Add merge timestamps
        for merge in node.merge_history:
            if merge.merged_speaker == speaker:
                timestamps.append(merge.merged_at)

    first_contribution = min(timestamps) if timestamps else 0
    last_contribution = max(timestamps) if timestamps else 0
    active_duration_minutes = (last_contribution - first_contribution) / (1000 * 60)

    # Calculate credibility and innovation
    credibility = calculate_speaker_credibility(speaker, all_nodes, speaker_contribution_map)
    innovation = calculate_speaker_innovation(speaker, all_nodes, speaker_contribution_map)

    # Overall score (50% credibility + 50% innovation)
    overall_score = (credibility.overall_credibility + innovation.overall_innovation) / 2

    return SpeakerStats(
        speaker_name=speaker,
        total_contributions=total_contributions,
        nodes_created=nodes_created,
        nodes_merged=nodes_merged,
        unique_topics=unique_topics,
        first_contribution=first_contribution,
        last_contribution=last_contribution,
        active_duration_minutes=round(active_duration_minutes, 2),
        credibility=credibility,
        innovation=innovation,
        overall_score=round(overall_score, 4),
    )


def calculate_topic_stats(
    node: DebateNode,
    all_nodes: List[DebateNode],
) -> TopicStats:
    """
    Calculate comprehensive statistics for a topic/node.

    Args:
        node: The debate node
        all_nodes: All debate nodes (for relative comparisons)

    Returns:
        TopicStats with health and dominance metrics
    """
    # Health metrics
    # 1. Controversy: More merges = more controversial
    max_merges = max((n.merge_count for n in all_nodes), default=1)
    controversy_score = min(node.merge_count / max(max_merges, 1), 1.0)

    # 2. Speaker diversity: More speakers = better discussion
    max_speakers = max((len(n.speakers) for n in all_nodes), default=1)
    speaker_diversity = min(len(node.speakers) / max(max_speakers, 1), 1.0)

    # 3. Evolution velocity: Merges per hour
    time_span_ms = node.last_updated - node.created_at
    time_span_hours = max(time_span_ms / (1000 * 60 * 60), 0.01)  # Avoid div by 0
    evolution_velocity = node.merge_count / time_span_hours

    # 4. Engagement level: Combined metric
    engagement_level = (controversy_score + speaker_diversity) / 2

    health = TopicDebateHealth(
        controversy_score=round(controversy_score, 4),
        speaker_diversity=round(speaker_diversity, 4),
        evolution_velocity=round(evolution_velocity, 4),
        engagement_level=round(engagement_level, 4),
    )

    # Dominance metrics
    content_volume = len(node.accumulated_text)
    time_span_minutes = time_span_ms / (1000 * 60)

    dominance = TopicDominance(
        content_volume=content_volume,
        time_span_minutes=round(time_span_minutes, 2),
        merge_count=node.merge_count,
        speaker_count=len(node.speakers),
        cross_references=0,  # Would need edge data to calculate
    )

    # Overall importance (weighted combination)
    importance_score = (
        0.4 * controversy_score +
        0.3 * speaker_diversity +
        0.2 * min(content_volume / 1000, 1.0) +  # Normalize by 1000 chars
        0.1 * min(evolution_velocity / 10, 1.0)  # Normalize by 10 merges/hour
    )

    # Determine top contributor
    speaker_merge_counts = defaultdict(int)
    for spk in node.speakers:
        speaker_merge_counts[spk] += 1
    for merge in node.merge_history:
        speaker_merge_counts[merge.merged_speaker] += 1

    top_contributor = max(speaker_merge_counts.items(), key=lambda x: x[1])[0] if speaker_merge_counts else None

    # Use full accumulated text (not truncated preview)
    # This shows ALL speaker contributions merged together
    preview_text = node.accumulated_text

    return TopicStats(
        node_id=node.id,
        primary_text=node.primary_text,
        preview_text=preview_text,  # Now contains full accumulated text
        health=health,
        dominance=dominance,
        speakers=node.speakers,
        top_contributor=top_contributor,
        importance_score=round(importance_score, 4),
    )


def identify_trends(all_nodes: List[DebateNode]) -> List[DebateTrend]:
    """
    Identify emerging trends in the debate.

    Trends include:
    - Emerging: New topics with high velocity
    - Controversial: Topics with many speakers and high merge count
    - Consensus: Topics with many speakers but low controversy (similar contributions)
    - Divergent: Topics that split into multiple directions

    Args:
        all_nodes: All debate nodes

    Returns:
        List of DebateTrend
    """
    trends = []

    if not all_nodes:
        return trends

    # Sort by creation time
    sorted_by_time = sorted(all_nodes, key=lambda n: n.created_at)
    recent_nodes = sorted_by_time[-10:] if len(sorted_by_time) > 10 else sorted_by_time

    # 1. Emerging trends (recent + high velocity)
    for node in recent_nodes:
        time_span_hours = max((node.last_updated - node.created_at) / (1000 * 60 * 60), 0.01)
        velocity = node.merge_count / time_span_hours

        if velocity > 5.0:  # More than 5 merges/hour
            trends.append(DebateTrend(
                topic_id=node.id,
                topic_preview=node.accumulated_text,  # Full text, not truncated
                trend_type="emerging",
                velocity=round(velocity, 2),
                speakers_involved=node.speakers,
                description=f"Rapidly evolving topic with {node.merge_count} merges from {len(node.speakers)} speakers",
            ))

    # 2. Controversial topics (high merge count + high speaker diversity)
    controversial = sorted(all_nodes, key=lambda n: n.merge_count * len(n.speakers), reverse=True)[:5]
    for node in controversial:
        if node.merge_count > 3 and len(node.speakers) > 2:
            trends.append(DebateTrend(
                topic_id=node.id,
                topic_preview=node.accumulated_text,  # Full text, not truncated
                trend_type="controversial",
                velocity=0.0,
                speakers_involved=node.speakers,
                description=f"Highly debated topic with {node.merge_count} contributions from {len(node.speakers)} speakers",
            ))

    # 3. Consensus topics (multiple speakers but low merge rate)
    for node in all_nodes:
        if len(node.speakers) >= 3 and node.merge_count <= 2:
            trends.append(DebateTrend(
                topic_id=node.id,
                topic_preview=node.accumulated_text,  # Full text, not truncated
                trend_type="consensus",
                velocity=0.0,
                speakers_involved=node.speakers,
                description=f"Consensus topic with {len(node.speakers)} speakers agreeing",
            ))

    return trends[:10]  # Return top 10 trends


def generate_debate_conclusion(all_nodes: List[DebateNode]) -> DebateConclusion:
    """
    Generate comprehensive debate conclusion.

    Args:
        all_nodes: All debate nodes

    Returns:
        DebateConclusion with full analysis
    """
    if not all_nodes:
        return DebateConclusion(
            total_nodes=0,
            total_contributions=0,
            unique_speakers=0,
            debate_duration_minutes=0.0,
            top_speakers=[],
            top_topics=[],
            controversial_topics=[],
            trends=[],
            consensus_topics=[],
            insights=[],
            overall_quality_score=0.0,
        )

    # Summary stats
    total_nodes = len(all_nodes)
    total_contributions = sum(node.merge_count for node in all_nodes)
    all_speakers = set()
    for node in all_nodes:
        all_speakers.update(node.speakers)
    unique_speakers = len(all_speakers)

    # Debate duration
    all_timestamps = [node.created_at for node in all_nodes] + [node.last_updated for node in all_nodes]
    debate_duration_minutes = (max(all_timestamps) - min(all_timestamps)) / (1000 * 60)

    # Calculate speaker stats for all speakers
    speaker_stats_list = [
        calculate_speaker_stats(speaker, all_nodes)
        for speaker in all_speakers
    ]

    # Rank speakers
    speaker_stats_list.sort(key=lambda s: s.overall_score, reverse=True)
    for i, stats in enumerate(speaker_stats_list, 1):
        stats.rank = i

    # Create speaker rankings with badges
    top_speakers = []
    for stats in speaker_stats_list[:10]:
        # Assign badges
        badge = None
        if stats.credibility.influence_score > 0.7:
            badge = "thought_leader"
        elif stats.innovation.novelty_score > 0.7:
            badge = "innovator"
        elif stats.credibility.engagement_depth > 0.7:
            badge = "mediator"
        elif stats.innovation.catalyst_score > 0.7:
            badge = "catalyst"

        top_speakers.append(SpeakerRanking(
            rank=stats.rank,
            speaker_name=stats.speaker_name,
            overall_score=stats.overall_score,
            credibility_score=stats.credibility.overall_credibility,
            innovation_score=stats.innovation.overall_innovation,
            total_contributions=stats.total_contributions,
            badge=badge,
        ))

    # Calculate topic stats
    topic_stats_list = [
        calculate_topic_stats(node, all_nodes)
        for node in all_nodes
    ]

    # Top topics by importance
    topic_stats_list.sort(key=lambda t: t.importance_score, reverse=True)
    for i, stats in enumerate(topic_stats_list, 1):
        stats.rank = i
    top_topics = topic_stats_list[:10]

    # Controversial topics (high controversy score)
    controversial_topics = sorted(
        topic_stats_list,
        key=lambda t: t.health.controversy_score,
        reverse=True
    )[:5]

    # Consensus topics (high speakers but low controversy)
    consensus_topics = [
        t for t in topic_stats_list
        if len(t.speakers) >= 3 and t.health.controversy_score < 0.3
    ][:5]

    # Identify trends
    trends = identify_trends(all_nodes)

    # Generate insights
    insights = []
    if top_speakers:
        insights.append(
            f"Top contributor: {top_speakers[0].speaker_name} with {top_speakers[0].total_contributions} contributions "
            f"and a {top_speakers[0].badge or 'participant'} badge"
        )
    if controversial_topics:
        insights.append(
            f"Most debated topic: '{controversial_topics[0].primary_text[:50]}...' "
            f"with {controversial_topics[0].dominance.merge_count} merges"
        )
    if len(all_speakers) > 5:
        insights.append(f"Highly diverse debate with {unique_speakers} unique speakers")
    if total_contributions > total_nodes * 3:
        insights.append(f"Very active debate with an average of {total_contributions / total_nodes:.1f} contributions per topic")

    # Overall quality score
    # Quality = speaker diversity + avg engagement + avg credibility of top speakers
    speaker_diversity_score = min(unique_speakers / 10, 1.0)  # Normalize by 10 speakers
    avg_engagement = sum(t.health.engagement_level for t in topic_stats_list) / len(topic_stats_list)
    avg_top_credibility = sum(s.credibility_score for s in top_speakers[:3]) / min(len(top_speakers), 3) if top_speakers else 0

    overall_quality_score = (
        0.3 * speaker_diversity_score +
        0.4 * avg_engagement +
        0.3 * avg_top_credibility
    )

    return DebateConclusion(
        total_nodes=total_nodes,
        total_contributions=total_contributions,
        unique_speakers=unique_speakers,
        debate_duration_minutes=round(debate_duration_minutes, 2),
        top_speakers=top_speakers,
        top_topics=top_topics,
        controversial_topics=controversial_topics,
        trends=trends,
        consensus_topics=consensus_topics,
        insights=insights,
        overall_quality_score=round(overall_quality_score, 4),
    )
