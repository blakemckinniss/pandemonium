// Turn management handlers
import type { RunState, Entity } from '../../types'
import { decayPowers } from '../powers'
import { drawCardsInternal } from './shared'

// Forward declaration - will be injected to avoid circular deps
let executePowerTriggers: (draft: RunState, entity: Entity, event: string, sourceId?: string) => void

export function setExecutePowerTriggers(fn: typeof executePowerTriggers): void {
  executePowerTriggers = fn
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

  // Clear block
  combat.player.block = 0

  // Decay powers at turn start
  decayPowers(combat.player, 'turnStart')

  // Execute power triggers for player
  if (executePowerTriggers) {
    executePowerTriggers(draft, combat.player, 'onTurnStart')
  }

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

  // Decay powers at turn end
  decayPowers(combat.player, 'turnEnd')

  // Reset turn-based cost modifiers on all cards
  for (const card of combat.hand) {
    if (card.costModifier !== undefined) {
      card.costModifier = undefined
    }
  }

  // Discard hand (except retained cards)
  const retained: typeof combat.hand = []
  const toDiscard: typeof combat.hand = []

  for (const card of combat.hand) {
    if (card.retained) {
      // Keep in hand but clear retain flag (one-time effect)
      card.retained = false
      retained.push(card)
    } else {
      toDiscard.push(card)
    }
  }

  combat.discardPile.push(...toDiscard)
  combat.hand = retained

  // Enemy turn
  combat.phase = 'enemyTurn'
}
