// ============================================
// EFFECT RESOLUTION UTILITIES
// ============================================

import type {
  RunState,
  Entity,
  EnemyEntity,
  EffectValue,
  ScalingSource,
  Condition,
  ComparisonOp,
  EntityTarget,
  CardTarget,
  FilteredCardTarget,
  CardInstance,
  EffectContext,
} from '../types'

// ============================================
// VALUE RESOLUTION
// ============================================

export function resolveValue(
  value: EffectValue,
  state: RunState,
  ctx: EffectContext
): number {
  if (typeof value === 'number') return value

  switch (value.type) {
    case 'fixed':
      return value.value

    case 'range':
      // Ranges should be resolved at generation, fallback to midpoint
      return Math.floor((value.min + value.max) / 2)

    case 'scaled': {
      const sourceValue = getScalingSourceValue(value.source, state, ctx)
      const scaled = value.base + value.perUnit * sourceValue
      return value.max !== undefined ? Math.min(scaled, value.max) : scaled
    }

    case 'generatedScaled': {
      // Should be resolved at generation, fallback to min base
      const sourceValue = getScalingSourceValue(value.source, state, ctx)
      return value.baseRange[0] + value.perUnit * sourceValue
    }

    case 'powerAmount':
      // Use the power's stack amount from context
      return ctx.powerStacks ?? 0
  }
}

export function getScalingSourceValue(
  source: ScalingSource,
  state: RunState,
  ctx: EffectContext
): number {
  const combat = state.combat
  if (!combat) return 0

  switch (source) {
    case 'energy':
      return combat.player.energy
    case 'maxEnergy':
      return combat.player.maxEnergy
    case 'cardsInHand':
      return combat.hand.length
    case 'cardsPlayed':
      return combat.cardsPlayedThisTurn
    case 'block':
      return combat.player.block
    case 'missingHealth':
      return combat.player.maxHealth - combat.player.currentHealth
    case 'healthPercent':
      return combat.player.currentHealth / combat.player.maxHealth
    case 'enemyCount':
      return combat.enemies.length
    case 'turnNumber':
      return combat.turn
    case 'powerStacks':
      return ctx.powerStacks ?? 0
    default:
      return 0
  }
}

// ============================================
// CONDITION EVALUATION
// ============================================

export function evaluateCondition(
  condition: Condition,
  state: RunState,
  ctx: EffectContext
): boolean {
  const combat = state.combat
  if (!combat) return false

  switch (condition.type) {
    case 'health': {
      const entity = resolveEntityTarget(condition.target, state, ctx)
      if (!entity) return false

      let value: number
      switch (condition.compare) {
        case 'current':
          value = entity.currentHealth
          break
        case 'max':
          value = entity.maxHealth
          break
        case 'percent':
          value = (entity.currentHealth / entity.maxHealth) * 100
          break
        case 'missing':
          value = entity.maxHealth - entity.currentHealth
          break
      }
      return compareValues(value, condition.op, condition.value)
    }

    case 'hasPower': {
      const entity = resolveEntityTarget(condition.target, state, ctx)
      if (!entity) return false
      const power = entity.powers[condition.powerId]
      if (!power) return false
      return power.amount >= (condition.minStacks ?? 1)
    }

    case 'resource': {
      let value: number
      switch (condition.resource) {
        case 'energy':
          value = combat.player.energy
          break
        case 'gold':
          value = state.gold
          break
        case 'block': {
          const entity = resolveEntityTarget(condition.target ?? 'self', state, ctx)
          value = entity?.block ?? 0
          break
        }
      }
      return compareValues(value, condition.op, condition.value)
    }

    case 'cardCount': {
      let pile: CardInstance[]
      switch (condition.pile) {
        case 'hand':
          pile = combat.hand
          break
        case 'drawPile':
          pile = combat.drawPile
          break
        case 'discardPile':
          pile = combat.discardPile
          break
        case 'exhaustPile':
          pile = combat.exhaustPile
          break
      }
      // TODO: Apply filter if provided
      return compareValues(pile.length, condition.op, condition.value)
    }

    case 'turn':
      return compareValues(combat.turn, condition.op, condition.value)

    case 'combat': {
      switch (condition.check) {
        case 'enemyCount':
          return compareValues(
            combat.enemies.length,
            condition.op ?? '>=',
            condition.value ?? 1
          )
        case 'isPlayerTurn':
          return combat.phase === 'playerTurn'
        case 'isFirstTurn':
          return combat.turn === 1
      }
      return false
    }

    case 'and':
      return condition.conditions.every((c) => evaluateCondition(c, state, ctx))

    case 'or':
      return condition.conditions.some((c) => evaluateCondition(c, state, ctx))

    case 'not':
      return !evaluateCondition(condition.condition, state, ctx)
  }
}

