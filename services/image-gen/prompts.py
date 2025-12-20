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

# Keywords to look for in card descriptions -> booru tags
ACTION_KEYWORD_MAP: dict[str, str] = {
    # Damage/Attack
    "damage": "attacking, energy_blast",
    "attack": "battle_stance, striking",
    "strike": "sword_swing, slashing",
    "slash": "blade, cutting",
    "pierce": "piercing, spear",
    "hit": "punch, impact",
    # Defense
    "block": "shield, defensive_stance",
    "armor": "armored, protection",
    "shield": "barrier, magic_shield",
    "protect": "protecting, guardian_pose",
    # Card manipulation
    "draw": "cards_floating, magical_cards",
    "discard": "cards_scattering, wind",
    "exhaust": "smoke, fading_cards",
    # Status effects
    "poison": "poison_aura, green_mist, toxic",
    "burn": "flames, burning, fire_aura",
    "freeze": "ice, frozen, frost_aura",
    "stun": "lightning, shocked, electricity",
    "weak": "debuff_aura, dark_mist",
    "vulnerable": "cracking, exposed",
    # Healing
    "heal": "healing_magic, green_glow, restoration",
    "restore": "light_particles, regeneration",
    "regenerate": "nature_magic, vines",
    # Energy
    "energy": "mana, glowing_orbs, power",
    "mana": "magical_energy, floating_crystals",
    # Multi-target
    "all enemies": "aoe_attack, multiple_targets, wave",
    "all": "explosion, radial_blast",
    # Powers/buffs
    "strength": "muscle, power_aura, flex",
    "dexterity": "agile, swift, motion_blur",
    "thorns": "spikes, thorny_vines",
    "rage": "fury, red_aura, screaming",
    # Special
    "chain": "chains, linked_attacks",
    "combo": "multiple_strikes, afterimages",
    "execute": "finishing_blow, deadly",
    "lifesteal": "soul_drain, vampiric",
}


