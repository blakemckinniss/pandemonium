import { describe, it, expect } from 'vitest'
import { applyAction } from '../actions'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  RoomInstance,
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

function createRoom(overrides: Partial<RoomInstance> = {}): RoomInstance {
  return {
    uid: `room_${Math.random().toString(36).slice(2, 8)}`,
    definitionId: 'test_room',
    revealed: false,
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

// ============================================================================
// Room Handler Tests
// ============================================================================

describe('room handlers', () => {
  describe('handleSelectRoom', () => {
    it('transitions_to_combat_phase', () => {
      // Arrange
      const room: RoomInstance = createRoom({ uid: 'room_1', definitionId: 'combat_room' })
      const state = createRunState({
        gamePhase: 'roomSelect',
        roomChoices: [room],
        combat: null,
      })

      // Act
      const result = applyAction(state, { type: 'selectRoom', roomUid: 'room_1' })

      // Assert
      expect(result.gamePhase).toBe('combat')
    })

    it('clears_room_choices', () => {
      // Arrange
      const room1: RoomInstance = createRoom({ uid: 'room_1' })
      const room2: RoomInstance = createRoom({ uid: 'room_2' })
      const state = createRunState({
        gamePhase: 'roomSelect',
        roomChoices: [room1, room2],
        combat: null,
      })

      // Act
      const result = applyAction(state, { type: 'selectRoom', roomUid: 'room_1' })

      // Assert
      expect(result.roomChoices).toHaveLength(0)
    })

    it('does_nothing_when_room_not_found', () => {
      // Arrange
      const room: RoomInstance = createRoom({ uid: 'room_1' })
      const state = createRunState({
        gamePhase: 'roomSelect',
        roomChoices: [room],
        combat: null,
      })

      // Act
      const result = applyAction(state, { type: 'selectRoom', roomUid: 'nonexistent' })

      // Assert
      expect(result.gamePhase).toBe('roomSelect') // Phase unchanged
      expect(result.roomChoices).toHaveLength(1) // Choices unchanged
    })
  })

  describe('handleDealRoomChoices', () => {
    it('deals_3_rooms_from_dungeon_deck', () => {
      // Arrange
      const rooms: RoomInstance[] = [
        createRoom({ uid: 'room_1' }),
        createRoom({ uid: 'room_2' }),
        createRoom({ uid: 'room_3' }),
        createRoom({ uid: 'room_4' }),
        createRoom({ uid: 'room_5' }),
      ]
      const state = createRunState({
        gamePhase: 'combat',
        dungeonDeck: rooms,
        roomChoices: [],
      })

      // Act
      const result = applyAction(state, { type: 'dealRoomChoices' })

      // Assert
      expect(result.roomChoices).toHaveLength(3)
      expect(result.dungeonDeck).toHaveLength(2)
    })

    it('transitions_to_roomSelect_phase', () => {
      // Arrange
      const rooms = [createRoom(), createRoom(), createRoom()]
      const state = createRunState({
        gamePhase: 'combat',
        dungeonDeck: rooms,
        roomChoices: [],
      })

      // Act
      const result = applyAction(state, { type: 'dealRoomChoices' })

      // Assert
      expect(result.gamePhase).toBe('roomSelect')
    })

    it('marks_dealt_rooms_as_revealed', () => {
      // Arrange
      const rooms: RoomInstance[] = [
        createRoom({ uid: 'room_1', revealed: false }),
        createRoom({ uid: 'room_2', revealed: false }),
        createRoom({ uid: 'room_3', revealed: false }),
      ]
      const state = createRunState({
        dungeonDeck: rooms,
        roomChoices: [],
      })

      // Act
      const result = applyAction(state, { type: 'dealRoomChoices' })

      // Assert
      result.roomChoices.forEach((room) => {
        expect(room.revealed).toBe(true)
      })
    })

    it('handles_fewer_than_3_rooms_remaining', () => {
      // Arrange
      const rooms = [createRoom({ uid: 'room_1' })]
      const state = createRunState({
        dungeonDeck: rooms,
        roomChoices: [],
      })

      // Act
      const result = applyAction(state, { type: 'dealRoomChoices' })

      // Assert
      expect(result.roomChoices).toHaveLength(1)
      expect(result.dungeonDeck).toHaveLength(0)
    })

    it('handles_empty_dungeon_deck', () => {
      // Arrange
      const state = createRunState({
        dungeonDeck: [],
        roomChoices: [],
      })

      // Act
      const result = applyAction(state, { type: 'dealRoomChoices' })

      // Assert
      expect(result.roomChoices).toHaveLength(0)
      expect(result.gamePhase).toBe('roomSelect') // Still transitions
    })
  })
})

// ============================================================================
// Energy Handler Tests
// ============================================================================

describe('energy handlers', () => {
  describe('handleSpendEnergy', () => {
    it('decreases_energy_by_amount', () => {
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

    it('prevents_energy_from_going_negative', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 1 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'spendEnergy', amount: 3 })

      // Assert
      expect(result.combat?.player.energy).toBe(0) // Clamped to 0
    })

    it('handles_zero_energy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 0 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'spendEnergy', amount: 1 })

      // Assert
      expect(result.combat?.player.energy).toBe(0) // Stays at 0
    })

    it('does_nothing_when_combat_null', () => {
      // Arrange
      const state = createRunState({ combat: null })

      // Act & Assert
      expect(() => applyAction(state, { type: 'spendEnergy', amount: 1 })).not.toThrow()
    })
  })

  describe('handleGainEnergy', () => {
    it('increases_energy_by_amount', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 2 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'gainEnergy', amount: 2 })

      // Assert
      expect(result.combat?.player.energy).toBe(4)
    })

    it('allows_energy_above_maxEnergy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3, maxEnergy: 3 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'gainEnergy', amount: 2 })

      // Assert
      expect(result.combat?.player.energy).toBe(5) // No cap on gaining
    })

    it('does_nothing_when_combat_null', () => {
      // Arrange
      const state = createRunState({ combat: null })

      // Act & Assert
      expect(() => applyAction(state, { type: 'gainEnergy', amount: 1 })).not.toThrow()
    })
  })

  describe('energy_in_turn_cycle', () => {
    it('resets_to_maxEnergy_on_startTurn', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 0, maxEnergy: 3 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.player.energy).toBe(3)
    })

    it('energy_persists_across_actions', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
        }),
      })

      // Act - spend, gain, spend
      let result = applyAction(state, { type: 'spendEnergy', amount: 2 })
      result = applyAction(result, { type: 'gainEnergy', amount: 1 })
      result = applyAction(result, { type: 'spendEnergy', amount: 1 })

      // Assert
      expect(result.combat?.player.energy).toBe(1) // 3 - 2 + 1 - 1
    })
  })
})

