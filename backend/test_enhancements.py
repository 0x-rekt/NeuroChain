"""
Quick test script for enhanced similarity and background workers.

Run this to verify the implementation is working correctly.
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.enhanced_similarity_service import (
    compute_enhanced_similarity,
    char_ngrams,
    fuzzy_similarity,
    edit_distance_ratio,
    length_ratio,
    token_overlap_ratio,
)
from app.services.embedding_service import generate_embedding


async def test_enhanced_similarity():
    """Test enhanced similarity methods."""

    print("=" * 60)
    print("Testing Enhanced Similarity Service")
    print("=" * 60)

    # Test cases
    test_pairs = [
        # (text_a, text_b, expected_similarity)
        ("The quick brown fox", "The quick brown fox", "STRONG"),  # Exact match
        ("The quick brown fox", "The fast brown fox", "STRONG"),   # Similar
        ("AI will transform education", "Artificial intelligence will change teaching", "MODERATE"),
        ("Python is great", "Java is terrible", "WEAK"),
        ("Hello world", "Goodbye universe", "NONE"),
    ]

    for text_a, text_b, expected in test_pairs:
        print(f"\n--- Test Case ---")
        print(f"Text A: {text_a}")
        print(f"Text B: {text_b}")
        print(f"Expected: {expected}")

        # Generate embeddings
        print("Generating embeddings...")
        embedding_a = await generate_embedding(text_a)
        embedding_b = await generate_embedding(text_b)

        # Compute enhanced similarity
        result = compute_enhanced_similarity(
            text_a,
            text_b,
            embedding_a,
            embedding_b,
        )

        print(f"\nResults:")
        print(f"  Composite Score: {result.composite_score:.3f}")
        print(f"  Confidence: {result.confidence.upper()}")
        print(f"  Is Duplicate: {result.is_duplicate}")
        print(f"\n  Component Scores:")
        print(f"    Semantic:      {result.semantic:.3f}")
        print(f"    Keyword:       {result.keyword:.3f}")
        print(f"    Fuzzy:         {result.fuzzy:.3f}")
        print(f"    Edit Distance: {result.edit_distance:.3f}")
        print(f"    Length Ratio:  {result.length_ratio:.3f}")
        print(f"    Token Overlap: {result.token_overlap:.3f}")

        # Check if result matches expectation
        match = "✓" if result.confidence.upper() == expected else "✗"
        print(f"\n  Result: {match} ({result.confidence.upper()} vs expected {expected})")


def test_individual_methods():
    """Test individual similarity methods."""

    print("\n" + "=" * 60)
    print("Testing Individual Similarity Methods")
    print("=" * 60)

    text_a = "The quick brown fox jumps"
    text_b = "The fast brown fox leaps"

    print(f"\nText A: {text_a}")
    print(f"Text B: {text_b}")

    print(f"\nCharacter N-grams (n=3):")
    ngrams_a = char_ngrams(text_a, 3)
    ngrams_b = char_ngrams(text_b, 3)
    print(f"  A: {list(ngrams_a)[:10]}... (sample)")
    print(f"  B: {list(ngrams_b)[:10]}... (sample)")

    print(f"\nFuzzy Similarity: {fuzzy_similarity(text_a, text_b):.3f}")
    print(f"Edit Distance Ratio: {edit_distance_ratio(text_a, text_b):.3f}")
    print(f"Length Ratio: {length_ratio(text_a, text_b):.3f}")
    print(f"Token Overlap: {token_overlap_ratio(text_a, text_b):.3f}")


def test_task_queue():
    """Test task queue configuration."""

    print("\n" + "=" * 60)
    print("Testing Task Queue Configuration")
    print("=" * 60)

    try:
        from app.tasks import huey
        from app.tasks.workers import (
            trigger_full_graph_reevaluation,
            reevaluate_node_connections,
        )

        print(f"\n✓ Huey instance loaded successfully")
        print(f"  Name: {huey.name}")
        print(f"  Storage: {type(huey.storage).__name__}")
        print(f"  Immediate mode: {huey.immediate}")

        print(f"\n✓ Worker tasks imported successfully")
        print(f"  - trigger_full_graph_reevaluation")
        print(f"  - reevaluate_node_connections")

        # Check pending tasks
        pending = huey.pending_count()
        scheduled = huey.scheduled_count()

        print(f"\nTask Queue Status:")
        print(f"  Pending: {pending}")
        print(f"  Scheduled: {scheduled}")

    except Exception as e:
        print(f"\n✗ Error loading task queue: {e}")


async def main():
    """Run all tests."""

    print("\n" + "=" * 60)
    print("NeuroChain Enhanced Similarity & Background Workers Test")
    print("=" * 60)

    # Test individual methods (fast)
    test_individual_methods()

    # Test task queue configuration
    test_task_queue()

    # Test enhanced similarity (requires Snowflake connection)
    try:
        await test_enhanced_similarity()
    except Exception as e:
        print(f"\n✗ Enhanced similarity test failed (requires Snowflake): {e}")
        print("  This is expected if Snowflake credentials are not configured.")

    print("\n" + "=" * 60)
    print("Tests Complete!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Start the Huey worker: scripts/start_worker.bat (Windows) or scripts/start_worker.sh (Linux)")
    print("2. Start the API server: uvicorn app.main:app --reload")
    print("3. Create a node via POST /node and watch the background re-evaluation in logs")


if __name__ == "__main__":
    asyncio.run(main())
