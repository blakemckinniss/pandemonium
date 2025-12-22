"""
Dynamic pool generation via Groq API.

Generates varied phrase pools on-demand to maximize prompt uniqueness.
Adds another layer of randomness: seed concepts → Groq variations → random selection.
"""

import json
import os
import random
import re
from functools import lru_cache

import requests

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _call_groq(prompt: str, max_tokens: int = 300) -> str | None:
    """Make a Groq API call and return content."""
    if not GROQ_API_KEY:
        return None
    try:
        response = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 1.0,  # Maximum creativity
                "max_tokens": max_tokens,
            },
            timeout=15,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception:
        return None


@lru_cache(maxsize=1)
def generate_skin_highlight_pool(count: int = 20) -> tuple[str, ...]:
    """Generate varied skin/lighting highlight phrases via Groq."""
    prompt = f"""Generate {count} UNIQUE short phrases describing sensual lighting on skin/body.
Each phrase should be 8-12 words, describing how light falls on bare skin.
Be creative and varied - no two should share the same 3-word sequence.

Examples of the style (but generate DIFFERENT ones):
- "golden hour glow caressing bare shoulders"
- "rim lighting defining the curve of her spine"

Return ONLY a JSON array of strings, no explanation."""

    result = _call_groq(prompt)
    if result:
        try:
            # Extract JSON array from response
            match = re.search(r"\[.*\]", result, re.DOTALL)
            if match:
                phrases = json.loads(match.group())
                if isinstance(phrases, list) and len(phrases) >= 5:
                    return tuple(phrases)
        except (json.JSONDecodeError, TypeError):
            pass

    # Fallback to static pool if Groq fails
    return (
        "with soft shadows and warm highlights on skin.",
        "casting sensual shadows across bare curves.",
        "with intimate lighting dancing across exposed flesh.",
        "highlighting every curve and contour of bare skin.",
        "with provocative interplay of light and shadow on body.",
        "golden hour warmth kissing bare shoulders.",
        "rim light defining silhouette against darkness.",
        "dappled light through curtains on naked form.",
        "candlelight flickering across exposed décolletage.",
        "moonbeam silver tracing the curve of hips.",
    )


@lru_cache(maxsize=1)
def generate_erotic_visual_pool(count: int = 30) -> tuple[str, ...]:
    """Generate varied erotic visual description phrases via Groq."""
    prompt = f"""Generate {count} UNIQUE erotic visual scene descriptions.
Each should be 5-10 words describing a sensual/erotic visual moment.
Focus on: poses, body parts, intimate gestures, sensual textures.
Be MAXIMALLY varied - no repeated patterns.

Return ONLY a JSON array of strings."""

    result = _call_groq(prompt, max_tokens=500)
    if result:
        try:
            match = re.search(r"\[.*\]", result, re.DOTALL)
            if match:
                phrases = json.loads(match.group())
                if isinstance(phrases, list) and len(phrases) >= 10:
                    return tuple(phrases)
        except (json.JSONDecodeError, TypeError):
            pass

    # Fallback
    return (
        "arched back in ecstasy",
        "fingers tracing collarbone",
        "lips parted in anticipation",
        "hips tilted provocatively",
        "shoulders bare and glistening",
        "thighs pressed together",
        "neck exposed vulnerably",
        "hands gripping bedsheets",
        "body curved in invitation",
        "skin flushed with warmth",
    )


