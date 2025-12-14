/**
 * Card Selection & Manipulation Effects
 * Scry/Tutor/Discover require async UI interaction, Upgrade is synchronous
 */

import type {
  RunState,
  CardInstance,
  EffectContext,
  CardFilter,
  ScryEffect,
  TutorEffect,
  UpgradeEffect,
  TransformEffect,
} from '../types'
import { generateUid } from '../lib/utils'
import { emitVisual } from './handlers/shared'
import { getCardDefinition, getAllCards } from './cards'
import { resolveValue, resolveCardTarget } from '../lib/effects'

/**
 * Execute scry effect - sets up pending selection for UI
 */
export function executeScry(
  draft: RunState,
  effect: ScryEffect,
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  if (amount <= 0) return

  // Take cards from top of draw pile
  const scryCards: CardInstance[] = []
  for (let i = 0; i < amount && draft.combat.drawPile.length > 0; i++) {
    const card = draft.combat.drawPile.pop()
    if (card) scryCards.push(card)
  }

  if (scryCards.length === 0) return

  // Set pending selection - UI will show modal
  draft.combat.pendingSelection = {
    type: 'scry',
    cards: scryCards,
  }
}

/**
 * Execute tutor effect - sets up pending selection for UI
 */
export function executeTutor(
  draft: RunState,
  effect: TutorEffect,
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const sourcePile = effect.from === 'drawPile'
    ? draft.combat.drawPile
    : draft.combat.discardPile

  // Find cards matching filter
  const matchingCards: CardInstance[] = []
  const matchingIndices: number[] = []

  for (let i = 0; i < sourcePile.length; i++) {
    const card = sourcePile[i]
    if (matchesFilter(card, effect.filter)) {
      matchingCards.push(card)
      matchingIndices.push(i)
    }
  }

  if (matchingCards.length === 0) return

  const maxSelect = effect.amount ? resolveValue(effect.amount, draft, ctx) : 1

  // Set pending selection - UI will show modal
  draft.combat.pendingSelection = {
    type: 'tutor',
    cards: matchingCards,
    sourceIndices: matchingIndices,
    from: effect.from,
    maxSelect,
    destination: effect.destination,
    position: effect.position,
    shuffle: effect.shuffle,
  }
}

/**
 * Execute upgrade effect - marks cards as upgraded
 */
export function executeUpgrade(
  draft: RunState,
  effect: UpgradeEffect,
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const cards = resolveCardTarget(effect.target, draft, ctx)

  for (const card of cards) {
    // Find and upgrade the card in its current location
    const locations = [
      draft.combat.hand,
      draft.combat.drawPile,
      draft.combat.discardPile,
    ]

    for (const pile of locations) {
      const found = pile.find((c) => c.uid === card.uid)
      if (found && !found.upgraded) {
        found.upgraded = true
        break
      }
    }
  }
}

/**
 * Execute transform effect - changes a card to a different card
 */
export function executeTransform(
  draft: RunState,
  effect: TransformEffect,
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const cards = resolveCardTarget(effect.target, draft, ctx)

  for (const card of cards) {
    // Find the card in its current location
    const locations = [
      draft.combat.hand,
      draft.combat.drawPile,
      draft.combat.discardPile,
    ]

    for (const pile of locations) {
      const found = pile.find((c) => c.uid === card.uid)
      if (found) {
        // Determine the new card ID
        let newCardId: string | undefined

        if (effect.toCardId) {
          // Transform to specific card
          newCardId = effect.toCardId
        } else if (effect.toRandom) {
          // Transform to random card from pool
          newCardId = pickRandomCard(effect.toRandom.filter, effect.toRandom.pool)
        }

        if (newCardId && getCardDefinition(newCardId)) {
          found.definitionId = newCardId
          found.upgraded = effect.upgraded ?? false
        }
        break
      }
    }
  }
}

/**
 * Pick a random card from the registry matching filter/pool
 */
function pickRandomCard(filter?: CardFilter, pool?: 'all' | 'common' | 'uncommon' | 'rare'): string | undefined {
  let candidates = getAllCards()

  // Filter by rarity pool
  if (pool && pool !== 'all') {
    candidates = candidates.filter(c => c.rarity === pool)
  }

  // Filter by card filter
  if (filter) {
    candidates = candidates.filter(def => {
      // Theme filter
      if (filter.theme) {
        const themes = Array.isArray(filter.theme) ? filter.theme : [filter.theme]
        if (!themes.includes(def.theme)) return false
      }
      // Cost filter
      const cost = typeof def.energy === 'number' ? def.energy : 0
      if (filter.costMin !== undefined && cost < filter.costMin) return false
      if (filter.costMax !== undefined && cost > filter.costMax) return false
      return true
    })
  }

  // Exclude curses and status cards from random pool
  candidates = candidates.filter(c => c.theme !== 'curse' && c.theme !== 'status')

  if (candidates.length === 0) return undefined
  return candidates[Math.floor(Math.random() * candidates.length)].id
}

/**
 * Check if a card matches a filter
 */
