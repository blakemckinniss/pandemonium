import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { handleCombatNumberEvents } from './combat-numbers'
import { handleCardAnimationEvents } from './card-animations'
import { handleCardModificationEvents } from './card-modifications'
import { handlePowerEffectEvents } from './power-effects'
import { handleResourceEffectEvents } from './resource-effects'
import { handleControlEffectEvents } from './control-effects'
import { handleHeroAbilityEvents } from './hero-abilities'
import { handleEnemyActionEvents } from './enemy-actions'
import { handleGameEvents } from './game-events'

export type { HandlerContext } from './types'
export { effects } from './utils'

/**
 * Process a single visual event by dispatching to the appropriate category handler
 */
export function processVisualEvent(event: VisualEvent, ctx: HandlerContext): void {
  // Try each handler category until one handles the event
  const handlers = [
    handleCombatNumberEvents,
    handleCardAnimationEvents,
    handleCardModificationEvents,
    handlePowerEffectEvents,
    handleResourceEffectEvents,
    handleControlEffectEvents,
    handleHeroAbilityEvents,
    handleEnemyActionEvents,
    handleGameEvents,
  ]

  for (const handler of handlers) {
    if (handler(event, ctx)) {
      return
    }
  }
}
