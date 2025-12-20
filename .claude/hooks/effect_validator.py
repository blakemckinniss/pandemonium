#!/usr/bin/env python3
"""
PreToolUse hook - validate effect system patterns.

Checks for common mistakes when editing effect-related files.
"""

import json
import os
import re
import sys


def check_effect_patterns(content: str, file_path: str) -> list[str]:
    """Check for common effect system mistakes."""
    warnings = []

    # Check for missing type in AtomicEffect (informational only)
    # Full validation would require parsing the union type

    # Check for direct state mutation (should use Immer)
    if "handlers/" in file_path or "actions.ts" in file_path:
        # Look for array mutations without Immer
        if "state.hand.push(" in content or "state.deck.push(" in content:
            warnings.append(
                "⚠️ Direct array push detected. Use `draft.hand.push()` inside `produce()`"
            )

        if "= [...state" in content or "= {...state" in content:
            warnings.append(
                "⚠️ Spread operator in handler. Use Immer draft mutation instead."
            )

    # Check for missing executeEffect import
    if "effects/" in file_path and "executeEffect" in content:
        if "import" in content and "executeEffect" not in content.split("import")[0]:
            # Likely importing, good
            pass

    # Check for hardcoded damage/block values in effects
    if "game/cards.ts" in file_path:
        # Look for very high values that might be typos
        high_values = re.findall(r"amount:\s*(\d{3,})", content)
        for val in high_values:
            if int(val) > 100:
                warnings.append(f"⚠️ High effect value: {val}. Intentional?")

    return warnings


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

    # Only check Write/Edit operations
    if tool_name not in ("Write", "Edit", "MultiEdit"):
        print(json.dumps({"result": "continue"}))
        return

    file_path = tool_input.get("file_path", "")

    # Only check relevant files
    relevant_patterns = ["game/", "types/index.ts"]
    if not any(p in file_path for p in relevant_patterns):
        print(json.dumps({"result": "continue"}))
        return

    # Get content to check
    content = tool_input.get("content", "")
    if not content:
        content = tool_input.get("new_string", "")

    if not content:
        print(json.dumps({"result": "continue"}))
        return

    warnings = check_effect_patterns(content, file_path)

    if warnings:
        message = "\n".join(warnings)
        message += (
            "\n🎯 **Available**: agent:`effect-debugger` for effect system issues"
        )
        print(json.dumps({"result": "continue", "message": message}))
        return

    print(json.dumps({"result": "continue"}))


if __name__ == "__main__":
    main()
