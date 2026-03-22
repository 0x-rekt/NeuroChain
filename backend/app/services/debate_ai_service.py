"""
AI-powered debate analysis service — Uses LLM to analyze debates and generate insights.
"""

from typing import List, Dict
import json

from app.models.debate import DebateNode
from app.services.snowflake_service import _get_connection
from app.utils.logger import logger


def analyze_debate_with_ai(all_nodes: List[DebateNode]) -> Dict:
    """
    Use Snowflake Cortex LLM to analyze the entire debate and provide insights.

    Args:
        all_nodes: All debate nodes

    Returns:
        Dict with AI-generated insights, best stances, and creative ideas
    """
    if not all_nodes:
        return {
            "summary": "No debate data available for analysis.",
            "key_insights": [],
            "best_stance": "No stance can be determined without debate data.",
            "creative_ideas": [],
            "synthesis": "No synthesis available.",
        }

    logger.info(f"Starting AI analysis of {len(all_nodes)} debate nodes")

    # Build comprehensive debate context
    debate_context = _build_debate_context(all_nodes)

    # Create prompt for LLM
    prompt = _build_analysis_prompt(debate_context, all_nodes)

    # Call Snowflake Cortex LLM
    try:
        analysis_result = _call_cortex_llm(prompt)
        logger.info("AI analysis completed successfully")
        return analysis_result
    except Exception as error:
        logger.error(f"AI analysis failed: {error}")
        # Return fallback analysis
        return _generate_fallback_analysis(all_nodes)


def _build_debate_context(all_nodes: List[DebateNode]) -> str:
    """
    Build a comprehensive context string from all debate nodes.

    Args:
        all_nodes: All debate nodes

    Returns:
        Context string with all debate content
    """
    context_parts = []

    # Add each topic with its full accumulated text
    for i, node in enumerate(all_nodes, 1):
        speakers_list = ", ".join(node.speakers)
        context_parts.append(
            f"TOPIC {i}:\n"
            f"Speakers: {speakers_list}\n"
            f"Merge Count: {node.merge_count}\n"
            f"Content:\n{node.accumulated_text}\n"
            f"---"
        )

    return "\n\n".join(context_parts)


def _build_analysis_prompt(context: str, all_nodes: List[DebateNode]) -> str:
    """
    Build the prompt for LLM analysis.

    Args:
        context: Debate context string
        all_nodes: All debate nodes

    Returns:
        Formatted prompt string
    """
    # Get summary stats
    total_nodes = len(all_nodes)
    all_speakers = set()
    total_merges = 0
    for node in all_nodes:
        all_speakers.update(node.speakers)
        total_merges += node.merge_count

    prompt = f"""You are an expert debate analyst. Analyze the following debate with {total_nodes} topics, {len(all_speakers)} speakers, and {total_merges} total contributions.

**DEBATE CONTENT:**

{context}

**YOUR TASK:**

Provide a comprehensive analysis in JSON format with the following structure:

{{
    "summary": "A 2-3 sentence summary of the entire debate",
    "key_insights": [
        "Insight 1: Key pattern or finding from the debate",
        "Insight 2: Another important observation",
        "Insight 3: Third key insight"
    ],
    "best_stance": "Based on the evidence and arguments presented, what appears to be the most defensible position? Explain your reasoning in 3-4 sentences.",
    "creative_ideas": [
        "Creative idea 1: A novel solution or approach not explicitly mentioned",
        "Creative idea 2: Another innovative perspective",
        "Creative idea 3: A third creative synthesis"
    ],
    "synthesis": "A comprehensive synthesis that bridges different viewpoints and proposes a path forward (3-4 sentences)",
    "strongest_arguments": [
        "Strong argument 1 from the debate",
        "Strong argument 2 from the debate"
    ],
    "weakest_arguments": [
        "Weak argument 1 that lacks support",
        "Weak argument 2 with logical flaws"
    ],
    "emerging_patterns": [
        "Pattern 1: A recurring theme or approach",
        "Pattern 2: Another observable pattern"
    ],
    "recommendations": [
        "Recommendation 1: Actionable suggestion for moving forward",
        "Recommendation 2: Another practical recommendation",
        "Recommendation 3: A third strategic recommendation"
    ]
}}

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON object."""

    return prompt


