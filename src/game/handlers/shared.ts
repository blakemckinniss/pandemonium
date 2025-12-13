// Shared utilities for action handlers
import type { RunState, CombatState, VisualEvent } from '../../types'

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Emit a visual event to the combat queue
 */
export function emitVisual(draft: RunState, event: VisualEvent): void {
  if (draft.combat) {
    draft.combat.visualQueue.push(event)
  }
}

/**
 * Draw cards from draw pile, reshuffling discard if needed
 */
export function drawCardsInternal(combat: CombatState, amount: number): void {
  for (let i = 0; i < amount; i++) {
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) break
      combat.drawPile = shuffleArray([...combat.discardPile])
      combat.discardPile = []
    }

    const card = combat.drawPile.pop()
    if (card) {
      combat.hand.push(card)
    }
  }
}

/**
 * Apply damage to an entity, returns actual damage dealt
 */
export function applyDamageInternal(
  draft: RunState,
  targetId: string,
  amount: number,
  piercing?: boolean,
  onKillCallback?: () => void
): number {
  if (!draft.combat) return 0
  const combat = draft.combat

  if (targetId === 'player') {
    let remaining = amount

    // Block absorbs first (unless piercing)
    if (!piercing && combat.player.block > 0) {
      const blocked = Math.min(combat.player.block, remaining)
      combat.player.block -= blocked
      remaining -= blocked
    }

    // Barrier absorbs second (unless piercing)
    if (!piercing && remaining > 0 && combat.player.barrier > 0) {
      const absorbed = Math.min(combat.player.barrier, remaining)
      combat.player.barrier -= absorbed
      remaining -= absorbed
    }

    combat.player.currentHealth -= remaining
    draft.stats.damageTaken += remaining

    if (combat.player.currentHealth <= 0) {
      combat.phase = 'defeat'
    }

    return remaining
  } else {
    const enemy = combat.enemies.find((e) => e.id === targetId)
    if (!enemy) return 0

    let remaining = amount

    if (!piercing && enemy.block > 0) {
      const blocked = Math.min(enemy.block, remaining)
      enemy.block -= blocked
      remaining -= blocked
    }

    // Barrier absorbs second (unless piercing)
    if (!piercing && remaining > 0 && enemy.barrier > 0) {
      const absorbed = Math.min(enemy.barrier, remaining)
      enemy.barrier -= absorbed
      remaining -= absorbed
    }

    enemy.currentHealth -= remaining
    draft.stats.damageDealt += remaining

    if (enemy.currentHealth <= 0) {
      combat.enemies = combat.enemies.filter((e) => e.id !== targetId)
      draft.stats.enemiesKilled++

      // Call the onKill callback if provided
      if (onKillCallback) {
        onKillCallback()
      }

      if (combat.enemies.length === 0) {
        combat.phase = 'victory'
      }
    }

    return remaining
  }
}
