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

function createCardInstance(
  definitionId: string,
  overrides: Partial<CardInstance> = {}
): CardInstance {
  return {
    uid: `card_${definitionId}_${Math.random().toString(36).slice(2, 8)}`,
    definitionId,
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

// ============================================================================
// Start Turn Tests
// ============================================================================

describe('startTurn action', () => {
  describe('turn state', () => {
    it('increments_turn_counter', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({ turn: 1 }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.turn).toBe(2)
    })

    it('sets_phase_to_playerTurn', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({ phase: 'enemyTurn' }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.phase).toBe('playerTurn')
    })

    it('resets_cardsPlayedThisTurn', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({ cardsPlayedThisTurn: 5 }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.cardsPlayedThisTurn).toBe(0)
    })

    it('clears_lastPlayedCard', () => {
      // Arrange
      const lastCard = createCardInstance('strike', { uid: 'last_card' })
      const state = createRunState({
        combat: createCombat({ lastPlayedCard: lastCard }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.lastPlayedCard).toBeUndefined()
    })
  })

  describe('energy', () => {
    it('resets_energy_to_maxEnergy', () => {
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

    it('respects_modified_maxEnergy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 0, maxEnergy: 4 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.player.energy).toBe(4)
    })
  })

  describe('block', () => {
    it('clears_block_at_turn_start', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ block: 15 }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.player.block).toBe(0)
    })

    it('preserves_block_with_barricade_power', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            block: 15,
            powers: { barricade: { id: 'barricade', amount: 1 } },
          }),
        }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.player.block).toBe(15) // Block preserved
    })
  })

  describe('card draw', () => {
    it('draws_5_cards_at_turn_start', () => {
      // Arrange
      const cards = Array.from({ length: 10 }, (_, i) =>
        createCardInstance('strike', { uid: `card_${i}` })
      )
      const state = createRunState({
        combat: createCombat({
          hand: [],
          drawPile: cards,
        }),
      })

      // Act
      const result = applyAction(state, { type: 'startTurn' })

      // Assert
      expect(result.combat?.hand).toHaveLength(5)
      expect(result.combat?.drawPile).toHaveLength(5)
    })
  })
})

// ============================================================================
// End Turn Tests
// ============================================================================

describe('endTurn action', () => {
  describe('phase transition', () => {
    it('sets_phase_to_enemyTurn', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({ phase: 'playerTurn' }),
      })

      // Act
      const result = applyAction(state, { type: 'endTurn' })

      // Assert
      expect(result.combat?.phase).toBe('enemyTurn')
    })
  })

  describe('hand management', () => {
    it('discards_all_cards_in_hand', () => {
      // Arrange
      const card1 = createCardInstance('strike', { uid: 'card_1' })
      const card2 = createCardInstance('defend', { uid: 'card_2' })
      const state = createRunState({
        combat: createCombat({
          hand: [card1, card2],
          discardPile: [],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'endTurn' })

      // Assert
      expect(result.combat?.hand).toHaveLength(0)
      expect(result.combat?.discardPile).toHaveLength(2)
    })

    it('retains_cards_with_retained_flag', () => {
      // Arrange
      const normalCard = createCardInstance('strike', { uid: 'card_1' })
      const retainedCard = createCardInstance('defend', { uid: 'card_2', retained: true })
      const state = createRunState({
        combat: createCombat({
          hand: [normalCard, retainedCard],
          discardPile: [],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'endTurn' })

      // Assert
      expect(result.combat?.hand).toHaveLength(1)
      expect(result.combat?.hand[0].uid).toBe('card_2')
      expect(result.combat?.discardPile).toHaveLength(1)
    })

    it('clears_retained_flag_after_retaining', () => {
      // Arrange
      const retainedCard = createCardInstance('defend', { uid: 'card_1', retained: true })
      const state = createRunState({
        combat: createCombat({
          hand: [retainedCard],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'endTurn' })

      // Assert
      expect(result.combat?.hand[0].retained).toBe(false) // Flag cleared
    })

    it('exhausts_ethereal_cards', () => {
      // Arrange
      const normalCard = createCardInstance('strike', { uid: 'card_1' })
      const etherealCard = createCardInstance('defend', { uid: 'card_2', ethereal: true })
      const state = createRunState({
        combat: createCombat({
          hand: [normalCard, etherealCard],
          discardPile: [],
          exhaustPile: [],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'endTurn' })

      // Assert
      expect(result.combat?.hand).toHaveLength(0)
      expect(result.combat?.discardPile).toHaveLength(1) // Normal card
      expect(result.combat?.exhaustPile).toHaveLength(1) // Ethereal card
      expect(result.combat?.exhaustPile[0].uid).toBe('card_2')
    })
  })

  describe('cost modifiers', () => {
    it('clears_costModifier_from_retained_cards', () => {
      // Arrange - use retained card so we can observe the modifier clearing
      const retainedCard = createCardInstance('strike', {
        uid: 'card_1',
        costModifier: -1,
        retained: true,
      })
      const state = createRunState({
        combat: createCombat({
          hand: [retainedCard],
        }),
      })

      // Act
      const result = applyAction(state, { type: 'endTurn' })

      // Assert - retained card stays in hand but modifier should be cleared
      expect(result.combat?.hand).toHaveLength(1)
      expect(result.combat?.hand[0].costModifier).toBeUndefined()
    })
  })
})

// ============================================================================
// Full Turn Cycle Tests
// ============================================================================

describe('turn cycle integration', () => {
  it('complete_turn_cycle_preserves_barrier', () => {
    // Arrange - barrier should not decay like block
    const cards = Array.from({ length: 5 }, (_, i) =>
      createCardInstance('strike', { uid: `card_${i}` })
    )
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ block: 10, barrier: 5, energy: 0 }),
        drawPile: cards,
        hand: [],
      }),
    })

    // Act - end turn then start new turn
    let result = applyAction(state, { type: 'endTurn' })
    result = applyAction(result, { type: 'startTurn' })

    // Assert
    expect(result.combat?.player.block).toBe(0) // Block cleared
    expect(result.combat?.player.barrier).toBe(5) // Barrier preserved
    expect(result.combat?.player.energy).toBe(3) // Energy reset
  })

  it('multiple_turns_increment_counter', () => {
    // Arrange
    const cards = Array.from({ length: 15 }, (_, i) =>
      createCardInstance('strike', { uid: `card_${i}` })
    )
    const state = createRunState({
      combat: createCombat({
        turn: 0,
        drawPile: cards,
      }),
    })

    // Act - simulate 3 turns
    let result = applyAction(state, { type: 'startTurn' })
    result = applyAction(result, { type: 'endTurn' })
    result = applyAction(result, { type: 'startTurn' })
    result = applyAction(result, { type: 'endTurn' })
    result = applyAction(result, { type: 'startTurn' })

    // Assert
    expect(result.combat?.turn).toBe(3)
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('turn edge cases', () => {
  it('startTurn_does_nothing_when_combat_null', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act & Assert
    expect(() => applyAction(state, { type: 'startTurn' })).not.toThrow()
  })

  it('endTurn_does_nothing_when_combat_null', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act & Assert
    expect(() => applyAction(state, { type: 'endTurn' })).not.toThrow()
  })

  it('startTurn_handles_empty_draw_pile', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        hand: [],
        drawPile: [],
        discardPile: [],
      }),
    })

    // Act
    const result = applyAction(state, { type: 'startTurn' })

    // Assert
    expect(result.combat?.hand).toHaveLength(0) // No cards to draw
  })
})
