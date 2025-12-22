#!/usr/bin/env python3
"""
Complete image regeneration with new NSFW/erotic focus.

This script wipes all existing images and regenerates:
- Heroes (NSFW anime waifus - body-first, revealing outfits)
- Enemies (NSFW monster girls - seductive, barely covered)
- Cards (effect-focused - NO characters, just spells/weapons/phenomena)

Usage:
    python regenerate_all.py                    # Full regeneration
    python regenerate_all.py --heroes-only      # Just heroes
    python regenerate_all.py --enemies-only     # Just enemies
    python regenerate_all.py --cards-only       # Just effect cards
    python regenerate_all.py --dry-run          # Preview without generating
    python regenerate_all.py --no-wipe          # Don't delete existing images
"""

import argparse
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from generator import CardArtGenerator
from prompts import card_to_prompt, enemy_to_prompt, hero_to_prompt

# Directories
GENERATED_DIR = Path(__file__).parent / "generated"
PUBLIC_DIR = Path(__file__).parent.parent.parent / "public" / "cards"

# ============================================
# HERO DEFINITIONS - NSFW anime waifus
# ============================================
HEROES = [
    {
        "id": "hero_sakura",
        "name": "Sakura",
        "description": "Cherry blossom warrior princess",
        "archetype": "Warrior",
        "element": "physical",
    },
    {
        "id": "hero_luna",
        "name": "Luna",
        "description": "Moonlight sorceress of the night",
        "archetype": "Mage",
        "element": "void",
    },
    {
        "id": "hero_aria",
        "name": "Aria",
        "description": "Divine songstress and healer",
        "archetype": "Paladin",
        "element": "lightning",
    },
    {
        "id": "hero_ironclad",
        "name": "Ironclad",
        "description": "Berserker warrior consumed by rage",
        "archetype": "Berserker",
        "element": "fire",
    },
    {
        "id": "hero_pyromancer",
        "name": "Pyromancer",
        "description": "Master of flame and destruction",
        "archetype": "Elementalist",
        "element": "fire",
    },
    {
        "id": "hero_frostweaver",
        "name": "Frostweaver",
        "description": "Ice queen of eternal winter",
        "archetype": "Mage",
        "element": "ice",
    },
    {
        "id": "hero_shadowdancer",
        "name": "Shadowdancer",
        "description": "Deadly assassin of the void",
        "archetype": "Assassin",
        "element": "void",
    },
    {
        "id": "hero_stormcaller",
        "name": "Stormcaller",
        "description": "Lightning goddess incarnate",
        "archetype": "Elementalist",
        "element": "lightning",
    },
]

# ============================================
# ENEMY DEFINITIONS - NSFW monster girls
# ============================================
ENEMIES = [
    # Basic enemies
    {"id": "enemy_slime", "name": "Slime Girl", "archetype": "Slime", "element": "physical", "difficulty": 1},
    {"id": "enemy_cultist", "name": "Dark Cultist", "archetype": "Cultist", "element": "void", "difficulty": 1},
    {"id": "enemy_jaw_worm", "name": "Jaw Worm", "archetype": "Brute", "element": "physical", "difficulty": 1},
    {"id": "enemy_spike_slime", "name": "Spike Slime", "archetype": "Slime", "element": "physical", "difficulty": 1},
    {"id": "enemy_gremlin_nob", "name": "Gremlin Nob", "archetype": "Brute", "element": "physical", "difficulty": 2},
    {"id": "enemy_fire_imp", "name": "Fire Imp", "archetype": "Mage", "element": "fire", "difficulty": 1},
    {"id": "enemy_frost_elemental", "name": "Frost Elemental", "archetype": "Golem", "element": "ice", "difficulty": 2},
    {"id": "enemy_storm_sprite", "name": "Storm Sprite", "archetype": "Mage", "element": "lightning", "difficulty": 1},
    {"id": "enemy_void_cultist", "name": "Void Cultist", "archetype": "Cultist", "element": "void", "difficulty": 2},
    {"id": "enemy_water_slime", "name": "Water Slime", "archetype": "Slime", "element": "ice", "difficulty": 1},
    {"id": "enemy_skeleton_warrior", "name": "Skeleton Warrior", "archetype": "Skeleton", "element": "physical", "difficulty": 1},
    {"id": "enemy_shadow_wraith", "name": "Shadow Wraith", "archetype": "Wraith", "element": "void", "difficulty": 2},
    {"id": "enemy_bone_golem", "name": "Bone Golem", "archetype": "Golem", "element": "physical", "difficulty": 2},
    {"id": "enemy_necromancer", "name": "Necromancer", "archetype": "Necromancer", "element": "void", "difficulty": 2},
    {"id": "enemy_shadow_lord", "name": "Shadow Lord", "archetype": "Necromancer", "element": "void", "difficulty": 2},
    # Elites
    {"id": "enemy_elite_slime", "name": "Queen Slime", "archetype": "Slime", "element": "physical", "difficulty": 2},
    {"id": "enemy_elite_cultist", "name": "High Priestess", "archetype": "Cultist", "element": "void", "difficulty": 2},
    {"id": "enemy_elite_fire_imp", "name": "Inferno Imp", "archetype": "Summoner", "element": "fire", "difficulty": 2},
    {"id": "enemy_elite_frost_elemental", "name": "Blizzard Queen", "archetype": "Golem", "element": "ice", "difficulty": 2},
    {"id": "enemy_elite_shadow_wraith", "name": "Phantom Empress", "archetype": "Wraith", "element": "void", "difficulty": 2},
    # Bosses
    {"id": "boss_necromancer", "name": "Necromancer Queen", "archetype": "BossNecromancer", "element": "void", "difficulty": 3},
    {"id": "boss_heart", "name": "Heart of Chaos", "archetype": "ChaosHeart", "element": "void", "difficulty": 3},
]

