import { describe, it, expect } from 'vitest'
import { executeEffect } from '../effects/engine'
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
// Test Factories (shared with actions.test.ts pattern)
// ============================================================================

function createStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    damageDealt: 0,
    damageTaken: 0,
    cardsPlayed: 0,
    enemiesKilled: 0,
    
    
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
    intent: { type: 'attack', value: 10 },
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
    id: 'warrior',
    name: 'Ironclad',
    health: 80,
    energy: 3,
    starterDeck: ['strike', 'defend', 'bash'],
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

function createContext(overrides: Partial<EffectContext> = {}): EffectContext {
  return {
    source: 'player',
    ...overrides,
  }
}

// ============================================================================
// Damage Effect Tests
// ============================================================================

describe('executeEffect - damage', () => {
  it('deals_damage_to_targeted_enemy', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ id: 'enemy_1', currentHealth: 50 })],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 10, target: 'enemy' }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].currentHealth).toBe(40)
  })

  it('deals_damage_to_all_enemies_when_target_is_allEnemies', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [
          createEnemy({ id: 'enemy_1', currentHealth: 30 }),
          createEnemy({ id: 'enemy_2', currentHealth: 40 }),
        ],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 5, target: 'allEnemies' }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].currentHealth).toBe(25)
    expect(state.combat?.enemies[1].currentHealth).toBe(35)
  })

  it('applies_piercing_damage_ignoring_block', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ id: 'enemy_1', currentHealth: 50, block: 10 })],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 15, target: 'enemy', piercing: true }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].block).toBe(10) // Block untouched
    expect(state.combat?.enemies[0].currentHealth).toBe(35) // Full damage applied
  })

  it('removes_enemy_when_damage_kills', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ id: 'enemy_1', currentHealth: 5 })],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 10, target: 'enemy' }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies).toHaveLength(0)
  })

  it('applies_strength_modifier_to_damage', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ powers: { strength: { id: 'strength', amount: 3 } } }),
        enemies: [createEnemy({ id: 'enemy_1', currentHealth: 50 })],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 10, target: 'enemy' }
    const ctx = createContext({ source: 'player', cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].currentHealth).toBe(37) // 50 - (10 + 3 strength)
  })

  it('applies_vulnerable_modifier_to_target', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ id: 'enemy_1', currentHealth: 50, powers: { vulnerable: { id: 'vulnerable', amount: 2 } } })],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 10, target: 'enemy' }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    // Vulnerable increases damage by 50% -> 10 * 1.5 = 15
    expect(state.combat?.enemies[0].currentHealth).toBe(35)
  })
})

// ============================================================================
// Block Effect Tests
// ============================================================================

describe('executeEffect - block', () => {
  it('adds_block_to_player_when_target_is_self', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 0 }),
      }),
    })
    const effect: AtomicEffect = { type: 'block', amount: 5, target: 'self' }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.block).toBe(5)
  })

  it('adds_barrier_when_persistent_flag_set', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 0, barrier: 0 }),
      }),
    })
    const effect: AtomicEffect = { type: 'block', amount: 8, target: 'self', persistent: true }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.block).toBe(0) // Regular block unchanged
    expect(state.combat?.player.barrier).toBe(8) // Barrier added
  })

  it('applies_dexterity_modifier_to_block', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 0, powers: { dexterity: { id: 'dexterity', amount: 2 } } }),
      }),
    })
    const effect: AtomicEffect = { type: 'block', amount: 5, target: 'self' }
    const ctx = createContext({ source: 'player' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.block).toBe(7) // 5 + 2 dexterity
  })
})

// ============================================================================
// Draw Effect Tests
// ============================================================================

describe('executeEffect - draw', () => {
  it('draws_cards_from_draw_pile_to_hand', () => {
    // Arrange
    const card1 = createCardInstance({ uid: 'c1' })
    const card2 = createCardInstance({ uid: 'c2' })
    const card3 = createCardInstance({ uid: 'c3' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1, card2, card3],
        hand: [],
      }),
    })
    const effect: AtomicEffect = { type: 'draw', amount: 2 }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.hand).toHaveLength(2)
    expect(state.combat?.drawPile).toHaveLength(1)
  })
})

