"""
Composable NSFW Visual Generators

Replaces static YAML phrases with dynamic composition for maximum variety.
Each keyword maps to a generator function that produces unique phrases.
"""

import random

# ============================================
# BASE POOLS (shared across generators)
# ============================================

BODY_PARTS = [
    "fingertips",
    "hands",
    "palms",
    "lips",
    "tongue",
    "neck",
    "shoulders",
    "spine",
    "hips",
    "thighs",
    "curves",
    "collarbone",
    "wrists",
    "ankles",
]

BODY_ACTIONS = [
    "trailing",
    "gliding",
    "caressing",
    "brushing",
    "dancing",
    "tracing",
    "sliding",
    "pressing",
    "gripping",
    "exploring",
    "teasing",
    "grazing",
    "skimming",
    "wandering",
]

BODY_DIRECTIONS = [
    "down",
    "across",
    "along",
    "over",
    "around",
    "beneath",
    "against",
    "up",
]

BODY_ADJECTIVES = [
    "bare",
    "exposed",
    "naked",
    "smooth",
    "warm",
    "flushed",
    "glistening",
    "soft",
    "tender",
    "supple",
    "silken",
    "heated",
    "trembling",
    "receptive",
    "sensitive",
]

BODY_AREAS = [
    "spine",
    "back",
    "shoulder",
    "thigh",
    "waist",
    "neck",
    "hip",
    "collarbone",
    "stomach",
    "chest",
    "arm",
    "leg",
    "side",
]

# ============================================
# CATEGORY-SPECIFIC POOLS
# ============================================

# Touch/Embrace
EMBRACE_VERBS = [
    "wrapping gently around",
    "encircling",
    "enveloping",
    "holding",
    "cradling",
    "clasping",
]
EMBRACE_TARGETS = [
    "bare waist",
    "naked hips",
    "exposed back",
    "warm body",
    "soft curves",
    "yielding form",
]
EMBRACE_DETAILS = [
    "from behind",
    "possessively",
    "tenderly",
    "desperately",
    "intimately",
    "protectively",
]

# Atomized touch gestures for variety (5x7=35 combos vs 5 static)
TOUCH_GESTURE_PARTS = ["finger", "palm", "hand", "thumb", "knuckles"]
TOUCH_GESTURE_VERBS = [
    "tracing",
    "resting against",
    "sliding along",
    "brushing",
    "grazing",
    "pressing",
    "lingering on",
]
TOUCH_AREAS = [
    "collarbone",
    "inner thigh",
    "jawline",
    "hipbone",
    "shoulder",
    "lower back",
    "ribcage",
    "nape",
    "wrist",
    "sternum",
    "ankle",
    "earlobe",
]

# Pleasure
PLEASURE_EXPRESSIONS = [
    "parted lips",
    "closed eyes",
    "tilted head",
    "arched neck",
    "bitten lip",
    "flushed cheeks",
]
PLEASURE_ACTIONS = [
    "exhaling softly",
    "gasping",
    "trembling",
    "shuddering",
    "writhing",
    "quivering",
]
PLEASURE_PROPS = [
    "gripping sheets",
    "clutching pillow",
    "hand in hair",
    "fingers spread",
    "toes curling",
]

ECSTASY_POSES = [
    "arched back",
    "thrown head",
    "tensed body",
    "curled toes",
    "splayed fingers",
    "stretched limbs",
]
ECSTASY_STATES = [
    "in bliss",
    "overcome",
    "surrendered",
    "lost in sensation",
    "at peak",
    "transcendent",
]

# Seduction
SEDUCE_LOOKS = [
    "bedroom eyes",
    "heavy-lidded gaze",
    "knowing smile",
    "inviting look",
    "smoldering stare",
]
SEDUCE_GESTURES = [
    "finger on lips",
    "hair toss",
    "shoulder reveal",
    "beckoning finger",
    "slow blink",
]
SEDUCE_ACTIONS = [
    "drawing closer",
    "leaning in",
    "undoing button",
    "sliding strap",
    "lowering lashes",
]

