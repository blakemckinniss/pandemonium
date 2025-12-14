# AI Card Generator

## Overview

Uses Groq SDK to generate procedural cards via LLM. Located in `src/game/card-generator.ts`.

## Generation Options

```typescript
interface GenerationOptions {
  theme?: 'attack' | 'skill' | 'power'
  rarity?: 'common' | 'uncommon' | 'rare'
  element?: Element
  effectType?: string     // Specific effect to include
  hint?: string           // Natural language hint for generation
}
```

## Key Functions

```typescript
// Generate a random card with constraints
generateRandomCard(options?: GenerationOptions): Promise<CardDefinition>

// Validate generated card structure
validateCard(card: unknown): CardDefinition | null

// Parse LLM response into card
parseCardResponse(response: string): CardDefinition | null

// Load generated cards into runtime registry
loadGeneratedCardsIntoRegistry(cards: CardDefinition[]): void
```

## Validation Functions

Separate validators ensure generated content is valid:
- `validateTheme(theme)` - Check attack/skill/power
- `validateRarity(rarity)` - Check common/uncommon/rare
- `validateTarget(target)` - Check enemy/self/all_enemies/none
- `validateElement(element)` - Check valid element
- `validateEffect(effect)` - Validate effect structure and amounts

## System Prompt

`SYSTEM_PROMPT` constant defines:
- Game context (Slay the Spire style)
- Available effect types
- Card structure requirements
- Balance guidelines

## Helpers

```typescript
// Convert rarity to numeric value for balance
rarityToNum(rarity: Rarity): number

// Convert theme to numeric value
themeToNum(theme: CardTheme): number

// Pick random from array
pickRandom<T>(arr: T[]): T

// Clamp value to range
clamp(value: number, min: number, max: number): number

// Generate card description from effects
generateDescription(effects: AtomicEffect[]): string
```

## Usage

```typescript
// Generate attack card with fire element
const card = await generateRandomCard({
  theme: 'attack',
  element: 'fire',
  rarity: 'uncommon'
})
```
