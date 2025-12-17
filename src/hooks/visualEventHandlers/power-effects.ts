import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { logger } from '../../lib/logger'

export function handlePowerEffectEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'powerApply': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        const isDebuff = event.powerId.match(/vulnerable|weak|frail|poison/)
        effects.pulse(targetEl, {
          color: isDebuff
            ? 'oklch(0.55 0.18 20)'
            : 'oklch(0.5 0.12 145)',
        })
        if (event.powerId === 'poison') {
          emitParticle(targetEl, 'poison')
        }
      }
      return true
    }

    case 'powerRemove':
      // PowerIndicators handles fade reactively
      return true

    case 'powerTrigger': {
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (targetEl) {
        const powerColors: Record<string, string> = {
          thorns: 'oklch(0.55 0.2 25)',
          poison: 'oklch(0.45 0.18 145)',
          burn: 'oklch(0.6 0.2 40)',
          burning: 'oklch(0.6 0.2 40)',
          regen: 'oklch(0.6 0.18 145)',
          metallicize: 'oklch(0.5 0.1 250)',
          platedArmor: 'oklch(0.5 0.1 250)',
        }
        const particleTypes: Record<string, 'thorns' | 'poison' | 'spark' | 'heal' | 'block'> = {
          thorns: 'thorns',
          poison: 'poison',
          burn: 'spark',
          burning: 'spark',
          regen: 'heal',
          metallicize: 'block',
          platedArmor: 'block',
        }

        const color = powerColors[event.powerId] ?? 'oklch(0.6 0.15 280)'
        const particleType = particleTypes[event.powerId] ?? 'spark'

        effects.pulse(targetEl, { color })
        emitParticle(targetEl, particleType)
      }
      logger.debug('Visual', `Power triggered: ${event.powerId} on ${event.targetId} (${event.triggerEvent})`)
      return true
    }
  }
  return false
}