# ============================================
# CARD DEFINITIONS - Effects only, NO characters
# ============================================
CARDS = [
    # Starter cards
    {"id": "strike", "name": "Strike", "description": "Deal 6 damage", "theme": "attack", "element": "physical", "rarity": "starter"},
    {"id": "defend", "name": "Defend", "description": "Gain 5 block", "theme": "skill", "element": "physical", "rarity": "starter"},
    # Attack cards
    {"id": "bash", "name": "Bash", "description": "Deal 8 damage. Apply 2 Vulnerable.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "cleave", "name": "Cleave", "description": "Deal 8 damage to ALL enemies.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "pommel_strike", "name": "Pommel Strike", "description": "Deal 9 damage. Draw 1 card.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "twin_strike", "name": "Twin Strike", "description": "Deal 5 damage twice.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "wild_strike", "name": "Wild Strike", "description": "Deal 12 damage. Shuffle a Wound into your draw pile.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "iron_wave", "name": "Iron Wave", "description": "Gain 5 Block. Deal 5 damage.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "clothesline", "name": "Clothesline", "description": "Deal 12 damage. Apply 2 Weak.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "headbutt", "name": "Headbutt", "description": "Deal 9 damage. Place a card from discard on top of draw pile.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "body_slam", "name": "Body Slam", "description": "Deal damage equal to your Block.", "theme": "attack", "element": "physical", "rarity": "common"},
    {"id": "carnage", "name": "Carnage", "description": "Deal 20 damage. Ethereal.", "theme": "attack", "element": "physical", "rarity": "uncommon"},
    {"id": "rampage", "name": "Rampage", "description": "Deal 8 damage. Increase this card's damage by 5 this combat.", "theme": "attack", "element": "physical", "rarity": "uncommon"},
    {"id": "uppercut", "name": "Uppercut", "description": "Deal 13 damage. Apply 1 Weak. Apply 1 Vulnerable.", "theme": "attack", "element": "physical", "rarity": "uncommon"},
    {"id": "whirlwind", "name": "Whirlwind", "description": "Deal 5 damage to ALL enemies X times.", "theme": "attack", "element": "physical", "rarity": "uncommon"},
    {"id": "bludgeon", "name": "Bludgeon", "description": "Deal 32 damage.", "theme": "attack", "element": "physical", "rarity": "rare"},
    {"id": "immolate", "name": "Immolate", "description": "Deal 21 damage to ALL enemies. Add a Burn to discard pile.", "theme": "attack", "element": "fire", "rarity": "rare"},
    # Skill cards
    {"id": "shrug_it_off", "name": "Shrug It Off", "description": "Gain 8 Block. Draw 1 card.", "theme": "skill", "element": "physical", "rarity": "common"},
    {"id": "armaments", "name": "Armaments", "description": "Gain 5 Block. Upgrade a card in hand.", "theme": "skill", "element": "physical", "rarity": "common"},
    {"id": "battle_trance", "name": "Battle Trance", "description": "Draw 3 cards. You cannot draw additional cards this turn.", "theme": "skill", "element": "physical", "rarity": "uncommon"},
    {"id": "bloodletting", "name": "Bloodletting", "description": "Lose 3 HP. Gain 2 Energy.", "theme": "skill", "element": "physical", "rarity": "uncommon"},
    {"id": "seeing_red", "name": "Seeing Red", "description": "Gain 2 Energy. Exhaust.", "theme": "skill", "element": "physical", "rarity": "uncommon"},
    {"id": "disarm", "name": "Disarm", "description": "Enemy loses 2 Strength. Exhaust.", "theme": "skill", "element": "physical", "rarity": "uncommon"},
    {"id": "dual_wield", "name": "Dual Wield", "description": "Create a copy of an Attack or Power card in your hand.", "theme": "skill", "element": "physical", "rarity": "uncommon"},
    {"id": "entrench", "name": "Entrench", "description": "Double your Block.", "theme": "skill", "element": "physical", "rarity": "uncommon"},
    {"id": "flame_barrier", "name": "Flame Barrier", "description": "Gain 12 Block. When attacked this turn, deal 4 damage back.", "theme": "skill", "element": "fire", "rarity": "uncommon"},
    {"id": "ghostly_armor", "name": "Ghostly Armor", "description": "Gain 10 Block. Ethereal.", "theme": "skill", "element": "void", "rarity": "uncommon"},
    {"id": "impervious", "name": "Impervious", "description": "Gain 30 Block. Exhaust.", "theme": "skill", "element": "physical", "rarity": "rare"},
    {"id": "offering", "name": "Offering", "description": "Lose 6 HP. Gain 2 Energy. Draw 3 cards. Exhaust.", "theme": "skill", "element": "physical", "rarity": "rare"},
    # Power cards
    {"id": "inflame", "name": "Inflame", "description": "Gain 2 Strength.", "theme": "power", "element": "fire", "rarity": "common"},
    {"id": "metallicize", "name": "Metallicize", "description": "At the end of your turn, gain 3 Block.", "theme": "power", "element": "physical", "rarity": "uncommon"},
    {"id": "demon_form", "name": "Demon Form", "description": "At the start of each turn, gain 2 Strength.", "theme": "power", "element": "fire", "rarity": "rare"},
    {"id": "barricade", "name": "Barricade", "description": "Block is not removed at the start of your turn.", "theme": "power", "element": "physical", "rarity": "rare"},
    {"id": "berserk", "name": "Berserk", "description": "Gain 2 Vulnerable. At the start of your turn, gain 1 Energy.", "theme": "power", "element": "physical", "rarity": "rare"},
    {"id": "brutality", "name": "Brutality", "description": "At the start of your turn, lose 1 HP and draw 1 card.", "theme": "power", "element": "physical", "rarity": "rare"},
    {"id": "combust", "name": "Combust", "description": "At the end of turn, lose 1 HP and deal 5 damage to ALL enemies.", "theme": "power", "element": "fire", "rarity": "uncommon"},
    {"id": "dark_embrace", "name": "Dark Embrace", "description": "Whenever a card is Exhausted, draw 1 card.", "theme": "power", "element": "void", "rarity": "uncommon"},
    {"id": "feel_no_pain", "name": "Feel No Pain", "description": "Whenever a card is Exhausted, gain 3 Block.", "theme": "power", "element": "physical", "rarity": "uncommon"},
    {"id": "fire_breathing", "name": "Fire Breathing", "description": "Whenever you draw a Status or Curse, deal 6 damage to ALL enemies.", "theme": "power", "element": "fire", "rarity": "uncommon"},
    {"id": "juggernaut", "name": "Juggernaut", "description": "Whenever you gain Block, deal 5 damage to a random enemy.", "theme": "power", "element": "physical", "rarity": "rare"},
    {"id": "rupture", "name": "Rupture", "description": "Whenever you lose HP from a card, gain 1 Strength.", "theme": "power", "element": "physical", "rarity": "uncommon"},
    # Elemental cards
    {"id": "fireball", "name": "Fireball", "description": "Deal 15 damage. Apply 2 Burning.", "theme": "attack", "element": "fire", "rarity": "uncommon"},
    {"id": "frost_nova", "name": "Frost Nova", "description": "Deal 8 damage to ALL enemies. Apply 1 Frozen.", "theme": "attack", "element": "ice", "rarity": "uncommon"},
    {"id": "lightning_bolt", "name": "Lightning Bolt", "description": "Deal 12 damage. Apply 2 Charged.", "theme": "attack", "element": "lightning", "rarity": "common"},
    {"id": "void_rift", "name": "Void Rift", "description": "Deal 10 damage. Apply 1 Void Mark.", "theme": "attack", "element": "void", "rarity": "uncommon"},
    {"id": "ice_barrier", "name": "Ice Barrier", "description": "Gain 12 Block. Apply 1 Frozen to attacker.", "theme": "skill", "element": "ice", "rarity": "uncommon"},
    {"id": "static_field", "name": "Static Field", "description": "Whenever you play a Lightning card, deal 3 damage to ALL enemies.", "theme": "power", "element": "lightning", "rarity": "rare"},
    {"id": "cosmic_singularity", "name": "Cosmic Singularity", "description": "Deal 25 damage. If enemy dies, draw 2 cards.", "theme": "attack", "element": "void", "rarity": "rare"},
]