TEASE_ACTIONS = [
    "almost touching",
    "pulling away",
    "dangling just out of reach",
    "hovering close",
    "withdrawing",
]
TEASE_TARGETS = [
    "lips",
    "exposed skin",
    "waiting body",
    "eager hands",
    "anticipating form",
]

# Dark/Forbidden
FORBIDDEN_SETTINGS = [
    "hidden alcove",
    "secret room",
    "shadowed corner",
    "locked chamber",
    "private sanctuary",
]
FORBIDDEN_MOODS = [
    "illicit",
    "clandestine",
    "taboo",
    "dangerous",
    "secret",
    "transgressive",
]
FORBIDDEN_ACTS = [
    "stolen moment",
    "forbidden touch",
    "secret liaison",
    "hidden passion",
    "covert embrace",
]

# BDSM
BONDAGE_MATERIALS = [
    "silk",
    "rope",
    "leather",
    "chains",
    "velvet",
    "lace",
    "ribbon",
    "cord",
]
BONDAGE_LOCATIONS = [
    "wrists",
    "ankles",
    "above head",
    "behind back",
    "to bedpost",
    "spread wide",
]
BONDAGE_STATES = [
    "restrained",
    "bound",
    "secured",
    "immobilized",
    "helpless",
    "vulnerable",
]

POWER_POSITIONS = [
    "standing over",
    "kneeling before",
    "pinned beneath",
    "held down",
    "looming above",
]
POWER_PROPS = ["collar", "leash", "cuffs", "blindfold", "crop", "flogger"]

# Texture
FABRIC_ACTIONS = [
    "sliding off",
    "falling open",
    "being removed",
    "barely covering",
    "clinging to",
    "slipping from",
]
FABRIC_STATES = [
    "untied",
    "loosened",
    "askew",
    "disheveled",
    "revealing",
    "parted",
]

# Intensity
INTENSITY_VERBS = [
    "consuming",
    "devouring",
    "claiming",
    "ravishing",
    "overwhelming",
    "possessing",
]
INTENSITY_TARGETS = [
    "bare skin",
    "exposed flesh",
    "yielding body",
    "willing form",
    "receptive curves",
]
INTENSITY_MOODS = [
    "desperate",
    "hungry",
    "ravenous",
    "insatiable",
    "fierce",
    "primal",
]

# Lighting
LIGHT_SOURCES = [
    "candlelight",
    "moonlight",
    "firelight",
    "lamplight",
    "sunlight",
    "starlight",
    "torchlight",
    "glow",
    "radiance",
    "shimmer",
    "gleam",
    "luminance",
    "brilliance",
    "warmth",
    "haze",
]
LIGHT_ACTIONS = [
    "caressing",
    "tracing",
    "kissing",
    "embracing",
    "illuminating",
    "highlighting",
    "painting",
    "touching",
    "gracing",
    "bathing",
    "warming",
    "gilding",
    "dappling",
    "falling on",
    "catching",
]
LIGHT_QUALITIES = [
    "soft",
    "warm",
    "golden",
    "silver",
    "dim",
    "flickering",
    "gentle",
    "sensual",
    "intimate",
    "diffuse",
    "dramatic",
]


# ============================================
# GENERATOR FUNCTIONS
# ============================================


def compose_body_phrase() -> str:
    """Generate a unique body-action phrase from composable parts."""
    part = random.choice(BODY_PARTS)
    action = random.choice(BODY_ACTIONS)
    direction = random.choice(BODY_DIRECTIONS)
    adj = random.choice(BODY_ADJECTIVES)
    area = random.choice(BODY_AREAS)
    return f"{part} {action} {direction} {adj} {area}"


def compose_touch_gesture() -> str:
    """Compose touch gesture from atomic parts (5x7=35 combos)."""
    part = random.choice(TOUCH_GESTURE_PARTS)
    verb = random.choice(TOUCH_GESTURE_VERBS)
    templates = [
        f"{part} {verb}",
        f"{verb} {part}",
        f"a {part} {verb}",
    ]
    return random.choice(templates)


