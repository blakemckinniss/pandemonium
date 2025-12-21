// ============================================
// DECK BUILDER PIPELINE
// ============================================
// Main entry point for building starter decks.
// Collects hooks from all sources, executes pipeline phases,
// and returns the final deck composition.

import type {
  DeckBuilderContext,
  DeckBuilderResult,
  DeckHookDefinition,
  CarrySlot,
} from '../../types'
import { BASE_DECK_SIZE, HOOK_PHASE_ORDER } from '../../types'
import { getAvailableEvergreenPool, selectRandomCards } from './evergreen-pool'
import { getHeroDeckHooks } from './hero-hooks'
import { getModifierDeckHooks, getRelicDeckHooks, getDungeonDeckHooks } from './modifier-hooks'

// ============================================
// MAIN BUILD FUNCTION
// ============================================

/**
 * Build a starter deck using the evergreen pool and hook pipeline.
 *
 * Pipeline phases:
 * 1. filter - Modify available pool before selection
 * 2. select - Modify selection logic (rarely used)
 * 3. swap - Replace selected cards with themed variants
 * 4. bonus - Add extra cards on top of base deck
 * 5. finalize - Final modifications before deck is created
 */
export function buildDeck(context: DeckBuilderContext): DeckBuilderResult {
  // Gather all hooks from sources
  const allHooks = gatherAllHooks(context)

  // Sort hooks by phase order, then by priority within each phase
  const sortedHooks = sortHooksByPhase(allHooks)

  // Get the available evergreen pool based on unlocks
  // If context provides unlocked IDs, use them; otherwise use base pool
  let pool =
    context.unlockedEvergreenIds.length > 0
      ? context.unlockedEvergreenIds
      : getAvailableEvergreenPool({
          totalWins: 0,
          currentStreak: 0,
          clearedDungeons: [],
          heroAffections: {},
          achievements: [],
        })

  // Inject carry slot cards (guaranteed in deck)
  const carrySlotCards = context.carrySlots.map((slot) => slot.cardId)

  // Track results
  const appliedHooks: string[] = []
  const allSwaps: Array<{ original: string; replacement: string }> = []
  const allBonuses: string[] = []

  // Execute hooks by phase
  let selectedCards: string[] = []

  for (const phase of HOOK_PHASE_ORDER) {
    const phaseHooks = sortedHooks.filter((h) => h.phase === phase)

    switch (phase) {
      case 'filter':
        // Filter phase: modify the available pool
        for (const hook of phaseHooks) {
          const result = hook.apply(pool, context)
          pool = result.cards
          appliedHooks.push(hook.id)
        }
        break

      case 'select':
        // Select phase: choose cards from pool
        // Default behavior if no select hooks: random selection
        if (phaseHooks.length === 0) {
          // Account for carry slots when calculating how many to select
          const selectCount = Math.max(0, BASE_DECK_SIZE - carrySlotCards.length)
          selectedCards = selectRandomCards(pool, selectCount)
        } else {
          // Let hooks handle selection
          for (const hook of phaseHooks) {
            const result = hook.apply(pool, context)
            selectedCards = result.cards
            appliedHooks.push(hook.id)
          }
        }
        break

      case 'swap':
        // Swap phase: replace cards with variants
        for (const hook of phaseHooks) {
          const result = hook.apply(selectedCards, context)
          selectedCards = result.cards
          if (result.swaps) {
            allSwaps.push(...result.swaps)
          }
          appliedHooks.push(hook.id)
        }
        break

      case 'bonus':
        // Bonus phase: add extra cards
        for (const hook of phaseHooks) {
          const result = hook.apply(selectedCards, context)
          if (result.bonuses) {
            allBonuses.push(...result.bonuses)
          }
          appliedHooks.push(hook.id)
        }
        break

      case 'finalize':
        // Finalize phase: final modifications
        for (const hook of phaseHooks) {
          const result = hook.apply(selectedCards, context)
          selectedCards = result.cards
          appliedHooks.push(hook.id)
        }
        break
    }
  }

  // Combine: carry slots + selected cards + bonus cards
  const finalDeck = [...carrySlotCards, ...selectedCards, ...allBonuses]

  return {
    cardIds: finalDeck,
    appliedHooks,
    bonusCards: allBonuses,
    swappedCards: allSwaps,
  }
}

