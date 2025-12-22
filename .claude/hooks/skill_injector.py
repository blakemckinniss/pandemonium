#!/usr/bin/env python3
"""
UserPromptSubmit hook - Inject project-local skill content based on semantic triggers.

Parses user prompts for patterns defined in skill frontmatter and injects
the full skill content into context when matched. Also suggests relevant
agents when skills are activated.

Skills are in: .claude/skills/<name>/SKILL.md
Agents are in: .claude/agents/<name>.md
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

# Skill trigger patterns with expanded coverage
# Format: skill_name -> {triggers, summary, agents}
SKILL_TRIGGERS = {
    "card-creation": {
        "triggers": [
            # Direct mentions
            r"\bnew card\b",
            r"\badd card\b",
            r"\bcreate card\b",
            r"\bmake a card\b",
            r"\bdesign card\b",
            r"\bwrite a card\b",
            # Card types
            r"\bcreate attack\b",
            r"\bcreate skill\b",
            r"\bcreate power\b",
            r"\battack card\b",
            r"\bskill card\b",
            r"\bpower card\b",
            # Balance/mechanics
            r"\bcard balance\b",
            r"\beffect syntax\b",
            r"\bhow much damage\b",
            r"\benergy cost\b",
            r"\bcard doesn't work\b",
            r"\bcard definition\b",
            r"\bregistercards?\b",
            # Implicit card work
            r"\bfire card\b",
            r"\bice card\b",
            r"\blightning card\b",
            r"\bvoid card\b",
            r"\bphysical card\b",
            r"\bcards\.ts\b",
            r"\bcard that\b",
        ],
        "summary": "Card creation syntax, effects, balance guidelines",
        "agents": ["balance-analyzer"],
    },
    "effect-authoring": {
        "triggers": [
            # Direct mentions
            r"\bnew effect\b",
            r"\badd effect\b",
            r"\bcreate effect\b",
            r"\bimplement effect\b",
            r"\beffect type\b",
            # Debugging
            r"\beffect not working\b",
            r"\beffect bug\b",
            r"\beffect broken\b",
            r"\bwrong target\b",
            r"\bwrong amount\b",
            # Technical
            r"\bexecuteeffect\b",
            r"\batomiceffect\b",
            r"\beffect handler\b",
            r"\bhow do effects work\b",
            r"\beffects engine\b",
            r"\bextend effects?\b",
            r"\beffects/",
            # Effect types
            r"\bdamage effect\b",
            r"\bblock effect\b",
            r"\bdraw effect\b",
            r"\bheal effect\b",
            r"\bconditional effect\b",
        ],
        "summary": "Extend effects engine with new AtomicEffect types",
        "agents": ["effect-debugger"],
    },
    "power-creation": {
        "triggers": [
            # Direct mentions
            r"\bnew power\b",
            r"\badd power\b",
            r"\bcreate power\b",
            r"\badd buff\b",
            r"\bcreate buff\b",
            r"\badd debuff\b",
            r"\bcreate debuff\b",
            r"\bimplement buff\b",
            r"\bimplement debuff\b",
            # Power names (common)
            r"\bstrength\b",
            r"\bvulnerable\b",
            r"\bweak\b",
            r"\bfrail\b",
            r"\bthorns\b",
            r"\bpoison\b",
            r"\bregeneration\b",
            r"\bdexterity\b",
            # Mechanics
            r"\bstack behavior\b",
            r"\bpower trigger\b",
            r"\bonturnstart\b",
            r"\bonturnend\b",
            r"\bonattack\b",
            r"\bmodifier\b",
            r"\bbuff system\b",
            r"\bdebuff system\b",
            r"\bregisterpower\b",
            r"\bpowers/",
            # Status effects
            r"\bburning\b",
            r"\bfrozen\b",
            r"\bcharged\b",
            r"\belemental status\b",
        ],
        "summary": "Powers (buffs/debuffs) with stack behaviors and triggers",
        "agents": ["balance-analyzer"],
    },
    "room-design": {
        "triggers": [
            # Direct mentions
            r"\bnew room\b",
            r"\badd room\b",
            r"\bcreate room\b",
            r"\bdesign room\b",
            r"\badd encounter\b",
            r"\bcreate encounter\b",
            # Room types
            r"\bcombat room\b",
            r"\belite room\b",
            r"\bboss room\b",
            r"\bcampfire\b",
            r"\btreasure room\b",
            r"\bshop room\b",
            r"\bevent room\b",
            # Dungeon mechanics
            r"\bdungeon deck\b",
            r"\bmonster spawn\b",
            r"\broom type\b",
            r"\bdungeon design\b",
            r"\bfloor composition\b",
            r"\brooms\.ts\b",
            # Monsters
            r"\badd monster\b",
            r"\bnew monster\b",
            r"\bcreate monster\b",
            r"\benemy design\b",
        ],
        "summary": "Dungeon rooms, monster spawns, deck composition",
        "agents": ["balance-analyzer", "game-reviewer"],
    },
    "image-gen": {
        "triggers": [
            # Direct mentions
            r"\bgenerate image\b",
            r"\bcreate image\b",
            r"\bmake image\b",
            r"\bcard art\b",
            r"\broom art\b",
            r"\bgenerate art\b",
            r"\bcreate art\b",
            # Missing/needed
            r"\bmissing image\b",
            r"\bno image\b",
            r"\bneed image\b",
            r"\bneeds? art\b",
            r"\bart for\b",
            # Technical
            r"\bcomfyui\b",
            r"\broom image\b",
            r"\bcreate artwork\b",
            r"\bbatch images?\b",
            r"\bimage generation\b",
            r"\bimage-gen\b",
            # Specific generation
            r"\bgenerate card\b",
            r"\bgenerate room\b",
            r"\.webp\b",
            r"\bpublic/cards\b",
        ],
        "summary": "ComfyUI image generation for cards and rooms",
        "agents": [],
    },
}


def get_project_root() -> Path:
    """Get project root from environment or cwd."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "")
    if project_dir:
        return Path(project_dir)
    return Path.cwd()


