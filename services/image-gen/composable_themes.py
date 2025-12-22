"""
Composable theme-specific generators for prompt variety.

Separated from composable_visuals.py to manage file complexity.
These generators replace static THEME_SUBJECT_POOLS and THEME_EROTIC_POOLS.
"""

import random

# ============================================
# ATTACK THEME POOLS
# ============================================
ATTACK_IMPLEMENTS = [
    "leather whip",
    "silk crop",
    "velvet flogger",
    "riding crop",
    "multi-tail flogger",
    "braided cord",
    "satin ribbon",
    "studded paddle",
    "feathered switch",
    "chain leash",
]

ATTACK_ACTIONS = [
    "striking",
    "descending",
    "swinging",
    "cracking",
    "slicing through air",
    "in motion",
    "raised high",
    "poised to strike",
    "mid-swing",
    "lashing out",
]

ATTACK_VISUALS = [
    "blurred motion",
    "impact ripples",
    "leather gleaming",
    "metal glinting",
    "fabric flowing",
    "shadows cast",
    "light catching edges",
    "dynamic arc",
    "tension visible",
    "power evident",
]

ATTACK_TEXTURES = [
    "dark leather",
    "slick latex",
    "studded leather",
    "chrome finish",
    "vinyl sheen",
    "polished metal",
    "black satin",
    "red velvet",
    "supple hide",
    "glossy PVC",
    "woven cord",
    "tooled leather",
    "steel rings",
    "dark lace",
    "mesh fabric",
    "buckled straps",
]

ATTACK_MARKS = [
    "red marks on skin",
    "flushed flesh",
    "rosy welts",
    "heated stripes",
    "passion marks",
    "love bites visible",
    "skin flushed pink",
    "traces of pleasure",
    "evidence of intensity",
    "warmth spreading",
]

ATTACK_ELEMENTS = [
    "chains glinting",
    "buckles catching light",
    "restraints visible",
    "collar prominent",
    "cuffs dangling",
    "rings gleaming",
    "hooks and eyes",
    "D-rings arranged",
    "straps crossing",
    "hardware accents",
]

# ============================================
# SKILL THEME POOLS
# ============================================
SKILL_SYMBOLS = [
    "arcane sigil",
    "mystic rune",
    "sacred glyph",
    "occult symbol",
    "ritual circle",
    "power seal",
    "binding mark",
    "arcane mark",
    "charm inscription",
    "hex pattern",
]

SKILL_PLACEMENTS = [
    "glowing on skin",
    "floating nearby",
    "traced in light",
    "hovering above",
    "inscribed on flesh",
    "materializing",
    "pulsing gently",
    "fading in/out",
    "rotating slowly",
    "orbiting form",
]

SKILL_EFFECTS = [
    "ethereal wisps",
    "arcane motes",
    "sparkle trails",
    "light particles",
    "energy threads",
    "luminous dust",
    "gleaming sparks",
    "soft radiance",
    "gentle aura",
    "subtle shimmer",
]

SKILL_BODY_ART = [
    "womb tattoo",
    "lumbar tattoo",
    "hip markings",
    "thigh patterns",
    "shoulder sigil",
    "sternum inscription",
    "spine design",
    "navel accent",
    "collarbone mark",
    "ankle band",
    "bicep rune",
    "rib inscription",
    "sacral glyph",
    "calf pattern",
    "forearm script",
]

SKILL_GLOWS = [
    "soft pink glow",
    "violet luminescence",
    "warm amber radiance",
    "cool blue shimmer",
    "rose gold gleam",
    "silver luminescence",
    "pearl iridescence",
    "champagne sparkle",
    "lavender haze",
    "coral warmth",
]

SKILL_FLOWS = [
    "energy flowing",
    "magic swirling",
    "power cascading",
    "essence drifting",
    "force rippling",
    "light streaming",
    "aura flickering",
    "spell weaving",
    "enchantment spreading",
    "charm emanating",
]

# ============================================
# POWER THEME POOLS
# ============================================
POWER_AURAS = [
    "intense aura",
    "blazing corona",
    "pulsing field",
    "radiating energy",
    "surrounding glow",
    "enveloping light",
    "crackling nimbus",
    "swirling vortex",
    "emanating waves",
    "projecting force",
]