export function matchesFilter(card: CardInstance, filter?: CardFilter): boolean {
  if (!filter) return true

  const def = getCardDefinition(card.definitionId)
  if (!def) return false

  // Theme filter
  if (filter.theme) {
    const themes = Array.isArray(filter.theme) ? filter.theme : [filter.theme]
    if (!themes.includes(def.theme)) return false
  }

  // Cost filter
  const cost = typeof def.energy === 'number' ? def.energy : 0
  if (filter.costMin !== undefined && cost < filter.costMin) return false
  if (filter.costMax !== undefined && cost > filter.costMax) return false

  // Effect type filter
  if (filter.hasEffect) {
    const hasIt = def.effects.some(e => e.type === filter.hasEffect)
    if (!hasIt) return false
  }

  return true
}

/**
 * Handle scry resolution from modal
 */
export function handleResolveScry(
  draft: RunState,
  keptUids: string[],
  discardedUids: string[]
): void {
  if (!draft.combat?.pendingSelection) return
  if (draft.combat.pendingSelection.type !== 'scry') return

  const pending = draft.combat.pendingSelection
  const cardMap = new Map(pending.cards.map(c => [c.uid, c]))

  // Put kept cards back on top of draw pile (in order)
  for (const uid of keptUids) {
    const card = cardMap.get(uid)
    if (card) {
      draft.combat.drawPile.push(card)
    }
  }

  // Put discarded cards on bottom of draw pile
  for (const uid of discardedUids) {
    const card = cardMap.get(uid)
    if (card) {
      draft.combat.drawPile.unshift(card)
    }
  }

  // Clear pending selection
  draft.combat.pendingSelection = undefined
}

/**
 * Handle tutor resolution from modal
 */
export function handleResolveTutor(
  draft: RunState,
  selectedUids: string[],
  shuffleArray: <T>(arr: T[]) => T[]
): void {
  if (!draft.combat?.pendingSelection) return
  if (draft.combat.pendingSelection.type !== 'tutor') return

  const pending = draft.combat.pendingSelection
  const sourcePile = pending.from === 'drawPile'
    ? draft.combat.drawPile
    : draft.combat.discardPile

  // Remove selected cards from source pile and move to destination
  for (const uid of selectedUids) {
    const idx = sourcePile.findIndex(c => c.uid === uid)
    if (idx !== -1) {
      const [card] = sourcePile.splice(idx, 1)

      if (pending.destination === 'hand') {
        draft.combat.hand.push(card)
      } else {
        // drawPile with position
        const pos = pending.position ?? 'top'
        if (pos === 'top') {
          draft.combat.drawPile.push(card)
        } else if (pos === 'bottom') {
          draft.combat.drawPile.unshift(card)
        } else {
          const randIdx = Math.floor(Math.random() * (draft.combat.drawPile.length + 1))
          draft.combat.drawPile.splice(randIdx, 0, card)
        }
      }
    }
  }

  // Shuffle if requested
  if (pending.shuffle) {
    draft.combat.drawPile = shuffleArray([...draft.combat.drawPile])
  }

  // Clear pending selection
  draft.combat.pendingSelection = undefined
}

/**
 * Handle discover resolution from modal
 */
export function handleResolveDiscover(
  draft: RunState,
  selectedCardIds: string[]
): void {
  if (!draft.combat?.pendingSelection) return
  if (draft.combat.pendingSelection.type !== 'discover') return

  const pending = draft.combat.pendingSelection
  const copies = pending.copies ?? 1

  // Add selected cards to destination
  for (const cardId of selectedCardIds) {
    // Verify the card was in the choices
    const cardDef = pending.cards.find(c => c.id === cardId)
    if (!cardDef) continue

    for (let i = 0; i < copies; i++) {
      const instance: CardInstance = {
        uid: generateUid(),
        definitionId: cardId,
        upgraded: false,
      }

      switch (pending.destination) {
        case 'hand':
          draft.combat.hand.push(instance)
          break
        case 'drawPile':
          draft.combat.drawPile.push(instance)
          break
        case 'discardPile':
          draft.combat.discardPile.push(instance)
          break
      }

      emitVisual(draft, { type: 'addCard', cardId, destination: pending.destination, count: 1 })
    }
  }

  // Clear pending selection
  draft.combat.pendingSelection = undefined
}

/**
 * Handle banish resolution from modal
 */
export function handleResolveBanish(
  draft: RunState,
  selectedUids: string[]
): void {
  if (!draft.combat?.pendingSelection) return
  if (draft.combat.pendingSelection.type !== 'banish') return

  const banishedUids: string[] = []

  // Remove selected cards from whichever pile they're in
  for (const uid of selectedUids) {
    const piles = [
      draft.combat.hand,
      draft.combat.drawPile,
      draft.combat.discardPile,
      draft.combat.exhaustPile,
    ]

    for (const pile of piles) {
      const idx = pile.findIndex(c => c.uid === uid)
      if (idx !== -1) {
        pile.splice(idx, 1)
        banishedUids.push(uid)
        break
      }
    }
  }

  // Emit visual for banished cards
  if (banishedUids.length > 0) {
    emitVisual(draft, { type: 'banish', cardUids: banishedUids })
  }

  // Clear pending selection
  draft.combat.pendingSelection = undefined
}
