"""
Types — Supporting types and response models.
"""

from pydantic import BaseModel
from typing import List, Optional


class ScoringBreakdown(BaseModel):
    """Multi-factor scoring breakdown."""
    score: float
    semantic: float
    keyword: float
    time: float


class CandidateNode(BaseModel):
    """Node candidate with pre-computed similarity."""
    id: str
    text: str
    timestamp: int
    embedding: List[float]
    similarity: float  # Cosine similarity from vector search


class NodeResponse(BaseModel):
    """API response for node details (without embedding)."""
    id: str
    text: str
    timestamp: int


class EdgeResponse(BaseModel):
    """API response for edge."""
    source: str
    target: str
    score: float
    semantic: float
    keyword: float
    time: float


class CreateNodeResponse(BaseModel):
    """Response for POST /node."""
    node: NodeResponse
    edges: List[EdgeResponse]


class GraphResponse(BaseModel):
    """Response for GET /graph."""
    nodes: List[NodeResponse]
    edges: List[EdgeResponse]


class NodeDetailsResponse(BaseModel):
    """Response for GET /node/:id."""
    node: NodeResponse
    edges: List[EdgeResponse]