// ============================================================================
// Damage Handler Tests
// ============================================================================

describe('damage handlers', () => {
  describe('handleDamage - player', () => {
    it('reduces_player_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 20 })

      // Assert
      expect(result.combat?.player.currentHealth).toBe(60)
    })

    it('block_absorbs_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, block: 15 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 20 })

      // Assert
      expect(result.combat?.player.block).toBe(0) // Block consumed
      expect(result.combat?.player.currentHealth).toBe(75) // Only 5 damage through
    })

    it('barrier_absorbs_damage_after_block', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, block: 10, barrier: 10 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 25 })

      // Assert
      expect(result.combat?.player.block).toBe(0) // Block consumed
      expect(result.combat?.player.barrier).toBe(0) // Barrier consumed
      expect(result.combat?.player.currentHealth).toBe(75) // Only 5 damage through
    })

    it('partial_block_absorption', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, block: 25 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 10 })

      // Assert
      expect(result.combat?.player.block).toBe(15) // Partial consumption
      expect(result.combat?.player.currentHealth).toBe(80) // No health lost
    })

    it('tracks_damageTaken_stat', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80 }),
        }),
        stats: createStats({ damageTaken: 0 }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 20 })

      // Assert
      expect(result.stats.damageTaken).toBe(20)
    })

    it('transitions_to_defeat_on_death', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 10 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 15 })

      // Assert
      expect(result.combat?.player.currentHealth).toBe(-5)
      expect(result.combat?.phase).toBe('defeat')
    })
  })

  describe('handleDamage - enemy', () => {
    it('reduces_enemy_health', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 50 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 20 })

      // Assert
      expect(result.combat?.enemies[0].currentHealth).toBe(30)
    })

    it('enemy_block_absorbs_damage', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 50, block: 15 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 20 })

      // Assert
      expect(result.combat?.enemies[0].block).toBe(0)
      expect(result.combat?.enemies[0].currentHealth).toBe(45) // 5 damage through
    })

    it('enemy_barrier_absorbs_after_block', () => {
      // Arrange
      const enemy = createEnemy({
        id: 'enemy_1',
        currentHealth: 50,
        block: 10,
        barrier: 10,
      })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 25 })

      // Assert
      expect(result.combat?.enemies[0].block).toBe(0)
      expect(result.combat?.enemies[0].barrier).toBe(0)
      expect(result.combat?.enemies[0].currentHealth).toBe(45) // 5 damage through
    })

    it('removes_enemy_on_death', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 10 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 15 })

      // Assert
      expect(result.combat?.enemies).toHaveLength(0)
    })

    it('tracks_damageDealt_stat', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 50 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
        stats: createStats({ damageDealt: 0 }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 20 })

      // Assert
      expect(result.stats.damageDealt).toBe(20)
    })

    it('tracks_enemiesKilled_stat', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 10 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
        stats: createStats({ enemiesKilled: 0 }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 15 })

      // Assert
      expect(result.stats.enemiesKilled).toBe(1)
    })

    it('transitions_to_victory_when_all_enemies_dead', () => {
      // Arrange
      const enemy1 = createEnemy({ id: 'enemy_1', currentHealth: 10 })
      const enemy2 = createEnemy({ id: 'enemy_2', currentHealth: 20 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy1, enemy2],
        }),
      })

      // Act - kill both enemies
      let result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 15 })
      result = applyAction(result, { type: 'damage', targetId: 'enemy_2', amount: 25 })

      // Assert
      expect(result.combat?.enemies).toHaveLength(0)
      expect(result.combat?.phase).toBe('victory')
    })

    it('emits_death_visual_on_kill', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 10 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
          visualQueue: [],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 15 })

      // Assert
      const deathEvent = result.combat?.visualQueue.find(
        (e) => e.type === 'enemyDeath' && e.enemyId === 'enemy_1'
      )
      expect(deathEvent).toBeDefined()
    })

    it('does_nothing_when_enemy_not_found', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', currentHealth: 50 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'damage',
        targetId: 'nonexistent',
        amount: 20,
      })

      // Assert
      expect(result.combat?.enemies[0].currentHealth).toBe(50) // Unchanged
      expect(result.stats.damageDealt).toBe(0) // No damage tracked
    })
  })

  describe('handleHeal', () => {
    it('restores_player_health', () => {
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

    it('caps_at_maxHealth', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 70, maxHealth: 80 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'heal', targetId: 'player', amount: 20 })

      // Assert
      expect(result.combat?.player.currentHealth).toBe(80) // Capped
    })

    it('full_heal_from_low_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 1, maxHealth: 80 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'heal', targetId: 'player', amount: 100 })

      // Assert
      expect(result.combat?.player.currentHealth).toBe(80) // Capped at max
    })

    it('does_nothing_when_combat_null', () => {
      // Arrange
      const state = createRunState({ combat: null })

      // Act & Assert
      expect(() =>
        applyAction(state, { type: 'heal', targetId: 'player', amount: 20 })
      ).not.toThrow()
    })
  })

  describe('handleAddBlock', () => {
    it('adds_block_to_player', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ block: 5 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'addBlock', targetId: 'player', amount: 10 })

      // Assert
      expect(result.combat?.player.block).toBe(15)
    })

    it('adds_block_to_enemy', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', block: 5 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'addBlock', targetId: 'enemy_1', amount: 10 })

      // Assert
      expect(result.combat?.enemies[0].block).toBe(15)
    })

    it('does_nothing_when_enemy_not_found', () => {
      // Arrange
      const enemy = createEnemy({ id: 'enemy_1', block: 5 })
      const state = createRunState({
        combat: createCombat({
          enemies: [enemy],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'addBlock',
        targetId: 'nonexistent',
        amount: 10,
      })

      // Assert
      expect(result.combat?.enemies[0].block).toBe(5) // Unchanged
    })

    it('does_nothing_when_combat_null', () => {
      // Arrange
      const state = createRunState({ combat: null })

      // Act & Assert
      expect(() =>
        applyAction(state, { type: 'addBlock', targetId: 'player', amount: 10 })
      ).not.toThrow()
    })
  })
})

