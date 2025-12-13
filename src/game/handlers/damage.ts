// Damage, heal, and block handlers
import type { RunState } from '../../types'
import { applyDamageInternal } from './shared'

export function handleDamage(draft: RunState, targetId: string, amount: number): void {
  if (!draft.combat) return
  applyDamageInternal(draft, targetId, amount)
}

export function handleHeal(draft: RunState, targetId: string, amount: number): void {
  if (!draft.combat) return

  if (targetId === 'player') {
    draft.combat.player.currentHealth = Math.min(
      draft.combat.player.currentHealth + amount,
      draft.combat.player.maxHealth
    )
  }
}

export function handleAddBlock(
  draft: RunState,
  targetId: string,
  amount: number
): void {
  if (!draft.combat) return

  if (targetId === 'player') {
    draft.combat.player.block += amount
  } else {
    const enemy = draft.combat.enemies.find((e) => e.id === targetId)
    if (enemy) {
      enemy.block += amount
    }
  }
}
