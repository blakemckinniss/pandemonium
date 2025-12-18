// Combat-related effects: damage, block, heal, lifesteal
import type { RunState, EffectContext, EffectValue, EntityTarget, AtomicEffect, Entity } from '../../types'
import type { Element, ElementalCombo } from '../../types'
import { resolveValue, resolveEntityTargets, getEntityById } from '../../lib/effects'
import {
  applyOutgoingDamageModifiers,
  applyIncomingDamageModifiers,
  applyOutgoingBlockModifiers,
  applyPowerToEntity,
  removePowerFromEntity,
} from '../powers'
import { checkElementalCombo, getElementStatus } from '../elements'
import { emitVisual, applyDamageInternal } from '../handlers/shared'

// Forward declarations for recursive effect execution
let executeEffect: (draft: RunState, effect: AtomicEffect, ctx: EffectContext) => void
let executePowerTriggers: (draft: RunState, entity: Entity, event: string, sourceId?: string) => void

export function setExecuteEffect(fn: typeof executeEffect): void {
  executeEffect = fn
}

export function setExecutePowerTriggers(fn: typeof executePowerTriggers): void {
  executePowerTriggers = fn
}

export function executeDamage(
  draft: RunState,
  effect: { type: 'damage'; amount: EffectValue; target?: EntityTarget; element?: Element; piercing?: boolean; triggerOnHit?: AtomicEffect[] },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const baseDamage = resolveValue(effect.amount, draft, ctx)
  const element: Element = effect.element ?? 'physical'
  const target = effect.target ?? (ctx.cardTarget ? 'enemy' : 'allEnemies')
  const targetIds = resolveEntityTargets(target, draft, ctx)

  // Get attacker for modifiers
  const attacker = getEntityById(ctx.source, draft)

  for (const targetId of targetIds) {
    let damage = baseDamage

    // Apply outgoing modifiers (Strength, Weak)
    if (attacker) {
      damage = applyOutgoingDamageModifiers(damage, attacker)
    }

    // Apply incoming modifiers (Vulnerable)
    const defender = getEntityById(targetId, draft)
    if (defender) {
      damage = applyIncomingDamageModifiers(damage, defender)
    }

    // Apply elemental vulnerability/resistance (enemies only)
    const enemy = draft.combat?.enemies.find((e) => e.id === targetId)
    if (enemy) {
      if (enemy.vulnerabilities?.includes(element)) {
        damage = Math.floor(damage * 1.5)
      }
      if (enemy.resistances?.includes(element)) {
        damage = Math.floor(damage * 0.5)
      }
    }

    // Check for elemental combo
    let combo: ElementalCombo | undefined
    let comboTriggered = false
    if (defender) {
      const targetStatuses = Object.keys(defender.powers)
      combo = checkElementalCombo(targetStatuses, element)

      if (combo) {
        comboTriggered = true

        if (combo.damageMultiplier) {
          damage = Math.floor(damage * combo.damageMultiplier)
        }

        if (combo.bonusDamage) {
          damage += combo.bonusDamage
        }

        if (combo.removeStatus) {
          const [statusToRemove] = combo.trigger
          removePowerFromEntity(defender, statusToRemove)
        }
      }
    }

    // Handle onKill trigger via callback
    const onKillCallback = () => {
      if (executePowerTriggers && draft.combat) {
        executePowerTriggers(draft, draft.combat.player, 'onKill')
      }
    }

    // Apply damage
    const damageDealt = applyDamageInternal(draft, targetId, damage, effect.piercing, onKillCallback)

    // Emit visual event
    if (damageDealt > 0) {
      emitVisual(draft, {
        type: 'damage',
        targetId,
        amount: damageDealt,
        variant: effect.piercing ? 'piercing' : (comboTriggered ? 'combo' : undefined),
        element,
        comboName: combo?.name,
      })
    }

    // Handle combo special effects
    if (combo && defender && draft.combat) {
      if (combo.chainToAll) {
        const otherEnemies = draft.combat.enemies.filter(e => e.id !== targetId)
        for (const otherEnemy of otherEnemies) {
          const chainDamage = Math.floor(damageDealt * 0.5)
          applyDamageInternal(draft, otherEnemy.id, chainDamage)
          emitVisual(draft, {
            type: 'damage',
            targetId: otherEnemy.id,
            amount: chainDamage,
            variant: 'chain',
            element,
          })
        }
      }

      if (combo.applyStatus) {
        applyPowerToEntity(defender, combo.applyStatus, 2)
        emitVisual(draft, {
          type: 'powerApply',
          targetId,
          powerId: combo.applyStatus,
          amount: 2,
        })
      }

      if (combo.executeThreshold && defender.currentHealth > 0) {
        const hpPercent = defender.currentHealth / defender.maxHealth
        if (hpPercent <= combo.executeThreshold) {
          applyDamageInternal(draft, targetId, defender.currentHealth)
          emitVisual(draft, {
            type: 'damage',
            targetId,
            amount: defender.currentHealth,
            variant: 'execute',
          })
        }
      }
    }

    // Apply elemental status if no combo triggered
    if (!comboTriggered && damageDealt > 0 && defender) {
      const statusToApply = getElementStatus(element)
      if (statusToApply) {
        applyPowerToEntity(defender, statusToApply, element === 'fire' ? damageDealt : 2)
        emitVisual(draft, {
          type: 'powerApply',
          targetId,
          powerId: statusToApply,
          amount: element === 'fire' ? damageDealt : 2,
        })
      }
    }

    // Trigger onHit effects
    if (effect.triggerOnHit && damageDealt > 0 && executeEffect) {
      const hitCtx = { ...ctx, currentTarget: targetId }
      for (const onHitEffect of effect.triggerOnHit) {
        executeEffect(draft, onHitEffect, hitCtx)
      }
    }

    // Trigger onAttack for attacker
    if (attacker && damageDealt > 0 && executePowerTriggers) {
      executePowerTriggers(draft, attacker, 'onAttack', targetId)
    }

    // Trigger onAttacked/onDamaged for defender
    if (defender && damageDealt > 0 && executePowerTriggers) {
      executePowerTriggers(draft, defender, 'onAttacked', ctx.source)
      executePowerTriggers(draft, defender, 'onDamaged', ctx.source)
    }
  }
}

