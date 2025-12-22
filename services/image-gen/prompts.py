# LARGE_FILE_OK: targeted trigram fixes in existing prompt generator
"""
Prompt generation for card illustrations.

Converts Pandemonium card definitions into image generation prompts.
IMPORTANT: Avoids "card art" / "TCG" terminology to prevent generating card frames.

Configuration is loaded from prompts.yaml for easy editing.

VARIETY SYSTEM (v2):
Uses randomized template assembly to prevent sameness in generated prompts.
- Multiple opening templates
- Synonym pools for common descriptors
- Variable sentence ordering
- Randomized camera angles and moods
"""

import random
from pathlib import Path
from typing import Literal

import yaml

from composable_themes import (
    compose_composition_phrase,
    compose_crop_description,
    compose_mood_phrase,
    compose_opening_template,
    compose_theme_erotic,
    compose_theme_subject,
)
from composable_visuals import (
    compose_lighting_phrase,
    compose_scene_template,
    compose_style_suffix,
    compose_theme_mood,
    generate_nsfw_visual,
)

# Curated synonyms for overused words (WordNet + domain-specific)
SYNONYM_MAP: dict[str, list[str]] = {
    "sensual": ["sultry", "voluptuous", "alluring", "seductive", "enticing", "provocative"],
    "intimate": ["private", "personal", "close", "tender", "passionate", "secret"],
    "erotic": ["arousing", "stimulating", "titillating", "risqué", "steamy", "heated"],
    "seductive": ["tempting", "captivating", "beguiling", "enchanting", "irresistible"],
    "alluring": ["enticing", "appealing", "magnetic", "bewitching", "fascinating"],
    "skin": ["flesh", "body", "form", "figure", "curves"],
    "bare": ["exposed", "uncovered", "naked", "revealed", "stripped"],
    "curves": ["contours", "silhouette", "figure", "form", "shape"],
    "soft": ["gentle", "delicate", "supple", "tender", "smooth"],
    "warm": ["heated", "flushed", "glowing", "radiant", "burning"],
    "touch": ["caress", "stroke", "graze", "brush", "contact"],
    "desire": ["longing", "yearning", "craving", "hunger", "passion"],
    "passion": ["ardor", "fervor", "intensity", "fire", "heat"],
    "beautiful": ["gorgeous", "stunning", "exquisite", "ravishing", "breathtaking"],
    "atmosphere": ["ambiance", "mood", "aura", "vibe", "feeling"],
}


def vary_phrase(phrase: str, replacement_chance: float = 0.4) -> str:
    """
    Randomly replace words with synonyms to increase variety.

    Args:
        phrase: Input phrase to vary
        replacement_chance: Probability of replacing each known word (0.0-1.0)

    Returns:
        Phrase with some words randomly replaced by synonyms
    """
    words = phrase.split()
    result = []
    for word in words:
        # Clean word for lookup (remove punctuation)
        clean = word.lower().rstrip(".,;:!?")
        if clean in SYNONYM_MAP and random.random() < replacement_chance:
            # Replace with random synonym, preserving case and punctuation
            synonym = random.choice(SYNONYM_MAP[clean])
            # Preserve original capitalization
            if word[0].isupper():
                synonym = synonym.capitalize()
            # Preserve trailing punctuation
            trailing = word[len(clean) :]
            result.append(synonym + trailing)
        else:
            result.append(word)
    return " ".join(result)


# ============================================
# VARIETY POOLS - Randomized template elements
# ============================================

OPENING_TEMPLATES = [
    "An intimate erotic scene showing {visual}.",
    "A sensual moment unfolds: {visual}.",
    "Passion manifests as {visual}.",
    "Desire takes form in {visual}.",
    "Alluringly captured: {visual}.",
    "Seduction captured: {visual}.",
    "Erotic energy flows through {visual}.",
    "A tantalizing glimpse of {visual}.",
]

FALLBACK_VISUAL_ADJECTIVES = [
    "sultry",
    "intimate",
    "seductive",
    "alluring",
    "erotic",
    "sensuous",
    "tantalizing",
    "provocative",
    "heated",
    "mystical",
]