def compose_embrace_visual() -> str:
    """Generate unique embrace/touch visual."""
    patterns = [
        lambda: (
            f"arms {random.choice(EMBRACE_VERBS)} "
            f"{random.choice(EMBRACE_TARGETS)} {random.choice(EMBRACE_DETAILS)}"
        ),
        lambda: f"{compose_touch_gesture()} {random.choice(TOUCH_AREAS)}, intimate contact",
        lambda: compose_body_phrase(),
    ]
    return random.choice(patterns)()


def compose_pleasure_visual() -> str:
    """Generate unique pleasure/ecstasy visual."""
    patterns = [
        lambda: (
            f"{random.choice(PLEASURE_EXPRESSIONS)} "
            f"{random.choice(PLEASURE_ACTIONS)}, {random.choice(PLEASURE_PROPS)}"
        ),
        lambda: (
            f"{random.choice(ECSTASY_POSES)} {random.choice(ECSTASY_STATES)}, "
            f"{random.choice(PLEASURE_EXPRESSIONS)}"
        ),
        lambda: (
            f"{random.choice(PLEASURE_ACTIONS)} with "
            f"{random.choice(PLEASURE_EXPRESSIONS)}, {random.choice(ECSTASY_STATES)}"
        ),
    ]
    return random.choice(patterns)()


def compose_seduce_visual() -> str:
    """Generate unique seduction/tease visual."""
    patterns = [
        lambda: (f"{random.choice(SEDUCE_LOOKS)} while {random.choice(SEDUCE_ACTIONS)}"),
        lambda: f"{random.choice(SEDUCE_GESTURES)}, {random.choice(SEDUCE_LOOKS)}",
        lambda: (
            f"{random.choice(TEASE_ACTIONS)} {random.choice(TEASE_TARGETS)}, "
            f"{random.choice(SEDUCE_LOOKS)}"
        ),
    ]
    return random.choice(patterns)()


def compose_forbidden_visual() -> str:
    """Generate unique forbidden/dark visual."""
    patterns = [
        lambda: (f"{random.choice(FORBIDDEN_ACTS)} in {random.choice(FORBIDDEN_SETTINGS)}"),
        lambda: (f"{random.choice(FORBIDDEN_MOODS)} encounter, {random.choice(FORBIDDEN_ACTS)}"),
        lambda: (
            f"{random.choice(FORBIDDEN_SETTINGS)}, "
            f"{random.choice(FORBIDDEN_MOODS)} {random.choice(FORBIDDEN_ACTS)}"
        ),
    ]
    return random.choice(patterns)()


def compose_bondage_visual() -> str:
    """Generate unique bondage/restraint visual."""
    patterns = [
        lambda: (
            f"{random.choice(BONDAGE_MATERIALS)} binding "
            f"{random.choice(BONDAGE_LOCATIONS)}, {random.choice(BONDAGE_STATES)}"
        ),
        lambda: (
            f"{random.choice(BONDAGE_STATES)} with "
            f"{random.choice(BONDAGE_MATERIALS)}, {random.choice(POWER_PROPS)} visible"
        ),
        lambda: (f"{random.choice(POWER_POSITIONS)}, {random.choice(POWER_PROPS)} in hand"),
    ]
    return random.choice(patterns)()


def compose_texture_visual(fabric: str) -> str:
    """Generate unique fabric/texture visual."""
    action = random.choice(FABRIC_ACTIONS)
    state = random.choice(FABRIC_STATES)
    adj = random.choice(BODY_ADJECTIVES)
    return f"{fabric} {action} {state}, against {adj} skin"


def compose_intensity_visual() -> str:
    """Generate unique intensity/passion visual."""
    patterns = [
        lambda: (
            f"{random.choice(INTENSITY_VERBS)} {random.choice(INTENSITY_TARGETS)}, "
            f"{random.choice(INTENSITY_MOODS)} passion"
        ),
        lambda: (
            f"{random.choice(INTENSITY_MOODS)} {random.choice(INTENSITY_VERBS)}, "
            f"{random.choice(PLEASURE_ACTIONS)}"
        ),
    ]
    return random.choice(patterns)()