function compareValues(a: number, op: ComparisonOp, b: number): boolean {
  switch (op) {
    case '<':
      return a < b
    case '<=':
      return a <= b
    case '=':
      return a === b
    case '>=':
      return a >= b
    case '>':
      return a > b
    case '!=':
      return a !== b
  }
}

// ============================================
// TARGET RESOLUTION
// ============================================

/** Resolve a single entity target to an Entity or null */
export function resolveEntityTarget(
  target: EntityTarget,
  state: RunState,
  ctx: EffectContext
): Entity | null {
  const combat = state.combat
  if (!combat) return null

  switch (target) {
    case 'self':
    case 'player':
      return combat.player

    case 'source':
      // For triggers, source is who triggered the effect
      if (ctx.source === 'player') return combat.player
      return combat.enemies.find((e) => e.id === ctx.source) ?? null

    case 'enemy':
      // Requires player selection - use ctx.cardTarget
      if (ctx.cardTarget) {
        return combat.enemies.find((e) => e.id === ctx.cardTarget) ?? null
      }
      // Fallback to first enemy
      return combat.enemies[0] ?? null

    case 'randomEnemy':
      if (combat.enemies.length === 0) return null
      return combat.enemies[Math.floor(Math.random() * combat.enemies.length)]

    case 'weakestEnemy':
      return (
        combat.enemies.reduce<EnemyEntity | null>((weakest, e) => {
          if (!weakest || e.currentHealth < weakest.currentHealth) return e
          return weakest
        }, null) ?? null
      )

    case 'strongestEnemy':
      return (
        combat.enemies.reduce<EnemyEntity | null>((strongest, e) => {
          if (!strongest || e.currentHealth > strongest.currentHealth) return e
          return strongest
        }, null) ?? null
      )

    case 'frontEnemy':
      return combat.enemies[0] ?? null

    case 'backEnemy':
      return combat.enemies[combat.enemies.length - 1] ?? null

    // Multi-targets return first for single resolution
    case 'allEnemies':
      return combat.enemies[0] ?? null

    case 'allEntities':
      return combat.player

    case 'otherEnemies':
      // All except current target
      const others = combat.enemies.filter((e) => e.id !== ctx.currentTarget)
      return others[0] ?? null

    default:
      return null
  }
}

/** Resolve a target to multiple entity IDs */
export function resolveEntityTargets(
  target: EntityTarget,
  state: RunState,
  ctx: EffectContext
): string[] {
  const combat = state.combat
  if (!combat) return []

  switch (target) {
    case 'self':
    case 'player':
      return ['player']

    case 'source':
      return [ctx.source]

    case 'enemy':
      if (ctx.cardTarget) return [ctx.cardTarget]
      return combat.enemies[0] ? [combat.enemies[0].id] : []

    case 'randomEnemy':
      if (combat.enemies.length === 0) return []
      const idx = Math.floor(Math.random() * combat.enemies.length)
      return [combat.enemies[idx].id]

    case 'weakestEnemy': {
      const weakest = resolveEntityTarget('weakestEnemy', state, ctx)
      return weakest ? [weakest.id] : []
    }

    case 'strongestEnemy': {
      const strongest = resolveEntityTarget('strongestEnemy', state, ctx)
      return strongest ? [strongest.id] : []
    }

    case 'frontEnemy':
      return combat.enemies[0] ? [combat.enemies[0].id] : []

    case 'backEnemy':
      return combat.enemies.length > 0
        ? [combat.enemies[combat.enemies.length - 1].id]
        : []

    case 'allEnemies':
      return combat.enemies.map((e) => e.id)

    case 'allEntities':
      return ['player', ...combat.enemies.map((e) => e.id)]

    case 'otherEnemies':
      return combat.enemies
        .filter((e) => e.id !== ctx.currentTarget)
        .map((e) => e.id)

    default:
      return []
  }
}

/** Get entity by ID */
export function getEntityById(
  id: string,
  state: RunState
): Entity | null {
  const combat = state.combat
  if (!combat) return null

  if (id === 'player') return combat.player
  return combat.enemies.find((e) => e.id === id) ?? null
}

