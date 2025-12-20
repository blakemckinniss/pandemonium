"""
Prompt generation for card illustrations.

Converts Pandemonium card definitions into image generation prompts.
IMPORTANT: Avoids "card art" / "TCG" terminology to prevent generating card frames.
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

    # Build prompt parts (NO game description - causes text rendering)
    parts = [
        # Anti-text FIRST for stronger weight
        "no text, no words, no letters, no writing, no numbers, no symbols",
        # Subject - just the name as visual concept
        f"fantasy illustration, {name} spell",
        # Element styling
        f"color palette: {elem_style['colors']}",
        f"visual effects: {elem_style['effects']}",
        # Theme styling
        theme_style["composition"],
        f"mood: {elem_style['atmosphere']}",
        # Quality based on rarity
        quality,
        # Base style tags
        "anime style, digital painting, fantasy portrait",
        "centered composition, dramatic lighting, vibrant colors",
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
<illustration>
<subject>{name}</subject>
<concept>{description}</concept>
<element>{element}</element>
<colors>{elem_style["colors"]}</colors>
<effects>{elem_style["effects"]}</effects>
<atmosphere>{elem_style["atmosphere"]}</atmosphere>
</illustration>
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

HERO_ARCHETYPE_STYLES: dict[str, dict[str, str]] = {
    "Warrior": {
        "pose": "heroic stance, weapon ready, armored",
        "mood": "brave, determined, stalwart",
        "details": "battle scars, heavy armor, sword or axe",
    },
    "Mage": {
        "pose": "casting spell, magical aura, robes flowing",
        "mood": "wise, powerful, mystical",
        "details": "staff or tome, glowing runes, arcane symbols",
    },
    "Assassin": {
        "pose": "stealthy crouch, daggers drawn, hooded",
        "mood": "deadly, cunning, shadowy",
        "details": "dark cloak, hidden blades, piercing gaze",
    },
    "Paladin": {
        "pose": "protective stance, shield raised, glowing",
        "mood": "righteous, protective, holy",
        "details": "ornate armor, divine light, blessed weapon",
    },
    "Necromancer": {
        "pose": "commanding undead, dark magic swirling",
        "mood": "sinister, commanding, eerie",
        "details": "skull staff, dark robes, ghostly spirits",
    },
    "Berserker": {
        "pose": "rage stance, muscles tense, battle cry",
        "mood": "furious, unstoppable, primal",
        "details": "tribal markings, dual weapons, wild hair",
    },
    "Elementalist": {
        "pose": "controlling elements, surrounded by magic",
        "mood": "balanced, attuned, versatile",
        "details": "multiple element effects, flowing energy",
    },
}


def hero_to_prompt(
    name: str,
    description: str,
    archetype: str = "Warrior",
    element: Literal["physical", "fire", "ice", "lightning", "void"] = "physical",
    custom_hint: str | None = None,
) -> str:
    """
    Convert a hero definition into an image generation prompt.

    Args:
        name: Hero name (e.g., "Pyromancer")
        description: Hero lore/identity
        archetype: Hero class (Warrior, Mage, etc.)
        element: Elemental affinity
        custom_hint: Optional custom style hints

    Returns:
        Optimized prompt string for hero portrait
    """
    elem_style = ELEMENT_STYLES.get(element, ELEMENT_STYLES["physical"])
    arch_style = HERO_ARCHETYPE_STYLES.get(archetype, HERO_ARCHETYPE_STYLES["Warrior"])

    parts = [
        # Anti-text FIRST
        "no text, no words, no letters, no writing, no numbers, no symbols",
        # Subject - heroic character portrait
        f"fantasy hero portrait, {name}",
        f"character class: {archetype}",
        # Archetype styling
        arch_style["pose"],
        f"mood: {arch_style['mood']}",
        arch_style["details"],
        # Element styling
        f"color palette: {elem_style['colors']}",
        f"elemental effects: {elem_style['effects']}",
        # Quality and style
        "extremely detailed, masterpiece quality, stunning illustration",
        "anime style, digital painting, fantasy character portrait",
        "dramatic lighting, epic composition, heroic atmosphere",
    ]

    if custom_hint:
        parts.append(custom_hint)

    return ", ".join(parts)


# ============================================
# ENEMY PROMPT GENERATION
# ============================================

ENEMY_ARCHETYPE_STYLES: dict[str, dict[str, str]] = {
    "Slime": {
        "creature": "gelatinous creature, amorphous blob, ooze monster",
        "mood": "disgusting, persistent, absorbing",
        "details": "translucent body, dripping slime, multiple eyes",
    },
    "Cultist": {
        "creature": "robed humanoid, dark ritualist, occult follower",
        "mood": "fanatical, mysterious, devoted",
        "details": "ritual robes, dark symbols, sacrificial dagger",
    },
    "Brute": {
        "creature": "large muscular beast, hulking warrior, heavy armor",
        "mood": "intimidating, powerful, relentless",
        "details": "massive weapon, scars, imposing size",
    },
    "Mage": {
        "creature": "dark spellcaster, corrupted wizard, elemental being",
        "mood": "sinister, powerful, calculating",
        "details": "dark magic aura, corrupted staff, glowing eyes",
    },
    "Assassin": {
        "creature": "shadow stalker, deadly hunter, void-touched",
        "mood": "lethal, patient, unsettling",
        "details": "shadow cloak, poison blades, hollow eyes",
    },
    "Guardian": {
        "creature": "ancient construct, armored sentinel, stone golem",
        "mood": "implacable, defensive, unyielding",
        "details": "heavy shield, ancient runes, glowing core",
    },
    "Berserker": {
        "creature": "rage demon, frenzied beast, blood warrior",
        "mood": "savage, uncontrollable, terrifying",
        "details": "blood-stained, rage flames, feral expression",
    },
    "Summoner": {
        "creature": "dark conjurer, necromancer lord, portal master",
        "mood": "commanding, ominous, powerful",
        "details": "summoning circle, minion spirits, bone staff",
    },
}


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

    Args:
        name: Enemy name (e.g., "Acid Slime")
        description: Enemy lore/behavior
        archetype: Enemy type (Slime, Brute, Mage, etc.)
        element: Elemental affinity
        difficulty: 1-3 tier for detail level
        custom_hint: Optional custom style hints

    Returns:
        Optimized prompt string for enemy portrait
    """
    elem_style = ELEMENT_STYLES.get(element, ELEMENT_STYLES["physical"])
    arch_style = ENEMY_ARCHETYPE_STYLES.get(archetype, ENEMY_ARCHETYPE_STYLES["Brute"])

    # Difficulty affects detail and menace level
    difficulty_styles = {
        1: "simple design, lesser threat, common creature",
        2: "detailed design, dangerous threat, formidable creature",
        3: "extremely detailed, elite threat, boss-level creature, masterpiece quality",
    }
    detail_level = difficulty_styles.get(difficulty, difficulty_styles[2])

    parts = [
        # Anti-text FIRST
        "no text, no words, no letters, no writing, no numbers, no symbols",
        # Subject - menacing monster portrait
        f"dark fantasy monster portrait, {name}",
        # Archetype styling
        arch_style["creature"],
        f"mood: {arch_style['mood']}",
        arch_style["details"],
        # Element styling
        f"color palette: {elem_style['colors']}",
        f"elemental effects: {elem_style['effects']}",
        f"atmosphere: {elem_style['atmosphere']}, menacing",
        # Difficulty-based quality
        detail_level,
        # Base style tags
        "anime style, digital painting, creature portrait",
        "dramatic lighting, dark atmosphere, threatening pose",
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

ROOM_TYPE_STYLES: dict[str, dict[str, str]] = {
    "combat": {
        "scene": "dungeon chamber, monster lair, dangerous room",
        "mood": "threatening, ominous, perilous",
        "details": "scattered bones, claw marks, blood stains, dim torchlight",
    },
    "elite": {
        "scene": "grand chamber, elite guardian room, imposing hall",
        "mood": "intimidating, powerful, foreboding",
        "details": "ornate pillars, glowing runes, ancient artifacts, dramatic shadows",
    },
    "boss": {
        "scene": "throne room, final chamber, epic arena",
        "mood": "epic, terrifying, climactic",
        "details": "massive scale, ominous throne, swirling dark energy, apocalyptic atmosphere",
    },
    "campfire": {
        "scene": "safe haven, rest area, warm shelter",
        "mood": "peaceful, warm, respite",
        "details": "crackling fire, warm glow, comfortable bedrolls, cooking pot",
    },
    "treasure": {
        "scene": "treasure vault, golden hoard, ancient cache",
        "mood": "exciting, rewarding, mysterious",
        "details": "piles of gold, glowing gems, ancient chests, magical items",
    },
    "shop": {
        "scene": "merchant stall, underground bazaar, trading post",
        "mood": "mysterious, mercantile, eclectic",
        "details": "hanging wares, exotic goods, hooded merchant, magical trinkets",
    },
    "event": {
        "scene": "mysterious location, strange encounter, unknown chamber",
        "mood": "enigmatic, curious, unpredictable",
        "details": "strange symbols, flickering lights, otherworldly presence",
    },
}


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
    elem_style = ELEMENT_STYLES.get(element, ELEMENT_STYLES["physical"])
    type_style = ROOM_TYPE_STYLES.get(room_type, ROOM_TYPE_STYLES["combat"])

    # Difficulty affects detail level
    detail_levels = {
        "combat": "detailed environment, atmospheric",
        "elite": "highly detailed, imposing scale, masterful lighting",
        "boss": "extremely detailed, epic scale, masterpiece quality, cinematic",
        "campfire": "cozy details, warm lighting, inviting",
        "treasure": "gleaming details, rich textures, rewarding atmosphere",
        "shop": "eclectic details, varied items, mysterious merchant",
        "event": "mysterious details, otherworldly elements, enigmatic",
    }
    detail_level = detail_levels.get(room_type, detail_levels["combat"])

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