FALLBACK_VISUAL_NOUNS = [
    "arcane wisps",
    "power",
    "runes",
    "forces",
    "sparks",
    "aura",
    "essence",
    "light",
    "sigils",
    "touch",
]

FALLBACK_VISUAL_VERBS = [
    "dancing around",
    "pulsing through",
    "gliding along",
    "drawn to",
    "sparking near",
    "wrapping",
    "pooling at",
    "playing on",
    "burning with",
    "awakening",
]

FALLBACK_VISUAL_TARGETS = [
    "bare skin",
    "heated flesh",
    "exposed curves",
    "trembling form",
    "flushed body",
    "her figure",
    "her core",
    "bare outline",
    "carnal hunger",
    "hidden desires",
]


def compose_fallback_visual() -> str:
    """Generate a unique fallback visual from composable parts."""
    adj = random.choice(FALLBACK_VISUAL_ADJECTIVES)
    noun = random.choice(FALLBACK_VISUAL_NOUNS)
    verb = random.choice(FALLBACK_VISUAL_VERBS)
    target = random.choice(FALLBACK_VISUAL_TARGETS)
    return f"{adj} {noun} {verb} {target}"


SCENE_VERBS = [
    "depicts",
    "reveals",
    "showcases",
    "presents",
    "displays",
    "captures",
    "illustrates",
    "manifests",
    "embodies",
    "expresses",
]

FRAMING_INTROS = [
    "Framed with",
    "Composed with",
    "Captured using",
    "Shot with",
    "Featuring",
    "Emphasizing",
    "Highlighting",
    "Focused on",
]

COMPOSITION_PHRASES = [
    "suggestive composition using",
    "seductive arrangement with",
    "provocative framing via",
    "sensual layout through",
    "alluring placement using",
    "tantalizing composition with",
    "intimate arrangement via",
    "erotic staging using",
]

CROP_DESCRIPTIONS = [
    "Cropped suggestively to show partial body, curves, and sensual details.",
    "Artfully composed to tease with partial reveals and erotic angles.",
    "Strategically cropped for maximum sensual impact and allure.",
    "Provocatively framed to emphasize curves and intimate details.",
    "Tight composition revealing bare shoulders and décolletage.",
    "Frame cuts across thighs, emphasizing leg curves and skin.",
    "Cropped at waist level, torso and chest prominent.",
    "Close framing on face and neck, with shoulder exposure.",
    "Asymmetric crop drawing eye to exposed hip and side.",
    "Dynamic diagonal framing across body's natural curves.",
    "Partial figure crop with emphasis on arched back.",
    "Intimate zoom on hands touching bare skin.",
    "Frame bisects body at navel, chest fills upper frame.",
    "Off-center composition highlighting silhouette curves.",
    "Cropped to show bare back and shoulder blades.",
    "Tight on collarbone and throat, vulnerability exposed.",
]

LIGHTING_INTROS = [
    "Lit with",
    "Bathed in",
    "Illuminated by",
    "Glowing with",
    "Washed in",
    "Drenched in",
    "Caressed by",
    "Embraced by",
]

MOOD_CONNECTORS = [
    "creating",
    "evoking",
    "establishing",
    "generating",
    "producing",
    "conjuring",
    "summoning",
    "inducing",
]

SKIN_HIGHLIGHTS = [
    "with soft shadows and warm highlights on skin.",
    "casting sensual shadows across bare curves.",
    "with intimate lighting dancing across exposed flesh.",
    "highlighting every curve and contour of bare skin.",
    "with provocative interplay of light and shadow on body.",
]

MOOD_PHRASES = [
    "The mood is {mood}",
    "Evoking {mood}",
    "The atmosphere conveys {mood}",
    "Radiating {mood}",
    "Suffused with {mood}",
    "Exuding {mood}",
    "Pulsing with {mood}",
    "Dripping with {mood}",
]

