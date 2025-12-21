import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'

export function handleHeroAbilityEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'heroActivated': {
      const playerEl = ctx.queryContainer('[data-target="player"]')
      if (playerEl) {
        // Blue energy burst for activated ability
        emitParticle(playerEl, 'heroActivated')
        emitParticle(playerEl, 'energy')
        effects.pulse(playerEl, {
          color: 'oklch(0.6 0.2 25)',
          scale: 1.05,
        })
      }
      return true
    }

    case 'heroUltimate': {
      const playerEl = ctx.queryContainer('[data-target="player"]')
      if (playerEl) {
        // Golden explosion for ultimate ability
        for (let i = 0; i < 3; i++) {
          setTimeout(() => emitParticle(playerEl, 'heroUltimate'), i * 60)
        }
        emitParticle(playerEl, 'critical')
        emitParticle(playerEl, 'combo')
        effects.pulse(playerEl, {
          color: 'oklch(0.75 0.2 85)',
          scale: 1.1,
        })
        // Screen shake for ultimate
        if (ctx.containerRef.current) {
          effects.shake(ctx.containerRef.current, { intensity: 6 })
        }
      }
      return true
    }

    case 'heroUltimateReady': {
      const playerEl = ctx.queryContainer('[data-target="player"]')
      if (playerEl) {
        // Pulsing golden glow when ultimate becomes ready
        emitParticle(playerEl, 'heroUltimate')
        emitParticle(playerEl, 'gold')
        effects.pulse(playerEl, {
          color: 'oklch(0.8 0.22 85)',
          scale: 1.08,
        })
        // Subtle screen effect
        if (ctx.containerRef.current) {
          effects.shake(ctx.containerRef.current, { intensity: 3 })
        }
      }
      return true
    }

    case 'heroUltimateCharge': {
      const playerEl = ctx.queryContainer('[data-target="player"]')
      if (playerEl) {
        // Subtle energy accumulation effect
        emitParticle(playerEl, 'energy')
        effects.pulse(playerEl, {
          color: 'oklch(0.65 0.15 70)',
          scale: 1.02,
        })
      }
      return true
    }
  }
  return false
}
