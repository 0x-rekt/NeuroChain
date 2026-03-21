"""
Enhanced similarity service — Multi-method similarity checking for full-proof detection.

Combines multiple similarity techniques:
1. Semantic similarity (cosine of embeddings)
2. Keyword overlap (Jaccard)
3. Fuzzy string matching (char n-grams)
4. Edit distance ratio (Levenshtein)
5. Length ratio check
6. Token overlap (set-based)
"""

from typing import List, Dict, Tuple
import re
from difflib import SequenceMatcher

from app.models.node import GraphNode
from app.models.debate import DebateNode
from app.services.scoring_service import cosine_similarity
from app.utils.keywords import tokenize, jaccard_similarity
from app.utils.logger import logger


# Similarity thresholds for different checks
SEMANTIC_THRESHOLD = 0.75        # Cosine similarity
KEYWORD_THRESHOLD = 0.5          # Jaccard keyword overlap
FUZZY_THRESHOLD = 0.8            # Fuzzy string matching
EDIT_DISTANCE_THRESHOLD = 0.7    # Levenshtein ratio
LENGTH_RATIO_MIN = 0.5           # Min length ratio (shorter/longer)
TOKEN_OVERLAP_THRESHOLD = 0.6    # Token set overlap

# Composite thresholds
STRONG_SIMILARITY_SCORE = 0.8    # High confidence duplicate
MODERATE_SIMILARITY_SCORE = 0.65 # Medium confidence duplicate
WEAK_SIMILARITY_SCORE = 0.5      # Low confidence duplicate


class SimilarityResult:
    """Container for multi-method similarity results."""

    def __init__(
        self,
        semantic: float,
        keyword: float,
        fuzzy: float,
        edit_distance: float,
        length_ratio: float,
        token_overlap: float,
        composite_score: float,
        is_duplicate: bool,
        confidence: str,  # "strong" | "moderate" | "weak" | "none"
    ):
        self.semantic = semantic
        self.keyword = keyword
        self.fuzzy = fuzzy
        self.edit_distance = edit_distance
        self.length_ratio = length_ratio
        self.token_overlap = token_overlap
        self.composite_score = composite_score
        self.is_duplicate = is_duplicate
        self.confidence = confidence

    def to_dict(self) -> Dict:
        """Convert to dictionary for logging/debugging."""
        return {
            "semantic": round(self.semantic, 4),
            "keyword": round(self.keyword, 4),
            "fuzzy": round(self.fuzzy, 4),
            "edit_distance": round(self.edit_distance, 4),
            "length_ratio": round(self.length_ratio, 4),
            "token_overlap": round(self.token_overlap, 4),
            "composite_score": round(self.composite_score, 4),
            "is_duplicate": self.is_duplicate,
            "confidence": self.confidence,
        }


def char_ngrams(text: str, n: int = 3) -> set:
    """
    Generate character n-grams from text.

    Useful for fuzzy matching with typos and minor variations.

    Args:
        text: Input text
        n: N-gram size (default 3)

    Returns:
        Set of character n-grams
    """
    text = text.lower().strip()
    if len(text) < n:
        return {text}
    return {text[i:i+n] for i in range(len(text) - n + 1)}


def fuzzy_similarity(text_a: str, text_b: str, n: int = 3) -> float:
    """
    Compute fuzzy similarity using character n-grams.

    More robust to small edits/typos than exact matching.

    Args:
        text_a: First text
        text_b: Second text
        n: N-gram size

    Returns:
        Jaccard similarity of character n-grams [0, 1]
    """
    ngrams_a = char_ngrams(text_a, n)
    ngrams_b = char_ngrams(text_b, n)

    if not ngrams_a and not ngrams_b:
        return 1.0
    if not ngrams_a or not ngrams_b:
        return 0.0

    intersection = len(ngrams_a & ngrams_b)
    union = len(ngrams_a | ngrams_b)

    return intersection / union if union > 0 else 0.0


def edit_distance_ratio(text_a: str, text_b: str) -> float:
    """
    Compute edit distance ratio using SequenceMatcher.

    Measures how similar two strings are based on edit operations.

    Args:
        text_a: First text
        text_b: Second text

    Returns:
        Similarity ratio [0, 1], where 1 = identical
    """
    return SequenceMatcher(None, text_a.lower(), text_b.lower()).ratio()


def length_ratio(text_a: str, text_b: str) -> float:
    """
    Compute length ratio between two texts.

    If one text is much longer/shorter, less likely to be duplicate.

    Args:
        text_a: First text
        text_b: Second text

    Returns:
        Ratio of shorter to longer [0, 1]
    """
    len_a = len(text_a)
    len_b = len(text_b)

    if len_a == 0 and len_b == 0:
        return 1.0
    if len_a == 0 or len_b == 0:
        return 0.0

    return min(len_a, len_b) / max(len_a, len_b)


def token_overlap_ratio(text_a: str, text_b: str) -> float:
    """
    Compute token overlap ratio (similar to keyword but on all tokens).

    Args:
        text_a: First text
        text_b: Second text

    Returns:
        Overlap ratio [0, 1]
    """
    # Tokenize (lowercase, split by whitespace and punctuation)
    tokens_a = set(re.findall(r'\w+', text_a.lower()))
    tokens_b = set(re.findall(r'\w+', text_b.lower()))

    if not tokens_a and not tokens_b:
        return 1.0
    if not tokens_a or not tokens_b:
        return 0.0

    intersection = len(tokens_a & tokens_b)
    union = len(tokens_a | tokens_b)

    return intersection / union if union > 0 else 0.0