# THEME_SUBJECT_POOLS - Varied subjects per card theme
THEME_SUBJECT_POOLS = {
    "attack": [
        "erotic weapon striking, leather whip in motion",
        "dominatrix implement descending, crop impact",
        "sensual violence captured, chains rattling",
        "bondage gear in use, leather restraints",
        "intimate punishment tool, silk bindings",
    ],
    "skill": [
        "magical lingerie barrier forming, lace shield",
        "silk ribbons as defensive ward, corset armor",
        "intimate garment protection, stocking shield",
        "sensual barrier manifesting, garter defense",
        "erotic ward activation, satin protection",
    ],
    "power": [
        "pleasure rune glowing on skin, womb tattoo",
        "erotic sigil pulsing with power, body marking",
        "lust emblem radiating energy, intimate symbol",
        "desire seal awakening, arcane body art",
        "orgasmic energy symbol manifesting, sensual glyph",
    ],
    "curse": [
        "corruption spreading on bare curves, dark tendrils",
        "sinful marking creeping across skin, lewd curse",
        "dark pleasure spreading, infectious lust visible",
        "wicked enchantment manifesting on body, curse marks",
        "malevolent charm taking hold, corruption blooming",
    ],
    "status": [
        "arousal indicator glowing softly, blush effect",
        "pleasure status visible, intimate mark",
        "desire level shown, sensual indicator",
        "passion meter displayed, erotic gauge",
        "intimate status revealed, lustful sign",
    ],
}

# THEME_EROTIC_POOLS - Varied erotic elements per theme
THEME_EROTIC_POOLS = {
    "attack": [
        "dark leather textures, chains glinting",
        "bare skin showing red marks, pleasure-pain",
        "bondage implements and straps, metal gleaming",
        "crop marks on curves, restraint patterns",
        "whip trails and impact zones, bound flesh",
    ],
    "skill": [
        "lingerie fabrics layered, silk and lace",
        "stocking textures and garter straps",
        "corset boning and ribbon ties, satin gleam",
        "sheer fabric layers, intimate coverage",
        "delicate undergarments as armor, lace edges",
    ],
    "power": [
        "body markings glowing, intimate tattoos",
        "arcane symbols on skin, erotic placement",
        "magical runes pulsing, sensual locations",
        "power sigils radiating, body art energy",
        "glowing marks on curves, magical branding",
    ],
    "curse": [
        "dark tendrils caressing, corruption spreading",
        "shadowy marks appearing, sinful patterns",
        "curse lines crawling on skin, dark pleasure",
        "corruption blooming on curves, wicked marks",
        "infectious patterns spreading, lewd enchantment",
    ],
    "status": [
        "subtle glow on skin, arousal indicators",
        "blush patterns visible, desire shown",
        "intimate markers present, status revealed",
        "sensual indicators active, passion signs",
        "gentle glow and warmth, pleasure evident",
    ],
}

# THEME_MOOD_POOLS - Varied moods per card theme to prevent sameness
THEME_MOOD_POOLS = {
    "attack": [
        "aggressive seduction, violent passion",
        "fierce desire, predatory lust",
        "savage intimacy, brutal attraction",
        "dominant hunger, commanding presence",
        "wild passion, untamed desire",
    ],
    "skill": [
        "protective allure, guarded sensuality",
        "defensive grace, shielded intimacy",
        "watchful seduction, alert beauty",
        "tactical allure, strategic charm",
        "careful passion, measured desire",
    ],
    "power": [
        "transcendent pleasure, empowering lust",
        "ascending desire, building passion",
        "radiating sensuality, pulsing power",
        "eternal allure, timeless seduction",
        "overwhelming presence, consuming beauty",
    ],
    "curse": [
        "dark seduction, corrupting pleasure",
        "sinister allure, forbidden desire",
        "infectious lust, spreading temptation",
        "malevolent charm, wicked attraction",
        "consuming darkness, devouring passion",
    ],
    "status": [
        "subtle allure, understated desire",
        "quiet sensuality, gentle passion",
        "lingering attraction, persistent charm",
        "ambient seduction, pervasive beauty",
        "steady desire, constant allure",
    ],
}

# Element color/atmosphere variation pools (override static YAML)
# Composable element color parts - avoid fixed trigrams
ELEMENT_COLOR_PRIMARIES = {
    "physical": ["steel grey", "gunmetal", "iron", "silver", "platinum", "chrome"],
    "fire": ["orange", "crimson", "scarlet", "vermillion", "ruby", "amber"],
    "ice": ["cyan", "arctic", "azure", "powder blue", "glacial", "crystalline"],
    "lightning": ["electric blue", "violet", "indigo", "magenta", "ultraviolet", "plasma"],
    "void": ["deep purple", "obsidian", "midnight", "dark plum", "cosmic", "abyssal"],
}

