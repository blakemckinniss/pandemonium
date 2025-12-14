import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  executeConditional,
  executeRepeat,
  executeRandom,
  executeSequence,
  executeForEach,
  setExecuteEffect,
} from '../effects/control-effects'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  CardInstance,
  RunStats,
  HeroState,
  EffectContext,
  AtomicEffect,
} from '../../types'

// ============================================================================
// Test Factories
// ============================================================================

function createStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    damageDealt: 0,
    damageTaken: 0,
    cardsPlayed: 0,
    enemiesKilled: 0,
    floorsCleared: 0,
    goldEarned: 0,
    ...overrides,
  }
}

function createPlayer(overrides: Partial<PlayerEntity> = {}): PlayerEntity {
  return {
    id: 'player',
    name: 'Player',
    currentHealth: 80,
    maxHealth: 80,
    block: 0,
    barrier: 0,
    powers: {},
    energy: 3,
    maxEnergy: 3,
    ...overrides,
  }
}

function createEnemy(overrides: Partial<EnemyEntity> = {}): EnemyEntity {
  return {
    id: 'enemy_1',
    name: 'Test Enemy',
    currentHealth: 50,
    maxHealth: 50,
    block: 0,
    barrier: 0,
    powers: {},
    intent: { type: 'attack', damage: 10 },
    patternIndex: 0,
    ...overrides,
  }
}

function createCardInstance(overrides: Partial<CardInstance> = {}): CardInstance {
  return {
    uid: 'card_uid_1',
    definitionId: 'strike',
    upgraded: false,
    ...overrides,
  }
}

function createCombat(overrides: Partial<CombatState> = {}): CombatState {
  return {
    phase: 'playerTurn',
    turn: 1,
    player: createPlayer(),
    enemies: [createEnemy()],
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    cardsPlayedThisTurn: 0,
    visualQueue: [],
    ...overrides,
  }
}

function createHero(overrides: Partial<HeroState> = {}): HeroState {
  return {
    currentHealth: 80,
    maxHealth: 80,
    ...overrides,
  }
}

function createRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    gamePhase: 'combat',
    floor: 1,
    hero: createHero(),
    deck: [],
    relics: [],
    combat: createCombat(),
    dungeonDeck: [],
    roomChoices: [],
    gold: 0,
    stats: createStats(),
    ...overrides,
  }
}

function createEffectContext(overrides: Partial<EffectContext> = {}): EffectContext {
  return {
    source: 'player',
    ...overrides,
  }
}

// ============================================================================
// executeConditional Tests
// ============================================================================

describe('executeConditional', () => {
  let executeEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    executeEffectMock = vi.fn()
    setExecuteEffect(executeEffectMock)
  })

  it('executes_then_branch_when_condition_is_true', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3 }),
      }),
    })
    const thenEffect: AtomicEffect = { type: 'draw', amount: 2 }
    const effect = {
      type: 'conditional' as const,
      condition: { type: 'resource' as const, resource: 'energy' as const, op: '>=' as const, value: 2 },
      then: [thenEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeConditional(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
    expect(executeEffectMock).toHaveBeenCalledWith(state, thenEffect, ctx)
  })

  it('executes_else_branch_when_condition_is_false', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 0 }),
      }),
    })
    const elseEffect: AtomicEffect = { type: 'draw', amount: 1 }
    const effect = {
      type: 'conditional' as const,
      condition: { type: 'resource' as const, resource: 'energy' as const, op: '>' as const, value: 0 },
      then: [{ type: 'draw' as const, amount: 2 }],
      else: [elseEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeConditional(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
    expect(executeEffectMock).toHaveBeenCalledWith(state, elseEffect, ctx)
  })

  it('does_nothing_when_condition_false_and_no_else_branch', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 0 }),
      }),
    })
    const effect = {
      type: 'conditional' as const,
      condition: { type: 'resource' as const, resource: 'energy' as const, op: '>' as const, value: 0 },
      then: [{ type: 'draw' as const, amount: 2 }],
    }
    const ctx = createEffectContext()

    // Act
    executeConditional(state, effect, ctx)

    // Assert
    expect(executeEffectMock).not.toHaveBeenCalled()
  })

  it('executes_multiple_effects_in_then_branch', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
      }),
    })
    const effect1: AtomicEffect = { type: 'draw', amount: 1 }
    const effect2: AtomicEffect = { type: 'block', amount: 5, target: 'self' }
    const effect = {
      type: 'conditional' as const,
      condition: { type: 'health' as const, target: 'player' as const, compare: 'percent' as const, op: '<' as const, value: 70 },
      then: [effect1, effect2],
    }
    const ctx = createEffectContext()

    // Act
    executeConditional(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(2)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, effect1, ctx)
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, effect2, ctx)
  })

  it('adds_visual_feedback_for_then_branch', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3 }),
      }),
    })
    const effect = {
      type: 'conditional' as const,
      condition: { type: 'resource' as const, resource: 'energy' as const, op: '>' as const, value: 0 },
      then: [{ type: 'draw' as const, amount: 1 }],
    }
    const ctx = createEffectContext()

    // Act
    executeConditional(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((v) => v.type === 'conditionalTrigger')
    expect(visual).toBeDefined()
    expect(visual).toMatchObject({ type: 'conditionalTrigger', branch: 'then' })
  })

  it('adds_visual_feedback_for_else_branch', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 0 }),
      }),
    })
    const effect = {
      type: 'conditional' as const,
      condition: { type: 'resource' as const, resource: 'energy' as const, op: '>' as const, value: 0 },
      then: [{ type: 'draw' as const, amount: 2 }],
      else: [{ type: 'draw' as const, amount: 1 }],
    }
    const ctx = createEffectContext()

    // Act
    executeConditional(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((v) => v.type === 'conditionalTrigger')
    expect(visual).toBeDefined()
    expect(visual).toMatchObject({ type: 'conditionalTrigger', branch: 'else' })
  })
})