export function executeBlock(
  draft: RunState,
  effect: { type: 'block'; amount: EffectValue; target?: EntityTarget; persistent?: boolean },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const baseBlock = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const block = applyOutgoingBlockModifiers(baseBlock, entity)

    if (effect.persistent) {
      entity.barrier += block
    } else {
      entity.block += block
    }

    if (block > 0) {
      emitVisual(draft, {
        type: 'block',
        targetId,
        amount: block,
        variant: effect.persistent ? 'barrier' : undefined,
      })
    }

    if (executePowerTriggers) {
      executePowerTriggers(draft, entity, 'onBlock')
    }
  }
}

export function executeHeal(
  draft: RunState,
  effect: { type: 'heal'; amount: EffectValue; target?: EntityTarget; canOverheal?: boolean },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const prevHealth = entity.currentHealth
    if (effect.canOverheal) {
      entity.currentHealth += amount
    } else {
      entity.currentHealth = Math.min(entity.currentHealth + amount, entity.maxHealth)
    }
    const healed = entity.currentHealth - prevHealth

    if (healed > 0) {
      emitVisual(draft, { type: 'heal', targetId, amount: healed })
    }
  }
}

export function executeLifesteal(
  draft: RunState,
  effect: { type: 'lifesteal'; amount: EffectValue; target: EntityTarget; healTarget?: EntityTarget; ratio?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const damage = resolveValue(effect.amount, draft, ctx)
  const ratio = effect.ratio ?? 1

  // Resolve targets for visual event
  const damageTargetIds = resolveEntityTargets(effect.target, draft, ctx)
  const healTargetId = effect.healTarget
    ? resolveEntityTargets(effect.healTarget, draft, ctx)[0]
    : ctx.source

  // Deal damage
  executeDamage(draft, { type: 'damage', amount: damage, target: effect.target }, ctx)

  // Heal
  const healAmount = Math.floor(damage * ratio)
  const healTarget = effect.healTarget ?? 'self'
  executeHeal(draft, { type: 'heal', amount: healAmount, target: healTarget }, ctx)

  // Emit lifesteal visual for soulDrain animation
  if (damageTargetIds.length > 0 && healTargetId) {
    emitVisual(draft, {
      type: 'lifesteal',
      sourceId: damageTargetIds[0],
      targetId: healTargetId,
      damage,
      heal: healAmount,
    })
  }
}

export function executeDestroyBlock(
  draft: RunState,
  effect: { type: 'destroyBlock'; target: EntityTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const targetIds = resolveEntityTargets(effect.target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const maxRemove = effect.amount ? resolveValue(effect.amount, draft, ctx) : Infinity
    const removed = Math.min(entity.block, maxRemove)

    entity.block = Math.max(0, entity.block - removed)

    if (removed > 0) {
      emitVisual(draft, { type: 'block', targetId, amount: -removed })
    }
  }
}

export function executeMaxHealth(
  draft: RunState,
  effect: { type: 'maxHealth'; amount: EffectValue; target?: EntityTarget; operation: 'gain' | 'lose' | 'set' },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const prevMax = entity.maxHealth

    switch (effect.operation) {
      case 'gain':
        entity.maxHealth += amount
        entity.currentHealth += amount // Also heal by the amount
        break
      case 'lose':
        entity.maxHealth = Math.max(1, entity.maxHealth - amount)
        entity.currentHealth = Math.min(entity.currentHealth, entity.maxHealth)
        break
      case 'set':
        entity.maxHealth = Math.max(1, amount)
        entity.currentHealth = Math.min(entity.currentHealth, entity.maxHealth)
        break
    }

    const delta = entity.maxHealth - prevMax
    if (delta !== 0) {
      emitVisual(draft, { type: 'maxHealth', targetId, delta })
    }
  }
}

export function executeSetHealth(
  draft: RunState,
  effect: { type: 'setHealth'; amount: EffectValue; target?: EntityTarget },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const oldHealth = entity.currentHealth
    entity.currentHealth = Math.max(1, Math.min(amount, entity.maxHealth))

    const delta = entity.currentHealth - oldHealth
    if (delta > 0) {
      emitVisual(draft, { type: 'heal', targetId, amount: delta })
    } else if (delta < 0) {
      emitVisual(draft, { type: 'damage', targetId, amount: -delta })
    }
  }
}

