"""
Background workers — Continuous re-evaluation tasks for the cognitive graph.

When a new node is added, these tasks run in background to:
1. Re-evaluate ALL existing nodes for new connections
2. Update trust scores and edge weights
3. Detect clusters and patterns
4. Apply decay to old edges
"""

import asyncio
from typing import List
from uuid import uuid4

from app.tasks import huey
from huey import crontab
from app.models.node import GraphNode
from app.models.edge import GraphEdge
from app.services.snowflake_service import (
    get_all_nodes,
    get_all_edges,
    get_node_by_id,
    get_edges_by_node_id,
    insert_edge,
    update_edge_score,
    delete_edge,
)
from app.services.scoring_service import cosine_similarity, compute_score
from app.services.enhanced_similarity_service import compute_enhanced_similarity
from app.utils.logger import logger
from app.config import settings


# Priority levels for task scheduling
PRIORITY_HIGH = 1    # Immediate neighbors
PRIORITY_MEDIUM = 5  # 2nd degree connections
PRIORITY_LOW = 10    # All other nodes


@huey.task(priority=PRIORITY_HIGH)
def reevaluate_node_connections(node_id: str, target_node_id: str):
    """
    Re-evaluate connections between two specific nodes.

    This task checks if a connection should be created, updated, or removed
    based on current scoring.

    Args:
        node_id: The newly added node ID
        target_node_id: Node to re-evaluate connection with
    """
    try:
        logger.info(f"Re-evaluating connection: {node_id} <-> {target_node_id}")

        # Run async operations in sync context
        result = asyncio.run(_reevaluate_connection_async(node_id, target_node_id))

        logger.info(f"Re-evaluation complete: {result}")
        return result

    except Exception as e:
        logger.error(f"Failed to re-evaluate connection {node_id} <-> {target_node_id}: {e}")
        return {"status": "error", "error": str(e)}


async def _reevaluate_connection_async(node_id: str, target_node_id: str) -> dict:
    """Async implementation of node connection re-evaluation."""

    # Fetch both nodes
    node = await get_node_by_id(node_id)
    target_node = await get_node_by_id(target_node_id)

    if not node or not target_node:
        return {"status": "skipped", "reason": "node_not_found"}

    # Check for enhanced similarity (duplicate detection)
    similarity_result = compute_enhanced_similarity(
        node.text,
        target_node.text,
        node.embedding,
        target_node.embedding,
        threshold=settings.score_threshold,
    )

    # If very high similarity, might be duplicate - log warning
    if similarity_result.confidence == "strong":
        logger.warning(
            f"Potential duplicate detected: {node_id} and {target_node_id} "
            f"(similarity: {similarity_result.composite_score:.3f})"
        )

    # Compute edge score
    semantic_sim = cosine_similarity(node.embedding, target_node.embedding)
    score_breakdown = compute_score(
        node,
        target_node,
        semantic_sim,
        settings.time_decay_halflife,
    )

    # Check if edge already exists
    existing_edges = await get_edges_by_node_id(node_id)
    existing_edge = next(
        (e for e in existing_edges if e.target == target_node_id or e.source == target_node_id),
        None
    )

    # Decision: create, update, or delete edge
    if score_breakdown.score >= settings.score_threshold:
        # Score is above threshold
        if existing_edge:
            # Update existing edge
            await update_edge_score(
                node_id,
                target_node_id,
                score_breakdown.score,
                score_breakdown.semantic,
                score_breakdown.keyword,
                score_breakdown.time,
            )
            return {"status": "updated", "score": score_breakdown.score}
        else:
            # Check max edges constraint
            edge_count = await get_edges_by_node_id(node_id)
            if len(edge_count) < settings.max_edges_per_node:
                # Create new edge
                edge = GraphEdge(
                    source=node_id,
                    target=target_node_id,
                    score=score_breakdown.score,
                    semantic=score_breakdown.semantic,
                    keyword=score_breakdown.keyword,
                    time=score_breakdown.time,
                )
                await insert_edge(edge)
                return {"status": "created", "score": score_breakdown.score}
            else:
                return {"status": "skipped", "reason": "max_edges_reached"}
    else:
        # Score is below threshold
        if existing_edge:
            # Delete existing edge (no longer qualifies)
            await delete_edge(node_id, target_node_id)
            return {"status": "deleted", "reason": "below_threshold"}
        else:
            return {"status": "skipped", "reason": "below_threshold"}


