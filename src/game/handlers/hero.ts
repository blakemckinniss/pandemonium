// Hero ability handlers
import type { RunState } from '../../types'
import { getCardDefinition } from '../cards'
import { executeEffect } from '../effects/engine'
import { emitVisual } from './shared'

/**
 * Use hero's activated ability (once per turn, costs energy)
 */
export function handleUseActivatedAbility(draft: RunState): void {
  if (!draft.combat) return
  const player = draft.combat.player
  if (!player.heroCardId) return

  const heroCard = getCardDefinition(player.heroCardId)
  if (!heroCard?.activated) return

  // Check if already used this turn
  if (player.activatedUsedThisTurn) return

  // Check energy cost
  if (player.energy < heroCard.activated.energyCost) return

  // Spend energy
  player.energy -= heroCard.activated.energyCost

  // Mark as used
  player.activatedUsedThisTurn = true

  // Emit visual
  emitVisual(draft, {
    type: 'heroActivated',
    heroCardId: player.heroCardId,
  })

  // Execute effects
  const ctx = { source: 'player' as const }
  for (const effect of heroCard.activated.effects) {
    executeEffect(draft, effect, ctx)
  }
}

/**
 * Use hero's ultimate ability (consumes all charges)
 */
export function handleUseUltimateAbility(draft: RunState): void {
  if (!draft.combat) return
  const player = draft.combat.player
  if (!player.heroCardId) return

  const heroCard = getCardDefinition(player.heroCardId)
  if (!heroCard?.ultimate) return

  // Check if ultimate is ready
  if (!player.ultimateReady) return

  // Reset charges and ready state
  player.ultimateCharges = 0
  player.ultimateReady = false

  // Emit visual
  emitVisual(draft, {
    type: 'heroUltimate',
    heroCardId: player.heroCardId,
  })

  // Execute effects
  const ctx = { source: 'player' as const }
  for (const effect of heroCard.ultimate.effects) {
    executeEffect(draft, effect, ctx)
  }
}

/**
 * Check if activated ability can be used
 */
export function canUseActivatedAbility(draft: RunState): boolean {
  if (!draft.combat) return false
  const player = draft.combat.player
  if (!player.heroCardId) return false

  const heroCard = getCardDefinition(player.heroCardId)
  if (!heroCard?.activated) return false

  return !player.activatedUsedThisTurn && player.energy >= heroCard.activated.energyCost
}

/**
 * Check if ultimate ability can be used
 */
export function canUseUltimateAbility(draft: RunState): boolean {
  if (!draft.combat) return false
  const player = draft.combat.player
  if (!player.heroCardId) return false

  const heroCard = getCardDefinition(player.heroCardId)
  if (!heroCard?.ultimate) return false

  return player.ultimateReady === true
}
