#!/usr/bin/env python3
"""
PostToolUse hook - inject relevant context based on file patterns.

Detects which system is being worked on and suggests relevant Serena memories.
"""

import json
import os
import sys
from typing import Optional

# File pattern to memory/context mapping
# Now includes skills and agents for better discoverability
CONTEXT_MAP = {
    # Effects system
    "game/effects/": {
        "memories": ["effects_engine", "effects_library_expanded"],
        "hint": "Effects use `executeEffect()`. Add new types to `AtomicEffect` union in types/index.ts",
        "skill": "effect-authoring",
        "agent": "effect-debugger",
    },
    # Power system
    "game/powers": {
        "memories": ["power_system_detailed"],
        "hint": "Powers use `registerPower()`. Stack behaviors: intensity|duration|replace",
        "skill": "power-creation",
    },
    # Action handlers
    "game/handlers/": {
        "memories": ["action_handlers"],
        "hint": "Handlers modify draft state via Immer. Return draft, don't spread.",
        "agent": "game-reviewer",
    },
    # Card definitions
    "game/cards.ts": {
        "memories": ["card_generator"],
        "hint": "Cards need unique IDs. Effects are declarative arrays. Check CARDS array for patterns.",
        "skill": "card-creation",
        "agent": "balance-analyzer",
    },
    # Types
    "types/index.ts": {
        "memories": ["codebase_structure"],
        "hint": "ALL types go here. Use union types for effects. Export everything.",
        "skill": "effect-authoring",
    },
    # Components
    "components/": {
        "memories": ["visual_system", "hooks_system"],
        "hint": "Components: PascalCase, index.tsx. Use hooks for logic separation.",
    },
    # Screens
    "components/screens/": {
        "memories": ["screens_and_phases", "hooks_system"],
        "hint": "Screens use useXxxHandlers hooks. GamePhase controls routing in App.tsx",
    },
    # Game screen specifically
    "GameScreen.tsx": {
        "memories": ["visual_system", "action_handlers"],
        "hint": "Combat state via applyAction(). Visual events via useVisualEventProcessor.",
    },
    # React hooks
    "hooks/": {
        "memories": ["hooks_system"],
        "hint": "Pattern: useXxx(runState, setRunState) → { handlers, uiState }. Use useCallback.",
    },
    # Animations
    "lib/animations.ts": {
        "memories": ["visual_system"],
        "hint": "GSAP effects registered globally. Use gsap.registerEffect() pattern.",
    },
    # Elements
    "game/elements.ts": {
        "memories": ["elemental_system"],
        "hint": "5 elements with combo system. Affinities: resist/weak/immune.",
        "skill": "power-creation",
    },
    # Relics
    "game/relics.ts": {
        "memories": ["relic_system"],
        "hint": "Relics use trigger events + AtomicEffect arrays. Same effect system as cards.",
        "skill": "effect-authoring",
    },
    # Selection effects
    "game/selection-effects.ts": {
        "memories": ["selection_effects"],
        "hint": "Selection effects pause combat. Set pendingSelection, resolve via action.",
        "skill": "effect-authoring",
    },
    # Dungeon/rooms
    "dungeon": {
        "memories": ["dungeon_system"],
        "hint": "Rooms in content/rooms.ts. DungeonDeck shuffles room cards.",
        "skill": "room-design",
    },
    # Room definitions
    "content/rooms": {
        "memories": ["dungeon_system"],
        "hint": "Define rooms with monsters, type, and rewards.",
        "skill": "room-design",
    },
    # Stores
    "stores/": {
        "memories": ["meta_progression"],
        "hint": "metaStore: Zustand + localStorage. db.ts: Dexie + IndexedDB.",
    },
    # Tests
    "__tests__/": {
        "memories": [],
        "hint": "Use fake-indexeddb for Dexie. Mock GSAP. Test via applyAction().",
        "agent": "test-writer",
    },
    # Modifiers
    "modifier": {
        "memories": [],
        "hint": "Modifiers alter run params. Applied via modifier-resolver.ts.",
    },
    # Image generation
    "services/image-gen": {
        "memories": ["image_generation"],
        "hint": "ComfyUI integration for card/room art.",
        "skill": "image-gen",
    },
    # Public card images
    "public/cards": {
        "memories": [],
        "hint": "Card images as WebP. Generate via image-gen service.",
        "skill": "image-gen",
    },
}


def get_relevant_context(tool_name: str, tool_input: dict) -> Optional[dict]:
    """Check if tool touches files and return relevant context."""

    # Get file path from various tool patterns
    file_path = None

    if tool_name in ("Read", "Write", "Edit", "MultiEdit"):
        file_path = tool_input.get("file_path", "")
    elif tool_name == "Grep":
        file_path = tool_input.get("path", "")
    elif tool_name == "Glob":
        file_path = tool_input.get("pattern", "")
    elif "serena" in tool_name.lower():
        file_path = tool_input.get("relative_path", "")

    if not file_path:
        return None

    # Check against patterns
    for pattern, context in CONTEXT_MAP.items():
        if pattern in file_path:
            return context

    return None


def main():
    # Read hook input from environment or stdin
    hook_input = os.environ.get("CLAUDE_HOOK_INPUT", "")
    if not hook_input:
        hook_input = sys.stdin.read()

    try:
        data = json.loads(hook_input)
    except json.JSONDecodeError:
        print(json.dumps({"result": "continue"}))
        return

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    context = get_relevant_context(tool_name, tool_input)

    if context:
        parts = []

        if context.get("memories"):
            memories = ", ".join(f"`{m}`" for m in context["memories"])
            parts.append(f"📚 **Relevant memories**: {memories}")

        if context.get("hint"):
            parts.append(f"💡 **Pattern**: {context['hint']}")

        # Suggest relevant skills and agents
        suggestions = []
        if context.get("skill"):
            suggestions.append(f"skill:`{context['skill']}`")
        if context.get("agent"):
            suggestions.append(f"agent:`{context['agent']}`")
        if suggestions:
            parts.append(f"🎯 **Available**: {', '.join(suggestions)}")

        if parts:
            message = "\n".join(parts)
            print(json.dumps({"result": "continue", "message": message}))
            return

    print(json.dumps({"result": "continue"}))


if __name__ == "__main__":
    main()
