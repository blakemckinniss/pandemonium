# Pandemonium - Project Overview

## Purpose
**Slay the Spire inspired roguelike card game** with drag-and-drop combat. A deck-building roguelike where players fight through rooms using cards with various effects.

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
| AI | Groq SDK |

## Key Dependencies

```json
{
  "react": "^19.2.0",
  "zustand": "^5.0.9",
  "immer": "^11.0.1",
  "gsap": "^3.14.2",
  "dexie": "^4.2.1",
  "three": "^0.182.0",
  "groq-sdk": "^0.37.0",
  "tailwindcss": "^4.1.18"
}
```

## Game Flow

```
roomSelect → combat → reward → roomSelect → ... → gameOver
     ↓           ↓
  RoomSelect  GameScreen
              (victory/defeat overlays)
```

## Platform
- **Dev Server**: `npm run dev` (Vite HMR)
- **Build**: `npm run build` (tsc + vite)
- **Test**: `npm run test` (Vitest)