// ============================================================================
// executeRepeat Tests
// ============================================================================

describe('executeRepeat', () => {
  let executeEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    executeEffectMock = vi.fn()
    setExecuteEffect(executeEffectMock)
  })

  it('executes_effects_specified_number_of_times', () => {
    // Arrange
    const state = createRunState()
    const innerEffect: AtomicEffect = { type: 'draw', amount: 1 }
    const effect = {
      type: 'repeat' as const,
      times: 3,
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(3)
    expect(executeEffectMock).toHaveBeenCalledWith(state, innerEffect, ctx)
  })

  it('executes_zero_times_when_times_is_zero', () => {
    // Arrange
    const state = createRunState()
    const effect = {
      type: 'repeat' as const,
      times: 0,
      effects: [{ type: 'draw' as const, amount: 1 }],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert
    expect(executeEffectMock).not.toHaveBeenCalled()
  })

  it('executes_multiple_effects_each_iteration', () => {
    // Arrange
    const state = createRunState()
    const effect1: AtomicEffect = { type: 'draw', amount: 1 }
    const effect2: AtomicEffect = { type: 'block', amount: 2, target: 'self' }
    const effect = {
      type: 'repeat' as const,
      times: 2,
      effects: [effect1, effect2],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert
    // 2 iterations × 2 effects = 4 total calls
    expect(executeEffectMock).toHaveBeenCalledTimes(4)
    // First iteration
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, effect1, ctx)
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, effect2, ctx)
    // Second iteration
    expect(executeEffectMock).toHaveBeenNthCalledWith(3, state, effect1, ctx)
    expect(executeEffectMock).toHaveBeenNthCalledWith(4, state, effect2, ctx)
  })

  it('resolves_scaled_value_for_times', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 2 }),
      }),
    })
    const innerEffect: AtomicEffect = { type: 'draw', amount: 1 }
    const effect = {
      type: 'repeat' as const,
      times: { type: 'scaled' as const, base: 1, perUnit: 1, source: 'energy' as const },
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert - base 1 + (2 energy × 1) = 3 times
    expect(executeEffectMock).toHaveBeenCalledTimes(3)
  })

  it('adds_visual_feedback_for_each_iteration', () => {
    // Arrange
    const state = createRunState()
    const effect = {
      type: 'repeat' as const,
      times: 3,
      effects: [{ type: 'draw' as const, amount: 1 }],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert
    const visuals = state.combat?.visualQueue.filter((v) => v.type === 'repeatEffect')
    expect(visuals).toHaveLength(3)
    expect(visuals?.[0]).toMatchObject({ type: 'repeatEffect', times: 3, current: 1 })
    expect(visuals?.[1]).toMatchObject({ type: 'repeatEffect', times: 3, current: 2 })
    expect(visuals?.[2]).toMatchObject({ type: 'repeatEffect', times: 3, current: 3 })
  })

  it('handles_power_amount_value_for_times', () => {
    // Arrange
    const state = createRunState()
    const innerEffect: AtomicEffect = { type: 'damage', amount: 1, target: 'enemy' }
    const effect = {
      type: 'repeat' as const,
      times: { type: 'powerAmount' as const },
      effects: [innerEffect],
    }
    const ctx = createEffectContext({ powerStacks: 4 })

    // Act
    executeRepeat(state, effect, ctx)

    // Assert - repeats 4 times based on power stacks
    expect(executeEffectMock).toHaveBeenCalledTimes(4)
  })
})

