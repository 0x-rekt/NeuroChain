"""
Scoring service — Multi-factor scoring with cosine similarity.
"""

import numpy as np
from typing import List

from app.models.node import GraphNode
from app.models.types import ScoringBreakdown, CandidateNode
from app.utils.keywords import keyword_score
from app.utils.time_utils import time_decay


# Scoring weights
SEMANTIC_WEIGHT = 0.6
KEYWORD_WEIGHT = 0.2
TIME_WEIGHT = 0.2


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Compute cosine similarity between two vectors using NumPy.

    Args:
        a: First vector
        b: Second vector

    Returns:
        Cosine similarity in [-1, 1], where 1 = identical direction
    """
    if len(a) != len(b) or len(a) == 0:
        return 0.0

    vec_a = np.array(a)
    vec_b = np.array(b)

    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = dot_product / (norm_a * norm_b)

    # Clamp to [0, 1] for scoring
    return max(0.0, min(1.0, float(similarity)))


def compute_score(
    node_a: GraphNode,
    node_b: GraphNode,
    semantic_similarity: float,
    halflife: int
) -> ScoringBreakdown:
    """
    Compute multi-factor score between two nodes.

    Formula: score = 0.6 × semantic + 0.2 × keyword + 0.2 × time

    Args:
        node_a: First node
        node_b: Second node
        semantic_similarity: Pre-computed cosine similarity
        halflife: Time decay half-life in milliseconds

    Returns:
        Scoring breakdown with composite score and individual factors
    """
    # Clamp semantic similarity to [0, 1]
    semantic = max(0.0, min(1.0, semantic_similarity))

    # Keyword score (Jaccard similarity)
    keyword = keyword_score(node_a.text, node_b.text)

    # Time decay score
    time_score = time_decay(node_a.timestamp, node_b.timestamp, halflife)

    # Composite score (weighted sum)
    composite = (
        SEMANTIC_WEIGHT * semantic +
        KEYWORD_WEIGHT * keyword +
        TIME_WEIGHT * time_score
    )

    # Round to 4 decimal places
    return ScoringBreakdown(
        score=round(composite, 4),
        semantic=round(semantic, 4),
        keyword=round(keyword, 4),
        time=round(time_score, 4),
    )


def compute_score_for_candidate(
    node: GraphNode,
    candidate: CandidateNode,
    halflife: int
) -> ScoringBreakdown:
    """
    Compute score for a candidate node.

    Args:
        node: Source node
        candidate: Candidate node with pre-computed similarity
        halflife: Time decay half-life

    Returns:
        Scoring breakdown
    """
    # Create temporary GraphNode from candidate
    candidate_node = GraphNode(
        id=candidate.id,
        text=candidate.text,
        timestamp=candidate.timestamp,
        embedding=candidate.embedding,
    )

    return compute_score(
        node,
        candidate_node,
        candidate.similarity,
        halflife
    )
