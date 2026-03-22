"""
Thought evolution service — Track creativity and thought flow evolution.

Instead of blocking duplicates, we merge similar thoughts and track:
- How thoughts evolve over time
- Who contributed to each evolution
- How creative/novel each evolution was
- The complete thought flow history
"""

from typing import Optional, Tuple
from app.models.node import GraphNode, ThoughtEvolution
from app.services.enhanced_similarity_service import (
    compute_enhanced_similarity,
    SimilarityResult,
)
from app.utils.time_utils import now_timestamp
from app.utils.logger import logger


# Similarity thresholds for thought evolution
MERGE_THRESHOLD_HIGH = 0.85      # Very similar - definitely same thought
MERGE_THRESHOLD_MEDIUM = 0.65    # Moderately similar - evolution of same thought
MERGE_THRESHOLD_LOW = 0.50       # Somewhat similar - related thought

# Creativity score calculation
# creativity = 1 - similarity (inverse relationship)
# High similarity = low creativity (repetitive)
# Low similarity = high creativity (novel)


def calculate_creativity_delta(similarity_score: float) -> float:
    """
    Calculate how creative/novel this evolution is.

    Args:
        similarity_score: Composite similarity score [0, 1]

    Returns:
        Creativity delta [0, 1] where:
        - 0.0 = identical/repetitive (no new ideas)
        - 0.5 = moderately creative (some new ideas)
        - 1.0 = highly creative (very novel ideas)
    """
    # Inverse of similarity
    # Very similar (0.9) → low creativity (0.1)
    # Somewhat similar (0.5) → medium creativity (0.5)
    # Not similar (0.2) → high creativity (0.8)
    return 1.0 - similarity_score


def should_merge_thought(similarity: SimilarityResult) -> Tuple[bool, str]:
    """
    Determine if a new thought should merge with existing node.

    Args:
        similarity: Enhanced similarity result

    Returns:
        Tuple of (should_merge, merge_reason)
    """
    score = similarity.composite_score

    if score >= MERGE_THRESHOLD_HIGH:
        return True, "high_similarity"  # Same thought, different wording
    elif score >= MERGE_THRESHOLD_MEDIUM:
        return True, "evolution"  # Evolution of the thought
    elif score >= MERGE_THRESHOLD_LOW:
        return True, "related"  # Related thought, track together
    else:
        return False, "distinct"  # Distinct thought, create new node


def merge_thoughts(
    existing_node: GraphNode,
    new_text: str,
    new_embedding: list[float],
    similarity_result: SimilarityResult,
    contributor: Optional[str] = None,
) -> GraphNode:
    """
    Merge a new thought into an existing node.

    This tracks the thought evolution and calculates creativity.

    Args:
        existing_node: Existing node to merge into
        new_text: New thought text
        new_embedding: New thought embedding
        similarity_result: Similarity analysis result
        contributor: Optional contributor identifier

    Returns:
        Updated GraphNode with evolution tracked
    """
    timestamp = now_timestamp()

    # Calculate creativity of this evolution
    creativity_delta = calculate_creativity_delta(similarity_result.composite_score)

    # Create evolution record
    evolution = ThoughtEvolution(
        evolved_at=timestamp,
        similarity_score=similarity_result.composite_score,
        evolved_text=new_text,
        contributor=contributor,
        creativity_delta=creativity_delta,
    )

    # Build evolution label
    evolution_count = existing_node.merge_count + 1
    contributor_label = f"[{contributor}]" if contributor else "[Evolution]"

    # Update accumulated text
    accumulated = existing_node.accumulated_text or existing_node.primary_text or existing_node.text
    new_accumulated = f"{accumulated}\n\n{contributor_label} #{evolution_count}: {new_text}"

    # Update contributors list
    new_contributors = list(existing_node.contributors)
    if contributor and contributor not in new_contributors:
        new_contributors.append(contributor)

    # Update overall creativity score (running average)
    # This shows how creative the thought has been overall
    total_evolutions = evolution_count
    current_creativity_sum = existing_node.creativity_score * (total_evolutions - 1)
    new_creativity = (current_creativity_sum + creativity_delta) / total_evolutions

    # Create updated node
    updated_node = GraphNode(
        id=existing_node.id,
        text=new_text,  # Update to latest text
        timestamp=existing_node.timestamp,  # Keep original timestamp
        embedding=new_embedding,  # Update to latest embedding
        primary_text=existing_node.primary_text or existing_node.text,  # Keep original
        accumulated_text=new_accumulated,
        merge_count=evolution_count,
        evolution_history=existing_node.evolution_history + [evolution],
        contributors=new_contributors,
        creativity_score=new_creativity,
        last_updated=timestamp,
    )

    logger.info(
        f"Thought evolved: {existing_node.id} "
        f"(evolution #{evolution_count}, "
        f"creativity: {creativity_delta:.3f}, "
        f"overall creativity: {new_creativity:.3f})"
    )

    return updated_node


def create_new_thought(
    text: str,
    embedding: list[float],
    contributor: Optional[str] = None,
) -> GraphNode:
    """
    Create a new thought node.

    Args:
        text: Thought text
        embedding: Text embedding
        contributor: Optional contributor identifier

    Returns:
        New GraphNode
    """
    from uuid import uuid4

    timestamp = now_timestamp()

    node = GraphNode(
        id=str(uuid4()),
        text=text,
        timestamp=timestamp,
        embedding=embedding,
        primary_text=text,
        accumulated_text=text,
        merge_count=0,
        evolution_history=[],
        contributors=[contributor] if contributor else [],
        creativity_score=1.0,  # First thought is always creative
        last_updated=timestamp,
    )

    logger.info(
        f"New thought created: {node.id} "
        f"(contributor: {contributor or 'anonymous'})"
    )

    return node


def analyze_thought_evolution(node: GraphNode) -> dict:
    """
    Analyze the evolution of a thought over time.

    Provides insights into:
    - Total evolutions
    - Average creativity
    - Contributor diversity
    - Evolution timeline

    Args:
        node: Node to analyze

    Returns:
        Analysis dictionary
    """
    if not node.evolution_history:
        return {
            "total_evolutions": 0,
            "average_creativity": 0.0,
            "contributor_count": len(node.contributors),
            "is_original": True,
            "evolution_trend": "new_thought",
        }

    # Calculate average creativity
    avg_creativity = sum(e.creativity_delta for e in node.evolution_history) / len(node.evolution_history)

    # Determine evolution trend
    if node.merge_count == 0:
        trend = "new_thought"
    elif avg_creativity > 0.7:
        trend = "highly_creative"
    elif avg_creativity > 0.4:
        trend = "moderately_creative"
    elif avg_creativity > 0.2:
        trend = "minor_variations"
    else:
        trend = "repetitive"

    return {
        "total_evolutions": node.merge_count,
        "average_creativity": avg_creativity,
        "overall_creativity": node.creativity_score,
        "contributor_count": len(node.contributors),
        "contributors": node.contributors,
        "is_original": node.merge_count == 0,
        "evolution_trend": trend,
        "first_contribution": node.timestamp,
        "last_contribution": node.last_updated,
    }