def wipe_images():
    """Delete all existing generated and public card images."""
    print("\n🗑️  Wiping existing images...")

    # Wipe generated directory
    if GENERATED_DIR.exists():
        count = len(list(GENERATED_DIR.glob("*.png"))) + len(list(GENERATED_DIR.glob("*.webp")))
        for f in GENERATED_DIR.glob("*.png"):
            f.unlink()
        for f in GENERATED_DIR.glob("*.webp"):
            f.unlink()
        print(f"   Deleted {count} files from {GENERATED_DIR}")

    # Wipe public cards (except .gitkeep)
    if PUBLIC_DIR.exists():
        count = 0
        for f in PUBLIC_DIR.glob("*"):
            if f.name != ".gitkeep":
                f.unlink()
                count += 1
        print(f"   Deleted {count} files from {PUBLIC_DIR}")


def generate_heroes(generator: CardArtGenerator, dry_run: bool = False) -> list[dict]:
    """Generate all hero images."""
    print(f"\n👸 Generating {len(HEROES)} hero images (NSFW anime waifus)...")
    results = []

    for i, hero in enumerate(HEROES):
        print(f"\n   [{i+1}/{len(HEROES)}] {hero['id']}: {hero['name']} ({hero['archetype']})")

        prompt = hero_to_prompt(
            name=hero["name"],
            description=hero["description"],
            archetype=hero["archetype"],
            element=hero["element"],
        )

        if dry_run:
            print(f"      Prompt: {prompt[:120]}...")
            results.append({"id": hero["id"], "status": "dry_run"})
            continue

        try:
            output_path = generator.save_card_art(
                card_id=hero["id"],
                prompt=prompt,
                format="webp",
            )
            print(f"      ✓ Saved: {output_path.name}")
            results.append({"id": hero["id"], "status": "success", "path": str(output_path)})
        except Exception as e:
            print(f"      ✗ Error: {e}")
            results.append({"id": hero["id"], "status": "error", "error": str(e)})

    return results


