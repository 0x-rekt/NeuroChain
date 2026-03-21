"""
CI service — Continuous Intelligence pipeline for graph evolution.
"""

import asyncio
from typing import List, Tuple

from app.models.node import GraphNode
from app.services.snowflake_service import (
    get_all_nodes,
    get_all_edges,
    get_node_by_id,
    get_edges_by_node_id,
    update_edge_score,
    delete_edge,
)
from app.services.scoring_service import cosine_similarity, compute_score
from app.utils.logger import logger
from app.utils.time_utils import now_timestamp


# CI pipeline constants
RECOMPUTE_DELTA_THRESHOLD = 0.01  # Update if score changes by >1%
CLUSTER_SIMILARITY_THRESHOLD = 0.85
DECAY_AGE_THRESHOLD = 7 * 24 * 60 * 60 * 1000  # 7 days in milliseconds
DECAY_FACTOR = 0.95
DECAY_REMOVAL_THRESHOLD = 0.3


async def run_ci_pipeline(node_id: str, halflife: int) -> None:
    """
    Run the three-stage CI pipeline asynchronously.

    Stages:
    1. Recompute nearby edges (update if score delta > 1%)
    2. Detect clusters (similarity > 0.85)
    3. Edge decay (>7 days old, multiply by 0.95, delete if < 0.3)

    Args:
        node_id: ID of the newly created node
        halflife: Time decay half-life in milliseconds
    """
    try:
        logger.info(f"Starting CI pipeline for node {node_id}...")

        # Stage 1: Recompute nearby edges
        await _recompute_nearby_edges(node_id, halflife)

        # Stage 2: Detect clusters
        clusters = await _detect_clusters()
        logger.info(f"Detected {len(clusters)} clusters")

        # Stage 3: Edge decay
        await _apply_edge_decay(halflife)

        logger.info(f"CI pipeline completed for node {node_id}")

    except Exception as e:
        logger.error(f"CI pipeline error for node {node_id}: {e}")


async def _recompute_nearby_edges(node_id: str, halflife: int) -> None:
    """
    Stage 1: Recompute scores for edges near the new node.

    Updates edge scores if they changed by more than 1%.
    """
    # Get edges connected to the new node
    new_node_edges = await get_edges_by_node_id(node_id)

    if not new_node_edges:
        logger.info("No edges to recompute")
        return

    # Get neighboring node IDs
    neighbor_ids = set()
    for edge in new_node_edges:
        neighbor_ids.add(edge.source if edge.source != node_id else edge.target)

    # For each neighbor, get their edges and recompute
    recomputed_count = 0

    for neighbor_id in neighbor_ids:
        neighbor_edges = await get_edges_by_node_id(neighbor_id)

        for edge in neighbor_edges:
            # Fetch both nodes
            source_node = await get_node_by_id(edge.source)
            target_node = await get_node_by_id(edge.target)

            if not source_node or not target_node:
                continue

            # Recompute score
            semantic_sim = cosine_similarity(source_node.embedding, target_node.embedding)
            new_breakdown = compute_score(source_node, target_node, semantic_sim, halflife)

            # Update if delta > 1%
            if abs(new_breakdown.score - edge.score) > RECOMPUTE_DELTA_THRESHOLD:
                await update_edge_score(
                    edge.source,
                    edge.target,
                    new_breakdown.score,
                    new_breakdown.semantic,
                    new_breakdown.keyword,
                    new_breakdown.time,
                )
                recomputed_count += 1

    logger.info(f"Recomputed {recomputed_count} nearby edges")


async def _detect_clusters() -> List[List[str]]:
    """
    Stage 2: Detect semantic clusters using greedy clustering.

    Algorithm:
    - Iterate through all nodes
    - Assign to first cluster where similarity > 0.85 with cluster representative
    - Otherwise create new cluster

    Returns:
        List of clusters (each cluster is a list of node IDs)
    """
    nodes = await get_all_nodes()

    if len(nodes) < 2:
        return []

    clusters: List[List[str]] = []

    for node in nodes:
        assigned = False

        # Try to assign to existing cluster
        for cluster in clusters:
            # Check similarity with first node in cluster (centroid proxy)
            representative_id = cluster[0]
            representative = next((n for n in nodes if n.id == representative_id), None)

            if representative:
                sim = cosine_similarity(node.embedding, representative.embedding)
                if sim > CLUSTER_SIMILARITY_THRESHOLD:
                    cluster.append(node.id)
                    assigned = True
                    break

        # Create new cluster if not assigned
        if not assigned:
            clusters.append([node.id])

    # Filter out single-node clusters
    clusters = [c for c in clusters if len(c) > 1]

    return clusters


async def _apply_edge_decay(halflife: int) -> None:
    """
    Stage 3: Apply edge decay to old connections.

    Process:
    1. Find edges connected to old nodes (>7 days)
    2. Multiply score by 0.95
    3. Delete if new score < 0.3
    4. Otherwise update score
    """
    current_time = now_timestamp()
    nodes = await get_all_nodes()
    edges = await get_all_edges()

    deleted_count = 0
    updated_count = 0

    for edge in edges:
        # Check if either node is old
        source_node = next((n for n in nodes if n.id == edge.source), None)
        target_node = next((n for n in nodes if n.id == edge.target), None)

        if not source_node or not target_node:
            continue

        source_age = current_time - source_node.timestamp
        target_age = current_time - target_node.timestamp

        # Apply decay if either node is older than threshold
        if source_age > DECAY_AGE_THRESHOLD or target_age > DECAY_AGE_THRESHOLD:
            new_score = edge.score * DECAY_FACTOR

            if new_score < DECAY_REMOVAL_THRESHOLD:
                # Delete edge
                await delete_edge(edge.source, edge.target)
                deleted_count += 1
            else:
                # Update with decayed score
                await update_edge_score(
                    edge.source,
                    edge.target,
                    new_score,
                    edge.semantic,
                    edge.keyword,
                    edge.time,
                )
                updated_count += 1

    logger.info(f"Edge decay: deleted {deleted_count}, updated {updated_count}")