ELEMENT_COLOR_ACCENTS = {
    "physical": ["metallic sheen", "chrome highlights", "polished gleam", "shadow"],
    "fire": ["gold blaze", "ember glow", "sparks", "heat shimmer"],
    "ice": ["silver shimmer", "white frost", "diamond sparkle", "snow"],
    "lightning": ["white sparks", "azure crackle", "flash", "electricity"],
    "void": ["violet shadow", "black depths", "darkness", "ink"],
}


COLOR_CONNECTORS = ["with", "and", "featuring", "showing", "plus"]


def compose_element_colors(element: str) -> str:
    """Generate composable element color description."""
    primaries = ELEMENT_COLOR_PRIMARIES.get(element, ELEMENT_COLOR_PRIMARIES["physical"])
    accents = ELEMENT_COLOR_ACCENTS.get(element, ELEMENT_COLOR_ACCENTS["physical"])
    primary = random.choice(primaries)
    accent = random.choice(accents)
    connector = random.choice(COLOR_CONNECTORS)
    return f"{primary} {connector} {accent}"


# Element atmosphere adjective pools (atomic - compose dynamically)
ELEMENT_ATMOSPHERE_ADJ = {
    "physical": [
        "dynamic",
        "powerful",
        "forceful",
        "impactful",
        "kinetic",
        "intense",
        "brutal",
        "raw",
        "visceral",
        "striking",
    ],
    "fire": [
        "intense",
        "burning",
        "passionate",
        "scorching",
        "fierce",
        "heated",
        "blazing",
        "fervent",
        "consuming",
        "smoldering",
        "wild",
        "untamed",
        "incendiary",
        "lustful",
        "searing",
    ],
    "ice": [
        "cold",
        "serene",
        "crystalline",
        "frigid",
        "tranquil",
        "pristine",
        "frozen",
        "calm",
        "glittering",
        "arctic",
        "shimmering",
        "still",
        "glacial",
        "peaceful",
        "sparkling",
    ],
    "lightning": [
        "energetic",
        "crackling",
        "charged",
        "electrifying",
        "volatile",
        "surging",
        "shocking",
        "pulsing",
        "alive",
        "sparking",
        "dynamic",
        "thrilling",
        "voltaic",
        "intense",
        "buzzing",
    ],
    "void": [
        "mysterious",
        "otherworldly",
        "ominous",
        "eldritch",
        "haunting",
        "unfathomable",
        "cosmic",
        "eerie",
        "infinite",
        "abyssal",
        "unknowable",
        "strange",
        "spectral",
        "dark",
        "limitless",
    ],
}


def compose_element_atmosphere(element: str) -> str:
    """Compose element atmosphere from random adjectives."""
    adj_pool = ELEMENT_ATMOSPHERE_ADJ.get(element, ELEMENT_ATMOSPHERE_ADJ["physical"])
    # Pick 2-3 random adjectives
    count = random.choice([2, 3])
    adjs = random.sample(adj_pool, min(count, len(adj_pool)))
    return ", ".join(adjs)