// ============================================================================
// Energy Effect Tests
// ============================================================================

describe('executeEffect - energy', () => {
  it('adds_energy_to_player', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 1 }),
      }),
    })
    const effect: AtomicEffect = { type: 'energy', amount: 2, operation: 'gain' }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.energy).toBe(3)
  })
})

// ============================================================================
// Heal Effect Tests
// ============================================================================

describe('executeEffect - heal', () => {
  it('heals_target_entity', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
      }),
    })
    const effect: AtomicEffect = { type: 'heal', amount: 20, target: 'self' }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.currentHealth).toBe(70)
  })

  it('caps_healing_at_max_health', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 75, maxHealth: 80 }),
      }),
    })
    const effect: AtomicEffect = { type: 'heal', amount: 20, target: 'self' }
    const ctx = createContext()

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.currentHealth).toBe(80)
  })
})

// ============================================================================
// Control Effect Tests (conditional, repeat)
// ============================================================================

describe('executeEffect - conditional', () => {
  it('executes_then_branch_when_condition_true', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 5 }),
        enemies: [createEnemy({ currentHealth: 50 })],
      }),
    })
    const effect: AtomicEffect = {
      type: 'conditional',
      condition: { type: 'resource', resource: 'block', target: 'self', op: '>', value: 0 },
      then: [{ type: 'damage', amount: 10, target: 'enemy' }],
    }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].currentHealth).toBe(40) // Damage was applied
  })

  it('executes_else_branch_when_condition_false', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 0 }), // No block
        enemies: [createEnemy({ currentHealth: 50 })],
      }),
    })
    const effect: AtomicEffect = {
      type: 'conditional',
      condition: { type: 'resource', resource: 'block', target: 'self', op: '>', value: 0 },
      then: [{ type: 'damage', amount: 20, target: 'enemy' }],
      else: [{ type: 'damage', amount: 5, target: 'enemy' }],
    }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].currentHealth).toBe(45) // Else branch damage
  })
})

describe('executeEffect - repeat', () => {
  it('executes_effects_multiple_times', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ currentHealth: 50 })],
      }),
    })
    const effect: AtomicEffect = {
      type: 'repeat',
      times: 3,
      effects: [{ type: 'damage', amount: 5, target: 'enemy' }],
    }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.enemies[0].currentHealth).toBe(35) // 50 - (5 * 3)
  })
})

// ============================================================================
// Sequence Effect Tests
// ============================================================================

describe('executeEffect - sequence', () => {
  it('executes_multiple_effects_in_order', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 0 }),
        enemies: [createEnemy({ currentHealth: 50 })],
      }),
    })
    const effect: AtomicEffect = {
      type: 'sequence',
      effects: [
        { type: 'block', amount: 5, target: 'self' },
        { type: 'damage', amount: 10, target: 'enemy' },
      ],
    }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act
    executeEffect(state, effect, ctx)

    // Assert
    expect(state.combat?.player.block).toBe(5)
    expect(state.combat?.enemies[0].currentHealth).toBe(40)
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('executeEffect - edge cases', () => {
  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect: AtomicEffect = { type: 'damage', amount: 10, target: 'enemy' }
    const ctx = createContext({ cardTarget: 'enemy_1' })

    // Act & Assert (should not throw)
    expect(() => executeEffect(state, effect, ctx)).not.toThrow()
  })

  it('handles_missing_target_gracefully', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ id: 'enemy_1' })],
      }),
    })
    const effect: AtomicEffect = { type: 'damage', amount: 10, target: 'enemy' }
    const ctx = createContext({ cardTarget: 'nonexistent_enemy' })

    // Act & Assert (should not throw)
    expect(() => executeEffect(state, effect, ctx)).not.toThrow()
  })
})