// ============================================
// HOOK GATHERING
// ============================================

/**
 * Gather deck hooks from all sources.
 */
function gatherAllHooks(context: DeckBuilderContext): DeckHookDefinition[] {
  const hooks: DeckHookDefinition[] = []

  // Hero hooks
  const heroHooks = getHeroDeckHooks(context.heroCardId)
  hooks.push(...heroHooks)

  // Modifier hooks
  const modifierHooks = getModifierDeckHooks(context.modifiers)
  hooks.push(...modifierHooks)

  // Relic hooks
  const relicHooks = getRelicDeckHooks(
    context.relics.map((r) => ({
      id: r.definitionId,
      // Relics with deck hooks would have them on their definition
      // This is a simplified version - full implementation would look up relic definitions
    }))
  )
  hooks.push(...relicHooks)

  // Dungeon hooks
  const dungeonHooks = getDungeonDeckHooks(context.dungeonId)
  hooks.push(...dungeonHooks)

  // Carry slot hooks (if carry slots have special effects)
  const carrySlotHooks = getCarrySlotHooks(context.carrySlots)
  hooks.push(...carrySlotHooks)

  return hooks
}

/**
 * Sort hooks by phase order, then by priority within each phase.
 */
function sortHooksByPhase(hooks: DeckHookDefinition[]): DeckHookDefinition[] {
  return [...hooks].sort((a, b) => {
    // First, sort by phase order
    const phaseOrderA = HOOK_PHASE_ORDER.indexOf(a.phase)
    const phaseOrderB = HOOK_PHASE_ORDER.indexOf(b.phase)
    if (phaseOrderA !== phaseOrderB) {
      return phaseOrderA - phaseOrderB
    }
    // Then sort by priority (lower runs first)
    return a.priority - b.priority
  })
}

/**
 * Get hooks from carry slots.
 * Some carry slots might have special effects.
 */
function getCarrySlotHooks(_carrySlots: CarrySlot[]): DeckHookDefinition[] {
  // Currently, carry slots just inject their cards (handled in buildDeck)
  // Future: special carry slot effects could be added here
  return []
}

// ============================================
// CONVENIENCE BUILDERS
// ============================================

/**
 * Create a minimal context for building a deck.
 * Used when starting a new run with default settings.
 */
export function createDeckBuilderContext(
  heroCardId: string,
  options: {
    modifiers?: DeckBuilderContext['modifiers']
    relics?: DeckBuilderContext['relics']
    dungeonId?: string
    carrySlots?: CarrySlot[]
    unlockedEvergreenIds?: string[]
  } = {}
): DeckBuilderContext {
  return {
    heroCardId,
    modifiers: options.modifiers ?? [],
    relics: options.relics ?? [],
    dungeonId: options.dungeonId,
    carrySlots: options.carrySlots ?? [],
    unlockedEvergreenIds: options.unlockedEvergreenIds ?? [],
  }
}

/**
 * Quick build with minimal options.
 * For simple cases where you just need a deck.
 */
export function buildDeckSimple(heroCardId: string): string[] {
  const context = createDeckBuilderContext(heroCardId)
  const result = buildDeck(context)
  return result.cardIds
}

// Re-export utilities
export { getAvailableEvergreenPool, selectRandomCards } from './evergreen-pool'
export { getHeroDeckHooks, createHeroSwapHook, createHeroBonusHook } from './hero-hooks'
export { getModifierDeckHooks, getRelicDeckHooks } from './modifier-hooks'