// --- ADVANCED COMBAT EFFECTS ---

export function executeExecute(
  draft: RunState,
  effect: { type: 'execute'; amount: EffectValue; target?: EntityTarget; threshold: number; bonusMultiplier: number; element?: Element },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const baseDamage = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'enemy'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const hpPercent = entity.currentHealth / entity.maxHealth
    const damage = hpPercent <= effect.threshold
      ? Math.floor(baseDamage * effect.bonusMultiplier)
      : baseDamage

    // Use the damage effect internally
    executeDamage(draft, {
      type: 'damage',
      amount: damage,
      target: { type: 'specific', id: targetId },
      element: effect.element,
    }, ctx)

    if (hpPercent <= effect.threshold) {
      emitVisual(draft, { type: 'damage', targetId, amount: damage, variant: 'execute' })
    }
  }
}

export function executeSplash(
  draft: RunState,
  effect: { type: 'splash'; amount: EffectValue; splashAmount: EffectValue; target: EntityTarget; splashTargets?: 'all_enemies' | 'adjacent'; element?: Element },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const primaryDamage = resolveValue(effect.amount, draft, ctx)
  const splashDamage = resolveValue(effect.splashAmount, draft, ctx)
  const primaryTargetIds = resolveEntityTargets(effect.target, draft, ctx)

  // Deal primary damage
  for (const targetId of primaryTargetIds) {
    executeDamage(draft, {
      type: 'damage',
      amount: primaryDamage,
      target: { type: 'specific', id: targetId },
      element: effect.element,
    }, ctx)
  }

  // Deal splash damage to others
  const splashTargetType = effect.splashTargets ?? 'all_enemies'
  if (splashTargetType === 'all_enemies') {
    const otherEnemies = draft.combat.enemies.filter(e =>
      e.currentHealth > 0 && !primaryTargetIds.includes(e.id)
    )
    for (const enemy of otherEnemies) {
      executeDamage(draft, {
        type: 'damage',
        amount: splashDamage,
        target: { type: 'specific', id: enemy.id },
        element: effect.element,
      }, ctx)
      emitVisual(draft, { type: 'damage', targetId: enemy.id, amount: splashDamage, variant: 'chain' })
    }
  }
}