def _call_cortex_llm(prompt: str) -> Dict:
    """
    Call Snowflake Cortex LLM to analyze the debate.

    Args:
        prompt: The analysis prompt

    Returns:
        Dict with analysis results
    """
    try:
        conn = _get_connection()
        cursor = conn.cursor()

        # Use Snowflake Cortex COMPLETE function with llama3.1-70b model
        # This is a powerful open-source model available in Snowflake
        sql = """
            SELECT SNOWFLAKE.CORTEX.COMPLETE(
                'llama3.1-70b',
                [
                    {
                        'role': 'system',
                        'content': 'You are an expert debate analyst. Always return valid JSON.'
                    },
                    {
                        'role': 'user',
                        'content': %(prompt)s
                    }
                ],
                {
                    'temperature': 0.7,
                    'max_tokens': 2000
                    
                }
            ) AS analysis
        """

        cursor.execute(sql, {'prompt': prompt})
        result = cursor.fetchone()

        if result and result[0]:
            # Parse the LLM response
            response_text = result[0]

            # Try to extract JSON from response
            try:
                # The response might be wrapped in markdown code blocks
                if "```json" in response_text:
                    start = response_text.find("```json") + 7
                    end = response_text.find("```", start)
                    response_text = response_text[start:end].strip()
                elif "```" in response_text:
                    start = response_text.find("```") + 3
                    end = response_text.find("```", start)
                    response_text = response_text[start:end].strip()

                analysis = json.loads(response_text)
                return analysis
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM JSON response: {e}")
                logger.error(f"Raw response: {response_text}")
                raise

        raise Exception("No response from Cortex LLM")

    except Exception as error:
        logger.error(f"Cortex LLM call failed: {error}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def _generate_fallback_analysis(all_nodes: List[DebateNode]) -> Dict:
    """
    Generate a basic analysis when AI is unavailable.

    Args:
        all_nodes: All debate nodes

    Returns:
        Dict with fallback analysis
    """
    # Get basic stats
    all_speakers = set()
    total_merges = 0
    for node in all_nodes:
        all_speakers.update(node.speakers)
        total_merges += node.merge_count

    most_debated = max(all_nodes, key=lambda n: n.merge_count) if all_nodes else None

    return {
        "summary": f"Debate with {len(all_nodes)} topics, {len(all_speakers)} speakers, and {total_merges} contributions.",
        "key_insights": [
            f"Most debated topic has {most_debated.merge_count} merges" if most_debated else "No highly debated topics",
            f"{len(all_speakers)} unique participants contributed to the discussion",
            "AI analysis temporarily unavailable - showing basic statistics only"
        ],
        "best_stance": "Unable to determine best stance without AI analysis. Please review the debate content manually.",
        "creative_ideas": [
            "Consider using different analytical approaches to the topics discussed",
            "Explore interdisciplinary perspectives that bridge multiple viewpoints",
            "Implement structured frameworks to organize the debate findings"
        ],
        "synthesis": "This is a fallback analysis. The full AI-powered analysis is temporarily unavailable. Please try again later or review the detailed analytics endpoints for statistical insights.",
        "strongest_arguments": ["AI analysis required to identify strongest arguments"],
        "weakest_arguments": ["AI analysis required to identify weakest arguments"],
        "emerging_patterns": ["AI analysis required to identify emerging patterns"],
        "recommendations": [
            "Use the /debate/conclusion endpoint for statistical analysis",
            "Review individual topic content for detailed insights",
            "Try the AI analysis again when the service is available"
        ]
    }
