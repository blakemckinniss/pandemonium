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
// Multi-Turn Combat Flow Integration Tests
// ============================================================================

describe('multi-turn combat flow', () => {
  it('complete_combat_cycle_player_wins', () => {
    // Arrange - Setup combat with weak enemy and strong attack cards
    const strikeCard1 = createCardInstance('strike', { uid: 'strike_1' })
    const strikeCard2 = createCardInstance('strike', { uid: 'strike_2' })
    const strikeCard3 = createCardInstance('strike', { uid: 'strike_3' })
    const defendCard = createCardInstance('defend', { uid: 'defend_1' })

    const drawPile = Array.from({ length: 5 }, (_, i) =>
      createCardInstance('strike', { uid: `draw_card_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        phase: 'playerTurn',
        turn: 1,
        player: createPlayer({ currentHealth: 80, maxHealth: 80, energy: 3 }),
        enemies: [
          createEnemy({
            id: 'enemy_1',
            currentHealth: 20,
            maxHealth: 20,
            intent: { type: 'attack', value: 8 },
          }),
        ],
        hand: [strikeCard1, strikeCard2, strikeCard3, defendCard],
        drawPile,
        discardPile: [],
        cardsPlayedThisTurn: 0,
      }),
    })

    // Act - Turn 1: Play three strikes to kill enemy
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_2',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_3',
      targetId: 'enemy_1',
    })

    // Assert - Enemy should be dead (6+6+6 = 18 damage, enemy has 20 HP)
    // After third strike, enemy should have 2 HP left, actually
    expect(result.combat?.enemies[0]?.currentHealth).toBe(2)
    expect(result.combat?.phase).toBe('playerTurn')

    // Act - End turn (enemy attacks), then play another strike next turn
    result = applyAction(result, { type: 'endTurn' })
    expect(result.combat?.phase).toBe('enemyTurn')

    // Enemy action
    result = applyAction(result, { type: 'enemyAction', enemyId: 'enemy_1' })

    // Player should have taken damage (8)
    expect(result.combat?.player.currentHealth).toBe(72)

    // Start new turn
    result = applyAction(result, { type: 'startTurn' })
    expect(result.combat?.phase).toBe('playerTurn')
    expect(result.combat?.turn).toBe(2)

    // Play a card from new hand to finish enemy
    const newHandCard = result.combat!.hand[0]
    result = applyAction(result, {
      type: 'playCard',
      cardUid: newHandCard.uid,
      targetId: 'enemy_1',
    })

    // Assert - Combat should end in victory
    expect(result.combat?.enemies).toHaveLength(0)
    expect(result.combat?.phase).toBe('victory')
    expect(result.stats.enemiesKilled).toBe(1)
  })

  it('complete_turn_cycle_with_block_decay', () => {
    // Arrange
    const defendCard = createCardInstance('defend', { uid: 'defend_1' })
    const drawCards = Array.from({ length: 10 }, (_, i) =>
      createCardInstance('strike', { uid: `draw_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3, block: 0 }),
        enemies: [createEnemy({ intent: { type: 'attack', value: 5 } })],
        hand: [defendCard],
        drawPile: drawCards,
      }),
    })

    // Act - Play defend card to gain block
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'defend_1',
      targetId: 'player',
    })

    // Assert - Block gained (5 from defend card)
    expect(result.combat?.player.block).toBe(5)

    // Act - End turn
    result = applyAction(result, { type: 'endTurn' })

    // Act - Enemy attacks
    result = applyAction(result, { type: 'enemyAction', enemyId: 'enemy_1' })

    // Assert - Block absorbed damage but enemy turn hasn't cleared it yet
    expect(result.combat?.player.block).toBe(0) // 5 block - 5 damage = 0
    expect(result.combat?.player.currentHealth).toBe(80) // No health loss

    // Act - Start new turn
    result = applyAction(result, { type: 'startTurn' })

    // Assert - Block should be cleared at turn start
    expect(result.combat?.player.block).toBe(0)
    expect(result.combat?.turn).toBe(2)
  })

  it('multi_turn_battle_with_sustained_combat', () => {
    // Arrange - Longer battle scenario
    const hand = [
      createCardInstance('strike', { uid: 'strike_1' }),
      createCardInstance('defend', { uid: 'defend_1' }),
      createCardInstance('strike', { uid: 'strike_2' }),
    ]

    const drawPile = Array.from({ length: 20 }, (_, i) =>
      createCardInstance(i % 2 === 0 ? 'strike' : 'defend', { uid: `draw_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 80, maxHealth: 80, energy: 3 }),
        enemies: [
          createEnemy({
            id: 'enemy_1',
            currentHealth: 60,
            maxHealth: 60,
            intent: { type: 'attack', value: 7 },
          }),
        ],
        hand,
        drawPile,
        turn: 1,
      }),
    })

    // Act - Turn 1: Attack and defend
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'defend_1',
      targetId: 'player',
    })

    expect(result.combat?.enemies[0].currentHealth).toBe(54) // 60 - 6
    expect(result.combat?.player.block).toBe(5)

    // End turn, enemy attacks
    result = applyAction(result, { type: 'endTurn' })
    result = applyAction(result, { type: 'enemyAction', enemyId: 'enemy_1' })

    // Block should absorb some damage (5 block, 7 damage = 2 damage to health)
    expect(result.combat?.player.currentHealth).toBe(78) // 80 - 2

    // Turn 2
    result = applyAction(result, { type: 'startTurn' })
    expect(result.combat?.turn).toBe(2)
    expect(result.combat?.hand).toHaveLength(5) // Drew 5 cards
    expect(result.combat?.player.energy).toBe(3) // Energy restored

    // Turn 3
    result = applyAction(result, { type: 'endTurn' })
    result = applyAction(result, { type: 'enemyAction', enemyId: 'enemy_1' })
    result = applyAction(result, { type: 'startTurn' })

    // Assert - Multiple turns completed successfully
    expect(result.combat?.turn).toBe(3)
    expect(result.combat?.phase).toBe('playerTurn')
  })
})

// ============================================================================
// Power + Card Interaction Tests
// ============================================================================

describe('power and card interactions', () => {
  it('strength_increases_attack_damage', () => {
    // Arrange
    const strikeCard = createCardInstance('strike', { uid: 'strike_1' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          powers: {
            strength: { id: 'strength', amount: 3 },
          },
        }),
        enemies: [createEnemy({ currentHealth: 50 })],
        hand: [strikeCard],
      }),
    })

    // Act - Play strike with strength buff
    const result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // Assert - Damage should be 6 (base) + 3 (strength) = 9
    expect(result.combat?.enemies[0].currentHealth).toBe(41) // 50 - 9
  })

  it('vulnerable_increases_damage_taken', () => {
    // Arrange
    const strikeCard = createCardInstance('strike', { uid: 'strike_1' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer(),
        enemies: [
          createEnemy({
            currentHealth: 50,
            powers: {
              vulnerable: { id: 'vulnerable', amount: 2 },
            },
          }),
        ],
        hand: [strikeCard],
      }),
    })

    // Act - Attack vulnerable enemy
    const result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // Assert - Damage should be 6 * 1.5 (vulnerable) = 9
    expect(result.combat?.enemies[0].currentHealth).toBe(41) // 50 - 9
  })

  it('weak_reduces_damage_dealt', () => {
    // Arrange - Enemy has weak, so its attacks deal less damage
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 80 }),
        enemies: [
          createEnemy({
            intent: { type: 'attack', value: 10 },
            powers: {
              weak: { id: 'weak', amount: 1 },
            },
          }),
        ],
      }),
    })

    // Act - Weak enemy attacks player
    const result = applyAction(state, { type: 'enemyAction', enemyId: 'enemy_1' })

    // Assert - Damage should be 10 * 0.75 (weak) = 7.5 -> 7
    expect(result.combat?.player.currentHealth).toBe(73) // 80 - 7
  })

  it('poison_deals_damage_at_turn_start', () => {
    // Arrange - Player with poison
    const drawCards = Array.from({ length: 5 }, (_, i) =>
      createCardInstance('strike', { uid: `draw_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        phase: 'enemyTurn',
        player: createPlayer({
          currentHealth: 80,
          powers: {
            poison: { id: 'poison', amount: 5 },
          },
        }),
        drawPile: drawCards,
      }),
    })

    // Act - Start player turn (poison decays first, then triggers)
    const result = applyAction(state, { type: 'startTurn' })

    // Assert - Poison decays to 4 first, then deals 4 damage
    expect(result.combat?.player.currentHealth).toBe(76) // 80 - 4 (poison decayed before dealing damage)
    expect(result.combat?.player.powers.poison?.amount).toBe(4) // 5 - 1 decay
  })

  it('multiple_powers_stack_correctly', () => {
    // Arrange - Enemy with both strength and vulnerable
    const strikeCard = createCardInstance('strike', { uid: 'strike_1' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          powers: {
            strength: { id: 'strength', amount: 2 },
          },
        }),
        enemies: [
          createEnemy({
            currentHealth: 50,
            powers: {
              vulnerable: { id: 'vulnerable', amount: 1 },
            },
          }),
        ],
        hand: [strikeCard],
      }),
    })

    // Act - Attack with strength against vulnerable enemy
    const result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // Assert - Damage: (6 + 2 strength) * 1.5 vulnerable = 12
    expect(result.combat?.enemies[0].currentHealth).toBe(38) // 50 - 12
  })
})

