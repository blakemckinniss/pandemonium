"""
Prompt generation for card illustrations.

Converts Pandemonium card definitions into image generation prompts.
IMPORTANT: Avoids "card art" / "TCG" terminology to prevent generating card frames.

Configuration is loaded from prompts.yaml for easy editing.
"""

from pathlib import Path
from typing import Literal

import yaml

# ============================================
# YAML CONFIGURATION LOADING
# ============================================

_config_cache: dict | None = None
_config_path = Path(__file__).parent / "prompts.yaml"


def _load_config() -> dict:
    """Load configuration from YAML file with caching."""
    global _config_cache
    if _config_cache is None:
        with open(_config_path) as f:
            _config_cache = yaml.safe_load(f)
    return _config_cache


def reload_config() -> None:
    """Force reload of configuration from YAML."""
    global _config_cache
    _config_cache = None
    _load_config()


def get_config() -> dict:
    """Get the current configuration."""
    return _load_config()


# ============================================
# CONFIGURATION ACCESSORS
# ============================================


def get_element_styles() -> dict[str, dict[str, str]]:
    """Get element to visual style mapping."""
    return _load_config().get("element_styles", {})


def get_theme_styles() -> dict[str, dict[str, str]]:
    """Get theme to visual style mapping."""
    return _load_config().get("theme_styles", {})


def get_rarity_quality() -> dict[str, str]:
    """Get rarity to quality/detail mapping."""
    return _load_config().get("rarity_quality", {})


def get_action_keywords() -> dict[str, str]:
    """Get keywords to booru tags mapping."""
    return _load_config().get("action_keywords", {})


def get_hero_archetypes() -> dict[str, dict[str, str]]:
    """Get hero archetype styles."""
    return _load_config().get("hero_archetypes", {})


def get_enemy_archetypes() -> dict[str, dict[str, str]]:
    """Get enemy archetype styles."""
    return _load_config().get("enemy_archetypes", {})


def get_room_types() -> dict[str, dict[str, str]]:
    """Get room type styles."""
    return _load_config().get("room_types", {})


def get_element_features(category: str = "card") -> dict[str, str]:
    """Get element-specific character features for a category."""
    features = _load_config().get("element_features", {})
    return features.get(category, features.get("card", {}))


def get_theme_tags() -> dict[str, str]:
    """Get theme-specific booru tags."""
    return _load_config().get("theme_tags", {})


def get_rarity_tags() -> dict[str, str]:
    """Get rarity-specific booru tags."""
    return _load_config().get("rarity_tags", {})


def get_difficulty_tags() -> dict[int, str]:
    """Get difficulty-based quality tags."""
    raw = _load_config().get("difficulty_tags", {})
    # Convert string keys to int
    return {int(k): v for k, v in raw.items()}


def get_templates() -> dict[str, str]:
    """Get base prompt templates."""
    return _load_config().get("templates", {})


def get_action_visuals() -> dict[str, str]:
    """Get action type to visual description mapping."""
    return _load_config().get("action_visuals", {})


def get_nsfw_name_visuals() -> dict[str, str]:
    """Get NSFW card name words to visual concept mapping."""
    return _load_config().get("nsfw_name_visuals", {})


def _extract_action_keywords(description: str) -> str:
    """Extract booru-style tags from card description."""
    desc_lower = description.lower()
    tags = []
    for keyword, booru_tags in get_action_keywords().items():
        if keyword in desc_lower:
            tags.append(booru_tags)
    return ", ".join(tags[:4]) if tags else "magic_effect"  # Limit to 4 most relevant


def _extract_action_visual(description: str) -> str:
    """Extract visual description for card action from action_visuals config."""
    desc_lower = description.lower()
    action_visuals = get_action_visuals()

    # Find matching action visual
    for keyword, visual in action_visuals.items():
        if keyword in desc_lower:
            return visual

    # Default to generic magic effect
    return "magical energy burst, arcane power, glowing effect"


