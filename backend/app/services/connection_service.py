"""
Connection service — Edge creation and pruning logic.
"""

from typing import List

from app.models.node import GraphNode
from app.models.edge import GraphEdge
from app.models.types import CandidateNode, ScoringBreakdown
from app.services.scoring_service import compute_score_for_candidate
from app.services.snowflake_service import (
    insert_edge,
    count_edges_for_node,
    get_edges_by_node_id,
    delete_edge,
)
from app.utils.logger import logger


async def create_connections(
    node: GraphNode,
    candidates: List[CandidateNode],
    threshold: float,
    max_edges: int,
    halflife: int
) -> List[GraphEdge]:
    """
    Create connections between a node and candidate nodes.

    Flow:
    1. Score all candidates
    2. Filter by threshold
    3. Sort descending by score
    4. Check existing edge count
    5. Take top-K (respecting max_edges constraint)
    6. Insert edges

    Args:
        node: Source node
        candidates: Candidate nodes with pre-computed similarity
        threshold: Minimum score threshold
        max_edges: Maximum edges per node
        halflife: Time decay half-life

    Returns:
        List of created edges
    """
    if not candidates:
        return []

    # Score all candidates
    scored_candidates: List[tuple[CandidateNode, ScoringBreakdown]] = []

    for candidate in candidates:
        breakdown = compute_score_for_candidate(node, candidate, halflife)
        scored_candidates.append((candidate, breakdown))

    # Filter by threshold
    qualified = [
        (cand, breakdown)
        for cand, breakdown in scored_candidates
        if breakdown.score >= threshold
    ]

    if not qualified:
        logger.info(f"No candidates above threshold {threshold} for node {node.id}")
        return []

    # Sort descending by score
    qualified.sort(key=lambda x: x[1].score, reverse=True)

    # Check existing edge count
    existing_count = await count_edges_for_node(node.id)
    available_slots = max_edges - existing_count

    if available_slots <= 0:
        logger.info(f"Node {node.id} already has {existing_count} edges (max: {max_edges})")
        return []

    # Take top-K
    to_create = qualified[:available_slots]

    # Insert edges
    edges: List[GraphEdge] = []

    for candidate, breakdown in to_create:
        edge = GraphEdge(
            source=node.id,
            target=candidate.id,
            score=breakdown.score,
            semantic=breakdown.semantic,
            keyword=breakdown.keyword,
            time=breakdown.time,
        )

        await insert_edge(edge)
        edges.append(edge)

    logger.info(f"Created {len(edges)} edges for node {node.id}")

    return edges


async def prune_edges(node_id: str, max_edges: int) -> None:
    """
    Prune edges for a node, keeping only top-K highest scoring.

    Args:
        node_id: Node to prune edges for
        max_edges: Maximum edges to keep
    """
    edges = await get_edges_by_node_id(node_id)

    if len(edges) <= max_edges:
        return  # No pruning needed

    # Sort by score descending
    edges.sort(key=lambda e: e.score, reverse=True)

    # Delete excess edges
    to_delete = edges[max_edges:]

    for edge in to_delete:
        await delete_edge(edge.source, edge.target)

    logger.info(f"Pruned {len(to_delete)} edges for node {node_id}")
