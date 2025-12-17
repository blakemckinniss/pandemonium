import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { getCardDefinition } from '../../game/cards'
import { logger } from '../../lib/logger'

export function handleControlEffectEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'conditionalTrigger': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.pulse(playerEl, {
          color: event.branch === 'then'
            ? 'oklch(0.7 0.15 145)'
            : 'oklch(0.6 0.12 60)',
        })
      }
      logger.debug('Visual', `Conditional: ${event.branch} branch`)
      return true
    }

    case 'repeatEffect': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl && event.current === 1) {
        effects.pulse(playerEl, {
          color: 'oklch(0.65 0.15 280)',
        })
      }
      logger.debug('Visual', `Repeat: ${event.current}/${event.times}`)
      return true
    }

    case 'replay': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.pulse(playerEl, {
          color: 'oklch(0.7 0.18 220)',
          scale: 1.08,
        })
        emitParticle(playerEl, 'combo')
      }
      return true
    }

    case 'playTopCard': {
      const pileSelector = event.fromPile === 'drawPile' ? '[data-deck-pile]' : '[data-discard-pile]'
      const pileEl = ctx.queryContainer(pileSelector)
      const playerEl = ctx.queryContainer('[data-entity="player"]')

      if (pileEl) {
        effects.pulse(pileEl, {
          color: 'oklch(0.7 0.15 70)',
        })
      }
      if (playerEl) {
        emitParticle(playerEl, 'spark')
      }

      const cardDef = getCardDefinition(event.cardId)
      logger.debug('Visual', `Auto-play: ${cardDef?.name ?? event.cardId} from ${event.fromPile}`)
      return true
    }
  }
  return false
}