def generate_enemies(generator: CardArtGenerator, dry_run: bool = False) -> list[dict]:
    """Generate all enemy images."""
    print(f"\n👹 Generating {len(ENEMIES)} enemy images (NSFW monster girls)...")
    results = []

    for i, enemy in enumerate(ENEMIES):
        print(f"\n   [{i+1}/{len(ENEMIES)}] {enemy['id']}: {enemy['name']} ({enemy['archetype']})")

        prompt = enemy_to_prompt(
            name=enemy["name"],
            description=f"Seductive {enemy['archetype'].lower()} monster girl",
            archetype=enemy["archetype"],
            element=enemy["element"],
            difficulty=enemy["difficulty"],
        )

        if dry_run:
            print(f"      Prompt: {prompt[:120]}...")
            results.append({"id": enemy["id"], "status": "dry_run"})
            continue

        try:
            output_path = generator.save_card_art(
                card_id=enemy["id"],
                prompt=prompt,
                format="webp",
            )
            print(f"      ✓ Saved: {output_path.name}")
            results.append({"id": enemy["id"], "status": "success", "path": str(output_path)})
        except Exception as e:
            print(f"      ✗ Error: {e}")
            results.append({"id": enemy["id"], "status": "error", "error": str(e)})

    return results


def generate_cards(generator: CardArtGenerator, dry_run: bool = False) -> list[dict]:
    """Generate all card effect images (NO characters)."""
    print(f"\n🃏 Generating {len(CARDS)} card images (effects only, no characters)...")
    results = []

    for i, card in enumerate(CARDS):
        print(f"\n   [{i+1}/{len(CARDS)}] {card['id']}: {card['name']} ({card['theme']})")

        prompt = card_to_prompt(
            name=card["name"],
            description=card["description"],
            theme=card["theme"],
            element=card["element"],
            rarity=card["rarity"],
        )

        if dry_run:
            print(f"      Prompt: {prompt[:120]}...")
            results.append({"id": card["id"], "status": "dry_run"})
            continue

        try:
            output_path = generator.save_card_art(
                card_id=card["id"],
                prompt=prompt,
                format="webp",
            )
            print(f"      ✓ Saved: {output_path.name}")
            results.append({"id": card["id"], "status": "success", "path": str(output_path)})
        except Exception as e:
            print(f"      ✗ Error: {e}")
            results.append({"id": card["id"], "status": "error", "error": str(e)})

    return results