export function executeRecoil(
  draft: RunState,
  effect: { type: 'recoil'; amount: EffectValue; target?: EntityTarget },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const damage = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    // Apply damage directly (bypasses block for self-damage)
    entity.currentHealth = Math.max(0, entity.currentHealth - damage)
    emitVisual(draft, { type: 'damage', targetId, amount: damage, variant: 'piercing' })
  }
}

export function executeCounterAttack(
  draft: RunState,
  effect: { type: 'counterAttack'; amount: EffectValue; duration?: number; triggersRemaining?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const damage = resolveValue(effect.amount, draft, ctx)
  const duration = effect.duration ?? 1

  // Apply as a power that triggers onAttacked
  const player = draft.combat.player
  const existingCounter = player.powers['counterAttack']
  const newStacks = existingCounter ? (existingCounter.stacks ?? 0) + damage : damage

  player.powers['counterAttack'] = {
    stacks: newStacks,
    duration,
  }

  emitVisual(draft, { type: 'powerApply', targetId: player.id, powerId: 'counterAttack', amount: damage })
}

export function executeChain(
  draft: RunState,
  effect: { type: 'chain'; amount: EffectValue; bounces: number; decay?: number; element?: Element },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  let damage = resolveValue(effect.amount, draft, ctx)
  const decayRate = effect.decay ?? 0.2
  const enemies = draft.combat.enemies.filter(e => e.currentHealth > 0)

  if (enemies.length === 0) return

  // Hit enemies in sequence with decaying damage
  const bounceCount = Math.min(effect.bounces, enemies.length)
  for (let i = 0; i < bounceCount; i++) {
    const targetEnemy = enemies[i % enemies.length]

    executeDamage(draft, {
      type: 'damage',
      amount: Math.floor(damage),
      target: { type: 'specific', id: targetEnemy.id },
      element: effect.element,
    }, ctx)

    emitVisual(draft, {
      type: 'damage',
      targetId: targetEnemy.id,
      amount: Math.floor(damage),
      variant: 'chain',
      element: effect.element,
    })

    // Decay damage for next bounce
    damage = damage * (1 - decayRate)
  }
}

export function executeWeakenIntent(
  draft: RunState,
  effect: { type: 'weakenIntent'; amount: EffectValue; target: EntityTarget },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const reduction = resolveValue(effect.amount, draft, ctx)
  const targetIds = resolveEntityTargets(effect.target, draft, ctx)

  for (const targetId of targetIds) {
    const enemy = draft.combat.enemies.find(e => e.id === targetId)
    if (!enemy || !enemy.intent) continue

    // Reduce intent value
    if (enemy.intent.value !== undefined) {
      enemy.intent.value = Math.max(0, enemy.intent.value - reduction)
      emitVisual(draft, { type: 'intentWeakened', targetId, reduction })
    }
  }
}

// --- MARK TARGET ---

export function executeMarkTarget(
  draft: RunState,
  effect: { type: 'markTarget'; target: EntityTarget; duration?: number; bonusDamage?: EffectValue; bonusMultiplier?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const targetIds = resolveEntityTargets(effect.target, draft, ctx)
  const duration = effect.duration ?? 1

  for (const targetId of targetIds) {
    const entity = getEntity(draft.combat, targetId)
    if (!entity) continue

    // Apply 'marked' power with duration
    const existingPower = entity.powers.find(p => p.id === 'marked')
    if (existingPower) {
      existingPower.duration = Math.max(existingPower.duration ?? 0, duration)
    } else {
      entity.powers.push({
        id: 'marked',
        amount: effect.bonusMultiplier ? Math.round(effect.bonusMultiplier * 100) : 50, // Store as percentage
        duration,
      })
    }
    emitVisual(draft, { type: 'markTarget', targetId, duration })
  }
}

// --- REFLECT ---

export function executeReflect(
  draft: RunState,
  effect: { type: 'reflect'; amount: EffectValue; percentage?: number; duration?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const duration = effect.duration ?? 1

  // Apply 'reflect' power to player
  const player = draft.combat.player
  const existingPower = player.powers.find(p => p.id === 'reflect')
  if (existingPower) {
    existingPower.amount += amount
    if (duration !== -1) existingPower.duration = Math.max(existingPower.duration ?? 0, duration)
  } else {
    player.powers.push({
      id: 'reflect',
      amount,
      duration: duration === -1 ? undefined : duration,
    })
  }
  emitVisual(draft, { type: 'reflect', targetId: 'player', amount })
}

// --- AMPLIFY ---

export function executeAmplify(
  draft: RunState,
  effect: { type: 'amplify'; multiplier: number; attacks?: number; duration?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const attacks = effect.attacks ?? 1
  const multiplierPercent = Math.round(effect.multiplier * 100)

  // Apply 'amplify' power to player
  const player = draft.combat.player
  const existingPower = player.powers.find(p => p.id === 'amplify')
  if (existingPower) {
    existingPower.amount = Math.max(existingPower.amount, multiplierPercent)
    existingPower.stacks = (existingPower.stacks ?? 0) + attacks
  } else {
    player.powers.push({
      id: 'amplify',
      amount: multiplierPercent, // Store multiplier as percentage
      stacks: attacks,
    })
  }
  emitVisual(draft, { type: 'amplify', targetId: 'player', multiplier: effect.multiplier, attacks })
}

// --- ENERGY NEXT TURN ---

export function executeEnergyNextTurn(
  draft: RunState,
  effect: { type: 'energyNextTurn'; amount: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)

  // Store in combat state for next turn processing
  draft.combat.energyNextTurn = (draft.combat.energyNextTurn ?? 0) + amount
  emitVisual(draft, { type: 'energyNextTurn', amount })
}

// --- TEMP MAX ENERGY ---

export function executeTempMaxEnergy(
  draft: RunState,
  effect: { type: 'tempMaxEnergy'; amount: EffectValue; duration?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const duration = effect.duration ?? 1

  // Apply temporary max energy power
  const player = draft.combat.player
  const existingPower = player.powers.find(p => p.id === 'tempMaxEnergy')
  if (existingPower) {
    existingPower.amount += amount
    if (existingPower.duration !== undefined) {
      existingPower.duration = Math.max(existingPower.duration, duration)
    }
  } else {
    player.powers.push({
      id: 'tempMaxEnergy',
      amount,
      duration,
    })
  }

  // Immediately increase current max energy
  draft.combat.maxEnergy += amount
  draft.combat.energy += amount
  emitVisual(draft, { type: 'tempMaxEnergy', amount })
}