def _extract_action_keywords(description: str) -> str:
    """Extract booru-style tags from card description."""
    desc_lower = description.lower()
    tags = []
    for keyword, booru_tags in ACTION_KEYWORD_MAP.items():
        if keyword in desc_lower:
            tags.append(booru_tags)
    return ", ".join(tags[:4]) if tags else "magic_effect"  # Limit to 4 most relevant


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
    rarity_tags = {
        "starter": "simple_background",
        "common": "detailed_background",
        "uncommon": "intricate_details, elaborate",
        "rare": "extremely_detailed, intricate, masterwork",
    }
    rarity_quality = rarity_tags.get(rarity, "detailed")

    # Build prompt with booru-style tags for anime image generation
    # Element-specific hair/eye colors
    element_features = {
        "physical": "silver_hair, grey_eyes",
        "fire": "red_hair, orange_eyes, flame_aura",
        "ice": "white_hair, blue_eyes, frost_aura",
        "lightning": "blonde_hair, purple_eyes, electricity",
        "void": "black_hair, purple_eyes, dark_aura",
    }
    elem_features = element_features.get(element, "long_hair")

    # Theme-specific pose/action tags
    theme_tags = {
        "attack": "battle_stance, attacking, aggressive, weapon",
        "skill": "defensive_pose, magic_shield, tactical",
        "power": "aura, glowing_eyes, power_up, floating",
        "curse": "dark_magic, corruption, sinister_smile",
        "status": "neutral_expression, calm, observing",
    }
    theme_action = theme_tags.get(theme, "casting_spell")

    # Extract action keywords from description for image influence
    desc_keywords = _extract_action_keywords(description)

    parts = [
        # Quality tags first (booru convention)
        "masterpiece, best_quality, highres",
        rarity_quality,
        # Character tags
        "1girl, solo, beautiful_detailed_eyes, detailed_face",
        elem_features,
        "long_hair, flowing_hair",
        # Body/pose
        "slim_waist, elegant, standing, dynamic_pose",
        # Theme-specific action
        theme_action,
        # Card effect visualization from description
        desc_keywords,
        # Outfit based on theme
        "fantasy_dress, sorceress_outfit, magical_girl",
        # Magic effect from card name
        f"casting_spell, {name.lower().replace(' ', '_')}",
        # Element effects
        elem_style["effects"].replace(", ", "_").replace(" ", "_"),
        # Atmosphere
        "dramatic_lighting, particle_effects, glowing",
        # Style tags
        "anime_style, digital_art, fantasy",
        # Negative concept embedding
        "no_text",
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
    Uses booru-style tags for better anime image generation.

    Args:
        name: Hero name (e.g., "Pyromancer")
        description: Hero lore/identity
        archetype: Hero class (Warrior, Mage, etc.)
        element: Elemental affinity
        custom_hint: Optional custom style hints

    Returns:
        Booru-style prompt string for hero portrait
    """
    # Element-specific features (booru tags)
    element_features = {
        "physical": "silver_hair, grey_eyes, metallic_armor",
        "fire": "red_hair, orange_eyes, flame_aura, fire_magic",
        "ice": "white_hair, blue_eyes, frost_aura, ice_magic",
        "lightning": "blonde_hair, purple_eyes, electricity, thunder",
        "void": "black_hair, purple_eyes, dark_aura, void_magic",
    }
    elem_features = element_features.get(element, "long_hair")

    # Archetype-specific booru tags
    archetype_tags = {
        "Warrior": "knight, armor, sword, battle_stance, warrior",
        "Mage": "witch_hat, staff, robes, magic_circle, sorceress",
        "Assassin": "hood, daggers, cloak, stealthy, ninja",
        "Paladin": "holy_knight, shield, divine_light, armor, halo",
        "Necromancer": "dark_mage, skull_staff, undead, dark_magic",
        "Berserker": "tribal, dual_wielding, rage, wild, muscles",
        "Elementalist": "elemental_magic, floating, multiple_elements, aura",
    }
    arch_tags = archetype_tags.get(archetype, "warrior, fantasy")

    # Extract keywords from description
    desc_keywords = _extract_action_keywords(description)

    parts = [
        # Quality tags first
        "masterpiece, best_quality, highres, extremely_detailed",
        # Character - anime heroine
        "1girl, solo, beautiful_detailed_eyes, detailed_face",
        elem_features,
        "long_hair, flowing_hair",
        # Body/pose - heroic
        "slim_waist, elegant, heroic_pose, confident",
        "determined_expression, brave",
        # Archetype features
        arch_tags,
        f"{name.lower().replace(' ', '_')}",
        # Description influence
        desc_keywords,
        # Atmosphere
        "dramatic_lighting, epic, heroic_aura",
        # Style
        "anime_style, digital_art, fantasy, jrpg",
        # No text
        "no_text",
    ]

    if custom_hint:
        parts.append(custom_hint)

    return ", ".join(parts)


# ============================================
# ENEMY PROMPT GENERATION
# ============================================

ENEMY_ARCHETYPE_STYLES: dict[str, dict[str, str]] = {
    # ALL enemies are beautiful anime women - even monsters are monster girls
    "Slime": {
        "creature": "beautiful anime slime girl, translucent gelatinous woman, cute monster girl",
        "mood": "playful, mischievous, alluring",
        "details": "translucent body, slime dripping, colorful core, cute face through slime",
    },
    "Cultist": {
        "creature": "beautiful anime woman in dark robes, elegant occult priestess",
        "mood": "fanatical, mysterious, alluring",
        "details": "flowing ritual robes, arcane tattoos, glowing eyes, elegant features",
    },
    "Brute": {
        "creature": "muscular anime woman warrior, amazonian fighter, armored battle maiden",
        "mood": "intimidating, powerful, fierce",
        "details": "battle armor, impressive physique, large weapon, wild hair, fierce eyes",
    },
    "Mage": {
        "creature": "beautiful anime sorceress, dark witch, elegant spellcaster",
        "mood": "sinister, powerful, calculating",
        "details": "dark magic aura, ornate staff, glowing eyes, flowing robes, mystical symbols",
    },
    "Assassin": {
        "creature": "beautiful anime kunoichi, deadly shadow maiden, elegant assassin",
        "mood": "lethal, seductive, mysterious",
        "details": "tight dark outfit, hidden blades, mask, piercing eyes, athletic body",
    },
    "Guardian": {
        "creature": "beautiful anime knight woman, armored maiden, elegant sentinel",
        "mood": "stoic, protective, unyielding",
        "details": "ornate armor, large shield, glowing runes, long hair flowing from helm",
    },
    "Berserker": {
        "creature": "fierce anime warrior woman, battle-crazed valkyrie, wild amazon",
        "mood": "savage, passionate, terrifying beauty",
        "details": "tribal markings, wild red hair, dual axes, battle scars, fierce expression",
    },
    "Summoner": {
        "creature": "beautiful anime summoner woman, elegant conjurer, dark mistress",
        "mood": "commanding, mysterious, powerful",
        "details": "summoning circle, spirit familiars, ornate tome, flowing dark dress",
    },
    # Undead/Monster girls
    "Skeleton": {
        "creature": "beautiful undead anime girl, elegant lich maiden, ghostly warrior woman",
        "mood": "haunting beauty, melancholic, deadly grace",
        "details": "pale glowing skin, ethereal dress, spectral weapon, hollow glowing eyes",
    },
    "Wraith": {
        "creature": "beautiful ghost anime girl, spectral maiden, ethereal spirit woman",
        "mood": "haunting, sorrowful, eerily beautiful",
        "details": "translucent flowing dress, trailing wisps, beautiful sad face, ghostly glow",
    },
    "Golem": {
        "creature": "beautiful anime golem girl, crystal maiden, elemental woman construct",
        "mood": "powerful, ancient, majestic",
        "details": "crystalline or stone body parts, glowing core, elegant feminine form, runes",
    },
    "Necromancer": {
        "creature": "beautiful anime woman in dark robes, elegant death mage, dark sorceress",
        "mood": "commanding, seductive, deadly",
        "details": "skull staff, black robes, pale skin, glowing purple eyes, dark aura",
    },
    "BossNecromancer": {
        "creature": "stunning anime woman, dark empress of death, necromancer queen",
        "mood": "regal, terrifying, overwhelming beauty",
        "details": "ornate dark crown, shadow robes, spirit army, bone throne, purple flames",
    },
    "ChaosHeart": {
        "creature": "eldritch anime goddess, void queen, beautiful chaos incarnate",
        "mood": "alien beauty, corrupting allure, apocalyptic",
        "details": "tentacle hair, void eyes, crystalline corruption, multiple arms, dark elegance",
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
    Uses booru-style tags for better anime image generation.

    Args:
        name: Enemy name (e.g., "Acid Slime")
        description: Enemy lore/behavior
        archetype: Enemy type (Slime, Brute, Mage, etc.)
        element: Elemental affinity
        difficulty: 1-3 tier for detail level
        custom_hint: Optional custom style hints

    Returns:
        Booru-style prompt string for enemy portrait
    """
    # Element-specific features (booru tags)
    element_features = {
        "physical": "silver_hair, grey_eyes, metallic_accessories",
        "fire": "red_hair, orange_eyes, flame_effects, burning",
        "ice": "white_hair, blue_eyes, ice_crystals, frost",
        "lightning": "blonde_hair, purple_eyes, electricity, sparks",
        "void": "black_hair, purple_eyes, dark_aura, void_energy",
    }
    elem_features = element_features.get(element, "long_hair")

    # Archetype-specific booru tags
    archetype_tags = {
        "Slime": "slime_girl, translucent_body, goo, monster_girl",
        "Cultist": "dark_robes, hood, occult, ritual_tattoos",
        "Brute": "muscular_female, amazon, battle_armor, warrior",
        "Mage": "witch, dark_magic, staff, floating_orbs",
        "Assassin": "kunoichi, ninja, tight_outfit, mask, daggers",
        "Guardian": "knight, armor, shield, helmet_removed",
        "Berserker": "tribal_markings, wild_hair, dual_wielding, battle_scars",
        "Summoner": "summoning_circle, familiars, tome, floating",
        "Skeleton": "undead, pale_skin, ghostly, ethereal_dress",
        "Wraith": "ghost, translucent, flowing_dress, spectral",
        "Golem": "crystal_body, elemental, glowing_core, runes",
        "Necromancer": "dark_mage, skull_staff, pale_skin, death_magic",
        "BossNecromancer": "dark_empress, crown, throne, spirit_army",
        "ChaosHeart": "eldritch, tentacles, void, multiple_arms, goddess",
    }
    arch_tags = archetype_tags.get(archetype, "monster_girl, fantasy")

    # Difficulty affects quality tags
    difficulty_tags = {
        1: "simple_background",
        2: "detailed_background, intricate",
        3: "extremely_detailed, intricate, masterwork, boss_monster",
    }
    quality_tags = difficulty_tags.get(difficulty, "detailed")

    parts = [
        # Quality tags first
        "masterpiece, best_quality, highres",
        quality_tags,
        # Character - anime monster girl
        "1girl, solo, monster_girl, beautiful_detailed_eyes, detailed_face",
        elem_features,
        "long_hair, flowing_hair",
        # Body/pose - dangerous beauty
        "slim_waist, elegant, dynamic_pose, dangerous",
        "seductive, alluring, confident",
        # Archetype features
        arch_tags,
        f"{name.lower().replace(' ', '_')}",
        # Outfit/details
        "fantasy, dark_fantasy, villain",
        # Atmosphere
        "dramatic_lighting, dark_atmosphere, menacing_aura",
        # Style
        "anime_style, digital_art, monster_musume",
        # No text
        "no_text",
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