def compose_lighting_phrase() -> str:
    """Generate a unique lighting description from composable parts."""
    quality = random.choice(LIGHT_QUALITIES)
    source = random.choice(LIGHT_SOURCES)
    action = random.choice(LIGHT_ACTIONS)
    adj = random.choice(BODY_ADJECTIVES)
    return f"{quality} {source} {action} {adj} skin"


# ============================================
# SIMPLE VISUAL GENERATORS
# ============================================


def _whisper_visual() -> str:
    loc = random.choice(["ear", "neck", "shoulder"])
    adj = random.choice(BODY_ADJECTIVES)
    return f"lips near {loc}, breath on {adj} skin"


def _kiss_visual() -> str:
    area = random.choice(BODY_AREAS)
    detail = random.choice(["lipstick mark", "kiss trail", "gentle pressure"])
    return f"lips on {area}, {detail}"


def _bliss_visual() -> str:
    pose = random.choice(["sprawl", "pose", "repose"])
    state = random.choice(ECSTASY_STATES)
    return f"relaxed {pose}, {state}, afterglow"


def _moan_visual() -> str:
    expr = random.choice(PLEASURE_EXPRESSIONS)
    action = random.choice(PLEASURE_ACTIONS)
    return f"open mouth, {expr}, {action}"


def _allure_visual() -> str:
    position = random.choice(["backlit", "in doorway", "emerging from shadow"])
    look = random.choice(SEDUCE_LOOKS)
    return f"silhouette {position}, {look}"


def _wicked_visual() -> str:
    pos = random.choice(POWER_POSITIONS)
    expr = random.choice(["cruel smile", "predatory gaze", "knowing smirk"])
    return f"{pos}, {expr}"


def _suffering_visual() -> str:
    state = random.choice(BONDAGE_STATES)
    mood = random.choice(["anticipation", "waiting", "denied"])
    return f"blindfolded, {state}, {mood}"


def _pain_visual() -> str:
    area = random.choice(BODY_AREAS)
    desc = random.choice(["pleasurable aftermath", "sweet pain", "delicious sting"])
    return f"marks on {area}, {desc}"


def _spank_visual() -> str:
    target = random.choice(["curves", "bare skin", "soft flesh"])
    return f"hand print on {target}, impact moment"


def _dominate_visual() -> str:
    pos = random.choice(POWER_POSITIONS)
    prop = random.choice(POWER_PROPS)
    mood = random.choice(["command", "control", "ownership"])
    return f"{pos}, {prop}, {mood}"


def _submit_visual() -> str:
    pose = random.choice(["head bowed", "eyes down", "offering self"])
    state = random.choice(BONDAGE_STATES)
    return f"kneeling, {pose}, {state}"


def _obey_visual() -> str:
    response = random.choice(
        [
            "trained response",
            "eager compliance",
            "willing submission",
        ]
    )
    return f"following command, {response}"


def _serve_visual() -> str:
    pose = random.choice(["attendant pose", "offering", "devoted stance"])
    return f"service position, {pose}"


def _overwhelm_visual() -> str:
    action = random.choice(PLEASURE_ACTIONS)
    state = random.choice(ECSTASY_STATES)
    return f"multiple sensations, {action}, {state}"


def _curves_visual() -> str:
    shape = random.choice(
        [
            "hourglass silhouette",
            "body contours",
            "feminine shape",
        ]
    )
    adj = random.choice(BODY_ADJECTIVES)
    return f"{shape}, {adj} skin"


def _flesh_visual() -> str:
    adj = random.choice(BODY_ADJECTIVES)
    form = random.choice(["nude form", "exposed body", "bare figure"])
    return f"{adj} skin expanses, {form}"


def _skin_visual() -> str:
    sheen = random.choice(["gleaming", "glistening", "radiant"])
    quality = random.choice(["touchable", "inviting", "warm"])
    return f"{sheen} skin, {quality} surface"


# ============================================
# KEYWORD TO GENERATOR MAPPING
# ============================================

