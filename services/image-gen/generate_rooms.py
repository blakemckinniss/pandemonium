#!/usr/bin/env python3
"""Generate missing Shadow Crypt room images."""

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from generator import CardArtGenerator
from prompts import room_to_prompt

# Shadow Crypt rooms (void element)
ROOMS_TO_GENERATE = [
    {
        "id": "bone_yard",
        "name": "Bone Yard",
        "description": "Skeletons rise from ancient graves",
        "room_type": "combat",
        "element": "void",
    },
    {
        "id": "shadow_passage",
        "name": "Shadow Passage",
        "description": "Wraiths drift through the darkness",
        "room_type": "combat",
        "element": "void",
    },
    {
        "id": "crypt_depths",
        "name": "Crypt Depths",
        "description": "Ancient bones guard forbidden secrets",
        "room_type": "combat",
        "element": "void",
    },
    {
        "id": "necropolis",
        "name": "Necropolis",
        "description": "A bone golem guards the crypt entrance",
        "room_type": "elite",
        "element": "void",
    },
    {
        "id": "dark_sanctum",
        "name": "Dark Sanctum",
        "description": "A necromancer performs dark rituals",
        "room_type": "elite",
        "element": "void",
    },
    {
        "id": "shadow_throne",
        "name": "Shadow Throne",
        "description": "The master of death awaits on his throne of bones",
        "room_type": "boss",
        "element": "void",
    },
]


def main():
    output_dir = Path(__file__).parent / "generated"
    public_dir = Path(__file__).parent.parent.parent / "public" / "cards"

    generator = CardArtGenerator(output_dir=output_dir)

    print("Checking ComfyUI connection...")
    if not generator.check_connection():
        print("ERROR: ComfyUI not running!")
        sys.exit(1)
    print("ComfyUI connected!\n")

    for room in ROOMS_TO_GENERATE:
        room_id = room["id"]
        print(f"Generating: room_{room_id}")

        prompt = room_to_prompt(
            name=room["name"],
            description=room["description"],
            room_type=room["room_type"],
            element=room["element"],
        )
        print(f"  Prompt: {prompt[:80]}...")

        try:
            output_path = generator.save_card_art(
                card_id=f"room_{room_id}",
                prompt=prompt,
                format="webp",
            )
            print(f"  Generated: {output_path}")

            # Copy to public
            dst = public_dir / f"room_{room_id}.webp"
            shutil.copy2(output_path, dst)
            print(f"  Copied to: {dst}\n")

        except Exception as e:
            print(f"  ERROR: {e}\n")

    print("Done!")


if __name__ == "__main__":
    main()
