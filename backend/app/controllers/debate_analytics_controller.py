"""
Debate analytics controller — Handlers for analytics endpoints.
"""

from fastapi import HTTPException
from typing import Optional

from app.models.debate_analytics import (
    SpeakerStats,
    SpeakerRanking,
    TopicStats,
    DebateConclusion,
)
from app.services.debate_service import get_all_debate_nodes_list
from app.services.debate_analytics_service import (
    calculate_speaker_stats,
    calculate_topic_stats,
    generate_debate_conclusion,
)
from app.services.debate_ai_service import analyze_debate_with_ai
from app.utils.logger import logger


async def get_speaker_stats_handler(speaker_name: str, session_id: str) -> SpeakerStats:
    """
    GET /debate/speaker/{speaker_name}/stats

    Get comprehensive statistics for a specific speaker in a session (session isolation).

    Args:
        speaker_name: Speaker identifier
        session_id: Session ID to filter stats

    Returns:
        SpeakerStats with credibility and innovation metrics

    Raises:
        HTTPException: 404 if speaker not found, 500 otherwise
    """
    try:
        logger.info(f"Calculating stats for speaker: {speaker_name} in session {session_id}")

        # Get debate nodes for this session only
        from app.services.debate_snowflake_service import get_debate_nodes_by_session
        all_nodes = await get_debate_nodes_by_session(session_id)

        # Check if speaker exists
        all_speakers = set()
        for node in all_nodes:
            all_speakers.update(node.speakers)

        if speaker_name not in all_speakers:
            raise HTTPException(
                status_code=404,
                detail=f"Speaker not found in session {session_id}: {speaker_name}"
            )

        # Calculate speaker stats
        stats = calculate_speaker_stats(speaker_name, all_nodes)

        logger.info(
            f"Speaker stats calculated: {speaker_name} - "
            f"Score: {stats.overall_score:.3f}, "
            f"Credibility: {stats.credibility.overall_credibility:.3f}, "
            f"Innovation: {stats.innovation.overall_innovation:.3f}"
        )

        return stats

    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Failed to calculate speaker stats: {error}")
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


async def get_leaderboard_handler(limit: int = 10, session_id: str = None) -> dict:
    """
    GET /debate/leaderboard

    Get ranked list of top speakers in a session (session isolation).

    Args:
        limit: Number of top speakers to return (default 10)
        session_id: Session ID to filter speakers

    Returns:
        Dict with speakers array and total count

    Raises:
        HTTPException: 500 on error
    """
    try:
        logger.info(f"Generating leaderboard for session {session_id} (limit: {limit})")

        # Get debate nodes for this session only
        from app.services.debate_snowflake_service import get_debate_nodes_by_session
        all_nodes = await get_debate_nodes_by_session(session_id)

        # Get all unique speakers
        all_speakers = set()
        for node in all_nodes:
            all_speakers.update(node.speakers)

        # Calculate stats for all speakers
        speaker_stats_list = [
            calculate_speaker_stats(speaker, all_nodes)
            for speaker in all_speakers
        ]

        # Sort by overall score
        speaker_stats_list.sort(key=lambda s: s.overall_score, reverse=True)

        # Assign ranks
        for i, stats in enumerate(speaker_stats_list, 1):
            stats.rank = i

        # Convert to rankings with badges
        rankings = []
        for stats in speaker_stats_list[:limit]:
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

            rankings.append(SpeakerRanking(
                rank=stats.rank,
                speaker_name=stats.speaker_name,
                overall_score=stats.overall_score,
                credibility_score=stats.credibility.overall_credibility,
                innovation_score=stats.innovation.overall_innovation,
                total_contributions=stats.total_contributions,
                badge=badge,
            ))

        logger.info(f"Leaderboard generated with {len(rankings)} speakers for session {session_id}")

        return {
            "speakers": rankings,
            "total": len(all_speakers),
            "session_id": session_id,
        }

    except Exception as error:
        logger.error(f"Failed to generate leaderboard: {error}")
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