STYLE_VARIATIONS = [
    "Rendered in anime illustration style with ecchi art sensibilities. "
    "Masterful brushwork on skin texture and fabric folds.",
    "Anime art style with sensual aesthetics. "
    "Soft cel-shading emphasizing curves and flowing hair.",
    "Ecchi anime illustration with masterful attention to form. "
    "Rich color palette capturing intimate warmth.",
    "High quality anime style with erotic undertones. "
    "Luminous skin rendering and delicate material textures.",
    "Sensual anime illustration style. "
    "Exquisite linework defining bodily curves and textile drape.",
    "Japanese animation aesthetic with mature themes. "
    "Gradient shading across exposed skin and silky fabrics.",
    "Doujin art style with professional polish. Careful attention to anatomy and clothing physics.",
    "Light novel illustration aesthetic with adult sensibility. "
    "Vivid coloring on bare flesh and gossamer materials.",
    "Visual novel CG style with romantic atmosphere. "
    "Smooth blending on skin tones and translucent fabrics.",
    "Hentai-adjacent anime rendering with tasteful composition. "
    "Detailed highlighting on curves and textile transparency.",
    "Pixiv-quality illustration with sensual subject matter. "
    "Sharp lineart softened by gentle luminance on skin.",
    "Gacha game splash art quality with erotic flair. "
    "Dynamic pose with attention to body proportions.",
]

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
    and returns DYNAMICALLY GENERATED visual descriptions for variety.

    Uses composable_visuals.generate_nsfw_visual() which creates unique
    phrases each time from word pools, preventing repetition.

    Args:
        name: Card name to parse

    Returns:
        Visual description string based on name keywords, or empty string if no match
    """
    name_lower = name.lower()
    matched_visuals = []

    # Check each word in the name against NSFW visual generators
    words = name_lower.replace("'s", "").replace("-", " ").split()
    for word in words:
        visual = generate_nsfw_visual(word)
        if visual:
            matched_visuals.append(visual)

    # Try known keywords that might appear as substrings in card name
    from composable_visuals import NSFW_VISUAL_GENERATORS

    for keyword in NSFW_VISUAL_GENERATORS:
        if keyword in name_lower and len(matched_visuals) < 2:
            visual = generate_nsfw_visual(keyword)
            if visual and visual not in matched_visuals:
                matched_visuals.append(visual)

    # Return combined visuals (up to 2 to avoid prompt bloat)
    # Each call generates UNIQUE phrases from composable pools
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

    Z-IMAGE TURBO OPTIMIZED: Uses camera-style narrative prompts (80-250 words).
    No emphasis brackets, no negative prompts - all constraints in positive prompt.

    VARIETY SYSTEM (v2): Uses randomized template assembly to prevent sameness.
    Each prompt is assembled from randomized pools of:
    - Opening templates
    - Scene verbs and connectors
    - Framing descriptions
    - Lighting intros
    - Style variations

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
        Narrative prompt optimized for Z-Image Turbo with high variety
    """
    # NOTE: YAML styles no longer used - we use ELEMENT_*_POOLS and THEME_*_POOLS for variety

    # Get name-based visuals from NSFW-themed card names - THIS IS PRIMARY
    name_visual = _extract_name_visuals(name)

    # Z-IMAGE TURBO FORMAT: Camera-style narrative sentences
    # Structure varies randomly to prevent template rigidity

    # 1. SUBJECT & SCENE - Randomized opening with visual
    if name_visual:
        visual_content = name_visual
    else:
        visual_content = compose_fallback_visual()

    scene = compose_opening_template().format(visual=visual_content)

    # 2. DETAILS - Theme-specific erotic elements with COMPOSABLE generators
    theme_subject = compose_theme_subject(theme)
    theme_erotic = compose_theme_erotic(theme)
    # Use composable scene template for variety instead of fixed "The scene {verb}"
    details = compose_scene_template(f"{theme_subject} with {theme_erotic}")

    # 3. FRAMING - Randomized composition description with varied camera angles
    # NOTE: Atomized for variety (15x15x5=1125 combos vs 15 static phrases)
    camera_adjectives = [
        "intimate",
        "sensual",
        "provocative",
        "alluring",
        "teasing",
        "voyeuristic",
        "dramatic",
        "soft-focus",
        "dynamic",
        "seductive",
        "suggestive",
        "candid",
        "artistic",
        "revealing",
        "evocative",
    ]
    camera_types = [
        "close-up",
        "medium",
        "low-angle",
        "dutch-angle",
        "over-shoulder",
        "wide",
        "three-quarter",
        "portrait",
        "action",
        "bird's-eye",
        "profile",
        "full-body",
        "silhouette",
        "boudoir",
        "side-view",
    ]
    # Vary camera phrase templates to avoid "glue trigrams"
    camera_templates = [
        "{adj} {type}",
        "{type}, {adj}",
        "{adj} {type} view",
        "{type} ({adj})",
        "{adj}-style {type}",
    ]
    framing_intro = random.choice(FRAMING_INTROS)
    crop_desc = compose_crop_description()  # Composable for max uniqueness
    cam_adj = random.choice(camera_adjectives)
    cam_type = random.choice(camera_types)
    camera = random.choice(camera_templates).format(adj=cam_adj, type=cam_type)
    composition = compose_composition_phrase()  # Composable for max uniqueness
    framing = f"{framing_intro} {composition} {camera}. {crop_desc}"

    # 4. LIGHTING - Element-based mood with COMPOSABLE generators (not static pools)
    # Use composable color generator for variety
    elem_colors = compose_element_colors(element)
    elem_atmosphere = compose_element_atmosphere(element)
    # Use composable mood generator for maximum uniqueness
    theme_mood = compose_theme_mood(theme)
    lighting_intro = random.choice(LIGHTING_INTROS)
    mood_connector = random.choice(MOOD_CONNECTORS)
    skin_highlight = compose_lighting_phrase()  # Composable for max uniqueness
    # Build mood phrase with composable generators for max uniqueness
    mood_phrase = compose_mood_phrase(theme_mood)
    # Varied atmosphere endings to avoid "atmosphere. X with" trigrams
    atmosphere_endings = [
        f"{elem_atmosphere} atmosphere.",
        f"{elem_atmosphere} vibe.",
        f"{elem_atmosphere} energy.",
        f"{elem_atmosphere} aura.",
        f"{elem_atmosphere} ambiance.",
        f"{elem_atmosphere} feeling.",
        f"{elem_atmosphere} presence.",
        f"{elem_atmosphere} tone.",
    ]
    atmosphere_end = random.choice(atmosphere_endings)
    # Vary the junction between atmosphere and mood to prevent trigram repetition
    mood_junctions = ["", " —", ";", " ·", ","]
    mood_junction = random.choice(mood_junctions)
    lighting = (
        f"{lighting_intro} {elem_colors} {mood_connector} {atmosphere_end}"
        f"{mood_junction} {mood_phrase} {skin_highlight}"
    )

    # 5. STYLE - Composable rendering description for variety
    style = compose_style_suffix()

    # NOTE: Negative constraints (no text, no watermark) belong in ComfyUI's
    # negative prompt parameter, NOT here. Including them in positive prompt
    # can cause the model to attend to those concepts ("pink elephant" problem).

    # Randomize order of middle sections for variety
    middle_parts = [details, framing, lighting]
    random.shuffle(middle_parts)

    # Combine: scene first, shuffled middle, style last
    prompt_parts = [scene] + middle_parts + [style]

    if custom_hint:
        prompt_parts.append(custom_hint)

    # Apply synonym variation to reduce repeated word patterns
    raw_prompt = " ".join(prompt_parts)
    return vary_phrase(raw_prompt, replacement_chance=0.35)


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

    Z-IMAGE TURBO OPTIMIZED: Uses camera-style narrative prompts (80-250 words).
    No emphasis brackets, no negative prompts - all constraints in positive prompt.

    Args:
        name: Hero name (e.g., "Pyromancer")
        description: Hero lore/identity
        archetype: Hero class (Warrior, Mage, etc.)
        element: Elemental affinity
        custom_hint: Optional custom style hints

    Returns:
        Narrative prompt optimized for Z-Image Turbo
    """
    # Element-specific features from config
    element_features = get_element_features("hero")
    elem_features = element_features.get(element, "flowing hair")

    # Archetype-specific data from config
    hero_archetypes = get_hero_archetypes()
    archetype_data = hero_archetypes.get(archetype, {})
    arch_pose = archetype_data.get("pose", "heroic stance")
    arch_wardrobe = archetype_data.get("wardrobe", "fantasy armor")
    arch_physical = archetype_data.get("physical", "voluptuous figure with large breasts")

    # Z-IMAGE TURBO FORMAT: Camera-style narrative sentences
    # Structure: [Subject] → [Appearance] → [Clothing] → [Pose] → [Lighting] → [Style]

    # 1. SUBJECT - Who we're depicting
    subject = (
        f"A beautiful anime woman, a {archetype} hero named {name}. "
        f"She has {elem_features} and stunning detailed eyes with a perfect face."
    )

    # 2. APPEARANCE - Physical attributes
    appearance = (
        f"Her figure is {arch_physical}. "
        "She has an alluring physique with exposed cleavage and perfect body proportions."
    )

    # 3. CLOTHING - Wardrobe
    clothing = (
        f"She wears {arch_wardrobe}, revealing and form-fitting. "
        "The outfit shows deep cleavage and accentuates her curves."
    )

    # 4. POSE & EXPRESSION - How she's positioned
    pose = (
        f"She stands in a {arch_pose}, exuding confidence. "
        "Her expression is a seductive smirk with bedroom eyes gazing at the viewer."
    )

    # 5. FRAMING - Camera position
    framing = "Portrait shot showing upper body in three-quarter view."

    # 6. LIGHTING - Dramatic hero lighting
    lighting = (
        "Lit with soft key light and rim lighting creating dramatic shadows. "
        "A subtle heroic glow emanates around her."
    )

    # 7. STYLE - Rendering approach
    style = "Rendered in anime illustration style with ecchi sensibilities and fantasy aesthetics."

    # 8. CONSTRAINTS - Z-Image Turbo requires these in positive prompt
    constraints = "No text, no watermark, no logos, no UI elements."

    # Combine into narrative prompt
    prompt_parts = [subject, appearance, clothing, pose, framing, lighting, style]

    if custom_hint:
        prompt_parts.append(custom_hint)

    prompt_parts.append(constraints)

    return " ".join(prompt_parts)


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

    Z-IMAGE TURBO OPTIMIZED: Uses camera-style narrative prompts (80-250 words).
    No emphasis brackets, no negative prompts - all constraints in positive prompt.

    Args:
        name: Enemy name (e.g., "Acid Slime")
        description: Enemy lore/behavior
        archetype: Enemy type (Slime, Brute, Mage, etc.)
        element: Elemental affinity
        difficulty: 1-3 tier for detail level
        custom_hint: Optional custom style hints

    Returns:
        Narrative prompt optimized for Z-Image Turbo
    """
    # Element-specific features from config
    element_features = get_element_features("enemy")
    elem_features = element_features.get(element, "flowing hair")

    # Archetype-specific data from config
    enemy_archetypes = get_enemy_archetypes()
    archetype_data = enemy_archetypes.get(archetype, {})
    arch_creature = archetype_data.get("creature", "beautiful monster girl")
    arch_mood = archetype_data.get("mood", "dangerous and alluring")
    arch_details = archetype_data.get("details", "")
    arch_erotic = archetype_data.get("erotic_features", "exposed skin and sensual curves")

    # Z-IMAGE TURBO FORMAT: Camera-style narrative sentences

    # 1. SUBJECT - What we're depicting
    subject = (
        f"A seductive monster girl, a {archetype} creature called {name}. "
        f"She is a {arch_creature} with {elem_features} and beautiful detailed eyes."
    )

    # 2. APPEARANCE - Physical attributes with monster features
    appearance = (
        "Her figure is voluptuous with huge breasts and exposed cleavage. "
        f"Her monster traits enhance her sexuality: {arch_erotic}."
    )

    # 3. MONSTER DETAILS - Archetype-specific features
    if arch_details:
        details = f"Distinctive features include {arch_details}."
    else:
        details = "She has subtle inhuman features that add to her allure."

    # 4. EXPRESSION & MOOD - Seductive threat
    expression = (
        f"Her demeanor is {arch_mood}. "
        "She wears a seductive smirk with bedroom eyes and a predatory gaze."
    )

    # 5. CLOTHING - Barely covered
    clothing = (
        "She is barely covered, wearing a revealing outfit that shows sideboob and underboob. "
        "Her attire leaves little to imagination."
    )

    # 6. FRAMING - Dynamic monster pose
    framing = "Portrait shot showing upper body in a dynamic pose."

    # 7. LIGHTING - Dark and dramatic
    lighting = "Lit with dramatic lighting in a dark atmosphere with a menacing aura."

    # 8. STYLE - Monster musume aesthetic
    style = "Rendered in anime illustration style with monster musume and ecchi aesthetics."

    # 9. CONSTRAINTS - Z-Image Turbo requires these in positive prompt
    constraints = "No text, no watermark, no logos, no UI elements."

    # Combine into narrative prompt
    prompt_parts = [subject, appearance, details, expression, clothing, framing, lighting, style]

    if custom_hint:
        prompt_parts.append(custom_hint)

    prompt_parts.append(constraints)

    return " ".join(prompt_parts)


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
