// Power application and removal effects
import type { RunState, EffectContext, EffectValue, EntityTarget } from '../../types'
import { resolveValue, resolveEntityTargets, getEntityById } from '../../lib/effects'
import { applyPowerToEntity, removePowerFromEntity } from '../powers'
import { emitVisual } from '../handlers/shared'

export function executeApplyPower(
  draft: RunState,
  effect: { type: 'applyPower'; powerId: string; amount: EffectValue; target?: EntityTarget; duration?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = resolveValue(effect.amount, draft, ctx)
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    applyPowerToEntity(entity, effect.powerId, amount, effect.duration)

    emitVisual(draft, {
      type: 'powerApply',
      targetId,
      powerId: effect.powerId,
      amount,
    })
  }
}

export function executeRemovePower(
  draft: RunState,
  effect: { type: 'removePower'; powerId: string; target?: EntityTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const amount = effect.amount ? resolveValue(effect.amount, draft, ctx) : undefined
  const target = effect.target ?? 'self'
  const targetIds = resolveEntityTargets(target, draft, ctx)

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    const hadPower = entity.powers[effect.powerId] !== undefined
    removePowerFromEntity(entity, effect.powerId, amount)

    if (hadPower) {
      emitVisual(draft, {
        type: 'powerRemove',
        targetId,
        powerId: effect.powerId,
      })
    }
  }
}

export function executeTransferPower(
  draft: RunState,
  effect: { type: 'transferPower'; powerId: string; from: EntityTarget; to: EntityTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const fromIds = resolveEntityTargets(effect.from, draft, ctx)
  const toIds = resolveEntityTargets(effect.to, draft, ctx)

  for (const fromId of fromIds) {
    const fromEntity = getEntityById(fromId, draft)
    if (!fromEntity) continue

    const power = fromEntity.powers[effect.powerId]
    if (!power) continue

    const transferAmount = effect.amount ? resolveValue(effect.amount, draft, ctx) : power.amount

    // Remove from source
    removePowerFromEntity(fromEntity, effect.powerId, transferAmount)
    emitVisual(draft, {
      type: 'powerRemove',
      targetId: fromId,
      powerId: effect.powerId,
    })

    // Apply to targets
    for (const toId of toIds) {
      const toEntity = getEntityById(toId, draft)
      if (!toEntity) continue

      applyPowerToEntity(toEntity, effect.powerId, transferAmount)
      emitVisual(draft, {
        type: 'powerApply',
        targetId: toId,
        powerId: effect.powerId,
        amount: transferAmount,
      })
    }
  }
}

export function executeStealPower(
  draft: RunState,
  effect: { type: 'stealPower'; powerId?: string; from: EntityTarget; to?: EntityTarget; amount?: EffectValue },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const fromIds = resolveEntityTargets(effect.from, draft, ctx)
  const toIds = resolveEntityTargets(effect.to ?? 'self', draft, ctx)

  for (const fromId of fromIds) {
    const fromEntity = getEntityById(fromId, draft)
    if (!fromEntity) continue

    // If no specific powerId, steal a random buff (positive power)
    let powerIdToSteal = effect.powerId
    if (!powerIdToSteal) {
      const buffIds = Object.keys(fromEntity.powers).filter(id => {
        // Consider strength, dexterity, etc. as buffs to steal
        const buffs = ['strength', 'dexterity', 'artifact', 'metallicize', 'platedArmor', 'regen']
        return buffs.includes(id) && (fromEntity.powers[id]?.stacks ?? 0) > 0
      })
      if (buffIds.length === 0) continue
      powerIdToSteal = buffIds[Math.floor(Math.random() * buffIds.length)]
    }

    const power = fromEntity.powers[powerIdToSteal]
    if (!power) continue

    const stealAmount = effect.amount ? resolveValue(effect.amount, draft, ctx) : (power.stacks ?? 1)

    // Remove from source
    removePowerFromEntity(fromEntity, powerIdToSteal, stealAmount)
    emitVisual(draft, {
      type: 'powerRemove',
      targetId: fromId,
      powerId: powerIdToSteal,
    })

    // Apply to thief
    for (const toId of toIds) {
      const toEntity = getEntityById(toId, draft)
      if (!toEntity) continue

      applyPowerToEntity(toEntity, powerIdToSteal, stealAmount)
      emitVisual(draft, {
        type: 'powerApply',
        targetId: toId,
        powerId: powerIdToSteal,
        amount: stealAmount,
      })
    }
  }
}

export function executeSilencePower(
  draft: RunState,
  effect: { type: 'silencePower'; powerId?: string; target: EntityTarget; duration?: number },
  ctx: EffectContext
): void {
  if (!draft.combat) return

  const targetIds = resolveEntityTargets(effect.target, draft, ctx)
  const duration = effect.duration ?? 1

  for (const targetId of targetIds) {
    const entity = getEntityById(targetId, draft)
    if (!entity) continue

    if (effect.powerId) {
      // Silence specific power
      const power = entity.powers[effect.powerId]
      if (power) {
        power.silenced = duration
        emitVisual(draft, {
          type: 'powerSilenced',
          targetId,
          powerId: effect.powerId,
          duration,
        })
      }
    } else {
      // Silence all powers
      for (const powerId of Object.keys(entity.powers)) {
        entity.powers[powerId].silenced = duration
      }
      emitVisual(draft, {
        type: 'powerSilenced',
        targetId,
        powerId: 'all',
        duration,
      })
    }
  }
}