@huey.task(priority=PRIORITY_MEDIUM)
def trigger_full_graph_reevaluation(new_node_id: str):
    """
    Trigger re-evaluation of entire graph after new node addition.

    This is the main entry point for continuous compute in background.

    Spawns individual re-evaluation tasks for all existing nodes with
    priority scheduling:
    - High priority: Direct neighbors (nodes with existing connections)
    - Medium priority: 2nd degree connections
    - Low priority: All other nodes

    Args:
        new_node_id: ID of the newly added node
    """
    try:
        logger.info(f"Starting full graph re-evaluation for new node: {new_node_id}")

        # Run async operations in sync context
        result = asyncio.run(_trigger_full_reevaluation_async(new_node_id))

        logger.info(
            f"Full graph re-evaluation triggered: "
            f"{result['high_priority']} high priority, "
            f"{result['medium_priority']} medium priority, "
            f"{result['low_priority']} low priority tasks"
        )

        return result

    except Exception as e:
        logger.error(f"Failed to trigger full graph re-evaluation: {e}")
        return {"status": "error", "error": str(e)}


async def _trigger_full_reevaluation_async(new_node_id: str) -> dict:
    """Async implementation of full graph re-evaluation trigger."""

    # Fetch all nodes
    all_nodes = await get_all_nodes()

    if len(all_nodes) <= 1:
        return {
            "status": "skipped",
            "reason": "insufficient_nodes",
            "high_priority": 0,
            "medium_priority": 0,
            "low_priority": 0,
        }

    # Get edges for the new node
    new_node_edges = await get_edges_by_node_id(new_node_id)
    direct_neighbors = set()
    for edge in new_node_edges:
        neighbor_id = edge.target if edge.source == new_node_id else edge.source
        direct_neighbors.add(neighbor_id)

    # Get 2nd degree connections
    second_degree = set()
    for neighbor_id in direct_neighbors:
        neighbor_edges = await get_edges_by_node_id(neighbor_id)
        for edge in neighbor_edges:
            node_id = edge.target if edge.source == neighbor_id else edge.source
            if node_id != new_node_id and node_id not in direct_neighbors:
                second_degree.add(node_id)

    high_priority_count = 0
    medium_priority_count = 0
    low_priority_count = 0

    # Schedule re-evaluation tasks with priorities
    for node in all_nodes:
        if node.id == new_node_id:
            continue  # Skip self

        if node.id in direct_neighbors:
            # High priority: direct neighbors
            reevaluate_node_connections.schedule(
                args=(new_node_id, node.id),
                priority=PRIORITY_HIGH,
            )
            high_priority_count += 1

        elif node.id in second_degree:
            # Medium priority: 2nd degree
            reevaluate_node_connections.schedule(
                args=(new_node_id, node.id),
                priority=PRIORITY_MEDIUM,
            )
            medium_priority_count += 1

        else:
            # Low priority: all others
            reevaluate_node_connections.schedule(
                args=(new_node_id, node.id),
                priority=PRIORITY_LOW,
            )
            low_priority_count += 1

    return {
        "status": "success",
        "high_priority": high_priority_count,
        "medium_priority": medium_priority_count,
        "low_priority": low_priority_count,
        "total_tasks": high_priority_count + medium_priority_count + low_priority_count,
    }


@huey.task(priority=PRIORITY_LOW)
def cluster_detection_task():
    """
    Background task to detect semantic clusters in the graph.

    Runs periodically to identify related node groups.
    """
    try:
        logger.info("Starting cluster detection...")

        result = asyncio.run(_detect_clusters_async())

        logger.info(f"Cluster detection complete: found {len(result)} clusters")
        return {"status": "success", "cluster_count": len(result), "clusters": result}

    except Exception as e:
        logger.error(f"Cluster detection failed: {e}")
        return {"status": "error", "error": str(e)}


async def _detect_clusters_async() -> List[List[str]]:
    """Async implementation of cluster detection."""
    from app.services.ci_service import _detect_clusters

    return await _detect_clusters()


@huey.task(priority=PRIORITY_LOW)
def edge_decay_task():
    """
    Background task to apply decay to old edges.

    Runs periodically to age out stale connections.
    """
    try:
        logger.info("Starting edge decay...")

        result = asyncio.run(_apply_edge_decay_async())

        logger.info("Edge decay complete")
        return result

    except Exception as e:
        logger.error(f"Edge decay failed: {e}")
        return {"status": "error", "error": str(e)}


async def _apply_edge_decay_async():
    """Async implementation of edge decay."""
    from app.services.ci_service import _apply_edge_decay

    await _apply_edge_decay(settings.time_decay_halflife)
    return {"status": "success"}


@huey.periodic_task(crontab(minute='*/30'))  # Run every 30 minutes
def periodic_maintenance():
    """
    Periodic maintenance task.

    Runs:
    - Cluster detection
    - Edge decay
    - Graph optimization
    """
    logger.info("Starting periodic graph maintenance...")

    try:
        # Trigger cluster detection
        cluster_detection_task()

        # Trigger edge decay
        edge_decay_task()

        logger.info("Periodic maintenance complete")
        return {"status": "success"}

    except Exception as e:
        logger.error(f"Periodic maintenance failed: {e}")
        return {"status": "error", "error": str(e)}
