"""
Node model — GraphNode for the cognitive graph with thought evolution tracking.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class NodeCreate(BaseModel):
    text: str = Field(..., description="The content of the node")
    source: Optional[str] = Field(default="manual", description="Where this node came from (e.g., meet_voice, meet_chat, manual)")
    author_wallet: Optional[str] = Field(default=None, description="The Algorand wallet address of the creator")

class NodeResponse(NodeCreate):
    id: str
    timestamp: datetime
    embedding: Optional[List[float]] = None
    tx_id: Optional[str] = Field(default=None, description="Algorand Transaction ID")


class ThoughtEvolution(BaseModel):
    """Record of a thought evolution/merge."""

    evolved_at: int = Field(..., description="When the evolution occurred (Unix ms)")
    similarity_score: float = Field(..., description="Similarity score that triggered merge")
    evolved_text: str = Field(..., description="Text that was merged in")
    contributor: Optional[str] = Field(default=None, description="Contributor identifier")
    creativity_delta: float = Field(
        default=0.0,
        description="How creative/novel this evolution was (0=identical, 1=very creative)"
    )


class GraphNode(BaseModel):
    """A node in the cognitive graph with text, embedding, and evolution tracking."""

    id: str = Field(..., description="UUID v4")
    text: str = Field(..., min_length=1, description="Current/latest text content")
    timestamp: int = Field(..., gt=0, description="Unix timestamp in milliseconds")
    embedding: List[float] = Field(
        ...,
        min_length=768,
        max_length=768,
        description="768-dimensional embedding vector"
    )

    # Evolution tracking fields (optional for backward compatibility)
    primary_text: Optional[str] = Field(
        default=None,
        description="The original/first text (for tracking evolution)"
    )
    accumulated_text: Optional[str] = Field(
        default=None,
        description="All evolved thoughts combined (for thought flow analysis)"
    )
    merge_count: int = Field(default=0, description="Number of times this node evolved")
    evolution_history: List[ThoughtEvolution] = Field(
        default_factory=list,
        description="History of all thought evolutions"
    )
    contributors: List[str] = Field(
        default_factory=list,
        description="All contributors to this thought"
    )
    creativity_score: float = Field(
        default=0.0,
        description="Overall creativity score (0=repetitive, 1=highly creative)"
    )
    last_updated: int = Field(
        default=0,
        description="Last evolution timestamp"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "text": "Machine learning is a subset of artificial intelligence",
                "timestamp": 1710000000000,
                "embedding": [0.1] * 768,
                "primary_text": "ML is part of AI",
                "accumulated_text": "ML is part of AI\n\n[Evolution 1]: Machine learning is a subset of artificial intelligence",
                "merge_count": 1,
                "evolution_history": [],
                "contributors": ["user1", "user2"],
                "creativity_score": 0.65,
                "last_updated": 1710001000000,
            }
        }
