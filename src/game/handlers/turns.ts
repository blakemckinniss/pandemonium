// Turn management handlers
import type { RunState, Entity, RelicTrigger } from '../../types'
import { decayPowers } from '../powers'
import { drawCardsInternal, emitVisual } from './shared'
import { getCardDefinition } from '../cards'
import { getRelicDefinition } from '../relics'
import { executeEffect } from '../effects/engine'

// Forward declaration - will be injected to avoid circular deps
let executePowerTriggers: (draft: RunState, entity: Entity, event: string, sourceId?: string) => void

export function setExecutePowerTriggers(fn: typeof executePowerTriggers): void {
  executePowerTriggers = fn
}

/**
 * Execute relic effects for a given trigger event
 */
export function executeRelicTriggers(draft: RunState, trigger: RelicTrigger): void {
  if (!draft.combat) return

  for (const relic of draft.relics) {
    const def = getRelicDefinition(relic.definitionId)
    if (!def || def.trigger !== trigger || !def.effects) continue

    // Emit visual for relic trigger
    emitVisual(draft, {
      type: 'relicTrigger',
      relicId: relic.id,
      relicDefId: relic.definitionId,
      trigger,
    })

    // Execute each effect
    const ctx = { source: 'player' as const }
    for (const effect of def.effects) {
      executeEffect(draft, effect, ctx)
    }
  }
}

export function handleStartTurn(draft: RunState): void {
  if (!draft.combat) return

  const combat = draft.combat
  combat.phase = 'playerTurn'
  combat.turn += 1
  combat.cardsPlayedThisTurn = 0
  combat.lastPlayedCard = undefined

  // Reset energy
  combat.player.energy = combat.player.maxEnergy

  // Clear block (unless player has Barricade)
  if (!combat.player.powers['barricade']) {
    combat.player.block = 0
  }

  // Decay powers at turn start
  decayPowers(combat.player, 'turnStart')

  // Execute power triggers for player
  if (executePowerTriggers) {
    executePowerTriggers(draft, combat.player, 'onTurnStart')
  }

  // Execute relic triggers for turn start
  executeRelicTriggers(draft, 'onTurnStart')

  // Draw 5 cards
  drawCardsInternal(combat, 5)
}

export function handleEndTurn(draft: RunState): void {
  if (!draft.combat) return

  const combat = draft.combat

  // Execute power triggers for player
  if (executePowerTriggers) {
    executePowerTriggers(draft, combat.player, 'onTurnEnd')
  }

  // Execute relic triggers for turn end
  executeRelicTriggers(draft, 'onTurnEnd')

  // Decay powers at turn end
  decayPowers(combat.player, 'turnEnd')

  // Reset turn-based cost modifiers on all cards
  for (const card of combat.hand) {
    if (card.costModifier !== undefined) {
      card.costModifier = undefined
    }
  }

  // Handle end-of-turn card effects
  const retained: typeof combat.hand = []
  const toDiscard: typeof combat.hand = []
  const toExhaust: typeof combat.hand = []

  for (const card of combat.hand) {
    // Check both instance and definition for ethereal
    const def = getCardDefinition(card.definitionId)
    const isEthereal = card.ethereal || def?.ethereal

    if (isEthereal) {
      // Ethereal cards exhaust if not played
      toExhaust.push(card)
    } else if (card.retained) {
      // Keep in hand but clear retain flag (one-time effect)
      card.retained = false
      retained.push(card)
    } else {
      toDiscard.push(card)
    }
  }

  combat.exhaustPile.push(...toExhaust)
  combat.discardPile.push(...toDiscard)
  combat.hand = retained

  // Emit exhaust visual for ethereal cards
  if (toExhaust.length > 0) {
    emitVisual(draft, { type: 'exhaust', cardUids: toExhaust.map(c => c.uid) })
  }

  // Enemy turn
  combat.phase = 'enemyTurn'
}
