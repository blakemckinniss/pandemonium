// ============================================
// HERO DECK HOOKS
// ============================================
// Collects and applies deck hooks from hero definitions.

import type { DeckHookDefinition, DeckBuilderContext } from '../../types'
import { getCardDefinition } from '../cards'

/**
 * Get deck hooks from a hero card definition.
 * Heroes can define hooks that modify deck building.
 */
export function getHeroDeckHooks(heroCardId: string | undefined): DeckHookDefinition[] {
  if (!heroCardId) return []

  const heroCard = getCardDefinition(heroCardId)
  if (!heroCard || heroCard.theme !== 'hero') return []

  // Check for deckHooks property on hero card
  // This is an extension we'll add to CardDefinition
  const hooks = (heroCard as { deckHooks?: DeckHookDefinition[] }).deckHooks
  if (!hooks || !Array.isArray(hooks)) return []

  // Add source info to hooks
  return hooks.map((hook) => ({
    ...hook,
    source: 'hero' as const,
    sourceId: heroCardId,
  }))
}

/**
 * Create a standard hero swap hook.
 * Swaps base cards with elemental variants based on hero's element.
 */
export function createHeroSwapHook(
  heroId: string,
  swapMap: Record<string, string>,
  maxSwaps: number = 2
): DeckHookDefinition {
  return {
    id: `${heroId}_element_swap`,
    phase: 'swap',
    priority: 50,
    source: 'hero',
    sourceId: heroId,
    description: `Swap up to ${maxSwaps} cards with ${heroId}'s variants`,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    apply: (cards, _context) => {
      const swaps: Array<{ original: string; replacement: string }> = []
      const result = [...cards]
      let swapCount = 0

      for (let i = 0; i < result.length && swapCount < maxSwaps; i++) {
        const cardId = result[i]
        const replacement = swapMap[cardId]
        if (replacement) {
          result[i] = replacement
          swaps.push({ original: cardId, replacement })
          swapCount++
        }
      }

      return { cards: result, swaps }
    },
  }
}

/**
 * Create a standard hero bonus hook.
 * Adds extra cards to the deck.
 */
export function createHeroBonusHook(
  heroId: string,
  bonusCardIds: string[],
  description?: string
): DeckHookDefinition {
  return {
    id: `${heroId}_bonus`,
    phase: 'bonus',
    priority: 50,
    source: 'hero',
    sourceId: heroId,
    description: description ?? `Add ${bonusCardIds.length} bonus card(s) from ${heroId}`,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    apply: (cards, _context) => ({
      cards,
      bonuses: bonusCardIds,
    }),
  }
}

/**
 * Create a standard hero filter hook.
 * Filters the available pool based on criteria.
 */
export function createHeroFilterHook(
  heroId: string,
  filterFn: (cardId: string, context: DeckBuilderContext) => boolean,
  description?: string
): DeckHookDefinition {
  return {
    id: `${heroId}_filter`,
    phase: 'filter',
    priority: 30,
    source: 'hero',
    sourceId: heroId,
    description: description ?? `Filter pool for ${heroId}`,
    apply: (cards, context) => ({
      cards: cards.filter((cardId) => filterFn(cardId, context)),
    }),
  }
}
