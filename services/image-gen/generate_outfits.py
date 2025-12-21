#!/usr/bin/env python3
"""Generate outfit images for hero gallery."""

import shutil
import time
from pathlib import Path

import httpx

API_URL = "http://localhost:8420"
POLL_INTERVAL = 2
TIMEOUT = 120.0
PUBLIC_CARDS = Path(__file__).parent.parent.parent / "public" / "cards"

# Outfit definitions matching src/types/affection.ts
OUTFITS = [
    # Sakura outfits (fire mage)
    {
        "id": "hero_sakura_casual",
        "name": "Sakura",
        "description": "Off-duty fire mage in relaxed attire",
        "theme": "hero",
        "archetype": "Mage",
        "element": "fire",
        "custom_hint": (
            "casual_clothes, oversized_sweater, shoulder_exposed, "
            "relaxed_pose, cozy, off_duty, comfortable, bare_legs, sitting"
        ),
    },
    {
        "id": "hero_sakura_elegant",
        "name": "Sakura",
        "description": "Moonlit Blossom - elegant evening gown",
        "theme": "hero",
        "archetype": "Mage",
        "element": "fire",
        "custom_hint": (
            "evening_gown, elegant_dress, silver_accents, cherry_blossom_petals, "
            "moonlight, formal, ball_gown, deep_neckline, backless_dress"
        ),
    },
    {
        "id": "hero_sakura_devoted",
        "name": "Sakura",
        "description": "Sacred Bond - ceremonial bridal outfit",
        "theme": "hero",
        "archetype": "Mage",
        "element": "fire",
        "custom_hint": (
            "wedding_dress, bridal, white_lingerie, ceremonial, veil, "
            "intimate, devoted_expression, blushing_bride, romantic"
        ),
    },
    # Luna outfits (ice sorceress)
    {
        "id": "hero_luna_casual",
        "name": "Luna",
        "description": "Twilight Rest - comfortable stargazing attire",
        "theme": "hero",
        "archetype": "Mage",
        "element": "ice",
        "custom_hint": (
            "pajamas, nightgown, sleepwear, silk_robe, stargazing, "
            "dreamy_expression, relaxed, moonlit, sheer_nightgown, bedroom"
        ),
    },
    {
        "id": "hero_luna_elegant",
        "name": "Luna",
        "description": "Celestial Empress - regal night sky gown",
        "theme": "hero",
        "archetype": "Mage",
        "element": "ice",
        "custom_hint": (
            "empress_gown, royal_dress, star_pattern, galaxy_dress, regal, "
            "crown, commanding_pose, sparkling, cosmic, ethereal_beauty"
        ),
    },
    {
        "id": "hero_luna_devoted",
        "name": "Luna",
        "description": "Eternal Eclipse - otherworldly surrender",
        "theme": "hero",
        "archetype": "Mage",
        "element": "ice",
        "custom_hint": (
            "eclipse_themed, dark_lingerie, celestial, surrendering_pose, "
            "intimate_trust, moonlight_glow, ethereal, vulnerable_beauty"
        ),
    },
    # Aria outfits (storm knight)
    {
        "id": "hero_aria_casual",
        "name": "Aria",
        "description": "Wind's Whisper - flowing breezy garments",
        "theme": "hero",
        "archetype": "Assassin",
        "element": "lightning",
        "custom_hint": (
            "flowing_dress, sundress, wind_blown, dancing_fabric, playful, "
            "carefree, light_clothing, summer_dress, breeze"
        ),
    },
    {
        "id": "hero_aria_elegant",
        "name": "Aria",
        "description": "Tempest Queen - electrifying royal attire",
        "theme": "hero",
        "archetype": "Assassin",
        "element": "lightning",
        "custom_hint": (
            "queen_attire, electric_dress, lightning_accents, powerful_pose, "
            "crackling_energy, dominant, leather_and_metal, storm_queen, fierce"
        ),
    },
    {
        "id": "hero_aria_devoted",
        "name": "Aria",
        "description": "Heart of the Storm - calm eternal passion",
        "theme": "hero",
        "archetype": "Assassin",
        "element": "lightning",
        "custom_hint": (
            "storm_bride, passionate, calm_center, intimate, electric_lingerie, "
            "devoted, loving_gaze, vulnerable_power, charged_atmosphere"
        ),
    },
]


def generate_outfit(outfit: dict) -> dict:
    """Generate a single outfit image via batch API."""
    print(f"Generating {outfit['id']}...")

    resp = httpx.post(
        f"{API_URL}/batch/start",
        json={"cards": [outfit], "format": "webp"},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    job = resp.json()
    job_id = job["job_id"]

    # Poll for completion
    while True:
        status = httpx.get(f"{API_URL}/batch/{job_id}").json()
        if status["status"] == "completed":
            return status["results"][0]
        if status["status"] == "error":
            raise RuntimeError(f"Job failed: {status}")
        time.sleep(POLL_INTERVAL)


def copy_to_public(filename: str, outfit_id: str) -> None:
    """Copy generated image to public/cards/."""
    src = Path(__file__).parent / "generated" / filename
    dst = PUBLIC_CARDS / f"{outfit_id}.webp"
    if src.exists():
        shutil.copy(src, dst)
        print(f"  Copied to {dst}")


def main() -> None:
    """Generate all outfit images."""
    print(f"Generating {len(OUTFITS)} outfit images...")
    print(f"Output: {PUBLIC_CARDS}")
    print()

    for outfit in OUTFITS:
        try:
            result = generate_outfit(outfit)
            if result["status"] == "success":
                copy_to_public(Path(result["path"]).name, outfit["id"])
            else:
                print(f"  FAILED: {result.get('error', 'Unknown error')}")
        except Exception as e:
            print(f"  ERROR: {e}")
        print()

    print("Done!")


if __name__ == "__main__":
    main()
