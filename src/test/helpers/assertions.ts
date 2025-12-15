import { expect } from 'vitest'
import type { RunState, CombatState, Entity, PlayerEntity, EnemyEntity } from '../../types'

// ============================================================================
// Entity Assertions
// ============================================================================

/** Assert entity has specific health */
export function expectHealth(entity: Entity, expected: number): void {
  expect(entity.currentHealth).toBe(expected)
}

/** Assert entity took specific damage from max */
export function expectDamaged(entity: Entity, amount: number): void {
  expect(entity.currentHealth).toBe(entity.maxHealth - amount)
}

/** Assert entity has specific block */
export function expectBlock(entity: Entity, expected: number): void {
  expect(entity.block).toBe(expected)
}

/** Assert entity has specific barrier */
export function expectBarrier(entity: Entity, expected: number): void {
  expect(entity.barrier).toBe(expected)
}

/** Assert entity has a power with optional amount check */
export function expectPower(entity: Entity, powerId: string, amount?: number): void {
  expect(entity.powers[powerId]).toBeDefined()
  if (amount !== undefined) {
    expect(entity.powers[powerId].amount).toBe(amount)
  }
}

/** Assert entity does NOT have a power */
export function expectNoPower(entity: Entity, powerId: string): void {
  expect(entity.powers[powerId]).toBeUndefined()
}

/** Assert entity is dead (health <= 0 or removed from enemies) */
export function expectDead(state: RunState, entityId: string): void {
  const combat = state.combat!
  if (entityId === 'player') {
    expect(combat.player.currentHealth).toBeLessThanOrEqual(0)
  } else {
    expect(combat.enemies.find(e => e.id === entityId)).toBeUndefined()
  }
}

/** Assert entity is alive */
export function expectAlive(state: RunState, entityId: string): void {
  const combat = state.combat!
  if (entityId === 'player') {
    expect(combat.player.currentHealth).toBeGreaterThan(0)
  } else {
    const enemy = combat.enemies.find(e => e.id === entityId)
    expect(enemy).toBeDefined()
    expect(enemy!.currentHealth).toBeGreaterThan(0)
  }
}

// ============================================================================
// Combat State Assertions
// ============================================================================

/** Assert combat is in specific phase */
export function expectPhase(state: RunState, phase: CombatState['phase']): void {
  expect(state.combat?.phase).toBe(phase)
}

/** Assert combat ended in victory */
export function expectVictory(state: RunState): void {
  expect(state.combat?.phase).toBe('victory')
  expect(state.combat?.enemies).toHaveLength(0)
}

/** Assert combat ended in defeat */
export function expectDefeat(state: RunState): void {
  expect(state.combat?.phase).toBe('defeat')
}

/** Assert current turn number */
export function expectTurn(state: RunState, turn: number): void {
  expect(state.combat?.turn).toBe(turn)
}

/** Assert player has specific energy */
export function expectEnergy(state: RunState, energy: number): void {
  expect(state.combat?.player.energy).toBe(energy)
}

/** Assert enemy count */
export function expectEnemyCount(state: RunState, count: number): void {
  expect(state.combat?.enemies).toHaveLength(count)
}

// ============================================================================
// Card Pile Assertions
// ============================================================================

/** Assert hand has specific size */
export function expectHandSize(state: RunState, size: number): void {
  expect(state.combat?.hand).toHaveLength(size)
}

/** Assert draw pile has specific size */
export function expectDrawPileSize(state: RunState, size: number): void {
  expect(state.combat?.drawPile).toHaveLength(size)
}

/** Assert discard pile has specific size */
export function expectDiscardPileSize(state: RunState, size: number): void {
  expect(state.combat?.discardPile).toHaveLength(size)
}

/** Assert exhaust pile has specific size */
export function expectExhaustPileSize(state: RunState, size: number): void {
  expect(state.combat?.exhaustPile).toHaveLength(size)
}

/** Assert card with definition ID is in hand */
export function expectCardInHand(state: RunState, cardId: string): void {
  const found = state.combat?.hand.some(c => c.definitionId === cardId)
  expect(found).toBe(true)
}

/** Assert card with definition ID is NOT in hand */
export function expectCardNotInHand(state: RunState, cardId: string): void {
  const found = state.combat?.hand.some(c => c.definitionId === cardId)
  expect(found).toBe(false)
}

/** Assert card is in discard pile */
export function expectCardInDiscard(state: RunState, cardId: string): void {
  const found = state.combat?.discardPile.some(c => c.definitionId === cardId)
  expect(found).toBe(true)
}

/** Assert card is in exhaust pile */
export function expectCardInExhaust(state: RunState, cardId: string): void {
  const found = state.combat?.exhaustPile.some(c => c.definitionId === cardId)
  expect(found).toBe(true)
}

// ============================================================================
// Stats Assertions
// ============================================================================

/** Assert run stats match expected values */
export function expectStats(state: RunState, expected: Partial<typeof state.stats>): void {
  Object.entries(expected).forEach(([key, value]) => {
    expect(state.stats[key as keyof typeof state.stats]).toBe(value)
  })
}

/** Assert damage dealt stat */
export function expectDamageDealt(state: RunState, amount: number): void {
  expect(state.stats.damageDealt).toBe(amount)
}

/** Assert damage taken stat */
export function expectDamageTaken(state: RunState, amount: number): void {
  expect(state.stats.damageTaken).toBe(amount)
}

/** Assert cards played stat */
export function expectCardsPlayed(state: RunState, count: number): void {
  expect(state.stats.cardsPlayed).toBe(count)
}

/** Assert enemies killed stat */
export function expectEnemiesKilled(state: RunState, count: number): void {
  expect(state.stats.enemiesKilled).toBe(count)
}

// ============================================================================
// Game Phase Assertions
// ============================================================================

/** Assert game is in specific phase */
export function expectGamePhase(state: RunState, phase: RunState['gamePhase']): void {
  expect(state.gamePhase).toBe(phase)
}

/** Assert current floor */
export function expectFloor(state: RunState, floor: number): void {
  expect(state.floor).toBe(floor)
}

/** Assert gold amount */
export function expectGold(state: RunState, gold: number): void {
  expect(state.gold).toBe(gold)
}
