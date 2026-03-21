"""
Embedding service — Embedding generation with caching and retry logic.
"""

from typing import List, Optional

from app.store.embedding_cache import EmbeddingCache
from app.services.snowflake_service import generate_embedding_via_snowflake
from app.utils.logger import logger


# Global cache instance
_cache: Optional[EmbeddingCache] = None


def init_embedding_cache(capacity: int) -> None:
    """
    Initialize the embedding cache.

    Args:
        capacity: Maximum number of entries to cache
    """
    global _cache
    _cache = EmbeddingCache(capacity)
    logger.info(f"Embedding cache initialized with capacity {capacity}")


async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for text with caching and retry logic.

    Flow:
    1. Check cache → return if hit
    2. Generate via Snowflake Cortex
    3. Retry once on failure
    4. Cache the result
    5. Return embedding

    Args:
        text: Text to embed

    Returns:
        768-dimensional embedding vector

    Raises:
        RuntimeError: If embedding generation fails after retry
    """
    # Check cache
    if _cache:
        cached = _cache.get(text)
        if cached is not None:
            logger.debug(f"Cache hit for text: {text[:50]}...")
            return cached

    # Generate with retry logic
    for attempt in range(2):
        try:
            logger.info(f"Generating embedding (attempt {attempt + 1}/2) for: {text[:50]}...")
            embedding = await generate_embedding_via_snowflake(text)

            # Cache the result
            if _cache:
                _cache.set(text, embedding)

            return embedding

        except Exception as e:
            if attempt == 1:  # Last attempt
                logger.error(f"Failed to generate embedding after retry: {e}")
                raise RuntimeError(f"Embedding generation failed: {str(e)}")

            logger.warning(f"Retrying embedding generation after error: {e}")

    # Should never reach here, but satisfy type checker
    raise RuntimeError("Unexpected error in embedding generation")
