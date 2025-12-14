# Visual System

## Overview

Visual feedback via GSAP animations, canvas particles, and floating combat numbers.

## GSAP Registered Effects

Located in `src/lib/animations.ts`. Use via `gsap.effects.<name>(target, config)`.

### Card Animations

| Effect | Purpose |
|--------|---------|
| `dealCards` | Fan cards into hand from deck position |
| `playCard` | Card flies to target, scales up, fades |
| `discardHand` | All hand cards sweep off-screen |
| `discardCard` | Single card discards with rotation |
| `exhaustCard` | Card burns/fades (removed from combat) |
| `etherealExhaust` | Ethereal card auto-exhaust effect |
| `cardHover` | Scale up on mouse enter |
| `cardUnhover` | Scale down on mouse leave |
| `snapBack` | Card returns to original position |
| `upgradeCard` | Glow + scale pulse on upgrade |
| `retainCard` | Subtle glow for retained cards |
| `transformCard` | Morph effect when card changes |
| `putOnDeck` | Card flies back to deck |
| `cardGlow` | Theme-colored glow pulse |
| `cardPlayFlash` | Flash effect when card played |

### Entity Animations

| Effect | Purpose |
|--------|---------|
| `shake` | Damage feedback shake |
| `enemyHit` | Enemy receives damage |
| `enemyShake` | Enemy shake on block |
| `pulse` | Generic scale pulse |
| `maxHealthPulse` | HP change flash |
| `statusPulse` | Status/element visual pulse |

### UI Animations

| Effect | Purpose |
|--------|---------|
| `floatNumber` | Damage/heal numbers float up |
| `shuffleDeck` | Deck shuffle visual |
| `powerIcon` | Power icon appears |
| `powerIconRemove` | Power icon fades |
| `energyPulse` | Energy orb pulse |

### Utilities

```typescript
// Get element center for positioning
getElementCenter(el: Element): { x: number, y: number }

// Kill all active tweens (cleanup)
killAllTweens(): void
```

## Particle System

Located in `src/components/ParticleEffects/`.

### ParticleEffects Component

Canvas-based particle renderer. Add to combat screen:

```tsx
<ParticleEffects containerRef={containerRef} />
```

### Particle Types

Defined in `PARTICLE_CONFIG`:

| Type | Color | Use Case |
|------|-------|----------|
| `attack` | Red | Attack card played |
| `skill` | Blue | Skill card played |
| `power` | Purple | Power card played |
| `block` | Gray | Block gained |
| `heal` | Green | Healing |
| `poison` | Dark green | Poison damage |
| `energy` | Yellow | Energy gained |
| `spark` | White | Generic sparkle |
| `critical` | Orange | Critical hits |
| `combo` | Multi-color | Elemental combos |
| `upgrade` | Gold | Card upgraded |
| `transform` | Cyan | Card transformed |
| `retain` | Soft blue | Card retained |

### emitParticle API

```typescript
type ParticleType = 'attack' | 'skill' | 'power' | 'block' | 'heal' | 
                    'poison' | 'energy' | 'spark' | 'critical' | 
                    'combo' | 'upgrade' | 'transform' | 'retain'

emitParticle(
  type: ParticleType,
  x: number,      // Canvas x position
  y: number,      // Canvas y position
  count?: number  // Number of particles (default from config)
): void
```

### Particle Interface

```typescript
interface Particle {
  x: number
  y: number
  vx: number       // Velocity X
  vy: number       // Velocity Y
  life: number     // Current life
  maxLife: number  // Starting life
  size: number
  color: string
  type: ParticleType
}
```

## Combat Numbers

Located in `src/components/CombatNumbers/`.

### CombatNumber Interface

```typescript
interface CombatNumber {
  id: string
  value: number
  type: 'damage' | 'heal' | 'block' | 'poison'
  variant?: 'piercing' | 'combo' | 'chain' | 'execute' | 'poison'
  element?: Element
  comboName?: string
  label?: string
  targetId: string
  x: number
  y: number
}
```

### Variants

| Variant | Visual |
|---------|--------|
| `piercing` | Blue, ignores block indicator |
| `combo` | Rainbow, shows combo name |
| `chain` | Lightning, chain damage |
| `execute` | Skull icon, lethal |
| `poison` | Green, poison tick |

### Element Colors

Numbers colored by element:
- `fire` → Orange
- `ice` → Cyan
- `lightning` → Yellow
- `physical` → Gray
- `void` → Purple

## Integration Flow

1. State change triggers effect (e.g., `playCard` action)
2. Component detects change via `useEffect`
3. GSAP effect plays on DOM element
4. `emitParticle()` called for particle burst
5. `CombatNumber` added to visualQueue
6. Numbers animate and remove themselves

## Adding Effects

### New GSAP Effect

```typescript
// In animations.ts
gsap.registerEffect({
  name: 'myEffect',
  effect: (targets, config) => {
    return gsap.timeline()
      .to(targets, { scale: 1.2, duration: 0.2 })
      .to(targets, { scale: 1, duration: 0.2 })
  },
  defaults: { duration: 0.4 },
  extendTimeline: true
})
```

### New Particle Type

```typescript
// In ParticleEffects.tsx, add to PARTICLE_CONFIG
myType: {
  color: '#ff0000',
  count: 10,
  speed: 3,
  size: 4,
  life: 30
}
```
