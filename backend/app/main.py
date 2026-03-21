"""
Main — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.routes.nodes import router as nodes_router
from app.services.snowflake_service import initialize_tables
from app.services.embedding_service import init_embedding_cache
from app.utils.logger import logger


# Create FastAPI app
app = FastAPI(
    title="Cognitive Graph Engine",
    description="Semantic knowledge graph powered by Snowflake Arctic Embed",
    version="2.0.0"
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting Cognitive Graph Engine...")

    # Initialize embedding cache
    init_embedding_cache(settings.embedding_cache_capacity)

    # Connect to Snowflake and initialize tables
    logger.info("Connecting to Snowflake...")
    await initialize_tables()

    # Log configuration
    logger.info(f"Configuration loaded:")
    logger.info(f"  - Score threshold: {settings.score_threshold}")
    logger.info(f"  - Max edges per node: {settings.max_edges_per_node}")
    logger.info(f"  - Time decay half-life: {settings.time_decay_halflife}ms")
    logger.info(f"  - Candidate limit: {settings.candidate_limit}")
    logger.info(f"  - Cache capacity: {settings.embedding_cache_capacity}")

    logger.info("Cognitive Graph Engine ready!")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Cognitive Graph Engine",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "engine": "Cognitive Graph Engine",
        "version": "2.0.0"
    }


# Include routers
app.include_router(nodes_router)