NSFW_VISUAL_GENERATORS: dict[str, callable] = {
    # Touch category
    "embrace": compose_embrace_visual,
    "caress": compose_embrace_visual,
    "touch": compose_embrace_visual,
    "stroke": compose_embrace_visual,
    "whisper": _whisper_visual,
    "kiss": _kiss_visual,
    # Pleasure category
    "ecstasy": compose_pleasure_visual,
    "pleasure": compose_pleasure_visual,
    "desire": compose_seduce_visual,
    "lust": compose_seduce_visual,
    "passion": compose_intensity_visual,
    "bliss": _bliss_visual,
    "climax": compose_pleasure_visual,
    "moan": _moan_visual,
    # Seduction category
    "tempt": compose_seduce_visual,
    "seduce": compose_seduce_visual,
    "allure": _allure_visual,
    "charm": compose_seduce_visual,
    "entice": compose_seduce_visual,
    "tease": compose_seduce_visual,
    "flirt": compose_seduce_visual,
    # Dark category
    "forbidden": compose_forbidden_visual,
    "sinful": compose_forbidden_visual,
    "wicked": _wicked_visual,
    "corrupt": compose_forbidden_visual,
    "unholy": compose_forbidden_visual,
    "taboo": compose_forbidden_visual,
    # BDSM category
    "torment": compose_bondage_visual,
    "agony": compose_bondage_visual,
    "suffering": _suffering_visual,
    "anguish": compose_pleasure_visual,
    "pain": _pain_visual,
    "punish": compose_bondage_visual,
    "spank": _spank_visual,
    # Texture category
    "velvet": lambda: compose_texture_visual("velvet"),
    "silk": lambda: compose_texture_visual("silk"),
    "satin": lambda: compose_texture_visual("satin"),
    "lace": lambda: compose_texture_visual("lace"),
    "leather": lambda: compose_texture_visual("leather"),
    "latex": lambda: compose_texture_visual("latex"),
    # Binding category
    "bind": compose_bondage_visual,
    "chain": compose_bondage_visual,
    "restrain": compose_bondage_visual,
    "dominate": _dominate_visual,
    "submit": _submit_visual,
    "obey": _obey_visual,
    "serve": _serve_visual,
    # Intensity category
    "ravish": compose_intensity_visual,
    "devour": compose_intensity_visual,
    "consume": compose_intensity_visual,
    "overwhelm": _overwhelm_visual,
    "claim": compose_intensity_visual,
    # Body category
    "curves": _curves_visual,
    "flesh": _flesh_visual,
    "skin": _skin_visual,
}


def generate_nsfw_visual(keyword: str) -> str:
    """
    Generate a unique visual phrase for a given NSFW keyword.

    Args:
        keyword: The keyword to generate visuals for (e.g., 'caress', 'ecstasy')

    Returns:
        A dynamically composed visual phrase, or empty string if no match
    """
    generator = NSFW_VISUAL_GENERATORS.get(keyword.lower())
    if generator:
        return generator()
    return ""


# ============================================
# COMPOSABLE MOOD GENERATORS
# ============================================

MOOD_ADJECTIVES = {
    "attack": [
        "aggressive",
        "fierce",
        "violent",
        "brutal",
        "savage",
        "predatory",
        "vicious",
        "relentless",
        "merciless",
        "intense",
    ],
    "skill": [
        "protective",
        "defensive",
        "watchful",
        "careful",
        "tactical",
        "guarded",
        "alert",
        "measured",
        "calculated",
        "steady",
    ],
    "power": [
        "transcendent",
        "overwhelming",
        "radiating",
        "eternal",
        "ascending",
        "pulsing",
        "consuming",
        "dominant",
        "absolute",
        "infinite",
    ],
    "curse": [
        "dark",
        "sinister",
        "malevolent",
        "corrupting",
        "infectious",
        "forbidden",
        "wicked",
        "profane",
        "tainted",
        "cursed",
    ],
    "status": [
        "subtle",
        "quiet",
        "lingering",
        "ambient",
        "steady",
        "persistent",
        "understated",
        "gentle",
        "pervasive",
        "constant",
    ],
}

