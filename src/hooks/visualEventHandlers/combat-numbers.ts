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
        // Element-themed particles for elemental damage
        if (event.element && event.element !== 'physical') {
          emitParticle(damageTarget, event.element)
          setTimeout(() => emitParticle(damageTarget, event.element!), 60)

          // Eldritch burst for void damage - cosmic horror effect
          if (event.element === 'void') {
            effects.eldritchBurst?.(damageTarget)
          }
        }

        // Elemental combo particles - dramatic multi-burst
        if (event.comboName) {
          // Map combo names to particle types
          const comboParticles: Record<string, Array<'fire' | 'ice' | 'lightning' | 'void' | 'physical' | 'spark' | 'energy' | 'critical'>> = {
            'Conducted': ['lightning', 'lightning', 'spark'],
            'Flash Freeze': ['ice', 'ice', 'critical'],
            'Steam Burst': ['fire', 'ice', 'energy'],
            'Conflagration': ['fire', 'fire', 'critical'],
            'Shatter': ['ice', 'physical', 'spark'],
            'Overload': ['lightning', 'energy', 'critical'],
            'Void Surge': ['void', 'lightning', 'energy'],
            'Plasma': ['fire', 'lightning', 'spark'],
            'Conduct': ['lightning', 'spark'],
          }
          const particles = comboParticles[event.comboName]
          if (particles) {
            particles.forEach((particle, i) => {
              setTimeout(() => emitParticle(damageTarget, particle), i * 50)
            })
          }
          // Extra screen shake for combos
          if (ctx.containerRef.current) {
            effects.shake(ctx.containerRef.current, { intensity: 10 })
          }
        }

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

          // Gothic slash effect for attack damage (scaled by damage amount)
          const slashCount = isCritical ? 3 : event.amount >= 8 ? 2 : 1
          effects.darkSlash?.(damageTarget, { count: slashCount, element: event.element ?? 'physical' })

          // Stronger shake for higher damage
          if (isCritical) {
            effects.enemyShake(damageTarget, { intensity: 12 })
            // Doom pulse for devastating hits
            effects.doomPulse?.(damageTarget, { intensity: 1.2, color: elementColors[event.element ?? 'physical'] })
          } else if (event.amount >= 5) {
            effects.enemyShake(damageTarget)
          }
        } else {
          // Player hit - dramatic recoil based on damage
          const intensity = isCritical ? 2 : event.amount >= 8 ? 1.5 : 1
          effects.playerHit(damageTarget, { intensity })

          // Gothic blood splatter for player damage
          effects.bloodSplatter?.(damageTarget, { intensity })

          // Screen edge vignette on player damage
          const vignetteIntensity = isCritical ? 1.5 : event.amount >= 10 ? 1.2 : 1
          effects.damageVignette(damageTarget, { intensity: vignetteIntensity })

          // Doom pulse for heavy player damage
          if (isCritical || event.amount >= 12) {
            effects.doomPulse?.(damageTarget, { intensity: vignetteIntensity * 0.8 })
          }

          // Low HP danger warning when below 30%
          if (ctx.combat) {
            const { currentHealth, maxHealth } = ctx.combat.player
            const hpPercent = currentHealth / maxHealth
            if (hpPercent <= 0.3 && hpPercent > 0) {
              // Delay slightly so it plays after the hit animation
              setTimeout(() => {
                effects.healthDanger(damageTarget)
              }, 300)
            }
          }
        }
      }
      return true
    }
    case 'heal': {
      ctx.spawnCombatNumber(event.targetId, event.amount, 'heal')
      const healTarget = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (healTarget) {
        emitParticle(healTarget, 'heal')
        // Enhanced heal pulse for significant healing (5+)
        if (event.amount >= 5) {
          effects.healPulse?.(healTarget, { amount: event.amount })
        }
      }
      return true
    }
    case 'lifesteal': {
      // Get source and target positions for soulDrain animation
      const sourceEl = ctx.queryContainer(`[data-target="${event.sourceId}"]`)
      const targetEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (sourceEl && targetEl) {
        const sourceRect = sourceEl.getBoundingClientRect()
        const sourceX = sourceRect.left + sourceRect.width / 2
        const sourceY = sourceRect.top + sourceRect.height / 2

        // Gothic soul drain effect - wisps flow from damaged enemy to healer
        effects.soulDrain?.(targetEl, {
          sourceX,
          sourceY,
          color: '#4a7c59', // Sickly green for lifesteal
        })
        emitParticle(sourceEl, 'poison')
        emitParticle(targetEl, 'heal')
      }
      return true
    }
    case 'block': {
      ctx.spawnCombatNumber(event.targetId, event.amount, 'block')
      const blockTarget = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (blockTarget) {
        emitParticle(blockTarget, 'block')
        // Enhanced shield flash for significant blocks
        if (event.amount >= 5) {
          effects.shieldBlock?.(blockTarget, { amount: event.amount })
        }
      }
      return true
    }
  }
  return false
}
