"""
Routes — API route definitions for the Cognitive Graph Engine.
"""

from fastapi import APIRouter, Body
from app.controllers.node_controller import (
    create_node_handler,
    get_graph_handler,
    get_node_details_handler,
)


router = APIRouter(tags=["nodes"])


@router.post("/node", status_code=201)
async def create_node(text: str = Body(..., embed=True)):
    """
    Create a new cognitive graph node from text input.

    Request body: {"text": "..."}
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
