# Style & Conventions

## TypeScript

### Types Location
**ALL types in `src/types/index.ts`** - single source of truth. Never define interfaces elsewhere.

### Naming
- **Interfaces**: `PascalCase` (e.g., `CardDefinition`, `CombatState`, `Entity`)
- **Type aliases**: `PascalCase` (e.g., `CardTarget`, `GamePhase`)
- **Functions**: `camelCase` (e.g., `applyAction`, `createCardInstance`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `CARDS`, `MONSTERS`, `ROOMS`)
- **Components**: `PascalCase` (e.g., `Card`, `Hand`, `GameScreen`)

### IDs & UIDs
- **Definition IDs**: String identifiers for templates (e.g., `'strike'`, `'defend'`)
- **Runtime UIDs**: Use `generateUid()` from `lib/utils.ts` for instances

## React Patterns

### State Management
- **Combat state**: `useState` + Immer via `applyAction()`
- **Meta state**: Zustand store (`metaStore.ts`)
- **Persistence**: Dexie for IndexedDB (`db.ts`)

### State Mutations
All combat changes through `applyAction()`:
```typescript
setState(prev => applyAction(prev, { type: 'playCard', cardUid, targetId }))
```

### Card Variants
Unified `<Card>` component with 4 variants:
- `hand` - Playable cards in player's hand
- `player` - Player entity on field
- `enemy` - Enemy entities on field
- `room` - Room selection cards

## Effects System

Card effects are **declarative objects**, not imperative code:
```typescript
{
  id: 'strike',
  effects: [{ type: 'damage', amount: 6 }],
}
```

Applied in `applyCardEffects()` within actions.ts.

## Animation

GSAP effects registered in `lib/animations.ts`:
- `dealCards` - Fan cards into hand
- `playCard` - Card flies to target
- `discardHand` - Cards sweep away
- `floatNumber` - Damage numbers float up
- `shake` - Hit feedback

## Styling

- **Tailwind v4** for all styling
- Utility classes in JSX
- Custom animations in `index.css`

## File Organization

- One component per directory with `index.tsx`
- Colocate styles if component-specific
- Keep related logic together (colocation > decoupling)
