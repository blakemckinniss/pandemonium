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
          // Multiple particles for impact
          emitParticle(targetEl, event.theme)
          if (event.theme === 'attack') {
            setTimeout(() => emitParticle(targetEl, 'spark'), 50)
          }

          // Enhanced card play flash effect
          effects.cardPlayFlash(targetEl, { theme: event.theme })

          // Screen micro-shake on attacks
          if (event.theme === 'attack' && ctx.containerRef.current) {
            effects.shake(ctx.containerRef.current, { intensity: 3 })
          }
        }
      }
      return true
    }

    case 'comboMilestone': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        // Escalating particle bursts based on combo count
        const burstCount = Math.min(event.count, 10)
        for (let i = 0; i < burstCount; i++) {
          setTimeout(() => emitParticle(playerEl, 'combo'), i * 60)
        }

        // Extra energy particles at high combos
        if (event.count >= 5) {
          for (let i = 0; i < 3; i++) {
            setTimeout(() => emitParticle(playerEl, 'energy'), 100 + i * 100)
          }
        }

        ctx.spawnCombatNumber('player', event.count, 'combo')

        // Escalating visual intensity
        const intensity = Math.min((event.count - 2) / 5, 2) // 0 at 2, 1 at 7, 2 at 12+
        effects.comboSurge(playerEl, { intensity })

        // Screen shake scales with combo
        if (event.count >= 3 && ctx.containerRef.current) {
          const shakeIntensity = Math.min(3 + (event.count - 3) * 2, 15)
          effects.shake(ctx.containerRef.current, { intensity: shakeIntensity })
        }

        // Screen flash at major milestones (5, 10, 15...)
        if (event.count % 5 === 0 && event.count >= 5) {
          const flash = document.createElement('div')
          flash.style.cssText = 'position:fixed;inset:0;background:oklch(0.8 0.15 70);pointer-events:none;z-index:100'
          document.body.appendChild(flash)
          import('gsap').then(({ gsap }) => {
            gsap.fromTo(flash, { opacity: 0.4 }, { opacity: 0, duration: 0.3, onComplete: () => flash.remove() })
          })
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
