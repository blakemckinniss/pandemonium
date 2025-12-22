#!/usr/bin/env python3
"""
Prompt Variety Audit - Analyze 100 randomly generated ComfyUI prompts for sameness issues.

Generates card metadata via Groq API, converts to ComfyUI prompts, and analyzes
for repetition patterns, template rigidity, and creativity metrics.
"""

import json
import os
import random
import re
import sys
from collections import Counter
from pathlib import Path

import requests

# Add parent for imports
sys.path.insert(0, str(Path(__file__).parent))
from composable_visuals import compose_body_phrase, compose_lighting_phrase
from prompts import card_to_prompt

# Groq API configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Card generation parameters
THEMES = ["attack", "skill", "power"]
ELEMENTS = ["physical", "fire", "ice", "lightning", "void"]
RARITIES = ["common", "uncommon", "rare"]

# Visual motif seeds - random visual concepts to inject variety at the source
VISUAL_MOTIFS = [
    "dripping candle wax",
    "silk ribbons binding",
    "shattered mirror",
    "rose petals scattered",
    "chains and velvet",
    "moonlit silhouette",
    "steam rising",
    "honey dripping",
    "thorny vines",
    "crystalline tears",
    "smoke and embers",
    "wet fabric clinging",
    "shadowy tendrils",
    "glowing runes",
    "feathers falling",
    "blood droplets",
    "frost patterns",
    "lightning arcs",
    "ink spreading",
    "ghostly touch",
    "golden chains",
    "serpentine coils",
    "broken glass",
    "melting ice",
    "burning incense",
    "spider silk",
    "dark wine spilled",
    "pearl strands",
    "cracked porcelain",
    "midnight bloom",
    "aurora wisps",
    "volcanic glow",
    "abyssal depths",
]

# Texture/material seeds
TEXTURE_MOTIFS = [
    "leather and lace",
    "silk against skin",
    "cold metal warmth",
    "velvet darkness",
    "satin shimmer",
    "gossamer transparency",
    "rough stone smooth flesh",
    "wet glossy surfaces",
    "matte shadow",
    "iridescent sheen",
    "crystalline facets",
    "organic curves",
]

# Mood seeds
MOOD_MOTIFS = [
    "desperate longing",
    "predatory patience",
    "ecstatic surrender",
    "cruel tenderness",
    "sacred profanity",
    "innocent corruption",
    "hungry anticipation",
    "lazy satisfaction",
    "fierce devotion",
    "cold passion",
    "burning restraint",
    "sweet agony",
]

# Sample hints for variety (game mechanics)
HINTS = [
    "vampiric drain",
    "explosive damage",
    "defensive stance",
    "chain lightning",
    "ice armor",
    "shadow strike",
    "healing aura",
    "berserker rage",
    "poison blade",
    "fire burst",
    "frost nova",
    "thunder clap",
    "blood magic",
    "arcane shield",
    "nature's wrath",
    "soul harvest",
    "blade dance",
    "inferno",
    "blizzard",
    "storm call",
    "life steal",
    "barrier",
    "thorns",
    "reflect damage",
    "multi-strike",
    "penetrating blow",
    "crushing force",
    "swift attack",
    "dark ritual",
    "holy light",
    "chaos bolt",
    "order restore",
    "summon familiar",
    "dominate",
    "curse",
    "blessing",
    "time warp",
    "dimension rift",
    "gravity well",
    "phase shift",
    "",
    "",
    "",
    "",  # Empty hints for fully random generation
]


def generate_card_via_groq(theme: str, element: str, rarity: str, hint: str) -> dict | None:
    """Generate a single card using Groq API with flavor seeds."""
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not set")
        return None

    # Inject random motifs as creative seeds
    visual_seed = random.choice(VISUAL_MOTIFS)
    texture_seed = random.choice(TEXTURE_MOTIFS)
    mood_seed = random.choice(MOOD_MOTIFS)

    prompt = f"""Generate a creative card for a dark fantasy erotic roguelike card game.

Requirements:
- Theme: {theme} (attack=damage, skill=utility, power=persistent buff)
- Element: {element}
- Rarity: {rarity}
{"- Mechanic hint: " + hint if hint else ""}

VISUAL INSPIRATION (incorporate these into flavor):
- Visual motif: {visual_seed}
- Texture/material: {texture_seed}
- Mood: {mood_seed}

Return ONLY valid JSON with this structure:
{{
  "name": "Creative Card Name",
  "description": "Brief flavor text about the card",
  "effects": "What the card does mechanically",
  "flavor_visual": "3-5 visual keywords (e.g., 'dripping honey, arched back')",
  "flavor_mood": "1-2 mood/atmosphere words (e.g., 'desperate yearning')",
  "flavor_texture": "1-2 texture/material words (e.g., 'wet silk')"
}}

Be creative and evocative. The flavor fields should paint a vivid erotic scene.
Think dark fantasy, occult, visceral, sensual, NSFW themes."""

    try:
        response = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.9,  # High creativity
                "max_tokens": 200,
            },
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]

        # Extract JSON from response
        json_match = re.search(r"\{[^{}]*\}", content, re.DOTALL)
        if json_match:
            card_data = json.loads(json_match.group())
            return {
                "name": card_data.get("name", "Unknown"),
                "description": card_data.get("description", ""),
                "theme": theme,
                "element": element,
                "rarity": rarity,
                "effects": card_data.get("effects", ""),
                # Flavor seeds from LLM for image generation variety
                "flavor_visual": card_data.get("flavor_visual", ""),
                "flavor_mood": card_data.get("flavor_mood", ""),
                "flavor_texture": card_data.get("flavor_texture", ""),
            }
    except Exception as e:
        print(f"  Error generating card: {e}")

    return None


