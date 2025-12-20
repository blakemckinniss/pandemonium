import type { AtomicEffect } from '../types'

// Event choice condition
export interface EventCondition {
  type: 'hasGold' | 'hasHP' | 'hasDeckSize' | 'hasRelic'
  value: number | string
  comparison?: 'gte' | 'lte' | 'eq'
}

// Event choice with effects
export interface EventChoice {
  id: string
  text: string
  description: string
  effects: EventEffect[]
  condition?: EventCondition
}

// Event effect types (simplified from AtomicEffect for events)
export type EventEffect =
  | { type: 'gainGold'; amount: number }
  | { type: 'loseGold'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'damage'; amount: number }
  | { type: 'gainMaxHP'; amount: number }
  | { type: 'loseMaxHP'; amount: number }
  | { type: 'addCard'; cardId: string }
  | { type: 'removeRandomCard' }
  | { type: 'upgradeRandomCard' }
  | { type: 'addRelic'; relicId: string }
  | { type: 'addRandomRelic'; rarity?: 'common' | 'uncommon' | 'rare' }
  | { type: 'addCurse' }
  | { type: 'applyPower'; powerId: string; amount: number }
  | { type: 'gainStrength'; amount: number }
  | { type: 'gainDexterity'; amount: number }

// Event definition
export interface EventDefinition {
  id: string
  title: string
  description: string
  image?: string
  choices: EventChoice[]
}

// Event registry
const eventRegistry = new Map<string, EventDefinition>()

export function registerEvent(event: EventDefinition): void {
  eventRegistry.set(event.id, event)
}

export function getEventDefinition(id: string): EventDefinition | undefined {
  return eventRegistry.get(id)
}

export function getAllEvents(): EventDefinition[] {
  return Array.from(eventRegistry.values())
}

export function getRandomEvent(): EventDefinition | undefined {
  const events = getAllEvents()
  if (events.length === 0) return undefined
  return events[Math.floor(Math.random() * events.length)]
}

// ============================================
// EVENT DEFINITIONS
// ============================================

// Mysterious Chest - Risk/reward gold event
registerEvent({
  id: 'mysterious_chest',
  title: 'Mysterious Chest',
  description: 'A ornate chest sits in the corner, its lock broken. Something glints inside, but you sense danger.',
  image: '/cards/event_chest.webp',
  choices: [
    {
      id: 'open_chest',
      text: 'Open the Chest',
      description: '50% chance: Gain 100 Gold. 50% chance: Add a Curse to your deck.',
      effects: Math.random() > 0.5
        ? [{ type: 'gainGold', amount: 100 }]
        : [{ type: 'addCurse' }],
    },
    {
      id: 'leave_chest',
      text: 'Leave It',
      description: 'Better safe than sorry.',
      effects: [],
    },
  ],
})

// Shrine of Power - Sacrifice HP for strength
registerEvent({
  id: 'shrine_of_power',
  title: 'Shrine of Power',
  description: 'An ancient shrine pulses with dark energy. You feel it could grant you strength... for a price.',
  image: '/cards/event_shrine.webp',
  choices: [
    {
      id: 'pray',
      text: 'Offer Your Blood',
      description: 'Lose 10 Max HP. Gain 1 permanent Strength.',
      effects: [
        { type: 'loseMaxHP', amount: 10 },
        { type: 'gainStrength', amount: 1 },
      ],
    },
    {
      id: 'meditate',
      text: 'Meditate Quietly',
      description: 'Heal 15 HP.',
      effects: [{ type: 'heal', amount: 15 }],
    },
    {
      id: 'leave_shrine',
      text: 'Leave',
      description: 'This place gives you the creeps.',
      effects: [],
    },
  ],
})

// Traveling Merchant - Cheap card offer
registerEvent({
  id: 'traveling_merchant',
  title: 'Traveling Merchant',
  description: 'A hooded figure beckons from the shadows. "Psst... I have rare goods, friend. Special price, just for you."',
  image: '/cards/event_merchant.webp',
  choices: [
    {
      id: 'buy_card',
      text: 'Buy Mystery Card (50 Gold)',
      description: 'Pay 50 gold for a random uncommon card.',
      effects: [{ type: 'loseGold', amount: 50 }],
      condition: { type: 'hasGold', value: 50, comparison: 'gte' },
    },
    {
      id: 'buy_relic',
      text: 'Buy Mystery Relic (150 Gold)',
      description: 'Pay 150 gold for a random common relic.',
      effects: [
        { type: 'loseGold', amount: 150 },
        { type: 'addRandomRelic', rarity: 'common' },
      ],
      condition: { type: 'hasGold', value: 150, comparison: 'gte' },
    },
    {
      id: 'decline',
      text: 'Decline',
      description: '"Your loss, friend..."',
      effects: [],
    },
  ],
})