def _extract_name_visuals(name: str) -> str:
    """
    Extract visual concepts from NSFW-themed card names.

    Parses evocative card names like "Sultry Embrace" or "Velvet Torment"
    and returns matching visual descriptions for effect-focused imagery.

    Args:
        name: Card name to parse

    Returns:
        Visual description string based on name keywords, or empty string if no match
    """
    name_lower = name.lower()
    nsfw_visuals = get_nsfw_name_visuals()
    matched_visuals = []

    # Check each word in the name against NSFW visual mappings
    words = name_lower.replace("'s", "").replace("-", " ").split()
    for word in words:
        if word in nsfw_visuals:
            matched_visuals.append(nsfw_visuals[word])

    # Also check for partial matches (e.g., "embracing" matches "embrace")
    for keyword, visual in nsfw_visuals.items():
        if keyword in name_lower and visual not in matched_visuals:
            matched_visuals.append(visual)

    # Return combined visuals (up to 2 to avoid prompt bloat)
    if matched_visuals:
        return ", ".join(matched_visuals[:2])

    return ""


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

    Hand cards generate EROTIC NARRATIVE SCENES (MTG-style storytelling):
    - Intimate moments, sensual actions, erotic phenomena
    - Partial body parts allowed (cropped suggestively)
    - NOT full character portraits (those are hero/enemy cards)

    Args:
        name: Card name (e.g., "Sultry Embrace", "Velvet Torment")
        description: Card effect description
        theme: Card type (attack/skill/power/curse/status)
        element: Elemental affinity
        rarity: Card rarity for detail level
        custom_hint: Optional custom style hints

    Returns:
        Erotic scene prompt (partial body parts OK, no full portraits)
    """
    templates = get_templates()
    elem_style = get_element_styles().get(element, get_element_styles().get("physical", {}))
    theme_style = get_theme_styles().get(theme, get_theme_styles().get("attack", {}))
    rarity_quality = get_rarity_quality().get(rarity, "detailed")

    # Get name-based visuals from NSFW-themed card names - THIS IS PRIMARY
    # These now describe erotic SCENES, not abstract energy
    name_visual = _extract_name_visuals(name)

    # Build erotic scene prompt
    parts = [
        # Quality prefix with NSFW tags
        templates.get("hand_quality_prefix", "masterpiece, best_quality, highres, nsfw, ecchi"),
        rarity_quality,
    ]

    # NAME-BASED VISUALS FIRST - Most important!
    # These describe the actual erotic scene/moment
    if name_visual:
        parts.append(f"((({name_visual})))")  # Triple emphasis for SD

    parts.extend(
        [
            # Subject - erotic scene, intimate moment
            templates.get(
                "hand_subject_base", "erotic scene, intimate moment, sensual action in progress"
            ),
            # Theme-specific erotic elements
            theme_style.get("subject", "sensual magical phenomenon"),
            theme_style.get("erotic_elements", "bare skin, intimate touch"),
            # Composition - narrative, cropped suggestively
            templates.get(
                "hand_composition",
                "narrative composition, intimate framing, cropped suggestively",
            ),
            theme_style.get("composition", "suggestive angle"),
            theme_style.get("mood", "sensual"),
            theme_style.get("camera", "intimate close-up"),
            # Erotic scene elements from templates
            templates.get(
                "hand_erotic_scenes",
                "bare skin, curves, flushed skin, silk sheets, intimate touch",
            ),
            # Element colors for mood lighting
            f"mood lighting: {elem_style['colors']}",
            elem_style.get("atmosphere", "intimate"),
            # Atmosphere - boudoir, sensual
            templates.get(
                "hand_atmosphere", "sensual lighting, intimate mood, boudoir atmosphere"
            ),
            # Style - anime ecchi
            templates.get("hand_style", "anime illustration, ecchi art style, sensual fantasy"),
            # Suffix
            templates.get("hand_suffix", "no_text, vignette edges, intimate background"),
        ]
    )

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
    element_styles = get_element_styles()
    elem_style = element_styles.get(element, element_styles.get("physical", {}))
    theme_styles = get_theme_styles()
    theme_style = theme_styles.get(theme, theme_styles.get("attack", {}))
    rarity_quality = get_rarity_quality()
    quality = rarity_quality.get(rarity, rarity_quality.get("common", ""))

    xml_prompt = f"""