def analyze_prompts(prompts: list[str]) -> dict:
    """Analyze a list of prompts for variety metrics."""

    # Word frequency analysis
    all_words = []
    for prompt in prompts:
        words = re.findall(r"\b[a-z]{4,}\b", prompt.lower())
        all_words.extend(words)

    word_counts = Counter(all_words)
    total_words = len(all_words)
    unique_words = len(word_counts)

    # Find overused words (appear in >20% of prompts)
    overused = {
        word: count for word, count in word_counts.most_common(50) if count > len(prompts) * 0.2
    }

    # Phrase repetition (3-grams)
    all_trigrams = []
    for prompt in prompts:
        words = prompt.lower().split()
        trigrams = [" ".join(words[i : i + 3]) for i in range(len(words) - 2)]
        all_trigrams.extend(trigrams)

    trigram_counts = Counter(all_trigrams)
    repeated_phrases = {
        phrase: count for phrase, count in trigram_counts.most_common(30) if count > 3
    }

    # Template structure analysis - look for repeated sentence patterns
    sentence_starts = []
    for prompt in prompts:
        sentences = prompt.split(".")
        for s in sentences[:3]:  # First 3 sentences
            words = s.strip().split()[:4]
            if words:
                sentence_starts.append(" ".join(words))

    start_counts = Counter(sentence_starts)
    repeated_starts = {start: count for start, count in start_counts.most_common(20) if count > 5}

    # Prompt length distribution
    lengths = [len(prompt.split()) for prompt in prompts]
    avg_length = sum(lengths) / len(lengths)
    length_variance = sum((ln - avg_length) ** 2 for ln in lengths) / len(lengths)

    # Unique content ratio (first 50 words of each prompt)
    first_50_words = [" ".join(p.split()[:50]) for p in prompts]
    unique_openings = len(set(first_50_words))

    # Calculate variety score (0-100)
    word_variety = min(100, (unique_words / total_words) * 500)
    phrase_variety = max(0, 100 - len(repeated_phrases) * 5)
    template_variety = max(0, 100 - len(repeated_starts) * 10)
    opening_variety = (unique_openings / len(prompts)) * 100

    overall_score = (
        word_variety * 0.25
        + phrase_variety * 0.25
        + template_variety * 0.25
        + opening_variety * 0.25
    )

    return {
        "total_prompts": len(prompts),
        "total_words": total_words,
        "unique_words": unique_words,
        "word_variety_ratio": unique_words / total_words,
        "avg_prompt_length": avg_length,
        "length_variance": length_variance,
        "overused_words": dict(list(overused.items())[:15]),
        "repeated_phrases": dict(list(repeated_phrases.items())[:10]),
        "repeated_starts": dict(list(repeated_starts.items())[:10]),
        "unique_openings": unique_openings,
        "scores": {
            "word_variety": round(word_variety, 1),
            "phrase_variety": round(phrase_variety, 1),
            "template_variety": round(template_variety, 1),
            "opening_variety": round(opening_variety, 1),
            "overall": round(overall_score, 1),
        },
    }