// ============================================
// CARD TARGET RESOLUTION
// ============================================

export function resolveCardTarget(
  target: CardTarget | FilteredCardTarget,
  state: RunState,
  _ctx: EffectContext
): CardInstance[] {
  const combat = state.combat
  if (!combat) return []

  // Handle FilteredCardTarget
  if (typeof target === 'object' && 'from' in target) {
    let cards = resolveCardTarget(target.from, state, _ctx)
    // TODO: Apply filter
    if (target.count !== undefined) {
      cards = cards.slice(0, target.count)
    }
    return cards
  }

  switch (target) {
    case 'hand':
      return [...combat.hand]
    case 'drawPile':
      return [...combat.drawPile]
    case 'discardPile':
      return [...combat.discardPile]
    case 'exhaustPile':
      return [...combat.exhaustPile]
    case 'randomHand':
      if (combat.hand.length === 0) return []
      return [combat.hand[Math.floor(Math.random() * combat.hand.length)]]
    case 'randomDraw':
      if (combat.drawPile.length === 0) return []
      return [combat.drawPile[Math.floor(Math.random() * combat.drawPile.length)]]
    case 'randomDiscard':
      if (combat.discardPile.length === 0) return []
      return [
        combat.discardPile[Math.floor(Math.random() * combat.discardPile.length)],
      ]
    case 'leftmostHand':
      return combat.hand[0] ? [combat.hand[0]] : []
    case 'rightmostHand':
      return combat.hand.length > 0
        ? [combat.hand[combat.hand.length - 1]]
        : []
    case 'topDraw':
      return combat.drawPile.length > 0
        ? [combat.drawPile[combat.drawPile.length - 1]]
        : []
    case 'thisCard':
      // Should be handled by caller with context
      return []
    case 'lastPlayed':
      return combat.lastPlayedCard ? [combat.lastPlayedCard] : []
    default:
      return []
  }
}

// ============================================
// RANGE RESOLUTION (for card generation)
// ============================================

export function resolveRangeValue(value: EffectValue, rng?: () => number): number {
  if (typeof value === 'number') return value

  const random = rng ?? Math.random

  switch (value.type) {
    case 'fixed':
      return value.value
    case 'range':
      return value.min + Math.floor(random() * (value.max - value.min + 1))
    case 'scaled':
      // For generation, just use base
      return value.base
    case 'generatedScaled':
      // Pick random from baseRange
      return (
        value.baseRange[0] +
        Math.floor(random() * (value.baseRange[1] - value.baseRange[0] + 1))
      )
    case 'powerAmount':
      // PowerAmount is runtime-dependent, return 1 as fallback for generation
      return 1
  }
}

/**
 * Get base energy cost from card definition (ignores instance modifiers).
 * Returns 'X' for scaled costs, otherwise the number.
 */
export function getEnergyCost(energy: number | EffectValue): number | 'X' {
  if (typeof energy === 'number') return energy
  if (energy.type === 'scaled' && energy.source === 'energy') return 'X'
  if (energy.type === 'fixed') return energy.value
  if (energy.type === 'range') return energy.min // Show minimum
  return 0
}

/**
 * Get base energy cost as a number (ignores instance modifiers).
 * X-cost cards return 0 (can always be played).
 */
export function getEnergyCostNumber(energy: number | EffectValue): number {
  if (typeof energy === 'number') return energy
  if (energy.type === 'scaled' && energy.source === 'energy') return 0 // X-cost
  if (energy.type === 'fixed') return energy.value
  if (energy.type === 'range') return energy.min
  return 0
}

/**
 * Get effective energy cost for a card instance (base + costModifier).
 * Applies any temporary cost modifications from effects.
 */
export function getEffectiveEnergyCost(
  baseCost: number | EffectValue,
  cardInstance: CardInstance
): number | 'X' {
  const base = getEnergyCost(baseCost)
  if (base === 'X') return 'X'

  const modifier = cardInstance.costModifier ?? 0
  return Math.max(0, base + modifier)
}

/**
 * Get effective energy cost as a number for comparison.
 */
export function getEffectiveEnergyCostNumber(
  baseCost: number | EffectValue,
  cardInstance: CardInstance
): number {
  const base = getEnergyCostNumber(baseCost)
  if (base === 0 && typeof baseCost !== 'number') {
    // X-cost card - always playable
    return 0
  }

  const modifier = cardInstance.costModifier ?? 0
  return Math.max(0, base + modifier)
}
