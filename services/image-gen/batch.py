#!/usr/bin/env python3
"""
Batch generation script for existing card library.

Usage:
    python batch.py                    # Generate for all cards
    python batch.py --cards strike,defend  # Specific cards
    python batch.py --theme attack     # Cards of specific theme
    python batch.py --dry-run          # Preview prompts without generating
"""

import argparse
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from generator import CardArtGenerator
from prompts import card_to_prompt


def load_cards_from_game() -> list[dict]:
    """
    Load card definitions from the game's cards.ts file.

    This parses the TypeScript CARDS array to extract card definitions.
    """
    cards_path = Path(__file__).parent.parent.parent / "src" / "game" / "cards.ts"

    if not cards_path.exists():
        print(f"Cards file not found: {cards_path}")
        return []

    content = cards_path.read_text()

    # Extract the CARDS array content
    # Look for: export const CARDS: CardDefinition[] = [...]
    import re

    # Find array start
    match = re.search(r"export\s+const\s+CARDS[^=]*=\s*\[", content)
    if not match:
        print("Could not find CARDS array in cards.ts")
        return []

    # Extract objects from the array
    cards = []
    start = match.end()

    # Simple state machine to extract object literals
    depth = 1
    obj_start = None
    i = start

    while i < len(content) and depth > 0:
        char = content[i]

        if char == "{":
            if depth == 1:
                obj_start = i
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 1 and obj_start is not None:
                obj_str = content[obj_start : i + 1]
                card = parse_card_object(obj_str)
                if card:
                    cards.append(card)
                obj_start = None
        elif char == "]" and depth == 1:
            break

        i += 1

    return cards


def parse_card_object(obj_str: str) -> dict | None:
    """Parse a TypeScript object literal into a dict."""
    import re

    card = {}

    # Extract simple string fields
    for field in ["id", "name", "description", "theme", "target", "rarity", "element"]:
        # Match: field: 'value' or field: "value"
        match = re.search(rf"{field}:\s*['\"]([^'\"]+)['\"]", obj_str)
        if match:
            card[field] = match.group(1)

    # Extract energy (number)
    energy_match = re.search(r"energy:\s*(\d+)", obj_str)
    if energy_match:
        card["energy"] = int(energy_match.group(1))

    # Must have at least id and name
    if "id" in card and "name" in card:
        return card

    return None


def generate_for_cards(
    cards: list[dict],
    generator: CardArtGenerator,
    output_format: str = "webp",
    dry_run: bool = False,
) -> list[dict]:
    """Generate images for a list of cards."""
    results = []

    for i, card in enumerate(cards):
        card_id = card.get("id", f"card_{i}")
        name = card.get("name", "Unknown")

        print(f"\n[{i + 1}/{len(cards)}] {card_id}: {name}")

        prompt = card_to_prompt(
            name=name,
            description=card.get("description", "A mysterious card"),
            theme=card.get("theme", "attack"),
            element=card.get("element", "physical"),
            rarity=card.get("rarity", "common"),
        )

        if dry_run:
            print(f"  Prompt: {prompt[:100]}...")
            results.append({"card_id": card_id, "status": "dry_run", "prompt": prompt})
            continue

        try:
            output_path = generator.save_card_art(
                card_id=card_id,
                prompt=prompt,
                format=output_format,
            )
            print(f"  Saved: {output_path}")
            results.append({"card_id": card_id, "status": "success", "path": str(output_path)})

        except Exception as e:
            print(f"  Error: {e}")
            results.append({"card_id": card_id, "status": "error", "error": str(e)})

    return results


def main():
    parser = argparse.ArgumentParser(description="Batch generate card art")
    parser.add_argument("--cards", type=str, help="Comma-separated card IDs to generate")
    parser.add_argument("--theme", type=str, help="Only cards of this theme")
    parser.add_argument("--element", type=str, help="Only cards of this element")
    parser.add_argument("--rarity", type=str, help="Only cards of this rarity")
    parser.add_argument("--format", type=str, default="webp", choices=["png", "webp"])
    parser.add_argument("--output", type=str, help="Output directory")
    parser.add_argument("--dry-run", action="store_true", help="Preview prompts only")
    parser.add_argument("--list", action="store_true", help="List available cards")

    args = parser.parse_args()

    # Load cards from game
    print("Loading cards from game...")
    all_cards = load_cards_from_game()
    print(f"Found {len(all_cards)} cards")

    if args.list:
        for card in all_cards:
            print(f"  {card['id']}: {card.get('name', 'unnamed')} ({card.get('theme', '?')})")
        return

    # Filter cards
    cards = all_cards

    if args.cards:
        card_ids = set(args.cards.split(","))
        cards = [c for c in cards if c.get("id") in card_ids]

    if args.theme:
        cards = [c for c in cards if c.get("theme") == args.theme]

    if args.element:
        cards = [c for c in cards if c.get("element") == args.element]

    if args.rarity:
        cards = [c for c in cards if c.get("rarity") == args.rarity]

    if not cards:
        print("No cards match the filters")
        return

    print(f"Will generate {len(cards)} card images")

    # Initialize generator
    output_dir = Path(args.output) if args.output else Path(__file__).parent / "generated"
    generator = CardArtGenerator(output_dir=output_dir)

    if not args.dry_run:
        print("Loading model (this may take a minute)...")
        generator.load_model()

    # Generate
    results = generate_for_cards(
        cards=cards,
        generator=generator,
        output_format=args.format,
        dry_run=args.dry_run,
    )

    # Save results
    results_path = output_dir / "batch_results.json"
    results_path.write_text(json.dumps(results, indent=2))
    print(f"\nResults saved to {results_path}")

    # Summary
    success = sum(1 for r in results if r["status"] == "success")
    errors = sum(1 for r in results if r["status"] == "error")
    print(f"\nSummary: {success} success, {errors} errors")


if __name__ == "__main__":
    main()
