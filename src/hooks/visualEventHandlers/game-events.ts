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

          // Element-themed particles for elemental cards
          if (event.element) {
            emitParticle(targetEl, event.element)
            // Extra burst for dramatic elemental feel
            setTimeout(() => emitParticle(targetEl, event.element!), 80)
          }

          // Gothic card impact effect - dark tendrils burst on attack targets
          if (event.theme === 'attack' && event.targetId) {
            effects.gothicCardImpact?.(targetEl, { theme: event.theme, intensity: 1 })
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
          void import('gsap').then(({ gsap }) => {
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
        // Dramatic relic activation - purple glow + particle burst
        effects.pulse(playerEl, {
          color: 'oklch(0.6 0.15 300)',
        })
        emitParticle(playerEl, 'energy')
        setTimeout(() => emitParticle(playerEl, 'spark'), 50)
        setTimeout(() => emitParticle(playerEl, 'energy'), 100)
      }

      // Also pulse the relic bar if visible
      const relicBar = ctx.queryContainer('[data-relic-bar]')
      if (relicBar) {
        effects.pulse(relicBar, { color: 'oklch(0.7 0.18 280)' })
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

    case 'playerTurnStart': {
      // Dramatic turn banner
      effects.playerTurnBanner?.(null, {})

      // Energizing pulse on player and field
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.turnStart(playerEl)
        emitParticle(playerEl, 'energy')
      }

      // Energy orb pulse
      const energyOrb = ctx.queryContainer('[data-energy-display]')
      if (energyOrb) {
        effects.energyPulse(energyOrb, { color: 'oklch(0.7 0.15 70)' })
      }

      return true
    }

    case 'enemyTurnStart': {
      // Dramatic enemy turn banner
      effects.enemyTurnBanner?.(null, {})

      // Gothic ominous sweep transition
      effects.ominousTurnStart?.(null, { isEnemy: true })

      // Ominous warning effect
      if (ctx.containerRef.current) {
        effects.enemyTurnStart(ctx.containerRef.current)
      }

      // Warning particles on all enemies
      const enemies = ctx.queryContainer('[data-entity="enemy"]')
      if (enemies) {
        const enemyList = enemies instanceof NodeList ? Array.from(enemies) : [enemies]
        enemyList.forEach((enemy, i) => {
          setTimeout(() => {
            if (enemy instanceof Element) {
              emitParticle(enemy, 'spark')
            }
          }, i * 100)
        })
      }

      return true
    }

    case 'delayedEffect': {
      // Delayed effect countdown - hourglass/timer visual
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.pulse(playerEl, {
          color: 'oklch(0.65 0.15 50)',  // Amber/orange for pending
          scale: 1.03,
        })
        emitParticle(playerEl, 'energy')
      }
      logger.debug('Visual', `Delayed effect: ${event.turnsRemaining} turns remaining`)
      return true
    }

    case 'delayedEffectTrigger': {
      // Delayed effect fires - dramatic activation
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.pulse(playerEl, {
          color: 'oklch(0.7 0.2 40)',  // Bright orange burst
          scale: 1.1,
        })
        // Multi-particle burst
        emitParticle(playerEl, 'critical')
        setTimeout(() => emitParticle(playerEl, 'spark'), 50)
        setTimeout(() => emitParticle(playerEl, 'energy'), 100)

        // Screen shake for dramatic trigger
        if (ctx.containerRef.current) {
          effects.shake(ctx.containerRef.current, { intensity: 6 })
        }
      }
      logger.debug('Visual', 'Delayed effect triggered!')
      return true
    }

    case 'markTarget': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        // Hunter's mark - red crosshair effect
        effects.pulse(targetEl, { color: 'oklch(0.6 0.25 25)', scale: 1.08 })
        emitParticle(targetEl, 'critical')
        setTimeout(() => emitParticle(targetEl, 'attack'), 80)
      }
      logger.debug('Visual', `Target marked: ${event.targetId} for ${event.duration} turns`)
      return true
    }

    case 'markExpired': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        effects.pulse(targetEl, { color: 'oklch(0.5 0.1 0)', scale: 0.95 })
      }
      return true
    }

    case 'reflect': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        // Mirror/shield effect - cyan shimmer
        effects.pulse(targetEl, { color: 'oklch(0.7 0.15 200)', scale: 1.05 })
        emitParticle(targetEl, 'block')
        setTimeout(() => emitParticle(targetEl, 'spark'), 60)
      }
      logger.debug('Visual', `Reflect ${event.amount} damage`)
      return true
    }

    case 'amplify': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        // Power surge - red/orange energy buildup
        effects.pulse(targetEl, { color: 'oklch(0.65 0.22 40)', scale: 1.1 })
        emitParticle(targetEl, 'attack')
        emitParticle(targetEl, 'energy')
        setTimeout(() => emitParticle(targetEl, 'critical'), 80)
      }
      logger.debug('Visual', `Amplify ${event.multiplier}x for ${event.attacks} attacks`)
      return true
    }

    case 'amplifyConsumed': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        effects.pulse(targetEl, { color: 'oklch(0.7 0.2 40)', scale: 1.15 })
        emitParticle(targetEl, 'critical')
        emitParticle(targetEl, 'spark')
      }
      return true
    }

    case 'energyNextTurn': {
      const energyOrb = ctx.queryContainer('[data-energy-orb]')
      if (energyOrb) {
        effects.pulse(energyOrb, { color: 'oklch(0.75 0.18 70)' })
        emitParticle(energyOrb, 'energy')
      }
      logger.debug('Visual', `+${event.amount} energy next turn`)
      return true
    }

    case 'tempMaxEnergy': {
      const energyOrb = ctx.queryContainer('[data-energy-orb]')
      if (energyOrb) {
        effects.pulse(energyOrb, { color: 'oklch(0.8 0.2 85)', scale: 1.15 })
        emitParticle(energyOrb, 'gold')
        emitParticle(energyOrb, 'energy')
      }
      logger.debug('Visual', `+${event.amount} max energy`)
      return true
    }

    case 'statusCardAdded': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        // Dark corruption effect for status cards
        effects.pulse(playerEl, { color: 'oklch(0.4 0.15 280)', scale: 0.95 })
        emitParticle(playerEl, 'poison')
        effects.shadowCoil?.(playerEl)
      }
      logger.debug('Visual', `Added ${event.count}x ${event.cardId} to ${event.destination}`)
      return true
    }

    case 'statusCardsRemoved': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        // Cleansing light effect
        effects.pulse(playerEl, { color: 'oklch(0.8 0.15 85)', scale: 1.08 })
        for (let i = 0; i < Math.min(event.count, 5); i++) {
          setTimeout(() => emitParticle(playerEl, 'heal'), i * 50)
        }
        emitParticle(playerEl, 'gold')
      }
      logger.debug('Visual', `Removed ${event.count} status cards`)
      return true
    }
  }
  return false
}
