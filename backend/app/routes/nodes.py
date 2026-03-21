"""
Routes — API route definitions for the Cognitive Graph Engine.
"""

from fastapi import APIRouter, Body, Query
from typing import Optional
from app.controllers.node_controller import (
    create_node_handler,
    get_graph_handler,
    get_node_details_handler,
)


router = APIRouter(tags=["nodes"])


@router.post("/node", status_code=201)
async def create_node(
    text: str = Body(..., embed=True),
    contributor: Optional[str] = Body(None, embed=True)
):
    """
    Create or evolve a thought node with creativity tracking.

    This endpoint tracks thought evolution instead of blocking duplicates:
    - Similar thoughts are merged together
    - Evolution history is recorded
    - Creativity scores are calculated
    - Contributors are tracked

    Request body:
        {
            "text": "Your thought here",
            "contributor": "username or wallet address (optional)"
        }

    Response:
        {
            "node": {...},
            "edges": [...],
            "action": "created" | "merged",
            "merge_count": 0,
            "creativity_score": 1.0,
            "contributors": ["user1", "user2"],
            "evolution_analysis": {...}
        }
    """
    return await create_node_handler(text, contributor)


@router.post("/api/nodes/", status_code=201)
async def create_node_from_extension(
    text: str = Body(...),
    source: str = Body(None),
    author_wallet: str = Body(None)
):
    """
    Create a new cognitive graph node from extension input.

    Request body: {"text": "...", "source": "meet_voice|meet_chat", "author_wallet": "..."}
    Response: {"node": {...}, "edges": [...]}
    """
    return await create_node_handler(text)


@router.get("/graph")
async def get_graph():
    """
    Retrieve the full knowledge graph (all nodes + edges).

    Response: {"nodes": [...], "edges": [...]}
    """
    return await get_graph_handler()


@router.get("/node/{node_id}")
async def get_node_details(node_id: str):
    """
    Retrieve a single node by ID with its connections.

    Response: {"node": {...}, "edges": [...]}
    """
    return await get_node_details_handler(node_id)
