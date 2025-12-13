// Card management handlers
import type { RunState, Entity, EffectContext } from '../../types'
import { getCardDefinition } from '../cards'
import { resolveValue } from '../../lib/effects'
import { drawCardsInternal } from './shared'

// Forward declarations - will be injected to avoid circular deps
let executeEffect: (draft: RunState, effect: import('../../types').AtomicEffect, ctx: EffectContext) => void
let executePowerTriggers: (draft: RunState, entity: Entity, event: string, sourceId?: string) => void

export function setExecuteEffect(fn: typeof executeEffect): void {
  executeEffect = fn
}

export function setExecutePowerTriggers(fn: typeof executePowerTriggers): void {
  executePowerTriggers = fn
}

export function handleDrawCards(draft: RunState, amount: number): void {
  if (!draft.combat) return
  drawCardsInternal(draft.combat, amount)
}

export function handlePlayCard(
  draft: RunState,
  cardUid: string,
  targetId?: string
): void {
  if (!draft.combat) return

  const combat = draft.combat
  const cardIndex = combat.hand.findIndex((c) => c.uid === cardUid)
  if (cardIndex === -1) return

  const cardInstance = combat.hand[cardIndex]
  const cardDef = getCardDefinition(cardInstance.definitionId)
  if (!cardDef) return

  // Resolve energy cost
  const energyCost = typeof cardDef.energy === 'number'
    ? cardDef.energy
    : resolveValue(cardDef.energy, draft, { source: 'player', cardTarget: targetId })

  // Check energy
  if (combat.player.energy < energyCost) return

  // Spend energy
  combat.player.energy -= energyCost

  // Remove from hand
  combat.hand.splice(cardIndex, 1)

  // Track stats
  draft.stats.cardsPlayed++
  combat.cardsPlayedThisTurn++

  // Build effect context
  const ctx: EffectContext = {
    source: 'player',
    cardTarget: targetId,
  }

  // Execute all effects
  if (executeEffect) {
    for (const effect of cardDef.effects) {
      executeEffect(draft, effect, ctx)
    }
  }

  // Execute onCardPlayed triggers
  if (executePowerTriggers) {
    executePowerTriggers(draft, combat.player, 'onCardPlayed')
  }

  // Move to discard
  combat.discardPile.push(cardInstance)
}

export function handleDiscardCard(draft: RunState, cardUid: string): void {
  if (!draft.combat) return

  const combat = draft.combat
  const cardIndex = combat.hand.findIndex((c) => c.uid === cardUid)
  if (cardIndex === -1) return

  const [card] = combat.hand.splice(cardIndex, 1)
  combat.discardPile.push(card)
}

export function handleDiscardHand(draft: RunState): void {
  if (!draft.combat) return

  draft.combat.discardPile.push(...draft.combat.hand)
  draft.combat.hand = []
}
