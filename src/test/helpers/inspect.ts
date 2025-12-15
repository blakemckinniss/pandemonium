import type { RunState, Entity, PlayerEntity, EnemyEntity, CardInstance, Power, CombatState } from '../../types'

// ============================================================================
// Entity Inspection
// ============================================================================

/** Get player entity from state */
export function getPlayer(state: RunState): PlayerEntity {
  if (!state.combat) throw new Error('No combat active')
  return state.combat.player
}

/** Get enemy by ID or index */
export function getEnemy(state: RunState, idOrIndex: string | number = 0): EnemyEntity {
  if (!state.combat) throw new Error('No combat active')

  if (typeof idOrIndex === 'number') {
    const enemy = state.combat.enemies[idOrIndex]
    if (!enemy) throw new Error(`No enemy at index ${idOrIndex}`)
    return enemy
  }

  const enemy = state.combat.enemies.find(e => e.id === idOrIndex)
  if (!enemy) throw new Error(`No enemy with id ${idOrIndex}`)
  return enemy
}

/** Get entity by ID (player or enemy) */
export function getEntity(state: RunState, id: string): Entity {
  if (!state.combat) throw new Error('No combat active')
  if (id === 'player') return state.combat.player

  const enemy = state.combat.enemies.find(e => e.id === id)
  if (!enemy) throw new Error(`No entity with id ${id}`)
  return enemy
}

/** Get all enemies */
export function getAllEnemies(state: RunState): EnemyEntity[] {
  return state.combat?.enemies ?? []
}

/** Get enemy count */
export function getEnemyCount(state: RunState): number {
  return state.combat?.enemies.length ?? 0
}

/** Get first enemy (convenience) */
export function getFirstEnemy(state: RunState): EnemyEntity {
  return getEnemy(state, 0)
}

// ============================================================================
// Power Inspection
// ============================================================================

/** Get power from entity (undefined if not present) */
export function getPower(entity: Entity, powerId: string): Power | undefined {
  return entity.powers[powerId]
}

/** Get power amount (0 if not present) */
export function getPowerAmount(entity: Entity, powerId: string): number {
  return entity.powers[powerId]?.amount ?? 0
}

/** Check if entity has a power */
export function hasPower(entity: Entity, powerId: string): boolean {
  return powerId in entity.powers
}

/** Get all power IDs on entity */
export function getPowerIds(entity: Entity): string[] {
  return Object.keys(entity.powers)
}

// ============================================================================
// Card Inspection
// ============================================================================

/** Get hand */
export function getHand(state: RunState): CardInstance[] {
  return state.combat?.hand ?? []
}

/** Get draw pile */
export function getDrawPile(state: RunState): CardInstance[] {
  return state.combat?.drawPile ?? []
}

/** Get discard pile */
export function getDiscardPile(state: RunState): CardInstance[] {
  return state.combat?.discardPile ?? []
}

/** Get exhaust pile */
export function getExhaustPile(state: RunState): CardInstance[] {
  return state.combat?.exhaustPile ?? []
}

/** Get hand size */
export function getHandSize(state: RunState): number {
  return state.combat?.hand.length ?? 0
}

/** Find card in hand by definition ID */
export function findCardInHand(state: RunState, definitionId: string): CardInstance | undefined {
  return state.combat?.hand.find(c => c.definitionId === definitionId)
}

/** Find card by UID (searches all piles) */
export function findCardByUid(state: RunState, uid: string): CardInstance | undefined {
  const combat = state.combat
  if (!combat) return undefined

  return (
    combat.hand.find(c => c.uid === uid) ??
    combat.drawPile.find(c => c.uid === uid) ??
    combat.discardPile.find(c => c.uid === uid) ??
    combat.exhaustPile.find(c => c.uid === uid)
  )
}

/** Check if card is in hand */
export function isCardInHand(state: RunState, cardIdOrUid: string): boolean {
  return state.combat?.hand.some(
    c => c.uid === cardIdOrUid || c.definitionId === cardIdOrUid
  ) ?? false
}

/** Get cards by definition ID from hand */
export function getCardsFromHand(state: RunState, definitionId: string): CardInstance[] {
  return state.combat?.hand.filter(c => c.definitionId === definitionId) ?? []
}

// ============================================================================
// Combat State Inspection
// ============================================================================

/** Check if combat is active */
export function isInCombat(state: RunState): boolean {
  return state.combat !== null
}

/** Check if it's player's turn */
export function isPlayerTurn(state: RunState): boolean {
  return state.combat?.phase === 'playerTurn'
}

/** Check if combat ended in victory */
export function isVictory(state: RunState): boolean {
  return state.combat?.phase === 'victory'
}

/** Check if combat ended in defeat */
export function isDefeat(state: RunState): boolean {
  return state.combat?.phase === 'defeat'
}

/** Check if combat has ended */
export function isCombatOver(state: RunState): boolean {
  return isVictory(state) || isDefeat(state)
}

/** Get current turn number */
export function getCurrentTurn(state: RunState): number {
  return state.combat?.turn ?? 0
}

/** Get cards played this turn */
export function getCardsPlayedThisTurn(state: RunState): number {
  return state.combat?.cardsPlayedThisTurn ?? 0
}

/** Get current energy */
export function getCurrentEnergy(state: RunState): number {
  return state.combat?.player.energy ?? 0
}

/** Get max energy */
export function getMaxEnergy(state: RunState): number {
  return state.combat?.player.maxEnergy ?? 0
}

/** Get current combat phase */
export function getCombatPhase(state: RunState): CombatState['phase'] | null {
  return state.combat?.phase ?? null
}

// ============================================================================
// Run State Inspection
// ============================================================================

/** Get current floor */
export function getFloor(state: RunState): number {
  return state.floor
}

/** Get gold */
export function getGold(state: RunState): number {
  return state.gold
}

/** Get hero current health */
export function getHeroHealth(state: RunState): number {
  return state.hero.currentHealth
}

/** Get hero max health */
export function getHeroMaxHealth(state: RunState): number {
  return state.hero.maxHealth
}

/** Get deck size */
export function getDeckSize(state: RunState): number {
  return state.deck.length
}

/** Get relic count */
export function getRelicCount(state: RunState): number {
  return state.relics.length
}

/** Check if player has a relic */
export function hasRelic(state: RunState, relicId: string): boolean {
  return state.relics.some(r => r.definitionId === relicId)
}
