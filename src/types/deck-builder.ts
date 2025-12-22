// ============================================
// DECK BUILDER SYSTEM TYPES
// ============================================
// Evergreen deck system with extensible hook pipeline
// for heroes, modifiers, relics, and dungeons.

import type { ModifierInstance } from './modifiers'
import type { RelicInstance } from './relics'

// ============================================
// COLLECTION CARD POOL
// ============================================

/** Categories for collection cards */
export type CollectionCategory =
  | 'attack_basic' // Pure damage
  | 'attack_utility' // Damage + draw/energy
  | 'attack_debuff' // Damage + debuffs
  | 'defense_basic' // Pure block
  | 'defense_utility' // Block + draw/utility
  | 'defense_heal' // Healing
  | 'utility_draw' // Card manipulation
  | 'utility_energy' // Energy manipulation
  | 'utility_discard' // Discard synergy
  | 'power_buff' // Self buffs
  | 'power_debuff' // Enemy debuffs

/** Metadata for collection cards */
export interface CollectionCardMeta {
  cardId: string
  category: CollectionCategory
  complexity: 1 | 2 | 3 // 1=simple, 2=moderate, 3=advanced
  unlockCondition: UnlockCondition
}

// ============================================
// UNLOCK CONDITIONS
// ============================================

/** Conditions for unlocking collection cards */
export type UnlockCondition =
  | { type: 'always' } // Base pool - always available
  | { type: 'totalWins'; count: number }
  | { type: 'streakReached'; streak: number }
  | { type: 'dungeonClear'; dungeonId: string }
  | { type: 'heroAffection'; heroId: string; level: number }
  | { type: 'achievement'; achievementId: string }

// ============================================
// DECK BUILDER CONTEXT
// ============================================

/** Context passed to deck builder pipeline */
export interface DeckBuilderContext {
  /** Hero card ID (e.g., 'hero_sakura') */
  heroCardId: string
  /** Active modifiers for the run */
  modifiers: ModifierInstance[]
  /** Active relics for the run */
  relics: RelicInstance[]
  /** Dungeon being entered (if any) */
  dungeonId?: string
  /** Cards in carry slots */
  carrySlots: CarrySlot[]
  /** IDs of unlocked collection cards */
  unlockedCollectionIds: string[]
}

/** Result from deck builder pipeline */
export interface DeckBuilderResult {
  /** Final card IDs for the deck */
  cardIds: string[]
  /** IDs of hooks that were applied */
  appliedHooks: string[]
  /** Cards added via bonus hooks */
  bonusCards: string[]
  /** Cards that were swapped by hooks */
  swappedCards: Array<{ original: string; replacement: string }>
}

// ============================================
// DECK HOOKS (EXTENSIBLE PIPELINE)
// ============================================

/**
 * Hook phases in the deck building pipeline.
 * Hooks execute in this order within each phase, sorted by priority.
 */
export type DeckHookPhase =
  | 'filter' // Modify available pool before selection
  | 'select' // Modify selection logic (rarely used)
  | 'swap' // Replace selected cards with themed variants
  | 'bonus' // Add extra cards on top of base deck
  | 'finalize' // Final modifications before deck is created

/** Sources that can provide deck hooks */
export type DeckHookSource =
  | 'hero'
  | 'modifier'
  | 'relic'
  | 'dungeon'
  | 'carrySlot'
  | 'achievement'
  | 'meta' // Meta-progression bonuses

/** A hook that modifies deck building */
export interface DeckHook {
  /** Unique identifier for this hook */
  id: string
  /** Which phase this hook runs in */
  phase: DeckHookPhase
  /** Lower priority runs first (0-100) */
  priority: number
  /** What provided this hook */
  source: DeckHookSource
  /** ID of the source (hero ID, modifier ID, etc.) */
  sourceId: string
  /** Description for UI/debugging */
  description?: string
}

/** Result from applying a deck hook */
export interface DeckHookResult {
  /** Modified card pool/selection */
  cards: string[]
  /** Cards that were swapped (for swap phase) */
  swaps?: Array<{ original: string; replacement: string }>
  /** Cards to add (for bonus phase) */
  bonuses?: string[]
}

/**
 * Deck hook definition with apply function.
 * This is what heroes, modifiers, etc. register.
 */
export interface DeckHookDefinition extends DeckHook {
  /** Apply the hook to cards */
  apply: (cards: string[], context: DeckBuilderContext) => DeckHookResult
}

// ============================================
// CARRY SLOTS (CROSS-DUNGEON PERSISTENCE)
// ============================================

/** Source of a card in a carry slot */
export type CarrySlotSource =
  | 'dungeonClear' // Reward for completing a dungeon
  | 'streakReward' // Reward for maintaining a win streak
  | 'purchase' // Bought from shop/meta-progression
  | 'event' // Special event reward

/** A card preserved across dungeon runs */
export interface CarrySlot {
  /** Slot index (0-2, max 3 slots) */
  slotIndex: 0 | 1 | 2
  /** Card definition ID */
  cardId: string
  /** Whether this card survives death/abandonment */
  protected: boolean
  /** How this slot was acquired */
  source: CarrySlotSource
  /** Timestamp when acquired */
  acquiredAt: number
}

// ============================================
// PERSISTENCE RECORDS (FOR DEXIE)
// ============================================

/** Record of an unlocked collection card */
export interface CollectionUnlockRecord {
  id?: number
  cardId: string
  unlockedAt: Date
  unlockSource: 'win' | 'dungeon' | 'streak' | 'affection' | 'achievement'
  unlockValue?: string // Dungeon ID, achievement ID, etc.
}

/** Record of a carry slot */
export interface CarrySlotRecord {
  id?: number
  slotIndex: 0 | 1 | 2
  cardId: string
  protected: boolean
  source: CarrySlotSource
  acquiredAt: Date
}

// ============================================
// HERO DECK HOOKS (EXTENSION TO CardDefinition)
// ============================================

/**
 * Deck hooks that can be attached to a hero CardDefinition.
 * Added to CardDefinition via extension in types/cards.ts.
 */
export interface HeroDeckHooks {
  /** Deck hooks provided by this hero */
  deckHooks?: DeckHookDefinition[]
}

// ============================================
// CONSTANTS
// ============================================

/** Base deck size (before bonus cards) */
export const BASE_DECK_SIZE = 10

/** Maximum carry slots */
export const MAX_CARRY_SLOTS = 3

/** Hook phase execution order */
export const HOOK_PHASE_ORDER: DeckHookPhase[] = [
  'filter',
  'select',
  'swap',
  'bonus',
  'finalize',
]