MOOD_NOUNS = {
    "attack": [
        "passion",
        "fury",
        "violence",
        "dominance",
        "aggression",
        "hunger",
        "ferocity",
        "brutality",
        "savagery",
        "force",
    ],
    "skill": [
        "allure",
        "grace",
        "beauty",
        "sensuality",
        "charm",
        "intimacy",
        "elegance",
        "poise",
        "finesse",
        "subtlety",
    ],
    "power": [
        "pleasure",
        "lust",
        "desire",
        "power",
        "passion",
        "presence",
        "beauty",
        "sensuality",
        "allure",
        "ecstasy",
    ],
    "curse": [
        "seduction",
        "pleasure",
        "desire",
        "lust",
        "temptation",
        "corruption",
        "darkness",
        "attraction",
        "hunger",
        "craving",
    ],
    "status": [
        "allure",
        "desire",
        "attraction",
        "charm",
        "sensuality",
        "passion",
        "beauty",
        "grace",
        "magnetism",
        "appeal",
    ],
}


def compose_theme_mood(theme: str) -> str:
    """Generate a unique mood phrase for a card theme."""
    adjs = MOOD_ADJECTIVES.get(theme, MOOD_ADJECTIVES["power"])
    nouns = MOOD_NOUNS.get(theme, MOOD_NOUNS["power"])
    adj1, adj2 = random.sample(adjs, 2)
    noun1, noun2 = random.sample(nouns, 2)
    patterns = [
        f"{adj1} {noun1}, {adj2} {noun2}",
        f"{adj1} and {adj2} {noun1}",
        f"{noun1} and {adj1} {noun2}",
        f"{adj1} {noun1} radiating {noun2}",
        f"surging {adj1} {noun1}",
        f"{adj1} {noun1}, building {noun2}",
    ]
    return random.choice(patterns)


# ============================================
# COMPOSABLE SCENE TEMPLATE GENERATORS
# ============================================

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
    "unveils",
    "portrays",
    "renders",
    "conjures",
    "evokes",
]

SCENE_STRUCTURES = [
    "This scene {verb} {content}",
    "Captivating {content}",
    "{content} unfolds",
    "Revealing {content}",
    "Witness {content}",
    "Behold {content}",
    "{content} manifests",
    "A vision {verb} {content}",
    "Observe {content} before you",
    "Intimately framed: {content}",
    "Here {verb} {content}",
    "Depicting {content}",
    "Showing {content}",
    "Featuring {content}",
]


def compose_scene_template(content: str) -> str:
    """Generate a unique scene opening with the given content."""
    structure = random.choice(SCENE_STRUCTURES)
    verb = random.choice(SCENE_VERBS)
    return structure.format(verb=verb, content=content)


# ============================================
# COMPOSABLE STYLE SUFFIX GENERATORS
# ============================================

# Style origins (nouns)
STYLE_ORIGINS = [
    "anime",
    "visual novel",
    "gacha game",
    "doujin",
    "eroge",
    "bishojo",
    "light novel",
    "manga",
    "pixiv",
    "dakimakura",
]

# Style types (what kind of art)
STYLE_TYPES = [
    "illustration",
    "CG",
    "splash art",
    "cover art",
    "key visual",
    "color page",
    "character art",
    "scene render",
    "portrait",
]

# Style moods (adjectives/qualities)
STYLE_MOODS = [
    "sensual",
    "romantic",
    "erotic",
    "intimate",
    "seductive",
    "alluring",
    "provocative",
    "sultry",
    "passionate",
    "tender",
]

# Technique verbs
TECHNIQUE_VERBS = [
    "blending",
    "shading",
    "rendering",
    "highlighting",
    "defining",
    "emphasizing",
    "capturing",
    "accentuating",
    "enhancing",
    "detailing",
]

# Technique qualities (adjectives)
TECHNIQUE_QUALITIES = [
    "smooth",
    "soft",
    "exquisite",
    "dynamic",
    "masterful",
    "delicate",
    "careful",
    "rich",
    "fine",
    "atmospheric",
]

# Technique subject nouns (single words for atomic composition)
TECHNIQUE_SUBJECT_NOUNS = [
    "skin",
    "curves",
    "contours",
    "proportions",
    "shadows",
    "highlights",
    "gradients",
    "linework",
    "silhouette",
    "form",
    "figure",
    "body",
]

