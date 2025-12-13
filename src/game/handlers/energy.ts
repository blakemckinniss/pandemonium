// Energy management handlers
import type { RunState } from '../../types'
import { applyPowerToEntity } from '../powers'
import { getEntityById } from '../../lib/effects'

export function handleSpendEnergy(draft: RunState, amount: number): void {
  if (!draft.combat) return
  draft.combat.player.energy = Math.max(0, draft.combat.player.energy - amount)
}

export function handleGainEnergy(draft: RunState, amount: number): void {
  if (!draft.combat) return
  draft.combat.player.energy += amount
}

export function handleApplyPower(
  draft: RunState,
  targetId: string,
  powerId: string,
  amount: number
): void {
  if (!draft.combat) return

  const entity = getEntityById(targetId, draft)
  if (!entity) return

  applyPowerToEntity(entity, powerId, amount)
}
