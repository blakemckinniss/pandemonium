import { describe, it, expect } from 'vitest'
import { applyAction } from '../actions'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  CardInstance,
  RunStats,
  HeroState,
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

// ============================================================================
// Damage Calculation Tests (CRITICAL)
// ============================================================================

describe('damage calculation', () => {
  describe('basic damage', () => {
    it('reduces_enemy_health_when_dealt_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1', currentHealth: 50 })],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

      // Assert
      expect(result.combat?.enemies[0].currentHealth).toBe(40)
    })

    it('reduces_player_health_when_dealt_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 15 })

      // Assert
      expect(result.combat?.player.currentHealth).toBe(65)
    })

    it('tracks_damage_dealt_stat_for_enemy_damage', () => {
      // Arrange
      const state = createRunState({
        stats: createStats({ damageDealt: 0 }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 25 })

      // Assert
      expect(result.stats.damageDealt).toBe(25)
    })

    it('tracks_damage_taken_stat_for_player_damage', () => {
      // Arrange
      const state = createRunState({
        stats: createStats({ damageTaken: 0 }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 12 })

      // Assert
      expect(result.stats.damageTaken).toBe(12)
    })
  })

  describe('block absorption', () => {
    it('absorbs_damage_with_block_first', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ currentHealth: 50, block: 5 })],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

      // Assert
      expect(result.combat?.enemies[0].block).toBe(0)
      expect(result.combat?.enemies[0].currentHealth).toBe(45) // 10 - 5 block = 5 damage
    })

    it('fully_absorbs_damage_when_block_exceeds_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, block: 20 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 15 })

      // Assert
      expect(result.combat?.player.block).toBe(5) // 20 - 15 = 5 remaining
      expect(result.combat?.player.currentHealth).toBe(80) // No health lost
    })

    it('absorbs_with_barrier_after_block_depleted', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, block: 5, barrier: 10 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 20 })

      // Assert
      expect(result.combat?.player.block).toBe(0) // Block depleted
      expect(result.combat?.player.barrier).toBe(0) // Barrier depleted (15 remaining after block)
      expect(result.combat?.player.currentHealth).toBe(75) // 5 damage after block+barrier
    })
  })

  describe('death conditions', () => {
    it('triggers_defeat_when_player_health_reaches_zero', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 10 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 15 })

      // Assert
      expect(result.combat?.player.currentHealth).toBeLessThanOrEqual(0)
      expect(result.combat?.phase).toBe('defeat')
    })

    it('removes_enemy_when_health_reaches_zero', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1', currentHealth: 10 })],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 15 })

      // Assert
      expect(result.combat?.enemies).toHaveLength(0)
    })

    it('triggers_victory_when_all_enemies_dead', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1', currentHealth: 5 })],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

      // Assert
      expect(result.combat?.enemies).toHaveLength(0)
      expect(result.combat?.phase).toBe('victory')
    })

    it('increments_enemies_killed_stat', () => {
      // Arrange
      const state = createRunState({
        stats: createStats({ enemiesKilled: 0 }),
        combat: createCombat({
          enemies: [createEnemy({ currentHealth: 5 })],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

      // Assert
      expect(result.stats.enemiesKilled).toBe(1)
    })
  })
})

// ============================================================================
// Block System Tests
// ============================================================================

describe('block system', () => {
  it('adds_block_to_player', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 0 }),
      }),
    })

    // Act
    const result = applyAction(state, { type: 'addBlock', targetId: 'player', amount: 10 })

    // Assert
    expect(result.combat?.player.block).toBe(10)
  })

  it('stacks_block_on_player', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 5 }),
      }),
    })

    // Act
    const result = applyAction(state, { type: 'addBlock', targetId: 'player', amount: 8 })

    // Assert
    expect(result.combat?.player.block).toBe(13)
  })

  it('adds_block_to_enemy', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ id: 'enemy_1', block: 0 })],
      }),
    })

    // Act
    const result = applyAction(state, { type: 'addBlock', targetId: 'enemy_1', amount: 15 })

    // Assert
    expect(result.combat?.enemies[0].block).toBe(15)
  })
})

// ============================================================================
// Heal System Tests
// ============================================================================

describe('heal system', () => {
  it('increases_player_health', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
      }),
    })

    // Act
    const result = applyAction(state, { type: 'heal', targetId: 'player', amount: 20 })

    // Assert
    expect(result.combat?.player.currentHealth).toBe(70)
  })

  it('does_not_exceed_max_health', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 75, maxHealth: 80 }),
      }),
    })

    // Act
    const result = applyAction(state, { type: 'heal', targetId: 'player', amount: 20 })

    // Assert
    expect(result.combat?.player.currentHealth).toBe(80) // Capped at max
  })
})

// ============================================================================
// Energy System Tests
// ============================================================================

describe('energy system', () => {
  it('spends_energy', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3 }),
      }),
    })

    // Act
    const result = applyAction(state, { type: 'spendEnergy', amount: 2 })

    // Assert
    expect(result.combat?.player.energy).toBe(1)
  })

  it('gains_energy', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 1 }),
      }),
    })

    // Act
    const result = applyAction(state, { type: 'gainEnergy', amount: 2 })

    // Assert
    expect(result.combat?.player.energy).toBe(3)
  })
})

// ============================================================================
// Card Draw Tests
// ============================================================================

describe('card draw', () => {
  it('moves_cards_from_draw_pile_to_hand', () => {
    // Arrange
    const card1 = createCardInstance({ uid: 'card_1' })
    const card2 = createCardInstance({ uid: 'card_2' })
    const card3 = createCardInstance({ uid: 'card_3' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1, card2, card3],
        hand: [],
      }),
    })

    // Act
    const result = applyAction(state, { type: 'drawCards', amount: 2 })

    // Assert
    expect(result.combat?.hand).toHaveLength(2)
    expect(result.combat?.drawPile).toHaveLength(1)
  })

  it('stops_drawing_when_draw_pile_empty', () => {
    // Arrange
    const card1 = createCardInstance({ uid: 'card_1' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1],
        discardPile: [], // Nothing to shuffle
        hand: [],
      }),
    })

    // Act
    const result = applyAction(state, { type: 'drawCards', amount: 5 })

    // Assert
    expect(result.combat?.hand).toHaveLength(1) // Only drew 1
    expect(result.combat?.drawPile).toHaveLength(0)
  })
})

// ============================================================================
// Action Immutability Tests
// ============================================================================

describe('action immutability', () => {
  it('returns_new_state_object', () => {
    // Arrange
    const state = createRunState()

    // Act
    const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

    // Assert
    expect(result).not.toBe(state)
  })

  it('does_not_mutate_original_state', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ currentHealth: 50 })],
      }),
    })
    const originalHealth = state.combat!.enemies[0].currentHealth

    // Act
    applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

    // Assert
    expect(state.combat!.enemies[0].currentHealth).toBe(originalHealth) // Unchanged
  })

  it('handles_null_combat_gracefully', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act
    const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 10 })

    // Assert
    expect(result).toEqual(state) // No changes when combat is null
  })
})
