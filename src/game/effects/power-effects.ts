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
