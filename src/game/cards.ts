import type { CardDefinition } from '../types'

// Card registry - all card definitions loaded here
const cardRegistry = new Map<string, CardDefinition>()

export function registerCard(card: CardDefinition): void {
  cardRegistry.set(card.id, card)
}

export function getCardDefinition(id: string): CardDefinition | undefined {
  return cardRegistry.get(id)
}

export function getAllCards(): CardDefinition[] {
  return Array.from(cardRegistry.values())
}

// Register starter cards
registerCard({
  id: 'strike',
  name: 'Strike',
  description: 'Deal 6 damage.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  effects: [{ type: 'damage', amount: 6 }],
})

registerCard({
  id: 'defend',
  name: 'Defend',
  description: 'Gain 5 Block.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  effects: [{ type: 'block', amount: 5 }],
})

registerCard({
  id: 'bash',
  name: 'Bash',
  description: 'Deal 8 damage. Apply 2 Vulnerable.',
  energy: 2,
  theme: 'attack',
  target: 'enemy',
  effects: [
    { type: 'damage', amount: 8 },
    { type: 'applyPower', powerId: 'vulnerable', amount: 2, target: 'enemy' },
  ],
})

registerCard({
  id: 'cleave',
  name: 'Cleave',
  description: 'Deal 8 damage to ALL enemies.',
  energy: 1,
  theme: 'attack',
  target: 'allEnemies',
  effects: [{ type: 'damage', amount: 8 }],
})

registerCard({
  id: 'pommel_strike',
  name: 'Pommel Strike',
  description: 'Deal 5 damage. Draw 1 card.',
  energy: 1,
  theme: 'attack',
  target: 'enemy',
  effects: [
    { type: 'damage', amount: 5 },
    { type: 'draw', amount: 1 },
  ],
})

registerCard({
  id: 'shrug_it_off',
  name: 'Shrug It Off',
  description: 'Gain 8 Block. Draw 1 card.',
  energy: 1,
  theme: 'skill',
  target: 'self',
  effects: [
    { type: 'block', amount: 8 },
    { type: 'draw', amount: 1 },
  ],
})
