#!/usr/bin/env python3
"""
PostToolUse hook - remind to run tests after game logic changes.

Tracks edits to game logic files and reminds about testing.
"""

import json
import os
import sys
from pathlib import Path

# Track files edited this session
EDIT_TRACKER_FILE = "/tmp/pandemonium_edits.txt"

# Patterns that require test runs
TESTABLE_PATTERNS = [
    "game/actions.ts",
    "game/effects/",
    "game/handlers/",
    "game/powers",
    "game/cards.ts",
    "game/elements.ts",
    "game/relics.ts",
    "game/selection-effects.ts",
    "game/modifiers.ts",
    "game/modifier-resolver.ts",
    "game/dungeon-deck.ts",
    "game/new-game.ts",
]

# How many edits before reminder
EDIT_THRESHOLD = 3


def load_edits() -> list[str]:
    """Load tracked edits from temp file."""
    try:
        if Path(EDIT_TRACKER_FILE).exists():
            return Path(EDIT_TRACKER_FILE).read_text().strip().split("\n")
    except Exception:
        pass
    return []


def save_edits(edits: list[str]) -> None:
    """Save tracked edits to temp file."""
    try:
        Path(EDIT_TRACKER_FILE).write_text("\n".join(edits[-20:]))  # Keep last 20
    except Exception:
        pass


def is_testable_file(file_path: str) -> bool:
    """Check if file is in testable patterns."""
    return any(pattern in file_path for pattern in TESTABLE_PATTERNS)


def main():
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
    tool_result = data.get("tool_result", {})

    # Only track Edit/Write tools
    if tool_name not in ("Edit", "Write", "MultiEdit"):
        print(json.dumps({"result": "continue"}))
        return

    file_path = tool_input.get("file_path", "")

    # Check if this is a testable file
    if not is_testable_file(file_path):
        print(json.dumps({"result": "continue"}))
        return

    # Track the edit
    edits = load_edits()
    edits.append(file_path)
    save_edits(edits)

    # Count recent testable edits
    testable_edits = [e for e in edits if is_testable_file(e)]

    # Check if test was run (reset counter)
    if "npm test" in str(tool_result) or "vitest" in str(tool_result):
        save_edits([])  # Reset
        print(json.dumps({"result": "continue"}))
        return

    # Remind after threshold
    if (
        len(testable_edits) >= EDIT_THRESHOLD
        and len(testable_edits) % EDIT_THRESHOLD == 0
    ):
        message = f"🧪 **Test reminder**: {len(testable_edits)} game logic edits. Run `npm test -- --run` to verify."
        print(json.dumps({"result": "continue", "message": message}))
        return

    print(json.dumps({"result": "continue"}))


if __name__ == "__main__":
    main()