POWER_MANIFESTATIONS = [
    "manifesting as flame",
    "coalescing into form",
    "crystallizing",
    "solidifying",
    "taking shape",
    "becoming visible",
    "materializing",
    "condensing",
    "gathering",
    "forming",
]

POWER_INTENSITIES = [
    "overwhelming",
    "intoxicating",
    "mesmerizing",
    "hypnotic",
    "entrancing",
    "captivating",
    "spellbinding",
    "all-consuming",
    "irresistible",
    "commanding",
]

POWER_POSES = [
    "confident stance",
    "commanding posture",
    "dominance shown",
    "confident poise",
    "powerful pose",
    "regal carriage",
    "imperious attitude",
    "authoritative presence",
    "masterful poise",
    "supreme confidence",
]

POWER_EXPRESSIONS = [
    "knowing smile",
    "confident smirk",
    "intense gaze",
    "piercing look",
    "commanding stare",
    "seductive glance",
    "enigmatic expression",
    "subtle satisfaction",
    "quiet dominance",
    "controlled passion",
]

POWER_FEATURES = [
    "body glistening",
    "skin luminous",
    "form radiant",
    "figure glowing",
    "silhouette backlit",
    "curves highlighted",
    "contours defined",
    "shape accentuated",
    "presence commanding",
    "beauty amplified",
]


def compose_theme_subject(theme: str) -> str:
    """Generate a unique theme subject from composable parts."""
    if theme == "attack":
        implement = random.choice(ATTACK_IMPLEMENTS)
        action = random.choice(ATTACK_ACTIONS)
        visual = random.choice(ATTACK_VISUALS)
        patterns = [
            f"{implement} {action}, {visual}",
            f"dominatrix with {implement}, {action}",
            f"{implement} mid-strike, {visual}",
            f"erotic {implement} {action}",
            f"{visual} as {implement} moves",
        ]
    elif theme == "skill":
        symbol = random.choice(SKILL_SYMBOLS)
        placement = random.choice(SKILL_PLACEMENTS)
        effect = random.choice(SKILL_EFFECTS)
        patterns = [
            f"{symbol} {placement}, {effect}",
            f"mystical {symbol} with {effect}",
            f"{effect} surrounding {symbol}",
            f"{symbol} appearing, {placement}",
            f"enchanted {symbol}, {effect} trailing",
        ]
    elif theme == "power":
        aura = random.choice(POWER_AURAS)
        manifest = random.choice(POWER_MANIFESTATIONS)
        intensity = random.choice(POWER_INTENSITIES)
        patterns = [
            f"{intensity} {aura} {manifest}",
            f"{aura} of {intensity} energy",
            f"power {manifest}, {intensity} presence",
            f"{intensity} force with {aura}",
            f"{aura} around her",
            f"{manifest} with {intensity} presence",
            f"visible {aura} {manifest}",
            f"{intensity} power {manifest}",
        ]
    else:
        # Default to attack
        return compose_theme_subject("attack")

    return random.choice(patterns)


def compose_theme_erotic(theme: str) -> str:
    """Generate unique erotic details for a theme."""
    if theme == "attack":
        texture = random.choice(ATTACK_TEXTURES)
        mark = random.choice(ATTACK_MARKS)
        element = random.choice(ATTACK_ELEMENTS)
        patterns = [
            f"{texture} textures, {element}",
            f"bare skin showing {mark}",
            f"{texture} against flesh, {mark}",
            f"{element}, {texture} prominent",
            f"{mark}, {texture} visible",
        ]
    elif theme == "skill":
        body_art = random.choice(SKILL_BODY_ART)
        glow = random.choice(SKILL_GLOWS)
        flow = random.choice(SKILL_FLOWS)
        patterns = [
            f"{body_art} with {glow}",
            f"{glow} {flow} over skin",
            f"glowing {body_art}, {flow}",
            f"{flow} through {body_art}",
            f"{body_art} pulsing, {glow} visible",
        ]
    elif theme == "power":
        pose = random.choice(POWER_POSES)
        expression = random.choice(POWER_EXPRESSIONS)
        feature = random.choice(POWER_FEATURES)
        patterns = [
            f"{pose} with {expression}",
            f"{feature}, {expression}",
            f"{pose}, {feature}",
            f"{expression}, {feature}",
            f"dominant {pose}, {feature}",
        ]
    else:
        # Default to attack
        return compose_theme_erotic("attack")

    return random.choice(patterns)


