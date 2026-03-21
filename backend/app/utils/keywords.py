"""
Keywords — Text tokenization and Jaccard similarity.
"""

import re
from typing import Set

# English stopwords (70+ common words to exclude)
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
    "to", "was", "will", "with", "the", "this", "but", "they", "have",
    "had", "what", "when", "where", "who", "which", "why", "how",
    "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "can", "just", "should", "now", "d", "ll",
    "m", "o", "re", "ve", "y", "ain", "aren", "couldn", "didn",
    "doesn", "hadn", "hasn", "haven", "isn", "ma", "mightn", "mustn",
    "needn", "shan", "shouldn", "wasn", "weren", "won", "wouldn"
}


def tokenize(text: str) -> Set[str]:
    """
    Tokenize text into meaningful keywords.

    Process:
    1. Convert to lowercase
    2. Strip punctuation (replace non-alphanumeric with spaces)
    3. Split into words
    4. Remove stopwords

    Args:
        text: Input text

    Returns:
        Set of meaningful keywords
    """
    # Lowercase and strip punctuation
    cleaned = re.sub(r'[^a-z0-9\s]', ' ', text.lower())

    # Split and filter stopwords
    words = cleaned.split()
    keywords = {word for word in words if word and word not in STOPWORDS}

    return keywords


def jaccard_similarity(tokens_a: Set[str], tokens_b: Set[str]) -> float:
    """
    Compute Jaccard similarity between two token sets.

    Formula: |A ∩ B| / |A ∪ B|

    Args:
        tokens_a: First token set
        tokens_b: Second token set

    Returns:
        Jaccard similarity in [0, 1]
    """
    if not tokens_a and not tokens_b:
        return 1.0

    if not tokens_a or not tokens_b:
        return 0.0

    intersection = len(tokens_a & tokens_b)
    union = len(tokens_a | tokens_b)

    return intersection / union if union > 0 else 0.0


def keyword_score(text_a: str, text_b: str) -> float:
    """
    Compute keyword similarity score between two texts.

    Args:
        text_a: First text
        text_b: Second text

    Returns:
        Jaccard similarity of their keywords
    """
    tokens_a = tokenize(text_a)
    tokens_b = tokenize(text_b)
    return jaccard_similarity(tokens_a, tokens_b)