// ============================================================================
// Enemy Death and Combat End Tests
// ============================================================================

describe('enemy death and combat end', () => {
  it('killing_single_enemy_ends_combat_in_victory', () => {
    // Arrange
    const strikeCard = createCardInstance('strike', { uid: 'strike_1' })

    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ currentHealth: 6 })],
        hand: [strikeCard],
      }),
    })

    // Act - Kill enemy with strike
    const result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // Assert
    expect(result.combat?.enemies).toHaveLength(0)
    expect(result.combat?.phase).toBe('victory')
    expect(result.stats.enemiesKilled).toBe(1)
  })

  it('killing_multiple_enemies_requires_all_dead', () => {
    // Arrange
    const strikeCard1 = createCardInstance('strike', { uid: 'strike_1' })
    const strikeCard2 = createCardInstance('strike', { uid: 'strike_2' })

    const state = createRunState({
      combat: createCombat({
        enemies: [
          createEnemy({ id: 'enemy_1', currentHealth: 6 }),
          createEnemy({ id: 'enemy_2', currentHealth: 6 }),
        ],
        hand: [strikeCard1, strikeCard2],
      }),
    })

    // Act - Kill first enemy
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // Assert - Combat continues
    expect(result.combat?.enemies).toHaveLength(1)
    expect(result.combat?.phase).toBe('playerTurn')

    // Act - Kill second enemy
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_2',
      targetId: 'enemy_2',
    })

    // Assert - Combat ends
    expect(result.combat?.enemies).toHaveLength(0)
    expect(result.combat?.phase).toBe('victory')
    expect(result.stats.enemiesKilled).toBe(2)
  })

  it('overkill_damage_still_kills_enemy', () => {
    // Arrange
    const strikeCard = createCardInstance('strike', { uid: 'strike_1' })

    const state = createRunState({
      combat: createCombat({
        enemies: [createEnemy({ currentHealth: 2 })],
        hand: [strikeCard],
      }),
    })

    // Act - Deal 6 damage to enemy with 2 HP
    const result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // Assert - Enemy dies even with overkill
    expect(result.combat?.enemies).toHaveLength(0)
    expect(result.combat?.phase).toBe('victory')
  })

  it('player_death_ends_combat_in_defeat', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ currentHealth: 5 }),
        enemies: [createEnemy({ intent: { type: 'attack', value: 10 } })],
      }),
    })

    // Act - Enemy deals lethal damage
    const result = applyAction(state, { type: 'enemyAction', enemyId: 'enemy_1' })

    // Assert
    expect(result.combat?.player.currentHealth).toBeLessThanOrEqual(0)
    expect(result.combat?.phase).toBe('defeat')
  })
})

