import type { VisualEvent, CombatNumber } from '../../types'
import type { HandlerContext } from './types'
import { effects } from './utils'
import { emitParticle } from '../../components/ParticleEffects/emitParticle'
import { generateUid } from '../../lib/utils'

export function handleEnemyActionEvents(event: VisualEvent, ctx: HandlerContext): boolean {
  switch (event.type) {
    case 'enemyDeath': {
      const enemyEl = ctx.queryContainer(`[data-target="${event.enemyId}"]`)
      if (enemyEl) {
        // Dramatic particle burst throughout the animation
        for (let i = 0; i < 5; i++) {
          setTimeout(() => emitParticle(enemyEl, 'explosion'), i * 60)
        }
        setTimeout(() => emitParticle(enemyEl, 'critical'), 100)
        setTimeout(() => emitParticle(enemyEl, 'spark'), 200)

        // Screen shake on death
        if (ctx.containerRef.current) {
          effects.shake(ctx.containerRef.current, { intensity: 12 })
        }

        // Gothic bone shatter for void/undead themed enemies
        if (event.element === 'void') {
          effects.boneShatter?.(enemyEl)
        } else {
          // Use element-themed shatter effect for others
          effects.enemyDeath(enemyEl, { element: event.element })
        }
      }
      return true
    }

    case 'enemyTelegraph': {
      const enemyEl = ctx.queryContainer(`[data-target="${event.enemyId}"]`)
      const playerEl = ctx.queryContainer('[data-target="player"]')
      if (enemyEl) {
        effects.enemyTelegraph(enemyEl, { intentType: event.intentType })
        // Emit intent-specific warning particles
        switch (event.intentType) {
          case 'attack':
          case 'ability':
          case 'ultimate':
            emitParticle(enemyEl, 'attack')
            // Show damage preview on player with block calculation
            if (playerEl && event.intentValue) {
              const rect = playerEl.getBoundingClientRect()
              const times = event.intentTimes ?? 1
              const totalDamage = event.intentValue * times
              const playerBlock = ctx.combat?.player.block ?? 0
              const netDamage = Math.max(0, totalDamage - playerBlock)
              const isFullyBlocked = netDamage === 0 && playerBlock > 0

              const previewNum: CombatNumber = {
                id: generateUid(),
                value: isFullyBlocked ? 0 : (times > 1 ? event.intentValue : netDamage),
                type: 'preview',
                targetId: 'player',
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 4,
                variant: isFullyBlocked ? undefined : (times > 1 ? 'multi' : undefined),
                label: isFullyBlocked
                  ? '🛡️ BLOCKED'
                  : times > 1
                    ? `x${times} → ${netDamage}`
                    : playerBlock > 0
                      ? `→ ${netDamage}`
                      : undefined,
              }
              ctx.setCombatNumbers((prev) => [...prev, previewNum])
            }
            break
          case 'defend':
            emitParticle(enemyEl, 'block')
            break
          case 'buff':
            emitParticle(enemyEl, 'energy')
            break
          case 'debuff':
            emitParticle(enemyEl, 'poison')
            break
        }
      }
      return true
    }

    case 'enemyActionExecute': {
      const enemyEl = ctx.queryContainer(`[data-target="${event.enemyId}"]`)
      const playerEl = ctx.queryContainer('[data-target="player"]')

      if (enemyEl) {
        // Use intent-specific animation
        switch (event.intentType) {
          case 'attack':
          case 'ability':
          case 'ultimate':
            effects.enemyAttackLunge(enemyEl)
            if (playerEl) {
              setTimeout(() => emitParticle(playerEl, 'spark'), 120)
            }
            break
          case 'defend':
            effects.enemyDefend(enemyEl)
            emitParticle(enemyEl, 'block')
            break
          case 'buff':
            effects.pulse(enemyEl, { color: 'oklch(0.65 0.18 85)' })
            emitParticle(enemyEl, 'energy')
            break
          case 'debuff':
            effects.pulse(enemyEl, { color: 'oklch(0.55 0.18 300)' })
            if (playerEl) {
              emitParticle(playerEl, 'poison')
            }
            break
        }
      }
      return true
    }

    case 'enemyAbility': {
      const enemyEl = ctx.queryContainer(`[data-target="${event.entityId}"]`)
      if (enemyEl) {
        // Special ability activation - purple energy surge
        effects.pulse(enemyEl, { color: 'oklch(0.6 0.2 280)', scale: 1.1 })
        emitParticle(enemyEl, 'energy')
        setTimeout(() => emitParticle(enemyEl, 'spark'), 80)

        // Screen shake for dramatic effect
        if (ctx.containerRef.current) {
          effects.shake(ctx.containerRef.current, { intensity: 5 })
        }
      }
      return true
    }

    case 'enemyUltimate': {
      const enemyEl = ctx.queryContainer(`[data-target="${event.entityId}"]`)
      if (enemyEl) {
        // Ultimate ability - dramatic red/black burst
        effects.pulse(enemyEl, { color: 'oklch(0.5 0.25 25)', scale: 1.15 })

        // Multi-burst particles
        for (let i = 0; i < 4; i++) {
          setTimeout(() => emitParticle(enemyEl, 'critical'), i * 50)
        }
        emitParticle(enemyEl, 'explosion')
        setTimeout(() => emitParticle(enemyEl, 'spark'), 150)

        // Strong screen shake
        if (ctx.containerRef.current) {
          effects.shake(ctx.containerRef.current, { intensity: 10 })
        }

        // Gothic doom pulse for ultimate
        effects.doomPulse?.(enemyEl, { intensity: 1.3, color: '#8b0000' })
      }
      return true
    }

    case 'intentWeakened': {
      const enemyEl = ctx.queryContainer(`[data-target="${event.targetId}"]`)
      if (enemyEl) {
        // Intent weakened - blue debuff visual
        effects.pulse(enemyEl, { color: 'oklch(0.55 0.15 240)', scale: 0.95 })
        emitParticle(enemyEl, 'block')

        // Show reduction number
        const rect = enemyEl.getBoundingClientRect()
        const num: CombatNumber = {
          id: generateUid(),
          value: -event.reduction,
          type: 'intentWeakened',
          targetId: event.targetId,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 4,
          label: 'Weakened',
        }
        ctx.setCombatNumbers((prev) => [...prev, num])
      }
      return true
    }
  }
  return false
}
