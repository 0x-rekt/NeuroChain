"""
Edge model — GraphEdge for connections between nodes.
"""

from pydantic import BaseModel, Field


class GraphEdge(BaseModel):
    """An edge connecting two nodes with multi-factor scoring."""

    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    score: float = Field(..., ge=0.0, le=1.0, description="Composite score")
    semantic: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity")
    keyword: float = Field(..., ge=0.0, le=1.0, description="Keyword overlap")
    time: float = Field(..., ge=0.0, le=1.0, description="Temporal proximity")

    class Config:
        json_schema_extra = {
            "example": {
                "source": "node-a",
                "target": "node-b",
                "score": 0.8234,
                "semantic": 0.85,
                "keyword": 0.70,
                "time": 0.90,
            }
        }
