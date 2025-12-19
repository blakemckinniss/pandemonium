import type { CardInstance } from '../../types'

// ============================================================================
// Card Instance Factory
// ============================================================================

export interface CardOptions extends Partial<CardInstance> {
  /** Alias for definitionId */
  id?: string
}

let cardCounter = 0

/** Reset card counter (useful between tests) */
export function resetCardCounter(): void {
  cardCounter = 0
}

/**
 * Create a card instance
 * @param definitionId - Card definition ID (e.g., 'strike', 'defend')
 * @param options - Additional options
 */
export function createCard(
  definitionId: string = 'strike',
  options: CardOptions = {}
): CardInstance {
  const { id, ...overrides } = options
  cardCounter++

  return {
    uid: overrides.uid ?? `card_${definitionId}_${cardCounter}`,
    definitionId: id ?? definitionId,
    upgraded: false,
    ...overrides,
  }
}

/** Alias for backwards compatibility */
export const createCardInstance = createCard

// ============================================================================
// Deck/Pile Builders
// ============================================================================

/**
 * Create a deck from card definition IDs
 * @example createDeck(['strike', 'strike', 'defend', 'bash'])
 */
export function createDeck(cardIds: string[]): CardInstance[] {
  return cardIds.map((id, index) => createCard(id, { uid: `deck_${id}_${index}` }))
}

/**
 * Create a hand from card definition IDs (shorter UIDs for readability)
 */
export function createHand(cardIds: string[]): CardInstance[] {
  return cardIds.map((id, index) => createCard(id, { uid: `hand_${id}_${index}` }))
}

// ============================================================================
// Pre-built Deck Configurations
// ============================================================================

export const DECKS = {
  /** Standard starter deck: 4x Strike, 4x Defend, 2x Bash */
  starter: () => createDeck([
    'strike', 'strike', 'strike', 'strike',
    'defend', 'defend', 'defend', 'defend',
    'bash', 'bash',
  ]),

  /** All strikes */
  allStrikes: (count = 5) => createDeck(Array<string>(count).fill('strike')),

  /** All defends */
  allDefends: (count = 5) => createDeck(Array<string>(count).fill('defend')),

  /** Mixed deck */
  mixed: (strikes = 3, defends = 2) => createDeck([
    ...Array<string>(strikes).fill('strike'),
    ...Array<string>(defends).fill('defend'),
  ]),

  /** Empty deck */
  empty: () => [] as CardInstance[],

  /** Single card deck */
  single: (cardId: string) => createDeck([cardId]),
} as const

// ============================================================================
// Pile Builder
// ============================================================================

export interface PileOptions {
  /** Card definition IDs */
  cards?: string[]
  /** Pre-built card instances */
  instances?: CardInstance[]
}

/**
 * Create a pile (hand, draw, discard, exhaust)
 */
export function createPile(options: PileOptions): CardInstance[] {
  if (options.instances) return options.instances
  return options.cards?.map((id, i) => createCard(id, { uid: `pile_${id}_${i}` })) ?? []
}