// ============================================================================
// executeRandom Tests
// ============================================================================

describe('executeRandom', () => {
  let executeEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    executeEffectMock = vi.fn()
    setExecuteEffect(executeEffectMock)
  })

  it('executes_one_random_choice_uniformly', () => {
    // Arrange
    const state = createRunState()
    const choice1: AtomicEffect[] = [{ type: 'draw', amount: 1 }]
    const choice2: AtomicEffect[] = [{ type: 'draw', amount: 2 }]
    const choice3: AtomicEffect[] = [{ type: 'draw', amount: 3 }]
    const effect = {
      type: 'random' as const,
      choices: [choice1, choice2, choice3],
    }
    const ctx = createEffectContext()

    // Act
    executeRandom(state, effect, ctx)

    // Assert - exactly one effect from one choice should execute
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
    const calledEffect = executeEffectMock.mock.calls[0][1] as AtomicEffect
    expect([choice1[0], choice2[0], choice3[0]]).toContainEqual(calledEffect)
  })

  it('executes_weighted_random_choice', () => {
    // Arrange
    const state = createRunState()
    const choice1: AtomicEffect[] = [{ type: 'draw', amount: 1 }]
    const choice2: AtomicEffect[] = [{ type: 'draw', amount: 2 }]
    const effect = {
      type: 'random' as const,
      choices: [choice1, choice2],
      weights: [1, 99], // 99% chance of choice2
    }
    const ctx = createEffectContext()

    // Act - run multiple times to test distribution
    const results: number[] = []
    for (let i = 0; i < 100; i++) {
      executeEffectMock.mockClear()
      executeRandom(state, effect, ctx)
      const calledEffect = executeEffectMock.mock.calls[0][1] as AtomicEffect
      if (calledEffect.type === 'draw' && 'amount' in calledEffect) {
        results.push(calledEffect.amount as number)
      }
    }

    // Assert - choice2 should dominate (at least 80% due to 99% weight)
    const choice2Count = results.filter((r) => r === 2).length
    expect(choice2Count).toBeGreaterThan(80)
  })

  it('handles_single_choice', () => {
    // Arrange
    const state = createRunState()
    const choice1: AtomicEffect[] = [{ type: 'draw', amount: 5 }]
    const effect = {
      type: 'random' as const,
      choices: [choice1],
    }
    const ctx = createEffectContext()

    // Act
    executeRandom(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
    expect(executeEffectMock).toHaveBeenCalledWith(state, choice1[0], ctx)
  })

  it('executes_all_effects_in_chosen_branch', () => {
    // Arrange
    const state = createRunState()
    const effect1: AtomicEffect = { type: 'draw', amount: 1 }
    const effect2: AtomicEffect = { type: 'block', amount: 5, target: 'self' }
    const choice1: AtomicEffect[] = [effect1, effect2]
    const effect = {
      type: 'random' as const,
      choices: [choice1], // Only one choice to ensure it's selected
    }
    const ctx = createEffectContext()

    // Act
    executeRandom(state, effect, ctx)

    // Assert - both effects in the chosen branch should execute
    expect(executeEffectMock).toHaveBeenCalledTimes(2)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, effect1, ctx)
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, effect2, ctx)
  })

  it('does_nothing_when_choices_array_is_empty', () => {
    // Arrange
    const state = createRunState()
    const effect = {
      type: 'random' as const,
      choices: [],
    }
    const ctx = createEffectContext()

    // Act
    executeRandom(state, effect, ctx)

    // Assert
    expect(executeEffectMock).not.toHaveBeenCalled()
  })

  it('ignores_weights_when_length_mismatches_choices', () => {
    // Arrange
    const state = createRunState()
    const choice1: AtomicEffect[] = [{ type: 'draw', amount: 1 }]
    const choice2: AtomicEffect[] = [{ type: 'draw', amount: 2 }]
    const effect = {
      type: 'random' as const,
      choices: [choice1, choice2],
      weights: [100], // Wrong length - should fall back to uniform
    }
    const ctx = createEffectContext()

    // Act
    executeRandom(state, effect, ctx)

    // Assert - should still execute one choice
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// executeSequence Tests
// ============================================================================

describe('executeSequence', () => {
  let executeEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    executeEffectMock = vi.fn()
    setExecuteEffect(executeEffectMock)
  })

  it('executes_effects_in_order', () => {
    // Arrange
    const state = createRunState()
    const effect1: AtomicEffect = { type: 'draw', amount: 1 }
    const effect2: AtomicEffect = { type: 'block', amount: 5, target: 'self' }
    const effect3: AtomicEffect = { type: 'energy', amount: 1, operation: 'gain' }
    const effect = {
      type: 'sequence' as const,
      effects: [effect1, effect2, effect3],
    }
    const ctx = createEffectContext()

    // Act
    executeSequence(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(3)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, effect1, ctx)
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, effect2, ctx)
    expect(executeEffectMock).toHaveBeenNthCalledWith(3, state, effect3, ctx)
  })

  it('handles_empty_effects_array', () => {
    // Arrange
    const state = createRunState()
    const effect = {
      type: 'sequence' as const,
      effects: [],
    }
    const ctx = createEffectContext()

    // Act
    executeSequence(state, effect, ctx)

    // Assert
    expect(executeEffectMock).not.toHaveBeenCalled()
  })

  it('executes_single_effect', () => {
    // Arrange
    const state = createRunState()
    const singleEffect: AtomicEffect = { type: 'draw', amount: 2 }
    const effect = {
      type: 'sequence' as const,
      effects: [singleEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeSequence(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
    expect(executeEffectMock).toHaveBeenCalledWith(state, singleEffect, ctx)
  })
})

// ============================================================================
// executeForEach Tests
// ============================================================================

describe('executeForEach', () => {
  let executeEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    executeEffectMock = vi.fn()
    setExecuteEffect(executeEffectMock)
  })

  it('iterates_over_all_enemies', () => {
    // Arrange
    const enemy1 = createEnemy({ id: 'enemy_1' })
    const enemy2 = createEnemy({ id: 'enemy_2' })
    const enemy3 = createEnemy({ id: 'enemy_3' })
    const state = createRunState({
      combat: createCombat({
        enemies: [enemy1, enemy2, enemy3],
      }),
    })
    const innerEffect: AtomicEffect = { type: 'damage', amount: 5, target: 'enemy' }
    const effect = {
      type: 'forEach' as const,
      target: 'allEnemies' as const,
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert - should execute once per enemy with updated context
    expect(executeEffectMock).toHaveBeenCalledTimes(3)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, innerEffect, { ...ctx, currentTarget: 'enemy_1' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, innerEffect, { ...ctx, currentTarget: 'enemy_2' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(3, state, innerEffect, { ...ctx, currentTarget: 'enemy_3' })
  })

  it('iterates_over_cards_in_hand', () => {
    // Arrange
    const card1 = createCardInstance({ uid: 'c1' })
    const card2 = createCardInstance({ uid: 'c2' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2],
      }),
    })
    const innerEffect: AtomicEffect = { type: 'modifyCost', target: 'thisCard', amount: -1 }
    const effect = {
      type: 'forEach' as const,
      target: 'hand' as const,
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert - should execute once per card
    expect(executeEffectMock).toHaveBeenCalledTimes(2)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, innerEffect, { ...ctx, currentTarget: 'c1' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, innerEffect, { ...ctx, currentTarget: 'c2' })
  })

  it('executes_multiple_effects_per_iteration', () => {
    // Arrange
    const enemy1 = createEnemy({ id: 'enemy_1' })
    const enemy2 = createEnemy({ id: 'enemy_2' })
    const state = createRunState({
      combat: createCombat({
        enemies: [enemy1, enemy2],
      }),
    })
    const effect1: AtomicEffect = { type: 'damage', amount: 3, target: 'enemy' }
    const effect2: AtomicEffect = { type: 'applyPower', powerId: 'weak', amount: 1, target: 'enemy' }
    const effect = {
      type: 'forEach' as const,
      target: 'allEnemies' as const,
      effects: [effect1, effect2],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert - 2 enemies × 2 effects = 4 calls
    expect(executeEffectMock).toHaveBeenCalledTimes(4)
    // Enemy 1
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, effect1, { ...ctx, currentTarget: 'enemy_1' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, effect2, { ...ctx, currentTarget: 'enemy_1' })
    // Enemy 2
    expect(executeEffectMock).toHaveBeenNthCalledWith(3, state, effect1, { ...ctx, currentTarget: 'enemy_2' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(4, state, effect2, { ...ctx, currentTarget: 'enemy_2' })
  })

  it('does_nothing_when_target_yields_empty_array', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [], // No enemies
      }),
    })
    const effect = {
      type: 'forEach' as const,
      target: 'allEnemies' as const,
      effects: [{ type: 'damage' as const, amount: 5, target: 'enemy' as const }],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert
    expect(executeEffectMock).not.toHaveBeenCalled()
  })

  it('handles_single_entity_target', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ id: 'player' }),
      }),
    })
    const innerEffect: AtomicEffect = { type: 'block', amount: 5, target: 'self' }
    const effect = {
      type: 'forEach' as const,
      target: 'player' as const,
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert - player is a single target, should execute once
    expect(executeEffectMock).toHaveBeenCalledTimes(1)
    expect(executeEffectMock).toHaveBeenCalledWith(state, innerEffect, { ...ctx, currentTarget: 'player' })
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({
      combat: null,
    })
    const effect = {
      type: 'forEach' as const,
      target: 'allEnemies' as const,
      effects: [{ type: 'damage' as const, amount: 5, target: 'enemy' as const }],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert
    expect(executeEffectMock).not.toHaveBeenCalled()
  })

  it('iterates_over_discard_pile_cards', () => {
    // Arrange
    const card1 = createCardInstance({ uid: 'd1' })
    const card2 = createCardInstance({ uid: 'd2' })
    const card3 = createCardInstance({ uid: 'd3' })
    const state = createRunState({
      combat: createCombat({
        discardPile: [card1, card2, card3],
      }),
    })
    const innerEffect: AtomicEffect = { type: 'exhaust', target: 'thisCard' }
    const effect = {
      type: 'forEach' as const,
      target: 'discardPile' as const,
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert
    expect(executeEffectMock).toHaveBeenCalledTimes(3)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, innerEffect, { ...ctx, currentTarget: 'd1' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, innerEffect, { ...ctx, currentTarget: 'd2' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(3, state, innerEffect, { ...ctx, currentTarget: 'd3' })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Control Effects Integration', () => {
  let executeEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    executeEffectMock = vi.fn()
    setExecuteEffect(executeEffectMock)
  })

  it('nested_conditional_in_repeat', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3 }),
      }),
    })
    const conditionalEffect = {
      type: 'conditional' as const,
      condition: { type: 'resource' as const, resource: 'energy' as const, op: '>' as const, value: 0 },
      then: [{ type: 'draw' as const, amount: 1 }],
    }
    const effect = {
      type: 'repeat' as const,
      times: 2,
      effects: [conditionalEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert - conditional executed twice
    expect(executeEffectMock).toHaveBeenCalledTimes(2)
    expect(executeEffectMock).toHaveBeenCalledWith(state, conditionalEffect, ctx)
  })

  it('forEach_with_sequence_effects', () => {
    // Arrange
    const enemy1 = createEnemy({ id: 'enemy_1' })
    const enemy2 = createEnemy({ id: 'enemy_2' })
    const state = createRunState({
      combat: createCombat({
        enemies: [enemy1, enemy2],
      }),
    })
    const sequenceEffect = {
      type: 'sequence' as const,
      effects: [
        { type: 'damage' as const, amount: 2, target: 'enemy' as const },
        { type: 'applyPower' as const, powerId: 'vulnerable', amount: 1, target: 'enemy' as const },
      ],
    }
    const effect = {
      type: 'forEach' as const,
      target: 'allEnemies' as const,
      effects: [sequenceEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeForEach(state, effect, ctx)

    // Assert - sequence executed once per enemy
    expect(executeEffectMock).toHaveBeenCalledTimes(2)
    expect(executeEffectMock).toHaveBeenNthCalledWith(1, state, sequenceEffect, { ...ctx, currentTarget: 'enemy_1' })
    expect(executeEffectMock).toHaveBeenNthCalledWith(2, state, sequenceEffect, { ...ctx, currentTarget: 'enemy_2' })
  })

  it('repeat_with_scaled_value_based_on_cards_in_hand', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        hand: [
          createCardInstance({ uid: 'c1' }),
          createCardInstance({ uid: 'c2' }),
          createCardInstance({ uid: 'c3' }),
        ],
      }),
    })
    const innerEffect: AtomicEffect = { type: 'damage', amount: 1, target: 'enemy' }
    const effect = {
      type: 'repeat' as const,
      times: { type: 'scaled' as const, base: 0, perUnit: 1, source: 'cardsInHand' as const },
      effects: [innerEffect],
    }
    const ctx = createEffectContext()

    // Act
    executeRepeat(state, effect, ctx)

    // Assert - should repeat 3 times (1 per card in hand)
    expect(executeEffectMock).toHaveBeenCalledTimes(3)
  })
})
