"""
Time utilities — Timestamp and time decay calculations.
"""

import time
import math


def now_timestamp() -> int:
    """Return current Unix timestamp in milliseconds."""
    return int(time.time() * 1000)


def time_decay(t1: int, t2: int, half_life: int) -> float:
    """
    Compute exponential time decay score between two timestamps.

    Args:
        t1: First timestamp (milliseconds)
        t2: Second timestamp (milliseconds)
        half_life: Half-life in milliseconds

    Returns:
        Decay score in (0, 1], where 1 = same timestamp
    """
    if half_life <= 0:
        return 1.0

    delta = abs(t1 - t2)
    return math.exp(-delta / half_life)
