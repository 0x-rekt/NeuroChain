"""
Embedding cache — LRU cache for deterministic embedding lookups.
"""

from collections import OrderedDict
from typing import List, Optional


class EmbeddingCache:
    """
    LRU (Least Recently Used) cache for embeddings.

    Maintains a fixed-capacity cache that evicts the oldest entry
    when full. Access promotes entries to most-recently-used.
    """

    def __init__(self, capacity: int = 500):
        """
        Initialize the cache.

        Args:
            capacity: Maximum number of entries to store
        """
        self._cache: OrderedDict[str, List[float]] = OrderedDict()
        self._capacity = capacity

    def get(self, text: str) -> Optional[List[float]]:
        """
        Retrieve embedding from cache.

        Args:
            text: Text key

        Returns:
            Cached embedding if found, None otherwise
        """
        if text in self._cache:
            # Move to end (mark as recently used)
            self._cache.move_to_end(text)
            return self._cache[text]
        return None

    def set(self, text: str, embedding: List[float]) -> None:
        """
        Store embedding in cache.

        Args:
            text: Text key
            embedding: Embedding vector to cache
        """
        if text in self._cache:
            # Update and move to end
            self._cache.move_to_end(text)
            self._cache[text] = embedding
        else:
            # Evict oldest if at capacity
            if len(self._cache) >= self._capacity:
                self._cache.popitem(last=False)  # Remove oldest (first item)
            self._cache[text] = embedding

    @property
    def size(self) -> int:
        """Return current cache size."""
        return len(self._cache)

    def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()
