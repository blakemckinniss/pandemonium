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
// Card Play Tests
// ============================================================================

describe('playCard action', () => {
  describe('energy cost', () => {
    it('deducts_energy_when_card_played', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [strikeCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.player.energy).toBe(2) // 3 - 1 (strike costs 1)
    })

    it('does_not_play_card_when_insufficient_energy', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 0 }),
          hand: [strikeCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.hand).toHaveLength(1) // Card still in hand
      expect(result.combat?.player.energy).toBe(0) // Energy unchanged
    })
  })

  describe('card destination', () => {
    it('moves_attack_card_to_discard_pile', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [strikeCard],
          discardPile: [],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.hand).toHaveLength(0)
      expect(result.combat?.discardPile).toHaveLength(1)
      expect(result.combat?.discardPile[0].definitionId).toBe('strike')
    })

    it('moves_skill_card_to_discard_pile', () => {
      // Arrange
      const defendCard = createCardInstance('defend', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [defendCard],
          discardPile: [],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
      })

      // Assert
      expect(result.combat?.hand).toHaveLength(0)
      expect(result.combat?.discardPile).toHaveLength(1)
      expect(result.combat?.discardPile[0].definitionId).toBe('defend')
    })

    it('moves_power_card_to_exhaust_pile', () => {
      // Arrange
      const inflameCard = createCardInstance('inflame', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [inflameCard],
          exhaustPile: [],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
      })

      // Assert
      expect(result.combat?.hand).toHaveLength(0)
      expect(result.combat?.discardPile).toHaveLength(0) // Not in discard
      expect(result.combat?.exhaustPile).toHaveLength(1) // In exhaust
      expect(result.combat?.exhaustPile[0].definitionId).toBe('inflame')
    })
  })

  describe('stats tracking', () => {
    it('increments_cardsPlayed_stat', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        stats: createStats({ cardsPlayed: 5 }),
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [strikeCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.stats.cardsPlayed).toBe(6)
    })

    it('increments_cardsPlayedThisTurn', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [strikeCard],
          cardsPlayedThisTurn: 2,
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.cardsPlayedThisTurn).toBe(3)
    })

    it('tracks_lastPlayedCard', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [strikeCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.lastPlayedCard?.uid).toBe('card_1')
      expect(result.combat?.lastPlayedCard?.definitionId).toBe('strike')
    })
  })

  describe('card effects', () => {
    it('applies_damage_effect_from_attack_card', () => {
      // Arrange
      const strikeCard = createCardInstance('strike', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          enemies: [createEnemy({ id: 'enemy_1', currentHealth: 50 })],
          hand: [strikeCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.enemies[0].currentHealth).toBe(44) // 50 - 6 (strike deals 6)
    })

    it('applies_block_effect_from_skill_card', () => {
      // Arrange
      const defendCard = createCardInstance('defend', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3, block: 0 }),
          hand: [defendCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
      })

      // Assert
      expect(result.combat?.player.block).toBe(5) // Defend gives 5 block
    })

    it('applies_power_from_power_card', () => {
      // Arrange
      const inflameCard = createCardInstance('inflame', { uid: 'card_1' })
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3, powers: {} }),
          hand: [inflameCard],
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
      })

      // Assert
      expect(result.combat?.player.powers['strength']).toBeDefined()
      expect(result.combat?.player.powers['strength'].amount).toBe(2) // Inflame gives 2 strength
    })
  })

  describe('edge cases', () => {
    it('does_nothing_when_card_not_in_hand', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 3 }),
          hand: [], // Empty hand
        }),
      })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'nonexistent_card',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result.combat?.player.energy).toBe(3) // Energy unchanged
    })

    it('does_nothing_when_combat_is_null', () => {
      // Arrange
      const state = createRunState({ combat: null })

      // Act
      const result = applyAction(state, {
        type: 'playCard',
        cardUid: 'card_1',
        targetId: 'enemy_1',
      })

      // Assert
      expect(result).toEqual(state)
    })
  })
})

// ============================================================================
// Discard Card Tests
// ============================================================================

describe('discardCard action', () => {
  it('moves_card_from_hand_to_discard', () => {
    // Arrange
    const card = createCardInstance('strike', { uid: 'card_1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card],
        discardPile: [],
      }),
    })

    // Act
    const result = applyAction(state, {
      type: 'discardCard',
      cardUid: 'card_1',
    })

    // Assert
    expect(result.combat?.hand).toHaveLength(0)
    expect(result.combat?.discardPile).toHaveLength(1)
  })
})

// ============================================================================
// Discard Hand Tests
// ============================================================================

describe('discardHand action', () => {
  it('moves_all_cards_from_hand_to_discard', () => {
    // Arrange
    const card1 = createCardInstance('strike', { uid: 'card_1' })
    const card2 = createCardInstance('defend', { uid: 'card_2' })
    const card3 = createCardInstance('strike', { uid: 'card_3' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2, card3],
        discardPile: [],
      }),
    })

    // Act
    const result = applyAction(state, { type: 'discardHand' })

    // Assert
    expect(result.combat?.hand).toHaveLength(0)
    expect(result.combat?.discardPile).toHaveLength(3)
  })
})