def main():
    print("=" * 70)
    print("COMFYUI PROMPT VARIETY AUDIT")
    print("=" * 70)
    print()

    # Generate 100 cards with varied parameters
    print("Generating 100 cards via Groq API...")
    print("(Using high temperature for maximum creativity)")
    print()

    cards = []
    prompts = []

    for i in range(100):
        # Randomize parameters
        theme = random.choice(THEMES)
        element = random.choice(ELEMENTS)
        rarity = random.choice(RARITIES)
        hint = random.choice(HINTS)

        print(f"  [{i + 1:3d}/100] Generating {rarity} {element} {theme}...", end=" ")

        card = generate_card_via_groq(theme, element, rarity, hint)
        if card:
            cards.append(card)

            # Use ONLY composable phrases - Groq flavor seeds converge too much
            # Each call to compose_*() generates unique combination
            custom_hint = ", ".join(
                [
                    compose_body_phrase(),
                    compose_body_phrase(),  # Two different body phrases
                    compose_lighting_phrase(),
                ]
            )

            # Convert to ComfyUI prompt with flavor seeds
            prompt = card_to_prompt(
                name=card["name"],
                description=card.get("description", ""),
                theme=card["theme"],
                element=card["element"],
                rarity=card["rarity"],
                custom_hint=custom_hint,
            )
            prompts.append(prompt)

            print(f"✓ {card['name'][:40]}")
        else:
            print("✗ Failed")

    print()
    print(f"Successfully generated {len(cards)} cards")
    print()

    if len(prompts) < 10:
        print("ERROR: Not enough prompts generated for meaningful analysis")
        return

    # Analyze prompts
    print("=" * 70)
    print("ANALYSIS RESULTS")
    print("=" * 70)
    print()

    analysis = analyze_prompts(prompts)

    # Print scores
    print("VARIETY SCORES (0-100, higher = more variety):")
    print("-" * 40)
    scores = analysis["scores"]
    for metric, score in scores.items():
        bar = "█" * int(score / 5) + "░" * (20 - int(score / 5))
        status = "✓" if score >= 70 else "⚠" if score >= 50 else "✗"
        print(f"  {metric:20s} {bar} {score:5.1f} {status}")
    print()

    # Print statistics
    print("STATISTICS:")
    print("-" * 40)
    print(f"  Total prompts:       {analysis['total_prompts']}")
    print(f"  Total words:         {analysis['total_words']}")
    print(f"  Unique words:        {analysis['unique_words']}")
    print(f"  Word variety ratio:  {analysis['word_variety_ratio']:.3f}")
    print(f"  Avg prompt length:   {analysis['avg_prompt_length']:.1f} words")
    print(f"  Length variance:     {analysis['length_variance']:.1f}")
    print(f"  Unique openings:     {analysis['unique_openings']}/{len(prompts)}")
    print()

    # Print overused words
    if analysis["overused_words"]:
        print("OVERUSED WORDS (>20% of prompts):")
        print("-" * 40)
        for word, count in list(analysis["overused_words"].items())[:10]:
            pct = count / len(prompts) * 100
            print(f"  '{word}': {count} times ({pct:.0f}%)")
        print()

    # Print repeated phrases
    if analysis["repeated_phrases"]:
        print("REPEATED PHRASES (3-word sequences appearing >3 times):")
        print("-" * 40)
        for phrase, count in list(analysis["repeated_phrases"].items())[:8]:
            print(f"  '{phrase}': {count} times")
        print()

    # Print repeated sentence starts
    if analysis["repeated_starts"]:
        print("TEMPLATE RIGIDITY (repeated sentence openings >5 times):")
        print("-" * 40)
        for start, count in list(analysis["repeated_starts"].items())[:8]:
            print(f"  '{start}...': {count} times")
        print()

    # Sample prompts for manual review
    print("=" * 70)
    print("SAMPLE PROMPTS FOR MANUAL REVIEW")
    print("=" * 70)

    samples = random.sample(list(zip(cards, prompts)), min(5, len(prompts)))
    for i, (card, prompt) in enumerate(samples, 1):
        print()
        info = f"{card['rarity']} {card['element']} {card['theme']}"
        print(f"--- Sample {i}: {card['name']} ({info}) ---")
        print()
        # Word wrap at 80 chars
        words = prompt.split()
        lines = []
        current_line = []
        current_len = 0
        for word in words:
            if current_len + len(word) + 1 > 78:
                lines.append(" ".join(current_line))
                current_line = [word]
                current_len = len(word)
            else:
                current_line.append(word)
                current_len += len(word) + 1
        if current_line:
            lines.append(" ".join(current_line))
        print("\n".join(lines))

    # Recommendations
    print()
    print("=" * 70)
    print("RECOMMENDATIONS")
    print("=" * 70)
    print()

    if scores["overall"] >= 80:
        print("✓ EXCELLENT variety! Prompts show good diversity.")
    elif scores["overall"] >= 60:
        print("⚠ MODERATE variety. Some sameness detected.")
    else:
        print("✗ LOW variety. Significant sameness issues found.")
    print()

    recommendations = []

    if scores["word_variety"] < 70:
        recommendations.append(
            "- WORD VARIETY: Add more synonyms to element/theme styles. "
            "Current vocabulary is too limited."
        )

    if scores["phrase_variety"] < 70:
        recommendations.append(
            "- PHRASE VARIETY: The same 3-word phrases repeat too often. "
            "Randomize descriptive phrases more."
        )

    if scores["template_variety"] < 70:
        recommendations.append(
            "- TEMPLATE RIGIDITY: Prompts follow too similar a structure. "
            "Vary sentence order and composition."
        )

    if scores["opening_variety"] < 70:
        recommendations.append(
            "- OPENING SAMENESS: Many prompts start the same way. Add multiple opening templates."
        )

    if recommendations:
        print("Specific issues to address:")
        for rec in recommendations:
            print(rec)
    else:
        print("No major issues detected.")

    # Save full results
    output_path = Path(__file__).parent / "generated" / "prompt_audit.json"
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, "w") as f:
        json.dump({"analysis": analysis, "cards": cards, "prompts": prompts}, f, indent=2)

    print()
    print(f"Full results saved to: {output_path}")


if __name__ == "__main__":
    main()