# Technique subject modifiers
TECHNIQUE_SUBJECT_MODS = [
    "tones",
    "shading",
    "definition",
    "rendering",
    "detail",
    "texture",
    "flow",
    "weight",
]

# Technique complement nouns (single words)
TECHNIQUE_COMPLEMENT_NOUNS = [
    "fabrics",
    "hair",
    "drape",
    "folds",
    "skin",
    "details",
    "mood",
    "features",
    "physics",
    "textures",
    "clothing",
    "expression",
]

# Technique complement modifiers
TECHNIQUE_COMPLEMENT_MODS = [
    "translucent",
    "flowing",
    "textile",
    "fabric",
    "exposed",
    "intimate",
    "sensual",
    "feminine",
    "delicate",
    "soft",
    "subtle",
    "natural",
]

# Connectors for technique descriptions
TECHNIQUE_CONNECTORS = ["and", "against", "with", "alongside", ","]


def compose_style_suffix() -> str:
    """Generate a unique anime style description from composable parts."""
    origin = random.choice(STYLE_ORIGINS)
    style_type = random.choice(STYLE_TYPES)
    mood = random.choice(STYLE_MOODS)

    # Style connectors to vary phrasing
    style_connectors = ["with", "featuring", "showing", "in"]
    connector = random.choice(style_connectors)

    # Randomly vary the structure (avoid "Rendered in" to prevent "skin rendered in" trigram)
    style_patterns = [
        f"{origin.capitalize()} {style_type} {connector} {mood} aesthetics.",
        f"{mood.capitalize()} {origin}-style {style_type}.",
        f"Drawn in {mood} {origin} style.",
        f"{origin.capitalize()}-quality {mood} {style_type}.",
        f"{mood.capitalize()} {style_type}, {origin} aesthetics.",
        f"Illustrated {connector} {mood} {origin} flair.",
        f"{origin.capitalize()} {mood} artwork.",
        f"Painted in {mood} {origin} manner.",
    ]
    style_part = random.choice(style_patterns)

    # Compose technique description from atomic parts
    tech_quality = random.choice(TECHNIQUE_QUALITIES)
    tech_verb = random.choice(TECHNIQUE_VERBS)

    # Compose subject: noun + optional modifier
    subj_noun = random.choice(TECHNIQUE_SUBJECT_NOUNS)
    subj_mod = random.choice(TECHNIQUE_SUBJECT_MODS)
    tech_subject = random.choice([subj_noun, f"{subj_noun} {subj_mod}"])

    # Compose complement: modifier + noun
    comp_noun = random.choice(TECHNIQUE_COMPLEMENT_NOUNS)
    comp_mod = random.choice(TECHNIQUE_COMPLEMENT_MODS)
    tech_complement = random.choice([comp_noun, f"{comp_mod} {comp_noun}"])

    # Varied connectors
    connector = random.choice(TECHNIQUE_CONNECTORS)

    # Technique prefixes to vary phrasing
    tech_prefixes = ["Expert", "Masterful", "Skilled", "Fine", "Rich"]
    tech_prefix = random.choice(tech_prefixes)

    # Vary technique patterns to prevent "capturing of" trigram
    tech_verbs_alt = ["rendering", "depicting", "portraying", "showing", "enhancing"]
    tech_verb_alt = random.choice(tech_verbs_alt)
    tq = tech_quality.capitalize()
    tv = tech_verb.capitalize()
    tech_patterns = [
        f"{tq} {tech_verb} on {tech_subject} {connector} {tech_complement}.",
        f"{tq} {tech_verb_alt} {tech_subject} {connector} {tech_complement}.",
        f"{tv} {tech_subject}, {tech_complement} rendered {tech_quality}ly.",
        f"{tech_prefix} {tech_verb} of {tech_subject} {connector} {tech_complement}.",
        f"{tq} {tech_verb} highlighting {tech_subject}.",
        f"{tech_prefix} {tech_verb_alt} for {tech_subject}.",
        f"{tv} {tech_quality} {tech_subject} {connector} {tech_complement}.",
    ]
    tech_part = random.choice(tech_patterns)

    return f"{style_part} {tech_part}"