<illustration>
<subject>beautiful anime woman, fantasy sorceress, {name}</subject>
<action>performing magic: {description}</action>
<element>{element}</element>
<colors>{elem_style["colors"]}</colors>
<effects>{elem_style["effects"]}</effects>
<atmosphere>{elem_style["atmosphere"]}</atmosphere>
</illustration>
<character>
<appearance>gorgeous face, detailed eyes, flowing hair, elegant pose</appearance>
<style>beautiful anime woman, attractive, alluring</style>
</character>
<composition>
<layout>centered, portrait orientation, fantasy scene</layout>
<pose>{theme_style["composition"]}</pose>
<mood>{theme_style["mood"]}</mood>
</composition>
<general_tags>
<style>anime_style, digital_illustration, fantasy_portrait</style>
<quality>{quality}, high_resolution, detailed</quality>
<constraints>no_text, no_words, no_letters, no_watermark</constraints>
{f"<custom>{custom_hint}</custom>" if custom_hint else ""}
</general_tags>
"""
    return xml_prompt.strip()


# ============================================
# HERO PROMPT GENERATION
# ============================================


def hero_to_prompt(
    name: str,
    description: str,
    archetype: str = "Warrior",
    element: Literal["physical", "fire", "ice", "lightning", "void"] = "physical",
    custom_hint: str | None = None,
) -> str:
    """
    Convert a hero definition into an image generation prompt.
    Uses booru-style tags for attractive anime character portraits.

    Args:
        name: Hero name (e.g., "Pyromancer")
        description: Hero lore/identity
        archetype: Hero class (Warrior, Mage, etc.)
        element: Elemental affinity
        custom_hint: Optional custom style hints

    Returns:
        Booru-style prompt string for attractive hero portrait
    """
    templates = get_templates()

    # Element-specific features from config
    element_features = get_element_features("hero")
    elem_features = element_features.get(element, "long_hair")

    # Archetype-specific data from config
    hero_archetypes = get_hero_archetypes()
    archetype_data = hero_archetypes.get(archetype, {})
    arch_tags = archetype_data.get("booru_tags", "warrior, fantasy")
    arch_pose = archetype_data.get("pose", "heroic stance")
    arch_wardrobe = archetype_data.get("wardrobe", "fantasy armor")
    arch_physical = archetype_data.get("physical", "large breasts, cleavage")

    parts = [
        # Quality tags first
        templates.get("hero_quality_prefix", "masterpiece, best_quality, highres"),
        # Character base - attractive anime woman
        templates.get("hero_character_base", "1girl, solo, beautiful detailed eyes, perfect face"),
        elem_features,
        "long_hair, flowing_hair",
        # Physical attributes - emphasis on attractive features
        templates.get("hero_body_base", "huge breasts, large breasts, cleavage, perfect body"),
        arch_physical,
        # Framing
        templates.get("hero_framing", "portrait, upper body, three-quarter view"),
        # Pose from archetype
        arch_pose,
        # Expression
        templates.get("hero_expression", "confident smirk, seductive gaze"),
        # Wardrobe from archetype - revealing
        arch_wardrobe,
        templates.get("hero_wardrobe", "revealing fantasy armor, deep cleavage"),
        # Archetype tags
        arch_tags,
        f"{name.lower().replace(' ', '_')}",
        # Lighting
        templates.get("hero_lighting", "soft key light, rim light, dramatic shadows"),
        # Atmosphere
        templates.get("hero_atmosphere", "dramatic lighting, heroic aura, subtle glow"),
        # Style
        templates.get("hero_style", "anime style, digital art, fantasy, ecchi"),
        # No text
        templates.get("hero_suffix", "no_text"),
    ]

    if custom_hint:
        parts.append(custom_hint)

    return ", ".join(parts)


# ============================================
# ENEMY PROMPT GENERATION
# ============================================


def enemy_to_prompt(
    name: str,
    description: str,
    archetype: str = "Brute",
    element: Literal["physical", "fire", "ice", "lightning", "void"] = "physical",
    difficulty: int = 2,
    custom_hint: str | None = None,
) -> str:
    """
    Convert an enemy definition into an image generation prompt.
    Uses booru-style tags for seductive monster girl portraits.

    Args:
        name: Enemy name (e.g., "Acid Slime")
        description: Enemy lore/behavior
        archetype: Enemy type (Slime, Brute, Mage, etc.)
        element: Elemental affinity
        difficulty: 1-3 tier for detail level
        custom_hint: Optional custom style hints

    Returns:
        Booru-style prompt string for seductive enemy portrait
    """
    templates = get_templates()

    # Element-specific features from config
    element_features = get_element_features("enemy")
    elem_features = element_features.get(element, "long_hair")

    # Archetype-specific data from config
    enemy_archetypes = get_enemy_archetypes()
    archetype_data = enemy_archetypes.get(archetype, {})
    arch_tags = archetype_data.get("booru_tags", "monster_girl, fantasy")
    arch_creature = archetype_data.get("creature", "beautiful monster girl")
    arch_mood = archetype_data.get("mood", "dangerous, alluring")
    arch_details = archetype_data.get("details", "")
    arch_erotic = archetype_data.get("erotic_features", "nude, exposed")

    # Difficulty affects quality tags
    difficulty_tags = get_difficulty_tags()
    quality_tags = difficulty_tags.get(difficulty, "detailed")

    parts = [
        # Quality tags first
        templates.get("enemy_quality_prefix", "masterpiece, best_quality, highres"),
        quality_tags,
        # Character - seductive monster girl
        templates.get("enemy_character_base", "1girl, solo, monster_girl, beautiful detailed eyes"),
        elem_features,
        "long_hair, flowing_hair",
        # Physical attributes - voluptuous and dangerous
        templates.get("enemy_body_base", "huge breasts, large breasts, cleavage, voluptuous"),
        # Archetype-specific erotic features (how monster traits enhance sexuality)
        arch_erotic,
        # Framing
        templates.get("enemy_framing", "portrait, upper body, dynamic pose"),
        # Expression - seductive threat
        templates.get("enemy_expression", "seductive smirk, bedroom eyes, predatory gaze"),
        # Creature description from archetype
        arch_creature,
        arch_mood,
        # Archetype-specific visual details
        arch_details,
        # Wardrobe - barely covered
        templates.get("enemy_wardrobe", "barely covered, revealing outfit, sideboob, underboob"),
        # Archetype tags
        arch_tags,
        f"{name.lower().replace(' ', '_')}",
        # Atmosphere
        templates.get("enemy_atmosphere", "dramatic lighting, dark atmosphere, menacing aura"),
        # Style
        templates.get("enemy_style", "anime style, digital art, monster musume, ecchi"),
        # No text
        templates.get("enemy_suffix", "no_text"),
    ]

    if custom_hint:
        parts.append(custom_hint)

    return ", ".join(parts)


# ============================================
# UNIFIED BATCH PROMPT GENERATION
# ============================================


# ============================================
# ROOM/DUNGEON PROMPT GENERATION
# ============================================


def room_to_prompt(
    name: str,
    description: str,
    room_type: str = "combat",
    element: Literal["physical", "fire", "ice", "lightning", "void"] = "physical",
    custom_hint: str | None = None,
) -> str:
    """
    Convert a room definition into an image generation prompt.

    Args:
        name: Room name (e.g., "Bone Yard")
        description: Room description
        room_type: Room type (combat/elite/boss/campfire/treasure/shop/event)
        element: Elemental theme for atmosphere
        custom_hint: Optional custom style hints

    Returns:
        Optimized prompt string for dungeon environment
    """
    element_styles = get_element_styles()
    elem_style = element_styles.get(element, element_styles.get("physical", {}))
    room_types = get_room_types()
    type_style = room_types.get(room_type, room_types.get("combat", {}))

    # Detail level from config
    detail_level = type_style.get("detail_level", "detailed environment, atmospheric")

    parts = [
        # Anti-text FIRST
        "no text, no words, no letters, no writing, no numbers, no symbols",
        # Subject - dungeon environment
        f"dark fantasy dungeon environment, {name}",
        f"scene description: {description}",
        # Room type styling
        type_style["scene"],
        f"mood: {type_style['mood']}",
        type_style["details"],
        # Element styling for atmosphere
        f"color palette: {elem_style['colors']}",
        f"atmospheric effects: {elem_style['effects']}",
        f"atmosphere: {elem_style['atmosphere']}",
        # Quality based on room type
        detail_level,
        # Base style tags - environment focused
        "anime style, digital painting, fantasy environment",
        "wide shot, dramatic lighting, atmospheric perspective",
        "no characters, empty room, environment only",
    ]

    if custom_hint:
        parts.append(custom_hint)

    return ", ".join(parts)


def batch_prompt_from_card_def(card_def: dict) -> str:
    """
    Generate prompt from a card definition dict (as stored in game).
    Automatically routes to the correct prompt generator based on theme.

    Args:
        card_def: Card definition with id, name, description, theme, element, rarity
                  For heroes: archetype, heroStats
                  For enemies: enemyStats with archetype hint

    Returns:
        Prompt string for image generation
    """
    theme = card_def.get("theme", "attack")

    # Route to hero prompt generator
    if theme == "hero":
        return hero_to_prompt(
            name=card_def.get("name", "Unknown Hero"),
            description=card_def.get("description", "A mysterious hero"),
            archetype=card_def.get("archetype", "Warrior"),
            element=card_def.get("element", "physical"),
        )

    # Route to enemy prompt generator
    if theme == "enemy":
        # Infer difficulty from rarity
        rarity_to_difficulty = {"common": 1, "uncommon": 2, "rare": 3}
        difficulty = rarity_to_difficulty.get(card_def.get("rarity", "common"), 2)

        # Try to extract archetype from generatedFrom parameters or use name-based inference
        archetype = "Brute"  # default
        generated_from = card_def.get("generatedFrom", {})
        if generated_from.get("parameters", {}).get("archetype"):
            archetype = generated_from["parameters"]["archetype"]

        return enemy_to_prompt(
            name=card_def.get("name", "Unknown Enemy"),
            description=card_def.get("description", "A dangerous creature"),
            archetype=archetype,
            element=card_def.get("element", "physical"),
            difficulty=difficulty,
        )

    # Default: regular card prompt
    return card_to_prompt(
        name=card_def.get("name", "Unknown Card"),
        description=card_def.get("description", "A mysterious card"),
        theme=card_def.get("theme", "attack"),
        element=card_def.get("element", "physical"),
        rarity=card_def.get("rarity", "common"),
    )