# ============================================
# CROP/FRAMING POOLS
# ============================================
CROP_VERBS = [
    "Cropped",
    "Framed",
    "Composed",
    "Captured",
    "Arranged",
    "Positioned",
    "Angled",
    "Shot",
    "Presented",
    "Rendered",
]

CROP_ADVERBS = [
    "suggestively",
    "provocatively",
    "intimately",
    "artfully",
    "strategically",
    "teasingly",
    "alluringly",
    "sensually",
    "dynamically",
    "dramatically",
]

CROP_FOCUS_PARTS = [
    "curves",
    "contours",
    "silhouette",
    "form",
    "skin",
    "exposure",
    "shape",
    "figure",
    "lines",
    "angles",
]

CROP_FOCUS_AREAS = [
    "body",
    "shoulder",
    "waist",
    "hip",
    "thigh",
    "back",
    "torso",
    "leg",
    "chest",
    "neck",
]

CROP_EFFECT_VERBS = [
    "maximizing",
    "emphasizing",
    "creating",
    "highlighting",
    "drawing",
    "revealing",
    "teasing",
    "accentuating",
    "capturing",
    "showcasing",
]

CROP_EFFECT_TARGETS = [
    "sensual impact",
    "natural curves",
    "intimate tension",
    "bare skin",
    "the form",
    "enticing details",
    "partial view",
    "body contours",
    "exposed areas",
    "erotic angles",
]


def compose_crop_description() -> str:
    """Generate a unique crop/framing description from composable parts."""
    verb = random.choice(CROP_VERBS)
    adverb = random.choice(CROP_ADVERBS)
    area = random.choice(CROP_FOCUS_AREAS)
    part = random.choice(CROP_FOCUS_PARTS)
    effect_verb = random.choice(CROP_EFFECT_VERBS)
    effect_target = random.choice(CROP_EFFECT_TARGETS)
    # Vary patterns to prevent "composition on" and "to show" trigrams
    patterns = [
        f"{verb} {adverb} showing {area} {part}.",
        f"{adverb.capitalize()} {verb.lower()} {effect_verb} {effect_target}.",
        f"{verb} for {area} {part}, {effect_verb} {effect_target}.",
        f"{adverb.capitalize()} focus on {area} {part}.",
        f"{verb} emphasizing {area} {part}.",
        f"{adverb.capitalize()} framing of {area} {part}.",
        f"{verb} highlighting {area} {part}.",
    ]
    return random.choice(patterns)


# ============================================
# MOOD PHRASE POOLS
# ============================================
MOOD_INTROS = [
    "Atmosphere:",
    "Evoking",
    "Radiating",
    "Suffused with",
    "Heavy with",
    "Dripping with",
    "Exuding",
    "Charged with",
    "Alive with",
    "Burning with",
]

MOOD_ADJECTIVES = [
    "raw",
    "primal",
    "fierce",
    "tender",
    "intense",
    "smoldering",
    "aching",
    "desperate",
    "languid",
    "electric",
]

MOOD_NOUNS = [
    "desire",
    "passion",
    "longing",
    "hunger",
    "tension",
    "anticipation",
    "abandon",
    "surrender",
    "dominance",
    "ecstasy",
]

MOOD_QUALITIES = [
    "radiating",
    "building",
    "consuming",
    "overwhelming",
    "simmering",
    "erupting",
    "spreading",
    "deepening",
    "intensifying",
    "cresting",
]


