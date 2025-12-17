import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { logger } from '../../lib/logger'

export function handleGameEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'cardPlayed': {
      const targetEl = event.targetId
        ? ctx.queryContainer(`[data-target="${event.targetId}"]`)
        : ctx.queryContainer('[data-entity="player"]')
      if (targetEl) {
        if (event.theme === 'attack' || event.theme === 'skill' || event.theme === 'power') {
          emitParticle(targetEl, event.theme)
          effects.cardPlayFlash(targetEl, { theme: event.theme })
        }
      }
      return true
    }

    case 'comboMilestone': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        const burstCount = event.count >= 7 ? 3 : event.count >= 5 ? 2 : 1
        for (let i = 0; i < burstCount; i++) {
          setTimeout(() => emitParticle(playerEl, 'combo'), i * 80)
        }
        ctx.spawnCombatNumber('player', event.count, 'combo')
        if (event.count >= 5) {
          effects.shake(ctx.containerRef.current, { intensity: event.count >= 7 ? 6 : 3 })
        }
      }
      return true
    }

    case 'relicTrigger': {
      ctx.setTriggeredRelicId(event.relicId)
      setTimeout(() => ctx.setTriggeredRelicId(null), 600)

      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.pulse(playerEl, {
          color: 'oklch(0.6 0.15 300)',
        })
        emitParticle(playerEl, 'energy')
      }
      logger.debug('Visual', `Relic triggered: ${event.relicDefId} (${event.trigger})`)
      return true
    }

    case 'shuffle': {
      const deckPile = ctx.queryContainer('[data-deck-pile]')
      if (deckPile) {
        effects.shuffleDeck(deckPile)
      }
      return true
    }
  }
  return false
}