// ============================================================================
// Card Chaining Tests
// ============================================================================

describe('card chaining and sequencing', () => {
  it('play_multiple_cards_in_single_turn', () => {
    // Arrange
    const strikeCard1 = createCardInstance('strike', { uid: 'strike_1' })
    const strikeCard2 = createCardInstance('strike', { uid: 'strike_2' })
    const defendCard = createCardInstance('defend', { uid: 'defend_1' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3, block: 0 }),
        enemies: [createEnemy({ currentHealth: 50 })],
        hand: [strikeCard1, strikeCard2, defendCard],
        cardsPlayedThisTurn: 0,
      }),
    })

    // Act - Play all three cards
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_2',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'defend_1',
      targetId: 'player',
    })

    // Assert
    expect(result.combat?.enemies[0].currentHealth).toBe(38) // 50 - 12
    expect(result.combat?.player.block).toBe(5)
    expect(result.combat?.player.energy).toBe(0)
    expect(result.combat?.cardsPlayedThisTurn).toBe(3)
    expect(result.combat?.hand).toHaveLength(0)
    expect(result.combat?.discardPile).toHaveLength(3)
  })

  it('card_play_order_affects_outcome', () => {
    // Arrange - Use strength power instead of bash (simpler test)
    const strikeCard1 = createCardInstance('strike', { uid: 'strike_1' })
    const strikeCard2 = createCardInstance('strike', { uid: 'strike_2' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3 }),
        enemies: [createEnemy({ currentHealth: 50 })],
        hand: [strikeCard1, strikeCard2],
      }),
    })

    // Act - Play first strike without strength
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })

    // First strike deals 6 damage
    expect(result.combat?.enemies[0].currentHealth).toBe(44) // 50 - 6

    // Apply strength power
    result = applyAction(result, {
      type: 'applyPower',
      targetId: 'player',
      powerId: 'strength',
      amount: 3,
    })

    // Play second strike with strength
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_2',
      targetId: 'enemy_1',
    })

    // Second strike deals 6 + 3 (strength) = 9 damage
    expect(result.combat?.enemies[0].currentHealth).toBe(35) // 44 - 9
  })

  it('energy_limits_card_plays', () => {
    // Arrange
    const strikeCard1 = createCardInstance('strike', { uid: 'strike_1' })
    const strikeCard2 = createCardInstance('strike', { uid: 'strike_2' })
    const strikeCard3 = createCardInstance('strike', { uid: 'strike_3' })
    const strikeCard4 = createCardInstance('strike', { uid: 'strike_4' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3 }),
        enemies: [createEnemy({ currentHealth: 50 })],
        hand: [strikeCard1, strikeCard2, strikeCard3, strikeCard4],
      }),
    })

    // Act - Play three cards (exhausts energy)
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'strike_1',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_2',
      targetId: 'enemy_1',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'strike_3',
      targetId: 'enemy_1',
    })

    // Assert - No energy left, can't play fourth card
    expect(result.combat?.player.energy).toBe(0)
    expect(result.combat?.cardsPlayedThisTurn).toBe(3)
    expect(result.combat?.hand).toHaveLength(1) // Fourth card still in hand
  })
})