def compose_mood_phrase(mood_content: str = "") -> str:
    """Generate a unique mood phrase from composable parts."""
    intro = random.choice(MOOD_INTROS)
    adj = random.choice(MOOD_ADJECTIVES)
    noun = random.choice(MOOD_NOUNS)
    quality = random.choice(MOOD_QUALITIES)

    if mood_content:
        # Use provided mood content with varied intro
        return f"{intro} {mood_content}"

    patterns = [
        f"{intro} {adj} {noun}",
        f"{intro} {adj} {noun} {quality}",
        f"{adj.capitalize()} {noun} {quality}",
        f"{intro} {noun} and {adj} energy",
        f"{quality.capitalize()} {adj} {noun}",
    ]
    return random.choice(patterns)


# ============================================
# COMPOSITION PHRASE POOLS
# ============================================
COMPOSITION_TECHNIQUES = [
    "framing",
    "arrangement",
    "layout",
    "positioning",
    "staging",
    "placement",
    "composition",
    "orientation",
    "alignment",
    "spacing",
]

COMPOSITION_STYLES = [
    "dynamic",
    "balanced",
    "asymmetric",
    "centered",
    "diagonal",
    "radial",
    "layered",
    "floating",
    "grounded",
    "flowing",
]

COMPOSITION_FOCUSES = [
    "figure",
    "form",
    "silhouette",
    "curves",
    "subject",
    "body",
    "pose",
    "gesture",
    "expression",
    "presence",
]

COMPOSITION_METHODS = [
    "using",
    "via",
    "through",
    "with",
    "employing",
    "applying",
    "featuring",
    "incorporating",
    "utilizing",
    "showcasing",
]


def compose_composition_phrase() -> str:
    """Generate a unique composition/framing phrase from composable parts."""
    technique = random.choice(COMPOSITION_TECHNIQUES)
    style = random.choice(COMPOSITION_STYLES)
    focus = random.choice(COMPOSITION_FOCUSES)
    method = random.choice(COMPOSITION_METHODS)
    patterns = [
        f"{style} {technique} {method}",
        f"{technique} on {focus} {method}",
        f"{style} {focus} {technique}",
        f"{method} {style} {technique}",
        f"{focus}-focused {style} {technique}",
        f"{style} {technique} for {focus}",
    ]
    return random.choice(patterns)


# ============================================
# OPENING TEMPLATE POOLS
# ============================================
OPENING_ARTICLES = [
    "A",
    "An",
    "The",
    "This",
    "Here",
    "Behold",
    "Witness",
    "See",
    "Observe",
    "Watch",
]

OPENING_ADJECTIVES = [
    "intimate",
    "sensual",
    "erotic",
    "alluring",
    "seductive",
    "passionate",
    "tantalizing",
    "provocative",
    "sultry",
    "heated",
    "tender",
    "fierce",
]

OPENING_NOUNS = [
    "moment",
    "scene",
    "vision",
    "glimpse",
    "dance",
    "display",
    "revelation",
    "encounter",
    "awakening",
    "surrender",
]

OPENING_VERBS = [
    "unfolds",
    "reveals",
    "captures",
    "shows",
    "presents",
    "displays",
    "manifests",
    "emerges",
    "beckons",
    "invites",
]


def compose_opening_template() -> str:
    """Generate a unique opening template from composable parts."""
    article = random.choice(OPENING_ARTICLES)
    adj = random.choice(OPENING_ADJECTIVES)
    noun = random.choice(OPENING_NOUNS)
    verb = random.choice(OPENING_VERBS)

    patterns = [
        f"{article} {adj} {noun} {verb}: {{visual}}.",
        f"{adj.capitalize()} energy {verb} as {{visual}}.",
        f"{article} {noun} of {adj} power: {{visual}}.",
        f"{verb.capitalize()} {{visual}} in {adj} detail.",
        f"{article} {adj} view {verb} {{visual}}.",
        f"{noun.capitalize()} {verb}: {{visual}}.",
        f"{adj.capitalize()} {noun} frames {{visual}}.",
        f"{adj.capitalize()} light {verb} {{visual}}.",
        f"{noun.capitalize()} dances across {{visual}}.",
        f"{adj.capitalize()} shadows {verb} {{visual}}.",
        f"{adj.capitalize()} touch {verb} {{visual}}.",
        f"{adj.capitalize()} {noun} mingles with {{visual}}.",
    ]
    return random.choice(patterns)
