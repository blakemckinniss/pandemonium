#!/usr/bin/env python3
"""Tests for skill_injector hook."""

import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Add hooks directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from skill_injector import (
    SKILL_TRIGGERS,
    format_injection,
    get_project_root,
    match_skills,
    strip_frontmatter,
)


class TestSkillTriggers:
    """Test that skill triggers match expected patterns."""

    @pytest.fixture(autouse=True)
    def mock_skill_content(self):
        """Mock read_skill_content to return fake content for all skills."""
        with patch(
            "skill_injector.read_skill_content",
            return_value="# Mocked Skill Content\nTest content here.",
        ):
            yield

    def test_card_creation_triggers(self):
        """Card creation skill should match card-related prompts."""
        prompts = [
            "I want to create a new card",
            "add card for fire damage",
            "make a card that deals 10 damage",
            "design card with block",
            "create attack card",
            "fire card with burning",
            "what's the energy cost for this?",
            "working on cards.ts",
        ]
        for prompt in prompts:
            matches = match_skills(prompt)
            skill_names = [m[0] for m in matches]
            assert "card-creation" in skill_names, f"Failed to match: {prompt}"

    def test_effect_authoring_triggers(self):
        """Effect authoring skill should match effect-related prompts."""
        prompts = [
            "add a new effect type",
            "create effect for healing",
            "effect not working properly",
            "how do effects work",
            "looking at src/game/effects/ code",
            "damage effect is broken",
            "implement effect for chain damage",
        ]
        for prompt in prompts:
            matches = match_skills(prompt)
            skill_names = [m[0] for m in matches]
            assert "effect-authoring" in skill_names, f"Failed to match: {prompt}"

    def test_power_creation_triggers(self):
        """Power creation skill should match power-related prompts."""
        prompts = [
            "add a new power",
            "create buff for strength",
            "add debuff for vulnerable",
            "implement buff system",
            "working with poison",
            "onTurnStart trigger",
            "elemental status burning",
        ]
        for prompt in prompts:
            matches = match_skills(prompt)
            skill_names = [m[0] for m in matches]
            assert "power-creation" in skill_names, f"Failed to match: {prompt}"

    def test_room_design_triggers(self):
        """Room design skill should match room-related prompts."""
        prompts = [
            "create a new room",
            "add encounter with slimes",
            "elite room design",
            "boss room with multiple enemies",
            "dungeon deck composition",
            "campfire mechanics",
            "add monster to encounter",
        ]
        for prompt in prompts:
            matches = match_skills(prompt)
            skill_names = [m[0] for m in matches]
            assert "room-design" in skill_names, f"Failed to match: {prompt}"

    def test_image_gen_triggers(self):
        """Image generation skill should match image-related prompts."""
        prompts = [
            "generate image for card",
            "card art is missing",
            "no image for this room",
            "ComfyUI setup",
            "batch images for all cards",
            "need art for fireball",
            "public/cards/strike.webp",
        ]
        for prompt in prompts:
            matches = match_skills(prompt)
            skill_names = [m[0] for m in matches]
            assert "image-gen" in skill_names, f"Failed to match: {prompt}"

    def test_no_match_for_unrelated_prompts(self):
        """Unrelated prompts should not match any skills."""
        prompts = [
            "help me understand the codebase",
            "what is the project structure",
            "run the tests",
            "fix the linting errors",
        ]
        for prompt in prompts:
            matches = match_skills(prompt)
            assert len(matches) == 0, f"Should not match: {prompt}"

    def test_multiple_skills_can_match(self):
        """Multiple skills can match a single prompt."""
        # This prompt mentions both cards and effects
        prompt = "create a new card with a custom damage effect"
        matches = match_skills(prompt)
        skill_names = [m[0] for m in matches]
        assert "card-creation" in skill_names
        assert "effect-authoring" in skill_names


class TestStripFrontmatter:
    """Test frontmatter stripping."""

    def test_strip_yaml_frontmatter(self):
        """Should strip YAML frontmatter from content."""
        content = """---
name: test-skill
description: A test skill
---

# Skill Content

This is the actual content."""

        result = strip_frontmatter(content)
        assert result.startswith("# Skill Content")
        assert "name: test-skill" not in result

    def test_no_frontmatter(self):
        """Should return content unchanged if no frontmatter."""
        content = "# Just Content\n\nNo frontmatter here."
        result = strip_frontmatter(content)
        assert result == content

    def test_incomplete_frontmatter(self):
        """Should return content if frontmatter is incomplete."""
        content = "---\nname: test\nNo closing marker"
        result = strip_frontmatter(content)
        assert result == content


class TestFormatInjection:
    """Test injection formatting."""

    def test_empty_matches(self):
        """Should return empty string for no matches."""
        result = format_injection([])
        assert result == ""

    def test_single_match_formatting(self):
        """Should format single skill match."""
        matches = [("test-skill", "Test summary", "# Test Content", ["test-agent"])]
        result = format_injection(matches)
        assert "🎯 **Skill Context Activated**" in result
        assert "### 📘 test-skill: Test summary" in result
        assert "# Test Content" in result
        assert "🤖 **Suggested agents**: `test-agent`" in result

    def test_multiple_matches_dedup_agents(self):
        """Should deduplicate agents across matches."""
        matches = [
            ("skill-a", "Summary A", "Content A", ["agent-1", "agent-2"]),
            ("skill-b", "Summary B", "Content B", ["agent-2", "agent-3"]),
        ]
        result = format_injection(matches)
        # Should have all three agents, deduplicated
        assert "`agent-1`" in result
        assert "`agent-2`" in result
        assert "`agent-3`" in result
        # agent-2 should only appear once
        assert result.count("`agent-2`") == 1

    def test_no_agents_section_when_empty(self):
        """Should not include agents section when no agents."""
        matches = [("test-skill", "Test summary", "# Test Content", [])]
        result = format_injection(matches)
        assert "🤖 **Suggested agents**" not in result


class TestGetProjectRoot:
    """Test project root detection."""

    def test_uses_env_var_when_set(self):
        """Should use CLAUDE_PROJECT_DIR when set."""
        with patch.dict(os.environ, {"CLAUDE_PROJECT_DIR": "/test/path"}):
            result = get_project_root()
            assert result == Path("/test/path")

    def test_falls_back_to_cwd(self):
        """Should fall back to cwd when env var not set."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove CLAUDE_PROJECT_DIR if set
            os.environ.pop("CLAUDE_PROJECT_DIR", None)
            result = get_project_root()
            assert result == Path.cwd()


class TestSkillTriggerConfig:
    """Test skill trigger configuration."""

    def test_all_skills_have_required_fields(self):
        """All skills should have triggers, summary, and agents."""
        for skill_name, config in SKILL_TRIGGERS.items():
            assert "triggers" in config, f"{skill_name} missing triggers"
            assert "summary" in config, f"{skill_name} missing summary"
            assert "agents" in config, f"{skill_name} missing agents"
            assert len(config["triggers"]) > 0, f"{skill_name} has no triggers"

    def test_all_triggers_are_valid_regex(self):
        """All triggers should be valid regex patterns."""
        import re

        for skill_name, config in SKILL_TRIGGERS.items():
            for pattern in config["triggers"]:
                try:
                    re.compile(pattern)
                except re.error as e:
                    pytest.fail(f"{skill_name} has invalid regex: {pattern} - {e}")