def compute_enhanced_similarity(
    text_a: str,
    text_b: str,
    embedding_a: List[float],
    embedding_b: List[float],
    threshold: float = MODERATE_SIMILARITY_SCORE,
) -> SimilarityResult:
    """
    Compute comprehensive similarity using multiple methods.

    This is the main function for full-proof similarity checking.

    Weights:
    - Semantic: 40% (most important for meaning)
    - Keyword: 15% (domain-specific terms)
    - Fuzzy: 15% (handles typos)
    - Edit distance: 10% (catches minor edits)
    - Length ratio: 10% (filters very different lengths)
    - Token overlap: 10% (overall word similarity)

    Args:
        text_a: First text
        text_b: Second text
        embedding_a: First text embedding
        embedding_b: Second text embedding
        threshold: Threshold for duplicate detection

    Returns:
        SimilarityResult with all metrics
    """
    # 1. Semantic similarity (cosine of embeddings)
    semantic = cosine_similarity(embedding_a, embedding_b)

    # 2. Keyword similarity (Jaccard of meaningful keywords)
    keywords_a = tokenize(text_a)
    keywords_b = tokenize(text_b)
    keyword = jaccard_similarity(keywords_a, keywords_b)

    # 3. Fuzzy similarity (character n-grams)
    fuzzy = fuzzy_similarity(text_a, text_b)

    # 4. Edit distance ratio
    edit_dist = edit_distance_ratio(text_a, text_b)

    # 5. Length ratio
    len_ratio = length_ratio(text_a, text_b)

    # 6. Token overlap
    token_overlap = token_overlap_ratio(text_a, text_b)

    # Compute weighted composite score
    composite = (
        0.40 * semantic +
        0.15 * keyword +
        0.15 * fuzzy +
        0.10 * edit_dist +
        0.10 * len_ratio +
        0.10 * token_overlap
    )

    # Determine if duplicate and confidence level
    is_duplicate = composite >= threshold

    if composite >= STRONG_SIMILARITY_SCORE:
        confidence = "strong"
    elif composite >= MODERATE_SIMILARITY_SCORE:
        confidence = "moderate"
    elif composite >= WEAK_SIMILARITY_SCORE:
        confidence = "weak"
    else:
        confidence = "none"

    result = SimilarityResult(
        semantic=semantic,
        keyword=keyword,
        fuzzy=fuzzy,
        edit_distance=edit_dist,
        length_ratio=len_ratio,
        token_overlap=token_overlap,
        composite_score=composite,
        is_duplicate=is_duplicate,
        confidence=confidence,
    )

    logger.debug(f"Enhanced similarity: {result.to_dict()}")

    return result


def find_best_match_enhanced(
    text: str,
    embedding: List[float],
    candidates: List[GraphNode],
    threshold: float = MODERATE_SIMILARITY_SCORE,
) -> Tuple[GraphNode | None, SimilarityResult | None]:
    """
    Find best matching node using enhanced similarity.

    Args:
        text: Input text
        embedding: Input text embedding
        candidates: Candidate nodes to compare against
        threshold: Similarity threshold

    Returns:
        Tuple of (best_node, similarity_result) or (None, None)
    """
    best_node = None
    best_result = None
    best_score = 0.0

    for candidate in candidates:
        result = compute_enhanced_similarity(
            text,
            candidate.text,
            embedding,
            candidate.embedding,
            threshold=threshold,
        )

        if result.composite_score > best_score:
            best_score = result.composite_score
            best_node = candidate
            best_result = result

    # Return only if above threshold
    if best_result and best_result.is_duplicate:
        return best_node, best_result

    return None, None


def find_best_debate_match_enhanced(
    text: str,
    embedding: List[float],
    candidates: List[DebateNode],
    threshold: float = MODERATE_SIMILARITY_SCORE,
) -> Tuple[DebateNode | None, SimilarityResult | None]:
    """
    Find best matching debate node using enhanced similarity.

    Args:
        text: Input text
        embedding: Input text embedding
        candidates: Candidate debate nodes to compare against
        threshold: Similarity threshold

    Returns:
        Tuple of (best_node, similarity_result) or (None, None)
    """
    best_node = None
    best_result = None
    best_score = 0.0

    for candidate in candidates:
        # For debate nodes, compare against primary_text (original)
        result = compute_enhanced_similarity(
            text,
            candidate.primary_text,
            embedding,
            candidate.embedding,
            threshold=threshold,
        )

        if result.composite_score > best_score:
            best_score = result.composite_score
            best_node = candidate
            best_result = result

    # Return only if above threshold
    if best_result and best_result.is_duplicate:
        return best_node, best_result

    return None, None


def check_exact_duplicate(text: str, nodes: List[GraphNode]) -> GraphNode | None:
    """
    Fast check for exact text duplicates.

    Use this before enhanced similarity for early exit.

    Args:
        text: Input text
        nodes: Nodes to check against

    Returns:
        Exact duplicate node or None
    """
    normalized_text = text.strip().lower()

    for node in nodes:
        if node.text.strip().lower() == normalized_text:
            logger.info(f"Found exact duplicate: {node.id}")
            return node

    return None
