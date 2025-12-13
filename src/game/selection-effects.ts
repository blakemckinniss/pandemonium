/**
 * Card Selection Effects (Scry, Tutor)
 * These effects require async player interaction via modals
 */

import type {
  RunState,
  CardInstance,
  EffectContext,
  CardFilter,
  ScryEffect,
  TutorEffect,
} from '../types'
import { getCardDefinition } from './cards'
import { resolveValue } from '../lib/effects'

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