def copy_to_public(results: list[dict]):
    """Copy successfully generated images to public directory."""
    print(f"\n📁 Copying to {PUBLIC_DIR}...")
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    copied = 0
    for r in results:
        if r.get("status") == "success" and "path" in r:
            src = Path(r["path"])
            if src.exists():
                dst = PUBLIC_DIR / src.name
                shutil.copy2(src, dst)
                copied += 1

    print(f"   Copied {copied} images")
    return copied


def main():
    parser = argparse.ArgumentParser(description="Regenerate all images with NSFW focus")
    parser.add_argument("--heroes-only", action="store_true", help="Only generate heroes")
    parser.add_argument("--enemies-only", action="store_true", help="Only generate enemies")
    parser.add_argument("--cards-only", action="store_true", help="Only generate cards")
    parser.add_argument("--dry-run", action="store_true", help="Preview prompts without generating")
    parser.add_argument("--no-wipe", action="store_true", help="Don't delete existing images")
    parser.add_argument("--no-copy", action="store_true", help="Don't copy to public directory")
    args = parser.parse_args()

    # Determine what to generate
    generate_all = not (args.heroes_only or args.enemies_only or args.cards_only)

    print("=" * 60)
    print("🎨 PANDEMONIUM IMAGE REGENERATION")
    print("   NSFW/Erotic Fantasy Aesthetic")
    print("=" * 60)

    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No images will be generated")

    # Initialize generator
    generator = CardArtGenerator(output_dir=GENERATED_DIR)

    if not args.dry_run:
        print("\n🔌 Checking ComfyUI connection...")
        if not generator.check_connection():
            print("❌ ComfyUI not running! Start it with:")
            print("   ~/ai/comfyui/start_optimized.sh")
            sys.exit(1)
        print("   ✓ Connected to ComfyUI")

    # Wipe existing images
    if not args.no_wipe and not args.dry_run:
        wipe_images()

    # Track all results
    all_results = []
    start_time = time.time()

    # Generate based on flags
    if generate_all or args.heroes_only:
        results = generate_heroes(generator, args.dry_run)
        all_results.extend(results)

    if generate_all or args.enemies_only:
        results = generate_enemies(generator, args.dry_run)
        all_results.extend(results)

    if generate_all or args.cards_only:
        results = generate_cards(generator, args.dry_run)
        all_results.extend(results)

    # Copy to public
    if not args.dry_run and not args.no_copy:
        copy_to_public(all_results)

    # Summary
    elapsed = time.time() - start_time
    success = sum(1 for r in all_results if r.get("status") == "success")
    errors = sum(1 for r in all_results if r.get("status") == "error")

    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"   Total: {len(all_results)} images")
    print(f"   Success: {success}")
    print(f"   Errors: {errors}")
    print(f"   Time: {elapsed:.1f}s ({elapsed/max(len(all_results),1):.1f}s per image)")

    if errors > 0:
        print("\n⚠️  Failed images:")
        for r in all_results:
            if r.get("status") == "error":
                print(f"   - {r['id']}: {r.get('error', 'unknown')}")


if __name__ == "__main__":
    main()