// Ancient Tome - Transform a card
registerEvent({
  id: 'ancient_tome',
  title: 'Ancient Tome',
  description: 'A dusty tome lies open on a pedestal. Its pages shimmer with arcane energy.',
  image: '/cards/event_tome.webp',
  choices: [
    {
      id: 'read_tome',
      text: 'Study the Tome',
      description: 'Upgrade a random card in your deck.',
      effects: [{ type: 'upgradeRandomCard' }],
    },
    {
      id: 'take_tome',
      text: 'Take the Tome',
      description: 'Gain 30 gold but add a Curse to your deck.',
      effects: [
        { type: 'gainGold', amount: 30 },
        { type: 'addCurse' },
      ],
    },
    {
      id: 'leave_tome',
      text: 'Leave',
      description: 'Some knowledge is best left undiscovered.',
      effects: [],
    },
  ],
})

// Healing Spring - Heal or upgrade
registerEvent({
  id: 'healing_spring',
  title: 'Healing Spring',
  description: 'Crystal-clear water bubbles up from the ground. Its warmth soothes your aching muscles.',
  image: '/cards/event_spring.webp',
  choices: [
    {
      id: 'drink',
      text: 'Drink Deeply',
      description: 'Heal to full HP.',
      effects: [{ type: 'heal', amount: 999 }],
    },
    {
      id: 'bathe',
      text: 'Bathe Your Weapons',
      description: 'Upgrade a random card.',
      effects: [{ type: 'upgradeRandomCard' }],
    },
  ],
})

// Dark Bargain - Remove card, lose max HP
registerEvent({
  id: 'dark_bargain',
  title: 'Dark Bargain',
  description: 'A spectral figure offers a trade. "I can make your burdens... disappear. For a small fee."',
  image: '/cards/event_specter.webp',
  choices: [
    {
      id: 'accept_bargain',
      text: 'Accept the Bargain',
      description: 'Remove a random card from your deck. Lose 5 Max HP.',
      effects: [
        { type: 'removeRandomCard' },
        { type: 'loseMaxHP', amount: 5 },
      ],
    },
    {
      id: 'decline_bargain',
      text: 'Decline',
      description: '"A pity... we could have been such good friends."',
      effects: [],
    },
  ],
})

// Fortune Teller - Scry-like preview
registerEvent({
  id: 'fortune_teller',
  title: 'Fortune Teller',
  description: 'An elderly woman peers at you through clouded eyes. "I see your future, child... would you like to know?"',
  image: '/cards/event_fortune.webp',
  choices: [
    {
      id: 'pay_fortune',
      text: 'Cross Her Palm (25 Gold)',
      description: 'Gain 5 Max HP and a blessing.',
      effects: [
        { type: 'loseGold', amount: 25 },
        { type: 'gainMaxHP', amount: 5 },
      ],
      condition: { type: 'hasGold', value: 25, comparison: 'gte' },
    },
    {
      id: 'rob_fortune',
      text: 'Rob Her',
      description: 'Gain 50 gold but add 2 Curses.',
      effects: [
        { type: 'gainGold', amount: 50 },
        { type: 'addCurse' },
        { type: 'addCurse' },
      ],
    },
    {
      id: 'leave_fortune',
      text: 'Leave',
      description: '"The future comes regardless, child..."',
      effects: [],
    },
  ],
})

// Golden Idol - High risk, high reward
registerEvent({
  id: 'golden_idol',
  title: 'Golden Idol',
  description: 'A gleaming golden idol sits on a pressure plate. Taking it would surely trigger something...',
  image: '/cards/event_idol.webp',
  choices: [
    {
      id: 'take_idol',
      text: 'Take the Idol',
      description: 'Gain 200 Gold. Take 25 damage.',
      effects: [
        { type: 'gainGold', amount: 200 },
        { type: 'damage', amount: 25 },
      ],
    },
    {
      id: 'leave_idol',
      text: 'Leave It',
      description: 'Not worth the risk.',
      effects: [],
    },
  ],
})
