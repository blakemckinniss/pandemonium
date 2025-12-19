import type { VisualEvent, CombatNumber } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { generateUid } from '../../lib/utils'

export function handleResourceEffectEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'energy': {
      const energyOrb = ctx.queryContainer('[data-energy-orb]')
      if (energyOrb) {
        if (event.delta > 0) {
          // Energy gain - use burst effect for significant gains
          if (event.delta >= 2) {
            effects.energyGain?.(energyOrb, { amount: event.delta })
          } else {
            effects.energyPulse(energyOrb, { color: 'oklch(0.7 0.15 70)' })
          }
          emitParticle(energyOrb, 'energy')
        } else {
          // Energy spend - subtle drain effect
          effects.energySpend?.(energyOrb, { amount: Math.abs(event.delta) })
        }
      }
      return true
    }

    case 'gold': {
      const playerEl = ctx.queryContainer('[data-entity="player"]')
      if (playerEl) {
        effects.pulse(playerEl, {
          color: event.delta > 0
            ? 'oklch(0.75 0.18 85)'
            : 'oklch(0.5 0.1 25)',
        })
        if (event.delta > 0) {
          emitParticle(playerEl, 'gold')
        }
        const rect = playerEl.getBoundingClientRect()
        const num: CombatNumber = {
          id: generateUid(),
          value: event.delta,
          type: 'gold',
          targetId: 'player',
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 3,
        }
        ctx.setCombatNumbers((prev) => [...prev, num])
      }
      return true
    }

    case 'maxHealth': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        effects.maxHealthPulse(targetEl, {
          color: event.delta > 0
            ? 'oklch(0.6 0.2 145)'
            : 'oklch(0.6 0.2 25)',
        })
        emitParticle(targetEl, event.delta > 0 ? 'heal' : 'spark')

        const rect = targetEl.getBoundingClientRect()
        const num: CombatNumber = {
          id: generateUid(),
          value: event.delta,
          type: 'maxHealth',
          targetId: event.targetId,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 3,
          label: 'Max HP',
        }
        ctx.setCombatNumbers((prev) => [...prev, num])
      }
      return true
    }
  }
  return false
}
