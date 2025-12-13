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

  // Deal damage
  executeDamage(draft, { type: 'damage', amount: damage, target: effect.target }, ctx)

  // Heal
  const healAmount = Math.floor(damage * ratio)
  const healTarget = effect.healTarget ?? 'self'
  executeHeal(draft, { type: 'heal', amount: healAmount, target: healTarget }, ctx)
}