async def get_topics_analysis_handler(session_id: str) -> dict:
    """
    GET /debate/topics/analysis

    Get analysis of debate topics in a session (session isolation).

    Args:
        session_id: Session ID to filter topics

    Returns:
        Dict with topic stats arrays

    Raises:
        HTTPException: 500 on error
    """
    try:
        logger.info(f"Analyzing debate topics for session {session_id}")

        # Get debate nodes for this session only
        from app.services.debate_snowflake_service import get_debate_nodes_by_session
        all_nodes = await get_debate_nodes_by_session(session_id)

        # Calculate topic stats for all nodes
        topic_stats_list = [
            calculate_topic_stats(node, all_nodes)
            for node in all_nodes
        ]

        # Sort by importance
        topic_stats_list.sort(key=lambda t: t.importance_score, reverse=True)

        # Assign ranks
        for i, stats in enumerate(topic_stats_list, 1):
            stats.rank = i

        # Categorize topics
        top_topics = topic_stats_list[:10]

        controversial_topics = sorted(
            topic_stats_list,
            key=lambda t: t.health.controversy_score,
            reverse=True
        )[:10]

        active_topics = sorted(
            topic_stats_list,
            key=lambda t: t.health.evolution_velocity,
            reverse=True
        )[:10]

        diverse_topics = sorted(
            topic_stats_list,
            key=lambda t: len(t.speakers),
            reverse=True
        )[:10]

        logger.info(f"Topic analysis completed for {len(all_nodes)} topics in session {session_id}")

        return {
            "total_topics": len(all_nodes),
            "top_topics": top_topics,
            "controversial_topics": controversial_topics,
            "active_topics": active_topics,
            "diverse_topics": diverse_topics,
            "session_id": session_id,
        }

    except Exception as error:
        logger.error(f"Failed to analyze topics for session {session_id}: {error}")
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


async def get_debate_conclusion_handler(session_id: str) -> DebateConclusion:
    """
    GET /debate/conclusion

    Generate comprehensive debate conclusion for a session (session isolation).

    Args:
        session_id: Session ID to filter by

    Returns:
        DebateConclusion with full analysis

    Raises:
        HTTPException: 500 on error
    """
    try:
        logger.info(f"Generating debate conclusion for session: {session_id}")

        # Get debate nodes for this session only
        from app.services.debate_snowflake_service import get_debate_nodes_by_session
        all_nodes = await get_debate_nodes_by_session(session_id)

        # Generate conclusion
        conclusion = generate_debate_conclusion(all_nodes)

        logger.info(
            f"Debate conclusion generated: "
            f"{conclusion.total_nodes} topics, "
            f"{conclusion.unique_speakers} speakers, "
            f"quality: {conclusion.overall_quality_score:.3f}"
        )

        return conclusion

    except Exception as error:
        logger.error(f"Failed to generate debate conclusion for session {session_id}: {error}")
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


async def get_ai_analysis_handler(session_id: str) -> dict:
    """
    GET /debate/ai-analysis

    Generate AI-powered debate analysis with insights and recommendations for a session (session isolation).

    Uses Snowflake Cortex LLM to analyze the debate and provide:
    - Comprehensive summary
    - Key insights
    - Best stance recommendation
    - Creative ideas and synthesis
    - Strongest/weakest arguments
    - Emerging patterns
    - Actionable recommendations

    Args:
        session_id: Session ID to filter by

    Returns:
        Dict with AI-generated analysis

    Raises:
        HTTPException: 500 on error
    """
    try:
        logger.info(f"Starting AI-powered debate analysis for session: {session_id}")

        # Get debate nodes for this session only
        from app.services.debate_snowflake_service import get_debate_nodes_by_session
        all_nodes = await get_debate_nodes_by_session(session_id)

        if not all_nodes:
            raise HTTPException(
                status_code=404,
                detail=f"No debate nodes found in session {session_id} for analysis"
            )

        # Generate AI analysis
        analysis = analyze_debate_with_ai(all_nodes)

        # Add metadata
        analysis["metadata"] = {
            "total_nodes": len(all_nodes),
            "unique_speakers": len(set(
                speaker
                for node in all_nodes
                for speaker in node.speakers
            )),
            "total_contributions": sum(node.merge_count for node in all_nodes),
            "analysis_model": "llama3.1-70b",
            "session_id": session_id,
        }

        logger.info("AI-powered debate analysis completed successfully")

        return analysis

    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"Failed to generate AI analysis: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(error)}"
        )

