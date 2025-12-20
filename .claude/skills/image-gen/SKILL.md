---
name: image-gen
description: >
  Generate card and room images via ComfyUI with proper prompts.
  Use when creating art, generating images, missing card images, or
  working with visual assets. Triggers: "generate image", "card art",
  "missing image", "ComfyUI", "room image", "create artwork", "batch images".
---

# Image Generation Skill

Use this skill when generating visual assets for Pandemonium cards and rooms.

## Quick Commands

```bash
# Start ComfyUI (if not running)
~/ai/comfyui/start_optimized.sh

# Check ComfyUI status
curl -s http://localhost:8188/system_stats | jq .

# Start image-gen API
cd services/image-gen && source .venv/bin/activate && python server.py

# Batch generate cards
cd services/image-gen && python batch.py --copy-to-public

# Generate specific cards
cd services/image-gen && python batch.py --cards strike,defend --copy-to-public
```

## Architecture

```
services/image-gen/
├── server.py      # FastAPI server (port 8420)
├── comfy.py       # ComfyUI API client
├── prompts.py     # card_to_prompt(), room_to_prompt()
├── batch.py       # Batch generation script
├── generated/     # Raw output from ComfyUI
└── .venv/         # Python environment

public/cards/      # Final WebP images served by app
```

## Prompt Generation

### Card Prompts (prompts.py)

```python
from prompts import card_to_prompt

prompt = card_to_prompt(
    name="Fireball",
    description="Deal 12 damage to all enemies.",
    theme="attack",        # attack | skill | power | curse | status
    element="fire",        # physical | fire | ice | lightning | void
    rarity="uncommon",     # starter | common | uncommon | rare
)
```

### Element Visual Styles

| Element | Colors | Effects |
|---------|--------|---------|
| physical | steel grey, silver | impact lines, motion blur |
| fire | orange, red, yellow | flames, embers, heat |
| ice | cyan, light blue, white | crystals, frost, mist |
| lightning | electric blue, purple | bolts, arcs, plasma |
| void | deep purple, black | tendrils, distortion |

### Theme Styles

| Theme | Composition | Mood |
|-------|-------------|------|
| attack | dynamic action pose | aggressive, powerful |
| skill | defensive/utility focus | tactical, protective |
| power | aura emanating, glowing | mystical, enhanced |
| curse | corrupted, twisted | malevolent, haunting |

## Room Image Generation

Room prompts focus on environments, not characters:

```python
def room_to_prompt(room_id: str, room_type: str, element: str) -> str:
    # Dungeon environment scene
    # Element-based atmosphere
    # Room type styling
```

Output: `public/cards/room_<id>.webp`

## Batch Generation

```bash
# Generate all cards missing images
python batch.py --copy-to-public

# Generate specific cards
python batch.py --cards fireball,ice_shard --copy-to-public

# Generate room images
python batch.py --rooms slime_pit,void_shrine --copy-to-public

# Dry run (show what would be generated)
python batch.py --dry-run
```

## API Endpoints (port 8420)

```bash
# Generate single card
curl -X POST http://localhost:8420/generate/card \
  -H "Content-Type: application/json" \
  -d '{"card_id": "strike"}'

# Check status
curl http://localhost:8420/status

# List generated images
curl http://localhost:8420/generated
```

## Image Specs

- Format: WebP
- Size: 512x768 (card aspect ratio)
- Location: `public/cards/<id>.webp`
- Naming: `card_id.webp` for cards, `room_<id>.webp` for rooms

## Troubleshooting

### ComfyUI not responding
```bash
# Check if running
pgrep -f comfyui

# Restart
pkill -f comfyui && ~/ai/comfyui/start_optimized.sh
```

### GPU memory issues
```bash
# Clear VRAM
nvidia-smi --gpu-reset

# Use lower resolution
python batch.py --width 384 --height 576
```

## Key Files

- `services/image-gen/prompts.py` - Prompt generation logic
- `services/image-gen/batch.py` - Batch processing
- `services/image-gen/comfy.py` - ComfyUI API wrapper
- `~/ai/comfyui/` - ComfyUI installation
