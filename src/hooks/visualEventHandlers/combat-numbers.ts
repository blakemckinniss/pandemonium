import type { VisualEvent } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'

export function handleCombatNumberEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'damage': {
      // Use 'critical' variant for high damage hits (15+)
      const isCritical = event.amount >= 15
      const effectiveVariant = isCritical && !event.variant ? 'execute' : event.variant

      ctx.spawnCombatNumber(event.targetId, event.amount, 'damage', {
        element: event.element,
        variant: effectiveVariant,
        comboName: isCritical ? (event.comboName ?? 'CRITICAL') : event.comboName,
      })

      // Spawn particles on target
      const damageTarget = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (damageTarget) {
        // Critical hits get extra particle burst
        if (isCritical) {
          emitParticle(damageTarget, 'critical')
          emitParticle(damageTarget, 'spark')
          // Screen shake for critical
          if (ctx.containerRef.current) {
            effects.shake(ctx.containerRef.current, { intensity: 8 })
          }
        } else {
          emitParticle(damageTarget, 'spark')
        }

        // Hit flash and shake for enemies
        if (event.targetId !== 'player') {
          const elementColors: Record<string, string> = {
            fire: '#ff6348',
            ice: '#00d4ff',
            lightning: '#ffd700',
            void: '#a55eea',
            physical: '#ff4757',
          }
          effects.enemyHit(damageTarget, { color: elementColors[event.element ?? 'physical'] })
          // Stronger shake for higher damage
          if (isCritical) {
            effects.enemyShake(damageTarget, { intensity: 12 })
          } else if (event.amount >= 5) {
            effects.enemyShake(damageTarget)
          }
        }
      }
      return true
    }
    case 'heal': {
      ctx.spawnCombatNumber(event.targetId, event.amount, 'heal')
      const healTarget = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (healTarget) emitParticle(healTarget, 'heal')
      return true
    }
    case 'block': {
      ctx.spawnCombatNumber(event.targetId, event.amount, 'block')
      const blockTarget = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (blockTarget) emitParticle(blockTarget, 'block')
      return true
    }
  }
  return false
}