// ============================================================================
// Integration Tests - Damage Scenarios
// ============================================================================

describe('damage integration scenarios', () => {
  it('overkill_damage_counted_correctly', () => {
    // Arrange
    const enemy = createEnemy({ id: 'enemy_1', currentHealth: 10 })
    const state = createRunState({
      combat: createCombat({
        enemies: [enemy],
      }),
      stats: createStats({ damageDealt: 0 }),
    })

    // Act - deal 50 damage to enemy with 10 health
    const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 50 })

    // Assert - all damage through defenses is counted, including overkill
    expect(result.stats.damageDealt).toBe(50)
  })

  it('damage_blocked_not_counted_in_stats', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 80, block: 50 }),
      }),
      stats: createStats({ damageTaken: 0 }),
    })

    // Act - 30 damage fully blocked
    const result = applyAction(state, { type: 'damage', targetId: 'player', amount: 30 })

    // Assert
    expect(result.stats.damageTaken).toBe(0) // Block absorbed all damage
    expect(result.combat?.player.currentHealth).toBe(80) // No health lost
  })

  it('multi_layer_defense_absorbs_correctly', () => {
    // Arrange
    const enemy = createEnemy({
      id: 'enemy_1',
      currentHealth: 100,
      block: 15,
      barrier: 20,
    })
    const state = createRunState({
      combat: createCombat({
        enemies: [enemy],
      }),
    })

    // Act - 50 damage through block and barrier
    const result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 50 })

    // Assert
    expect(result.combat?.enemies[0].block).toBe(0) // All consumed
    expect(result.combat?.enemies[0].barrier).toBe(0) // All consumed
    expect(result.combat?.enemies[0].currentHealth).toBe(85) // 15 damage through
  })

  it('simultaneous_enemy_deaths', () => {
    // Arrange
    const enemy1 = createEnemy({ id: 'enemy_1', currentHealth: 10 })
    const enemy2 = createEnemy({ id: 'enemy_2', currentHealth: 10 })
    const enemy3 = createEnemy({ id: 'enemy_3', currentHealth: 10 })
    const state = createRunState({
      combat: createCombat({
        enemies: [enemy1, enemy2, enemy3],
      }),
      stats: createStats({ enemiesKilled: 0 }),
    })

    // Act - kill all three
    let result = applyAction(state, { type: 'damage', targetId: 'enemy_1', amount: 15 })
    result = applyAction(result, { type: 'damage', targetId: 'enemy_2', amount: 15 })
    result = applyAction(result, { type: 'damage', targetId: 'enemy_3', amount: 15 })

    // Assert
    expect(result.combat?.enemies).toHaveLength(0)
    expect(result.stats.enemiesKilled).toBe(3)
    expect(result.combat?.phase).toBe('victory')
  })

  it('block_restored_and_consumed_across_turns', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 80, block: 0 }),
      }),
    })

    // Act - add block, take damage, end turn (clears block), start turn
    let result = applyAction(state, { type: 'addBlock', targetId: 'player', amount: 20 })
    result = applyAction(result, { type: 'damage', targetId: 'player', amount: 10 })
    result = applyAction(result, { type: 'endTurn' })
    result = applyAction(result, { type: 'startTurn' })

    // Assert
    expect(result.combat?.player.block).toBe(0) // Cleared on new turn
    expect(result.combat?.player.currentHealth).toBe(80) // No health lost (block absorbed)
  })
})