def read_skill_content(skill_name: str) -> Optional[str]:
    """Read full SKILL.md content for a skill."""
    project_root = get_project_root()
    skill_path = project_root / ".claude" / "skills" / skill_name / "SKILL.md"

    if not skill_path.exists():
        return None

    try:
        return skill_path.read_text()
    except Exception:
        return None


def match_skills(prompt: str) -> list[tuple[str, str, str, list[str]]]:
    """Match prompt against skill triggers.

    Returns: [(skill_name, summary, content, agents), ...]
    """
    prompt_lower = prompt.lower()
    matched = []

    for skill_name, config in SKILL_TRIGGERS.items():
        for pattern in config["triggers"]:
            if re.search(pattern, prompt_lower):
                content = read_skill_content(skill_name)
                if content:
                    matched.append(
                        (
                            skill_name,
                            config["summary"],
                            content,
                            config.get("agents", []),
                        )
                    )
                break  # One match per skill is enough

    return matched


def strip_frontmatter(content: str) -> str:
    """Remove YAML frontmatter from skill content."""
    if content.startswith("---"):
        end_marker = content.find("---", 3)
        if end_marker > 0:
            return content[end_marker + 3 :].strip()
    return content


def format_injection(matches: list[tuple[str, str, str, list[str]]]) -> str:
    """Format matched skills for context injection."""
    if not matches:
        return ""

    parts = ["🎯 **Skill Context Activated**\n"]

    # Collect all suggested agents
    all_agents = set()

    for skill_name, summary, content, agents in matches:
        content_body = strip_frontmatter(content)
        parts.append(f"\n### 📘 {skill_name}: {summary}\n")
        parts.append(content_body)
        parts.append("\n---\n")
        all_agents.update(agents)

    # Add agent suggestions if any
    if all_agents:
        agent_list = ", ".join(f"`{a}`" for a in sorted(all_agents))
        parts.append(f"\n🤖 **Suggested agents**: {agent_list}")
        parts.append("\nConsider spawning these for specialized analysis.\n")

    parts.append("\n**USE THIS CONTEXT** for the task at hand.\n")

    return "".join(parts)


def main():
    # Read hook input
    hook_input = os.environ.get("CLAUDE_HOOK_INPUT", "")
    if not hook_input:
        hook_input = sys.stdin.read()

    try:
        data = json.loads(hook_input)
    except json.JSONDecodeError:
        print(json.dumps({"result": "continue"}))
        return

    prompt = data.get("prompt", "")
    if not prompt or len(prompt) < 10:
        print(json.dumps({"result": "continue"}))
        return

    # Match skills
    matches = match_skills(prompt)

    if matches:
        injection = format_injection(matches)
        skill_names = ", ".join(f"`{m[0]}`" for m in matches)

        # Output injection with summary
        print(
            json.dumps(
                {
                    "result": "continue",
                    "message": f"📚 **Skills injected**: {skill_names}\n\n{injection}",
                }
            )
        )
    else:
        print(json.dumps({"result": "continue"}))


if __name__ == "__main__":
    main()
