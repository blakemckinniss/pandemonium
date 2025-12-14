"""
Card-to-prompt conversion for NewBie image model.

Converts Pandemonium card definitions into prompts optimized for anime-style card art.
Supports both natural language and XML structured format for complex scenes.
"""

from typing import Literal

# Element to visual style mapping
ELEMENT_STYLES: dict[str, dict[str, str]] = {
    "physical": {
        "colors": "steel grey, silver, metallic",
        "effects": "impact lines, motion blur",
        "atmosphere": "dynamic, powerful",
    },
    "fire": {
        "colors": "orange, red, yellow flames",
        "effects": "fire particles, embers, heat distortion",
        "atmosphere": "intense, burning, passionate",
    },
    "ice": {
        "colors": "cyan, light blue, white frost",
        "effects": "ice crystals, snowflakes, frozen mist",
        "atmosphere": "cold, serene, crystalline",
    },
    "lightning": {
        "colors": "electric blue, purple, white sparks",
        "effects": "lightning bolts, electrical arcs, plasma",
        "atmosphere": "energetic, crackling, charged",
    },
    "void": {
        "colors": "deep purple, black, dark magenta",
        "effects": "dark tendrils, void particles, distortion",
        "atmosphere": "mysterious, otherworldly, ominous",
    },
}

# Theme to visual style mapping
THEME_STYLES: dict[str, dict[str, str]] = {
    "attack": {
        "composition": "dynamic action pose, offensive stance",
        "mood": "aggressive, powerful, striking",
        "border_hint": "red energy border",
    },
    "skill": {
        "composition": "defensive or utility focus, balanced pose",
        "mood": "tactical, protective, supportive",
        "border_hint": "blue energy border",
    },
    "power": {
        "composition": "aura emanating, empowered stance, glowing",
        "mood": "mystical, enhanced, transcendent",
        "border_hint": "purple energy border",
    },
    "curse": {
        "composition": "corrupted, twisted, dark influence",
        "mood": "malevolent, cursed, haunting",
        "border_hint": "sickly green border",
    },
    "status": {
        "composition": "neutral, simple, basic",
        "mood": "plain, unremarkable",
        "border_hint": "grey border",
    },
}

# Rarity to quality/detail mapping
RARITY_QUALITY: dict[str, str] = {
    "starter": "simple design, basic details, clean lines",
    "common": "good detail, clear composition, polished",
    "uncommon": "high detail, interesting composition, elaborate effects",
    "rare": "extremely detailed, complex composition, stunning effects, masterpiece quality",
}


def card_to_prompt(
    name: str,
    description: str,
    theme: Literal["attack", "skill", "power", "curse", "status"],
    element: Literal["physical", "fire", "ice", "lightning", "void"] = "physical",
    rarity: Literal["starter", "common", "uncommon", "rare"] = "common",
    custom_hint: str | None = None,
) -> str:
    """
    Convert a card definition into an image generation prompt.

    Args:
        name: Card name (e.g., "Flame Strike")
        description: Card effect description
        theme: Card type (attack/skill/power/curse/status)
        element: Elemental affinity
        rarity: Card rarity for detail level
        custom_hint: Optional custom style hints

    Returns:
        Optimized prompt string for NewBie model
    """
    elem_style = ELEMENT_STYLES.get(element, ELEMENT_STYLES["physical"])
    theme_style = THEME_STYLES.get(theme, THEME_STYLES["attack"])
    quality = RARITY_QUALITY.get(rarity, RARITY_QUALITY["common"])

    # Build prompt parts
    parts = [
        # Subject - the card's concept
        f"fantasy card art depicting '{name}'",
        # Interpret the effect visually
        f"visualizing: {description}",
        # Element styling
        f"color palette: {elem_style['colors']}",
        f"visual effects: {elem_style['effects']}",
        # Theme styling
        theme_style["composition"],
        f"mood: {theme_style['mood']}",
        # Quality based on rarity
        quality,
        # Base style tags
        "anime style, digital illustration, card game art",
        "centered composition, suitable for card frame",
        "dramatic lighting, vibrant colors",
        "no text, no words, no letters",
    ]

    if custom_hint:
        parts.append(custom_hint)

    return ", ".join(parts)


def card_to_xml_prompt(
    name: str,
    description: str,
    theme: Literal["attack", "skill", "power", "curse", "status"],
    element: Literal["physical", "fire", "ice", "lightning", "void"] = "physical",
    rarity: Literal["starter", "common", "uncommon", "rare"] = "common",
    custom_hint: str | None = None,
) -> str:
    """
    Convert a card definition into XML structured prompt for better attribute control.

    The NewBie model supports XML format for improved prompt adherence,
    especially useful for complex card art with multiple elements.
    """
    elem_style = ELEMENT_STYLES.get(element, ELEMENT_STYLES["physical"])
    theme_style = THEME_STYLES.get(theme, THEME_STYLES["attack"])
    quality = RARITY_QUALITY.get(rarity, RARITY_QUALITY["common"])

    xml_prompt = f"""
<card_art>
<subject>{name}</subject>
<concept>{description}</concept>
<element>{element}</element>
<colors>{elem_style["colors"]}</colors>
<effects>{elem_style["effects"]}</effects>
<atmosphere>{elem_style["atmosphere"]}</atmosphere>
</card_art>
<composition>
<layout>centered, card game art format, vertical orientation</layout>
<pose>{theme_style["composition"]}</pose>
<mood>{theme_style["mood"]}</mood>
</composition>
<general_tags>
<style>anime_style, digital_illustration, fantasy_card_art</style>
<quality>{quality}, high_resolution, detailed</quality>
<constraints>no_text, no_words, no_letters, no_watermark</constraints>
{f"<custom>{custom_hint}</custom>" if custom_hint else ""}
</general_tags>
"""
    return xml_prompt.strip()


def batch_prompt_from_card_def(card_def: dict) -> str:
    """
    Generate prompt from a card definition dict (as stored in game).

    Args:
        card_def: Card definition with id, name, description, theme, element, rarity

    Returns:
        Prompt string for image generation
    """
    return card_to_prompt(
        name=card_def.get("name", "Unknown Card"),
        description=card_def.get("description", "A mysterious card"),
        theme=card_def.get("theme", "attack"),
        element=card_def.get("element", "physical"),
        rarity=card_def.get("rarity", "common"),
    )
