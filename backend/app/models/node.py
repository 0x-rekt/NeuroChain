"""
Node model — GraphNode for the cognitive graph.
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


class GraphNode(BaseModel):
    """A node in the cognitive graph with text and embedding."""

    id: str = Field(..., description="UUID v4")
    text: str = Field(..., min_length=1, description="Text content")
    timestamp: int = Field(..., gt=0, description="Unix timestamp in milliseconds")
    embedding: List[float] = Field(
        ...,
        min_length=768,
        max_length=768,
        description="768-dimensional embedding vector"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "text": "Machine learning is a subset of artificial intelligence",
                "timestamp": 1710000000000,
                "embedding": [0.1] * 768,
            }
        }