// ============================================================================
// Block Decay Across Turns Tests
// ============================================================================

describe('block decay across turns', () => {
  it('block_clears_at_start_of_player_turn', () => {
    // Arrange
    const drawCards = Array.from({ length: 5 }, (_, i) =>
      createCardInstance('strike', { uid: `draw_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        phase: 'enemyTurn',
        player: createPlayer({ block: 15 }),
        drawPile: drawCards,
      }),
    })

    // Act - Start player turn
    const result = applyAction(state, { type: 'startTurn' })

    // Assert - Block cleared
    expect(result.combat?.player.block).toBe(0)
    expect(result.combat?.phase).toBe('playerTurn')
  })

  it('block_persists_during_enemy_turn', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        phase: 'playerTurn',
        player: createPlayer({ block: 10 }),
        enemies: [createEnemy({ intent: { type: 'attack', value: 5 } })],
      }),
    })

    // Act - End turn (block should still be there for enemy attacks)
    let result = applyAction(state, { type: 'endTurn' })

    expect(result.combat?.player.block).toBe(10) // Still there

    // Enemy attacks
    result = applyAction(result, { type: 'enemyAction', enemyId: 'enemy_1' })

    // Assert - Block absorbed damage
    expect(result.combat?.player.block).toBe(5) // 10 - 5
    expect(result.combat?.player.currentHealth).toBe(80) // No damage
  })

  it('barrier_persists_across_turns', () => {
    // Arrange
    const drawCards = Array.from({ length: 5 }, (_, i) =>
      createCardInstance('strike', { uid: `draw_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        phase: 'enemyTurn',
        player: createPlayer({ block: 10, barrier: 8 }),
        drawPile: drawCards,
      }),
    })

    // Act - Start player turn
    const result = applyAction(state, { type: 'startTurn' })

    // Assert - Block cleared but barrier remains
    expect(result.combat?.player.block).toBe(0)
    expect(result.combat?.player.barrier).toBe(8) // Persists
  })

  it('barricade_power_prevents_block_decay', () => {
    // Arrange
    const drawCards = Array.from({ length: 5 }, (_, i) =>
      createCardInstance('strike', { uid: `draw_${i}` })
    )

    const state = createRunState({
      combat: createCombat({
        phase: 'enemyTurn',
        player: createPlayer({
          block: 20,
          powers: {
            barricade: { id: 'barricade', amount: 1 },
          },
        }),
        drawPile: drawCards,
      }),
    })

    // Act - Start player turn
    const result = applyAction(state, { type: 'startTurn' })

    // Assert - Block preserved by barricade
    expect(result.combat?.player.block).toBe(20)
  })

  it('block_builds_up_within_single_turn', () => {
    // Arrange
    const defendCard1 = createCardInstance('defend', { uid: 'defend_1' })
    const defendCard2 = createCardInstance('defend', { uid: 'defend_2' })
    const defendCard3 = createCardInstance('defend', { uid: 'defend_3' })

    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 3, block: 0 }),
        hand: [defendCard1, defendCard2, defendCard3],
      }),
    })

    // Act - Play multiple defend cards
    let result = applyAction(state, {
      type: 'playCard',
      cardUid: 'defend_1',
      targetId: 'player',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'defend_2',
      targetId: 'player',
    })
    result = applyAction(result, {
      type: 'playCard',
      cardUid: 'defend_3',
      targetId: 'player',
    })

    // Assert - Block stacks within turn
    expect(result.combat?.player.block).toBe(15) // 5 + 5 + 5
  })
})
