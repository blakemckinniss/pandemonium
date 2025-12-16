# Pandemonium - Project Overview

## Purpose
**Slay the Spire inspired roguelike card game** with drag-and-drop combat. A deck-building roguelike where players fight through themed dungeons using cards with various effects.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5.9 |
| Bundler | Vite 7 |
| Animation | GSAP + Draggable + Flip |
| State (combat) | useState + Immer |
| State (meta) | Zustand (localStorage) |
| Persistence | Dexie (IndexedDB) |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + jsdom + fake-indexeddb |
| 3D | Three.js (ambient effects) |
| AI | Groq SDK (card/dungeon generation) |

## Key Features

- **Hero System**: Heroes with passive, activated, and ultimate abilities
- **Dungeon Decks**: Themed dungeon progressions with varied room types
- **Enemy Cards**: Enemies defined as cards with abilities and ultimates
- **Elemental Combat**: 5 elements with combo system
- **Power/Buff System**: 29+ powers with triggers and modifiers
- **Relic System**: Passive items with various triggers
- **Selection Effects**: Scry, tutor, discover, banish mechanics

## Game Flow

```
MenuScreen (dungeon selection)
    ↓
RoomSelect (choose room)
    ↓
[Room Type]
├── combat/elite → GameScreen → RewardScreen
├── boss → GameScreen → DungeonComplete
├── campfire → CampfireScreen
└── treasure → TreasureScreen
    ↓
Next Room or Run End
```

## Commands

```bash
npm run dev      # Development server (Vite HMR)
npm run build    # Production build (tsc + vite)
npm run test     # Run tests (Vitest)
npm run preview  # Preview production build
```

## Repository

**GitHub**: https://github.com/blakemckinniss/pandemonium

## MVP Policy

**No backwards compatibility.** Move fast, break things:
- Breaking schema changes? Wipe IndexedDB
- Breaking game logic? Delete old code
- Reset DB: `indexedDB.deleteDatabase('PandemoniumDB')`