@lru_cache(maxsize=5)
def generate_element_colors(element: str, count: int = 10) -> tuple[str, ...]:
    """Generate varied color descriptions for an element via Groq."""
    element_hints = {
        "fire": "flames, heat, burning",
        "ice": "frost, cold, crystalline",
        "lightning": "electricity, sparks, plasma",
        "void": "darkness, shadow, cosmic",
        "physical": "metal, steel, force",
    }
    hint = element_hints.get(element, "magical energy")

    prompt = f"""Generate {count} UNIQUE color descriptions for "{element}" ({hint}).
Each: 4-7 words of colors/tones. Be creative, vary combinations.
Return ONLY a JSON array of strings."""

    result = _call_groq(prompt, max_tokens=200)
    if result:
        try:
            match = re.search(r"\[.*\]", result, re.DOTALL)
            if match:
                phrases = json.loads(match.group())
                if isinstance(phrases, list) and len(phrases) >= 3:
                    return tuple(phrases)
        except (json.JSONDecodeError, TypeError):
            pass

    # Fallback to static
    fallbacks = {
        "fire": ("crimson and gold", "orange ember glow", "scarlet flame burst"),
        "ice": ("arctic blue shimmer", "pale frost white", "crystalline cyan"),
        "lightning": ("electric violet", "plasma white-blue", "crackling purple"),
        "void": ("abyssal purple-black", "cosmic dark magenta", "shadow ink"),
        "physical": ("steel grey metallic", "iron and chrome", "silver gleam"),
    }
    return fallbacks.get(element, ("magical hues",))


def get_random_skin_highlight() -> str:
    """Get a random skin highlight phrase from Groq-generated pool."""
    pool = generate_skin_highlight_pool()
    return random.choice(pool)


def get_random_erotic_visual() -> str:
    """Get a random erotic visual phrase from Groq-generated pool."""
    pool = generate_erotic_visual_pool()
    return random.choice(pool)


def get_random_element_colors(element: str) -> str:
    """Get random color description for element from Groq-generated pool."""
    pool = generate_element_colors(element)
    return random.choice(pool)


@lru_cache(maxsize=1)
def generate_opening_templates(count: int = 20) -> tuple[str, ...]:
    """Generate varied opening sentence templates via Groq."""
    prompt = f"""Generate {count} UNIQUE opening phrases for erotic scene descriptions.
Each should be 4-8 words, ending with a colon or period, with {{visual}} placeholder.
Vary structure: "A [adj] [noun] of...", "The scene...", "[Noun] [verb]s as...", etc.
NO repetition of 3-word sequences across phrases.

Return ONLY a JSON array of strings with {{visual}} placeholder."""

    result = _call_groq(prompt)
    if result:
        try:
            match = re.search(r"\[.*\]", result, re.DOTALL)
            if match:
                phrases = json.loads(match.group())
                if isinstance(phrases, list) and len(phrases) >= 5:
                    return tuple(phrases)
        except (json.JSONDecodeError, TypeError):
            pass

    return (
        "An intimate erotic scene showing {visual}.",
        "A sensual moment unfolds: {visual}.",
        "Passion manifests as {visual}.",
        "Desire takes form in {visual}.",
        "An alluring vision of {visual}.",
    )


@lru_cache(maxsize=1)
def generate_composition_phrases(count: int = 15) -> tuple[str, ...]:
    """Generate varied composition/framing phrases via Groq."""
    prompt = f"""Generate {count} UNIQUE photography composition phrases.
Each 3-5 words describing arrangement/framing style.
Vary vocabulary: arrangement, staging, layout, framing, placement, positioning.
NO shared 3-word sequences.

Return ONLY a JSON array of strings."""

    result = _call_groq(prompt, max_tokens=200)
    if result:
        try:
            match = re.search(r"\[.*\]", result, re.DOTALL)
            if match:
                phrases = json.loads(match.group())
                if isinstance(phrases, list) and len(phrases) >= 5:
                    return tuple(phrases)
        except (json.JSONDecodeError, TypeError):
            pass

    return (
        "suggestive composition using",
        "seductive arrangement with",
        "provocative framing via",
        "sensual layout through",
        "alluring placement using",
    )


def get_random_opening_template() -> str:
    """Get a random opening template from Groq-generated pool."""
    pool = generate_opening_templates()
    return random.choice(pool)


def get_random_composition_phrase() -> str:
    """Get a random composition phrase from Groq-generated pool."""
    pool = generate_composition_phrases()
    return random.choice(pool)


def refresh_pools() -> None:
    """Clear cached pools to force regeneration on next access."""
    generate_skin_highlight_pool.cache_clear()
    generate_erotic_visual_pool.cache_clear()
    generate_element_colors.cache_clear()
    generate_opening_templates.cache_clear()
    generate_composition_phrases.cache_clear()
