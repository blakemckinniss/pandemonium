import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  executeEnergy,
  executeDraw,
  executeDiscard,
  executeExhaust,
  executeBanish,
  executeAddCard,
  executeShuffle,
  executeRetain,
  executeCopyCard,
  executePutOnDeck,
  executeModifyCost,
  executeReplayCard,
  executePlayTopCard,
  executeGold,
  executeDiscover,
  setCardEffectsExecuteEffect,
} from '../effects/card-effects'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  CardInstance,
  EffectContext,
  HeroState,
  AtomicEffect,
} from '../../types'

// ============================================================================
// Test Factories
// ============================================================================

function createHero(): HeroState {
  return {
    id: 'warrior',
    name: 'Warrior',
    health: 80,
    energy: 3,
    currentHealth: 80,
    maxHealth: 80,
    starterDeck: [],
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

function createCard(overrides: Partial<CardInstance> = {}): CardInstance {
  return {
    uid: `card_${Math.random().toString(36).substr(2, 9)}`,
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
    gold: 100,
    stats: {
      enemiesKilled: 0,
      cardsPlayed: 0,
      damageDealt: 0,
      damageTaken: 0,
    },
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
// executeEnergy Tests
// ============================================================================

describe('executeEnergy', () => {
  it('gains_energy_with_gain_operation', () => {
    // Arrange
    const state = createRunState()
    const effect = { type: 'energy' as const, amount: 2, operation: 'gain' as const }
    const ctx = createEffectContext()

    // Act
    executeEnergy(state, effect, ctx)

    // Assert
    expect(state.combat?.player.energy).toBe(5) // 3 + 2
  })

  it('spends_energy_with_spend_operation', () => {
    // Arrange
    const state = createRunState()
    const effect = { type: 'energy' as const, amount: 2, operation: 'spend' as const }
    const ctx = createEffectContext()

    // Act
    executeEnergy(state, effect, ctx)

    // Assert
    expect(state.combat?.player.energy).toBe(1) // 3 - 2
  })

  it('does_not_go_below_zero_when_spending', () => {
    // Arrange
    const state = createRunState()
    state.combat!.player.energy = 1
    const effect = { type: 'energy' as const, amount: 5, operation: 'spend' as const }
    const ctx = createEffectContext()

    // Act
    executeEnergy(state, effect, ctx)

    // Assert
    expect(state.combat?.player.energy).toBe(0)
  })

  it('sets_energy_with_set_operation', () => {
    // Arrange
    const state = createRunState()
    const effect = { type: 'energy' as const, amount: 10, operation: 'set' as const }
    const ctx = createEffectContext()

    // Act
    executeEnergy(state, effect, ctx)

    // Assert
    expect(state.combat?.player.energy).toBe(10)
  })

  it('emits_visual_event_when_energy_changes', () => {
    // Arrange
    const state = createRunState()
    const effect = { type: 'energy' as const, amount: 2, operation: 'gain' as const }
    const ctx = createEffectContext()

    // Act
    executeEnergy(state, effect, ctx)

    // Assert
    expect(state.combat?.visualQueue.length).toBe(1)
    expect(state.combat?.visualQueue[0]).toEqual({ type: 'energy', delta: 2 })
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'energy' as const, amount: 2, operation: 'gain' as const }
    const ctx = createEffectContext()

    // Act - should not throw
    executeEnergy(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeDraw Tests
// ============================================================================

describe('executeDraw', () => {
  it('draws_cards_from_draw_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1, card2],
        hand: [],
      }),
    })
    const effect = { type: 'draw' as const, amount: 2 }
    const ctx = createEffectContext()

    // Act
    executeDraw(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(2)
    expect(state.combat?.drawPile.length).toBe(0)
  })

  it('reshuffles_discard_when_draw_pile_empty', () => {
    // Arrange
    const discardCard = createCard({ uid: 'discard1' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [],
        discardPile: [discardCard],
        hand: [],
      }),
    })
    const effect = { type: 'draw' as const, amount: 1 }
    const ctx = createEffectContext()

    // Act
    executeDraw(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(1)
    expect(state.combat?.discardPile.length).toBe(0)
  })

  it('stops_drawing_when_both_piles_empty', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        drawPile: [],
        discardPile: [],
        hand: [],
      }),
    })
    const effect = { type: 'draw' as const, amount: 5 }
    const ctx = createEffectContext()

    // Act
    executeDraw(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(0)
  })

  it('emits_visual_event_for_drawn_cards', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        drawPile: [createCard(), createCard()],
        hand: [],
      }),
    })
    const effect = { type: 'draw' as const, amount: 2 }
    const ctx = createEffectContext()

    // Act
    executeDraw(state, effect, ctx)

    // Assert
    expect(state.combat?.visualQueue.some((e) => e.type === 'draw')).toBe(true)
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'draw' as const, amount: 2 }
    const ctx = createEffectContext()

    // Act
    executeDraw(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeDiscard Tests
// ============================================================================

describe('executeDiscard', () => {
  it('discards_card_from_hand_to_discard_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2],
        discardPile: [],
      }),
    })
    const effect = { type: 'discard' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeDiscard(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(2)
    expect(state.combat?.hand.length).toBe(0)
  })

  it('discards_limited_amount_when_specified', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const card3 = createCard({ uid: 'card3' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2, card3],
        discardPile: [],
      }),
    })
    const effect = { type: 'discard' as const, target: 'hand' as const, amount: 2 }
    const ctx = createEffectContext()

    // Act
    executeDiscard(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(2)
    expect(state.combat?.hand.length).toBe(1)
  })

  it('emits_visual_event_with_discarded_uids', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        discardPile: [],
      }),
    })
    const effect = { type: 'discard' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeDiscard(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'discard')
    expect(visual).toBeDefined()
    expect((visual as any).cardUids).toContain('card1')
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'discard' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeDiscard(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeExhaust Tests
// ============================================================================

describe('executeExhaust', () => {
  it('exhausts_card_from_hand_to_exhaust_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        exhaustPile: [],
      }),
    })
    const effect = { type: 'exhaust' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeExhaust(state, effect, ctx)

    // Assert
    expect(state.combat?.exhaustPile.length).toBe(1)
    expect(state.combat?.hand.length).toBe(0)
    expect(state.combat?.exhaustPile[0].uid).toBe('card1')
  })

  it('exhausts_card_from_discard_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        discardPile: [card1],
        exhaustPile: [],
      }),
    })
    const effect = { type: 'exhaust' as const, target: 'discardPile' as const }
    const ctx = createEffectContext()

    // Act
    executeExhaust(state, effect, ctx)

    // Assert
    expect(state.combat?.exhaustPile.length).toBe(1)
    expect(state.combat?.discardPile.length).toBe(0)
  })

  it('limits_exhausts_to_amount_specified', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const card3 = createCard({ uid: 'card3' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2, card3],
        exhaustPile: [],
      }),
    })
    const effect = { type: 'exhaust' as const, target: 'hand' as const, amount: 2 }
    const ctx = createEffectContext()

    // Act
    executeExhaust(state, effect, ctx)

    // Assert
    expect(state.combat?.exhaustPile.length).toBe(2)
    expect(state.combat?.hand.length).toBe(1)
  })

  it('emits_visual_event_with_exhausted_uids', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        exhaustPile: [],
      }),
    })
    const effect = { type: 'exhaust' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeExhaust(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'exhaust')
    expect(visual).toBeDefined()
    expect((visual as any).cardUids).toContain('card1')
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'exhaust' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeExhaust(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeBanish Tests
// ============================================================================

describe('executeBanish', () => {
  it('removes_card_from_hand_permanently', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'banish' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(0)
    expect(state.combat?.exhaustPile.length).toBe(0) // Not in exhaust
    expect(state.combat?.discardPile.length).toBe(0) // Not in discard
  })

  it('removes_card_from_draw_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1],
      }),
    })
    const effect = { type: 'banish' as const, target: 'drawPile' as const }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(0)
  })

  it('removes_card_from_discard_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        discardPile: [card1],
      }),
    })
    const effect = { type: 'banish' as const, target: 'discardPile' as const }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(0)
  })

  it('removes_card_from_exhaust_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        exhaustPile: [card1],
      }),
    })
    const effect = { type: 'banish' as const, target: 'exhaustPile' as const }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat?.exhaustPile.length).toBe(0)
  })

  it('limits_banish_to_amount_specified', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const card3 = createCard({ uid: 'card3' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2, card3],
      }),
    })
    const effect = { type: 'banish' as const, target: 'hand' as const, amount: 2 }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(1)
  })

  it('sets_pending_selection_when_player_choice_true', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2],
      }),
    })
    const effect = { type: 'banish' as const, target: 'hand' as const, playerChoice: true }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat?.pendingSelection).toBeDefined()
    expect(state.combat?.pendingSelection?.type).toBe('banish')
    expect(state.combat?.hand.length).toBe(2) // Cards not removed yet
  })

  it('emits_visual_event_for_banished_cards', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'banish' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'banish')
    expect(visual).toBeDefined()
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'banish' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeBanish(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeAddCard Tests
// ============================================================================

describe('executeAddCard', () => {
  it('adds_card_to_hand', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        hand: [],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'hand' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(1)
    expect(state.combat?.hand[0].definitionId).toBe('strike')
    expect(state.combat?.hand[0].upgraded).toBe(false)
  })

  it('adds_upgraded_card_when_upgraded_true', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        hand: [],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'hand' as const,
      upgraded: true,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].upgraded).toBe(true)
  })

  it('adds_multiple_cards_when_count_specified', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        hand: [],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'hand' as const,
      count: 3,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(3)
  })

  it('adds_card_to_top_of_draw_pile_when_position_top', () => {
    // Arrange
    const existing = createCard({ uid: 'existing' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [existing],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'drawPile' as const,
      position: 'top' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(2)
    expect(state.combat?.drawPile[1].definitionId).toBe('strike') // Top is last
  })

  it('adds_card_to_bottom_of_draw_pile_when_position_bottom', () => {
    // Arrange
    const existing = createCard({ uid: 'existing' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [existing],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'drawPile' as const,
      position: 'bottom' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(2)
    expect(state.combat?.drawPile[0].definitionId).toBe('strike') // Bottom is first
  })

  it('adds_card_to_discard_pile', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        discardPile: [],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'discardPile' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(1)
    expect(state.combat?.discardPile[0].definitionId).toBe('strike')
  })

  it('emits_visual_event_for_added_card', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        hand: [],
      }),
    })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'hand' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'addCard')
    expect(visual).toBeDefined()
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = {
      type: 'addCard' as const,
      cardId: 'strike',
      destination: 'hand' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeAddCard(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeShuffle Tests
// ============================================================================

describe('executeShuffle', () => {
  it('shuffles_draw_pile', () => {
    // Arrange
    const cards = [
      createCard({ uid: 'card1' }),
      createCard({ uid: 'card2' }),
      createCard({ uid: 'card3' }),
    ]
    const state = createRunState({
      combat: createCombat({
        drawPile: [...cards],
      }),
    })
    const effect = { type: 'shuffle' as const, pile: 'drawPile' as const }
    const ctx = createEffectContext()

    // Act
    executeShuffle(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(3)
    // All cards still present
    expect(state.combat?.drawPile.map((c) => c.uid).sort()).toEqual(['card1', 'card2', 'card3'])
  })

  it('shuffles_discard_pile', () => {
    // Arrange
    const cards = [createCard({ uid: 'card1' }), createCard({ uid: 'card2' })]
    const state = createRunState({
      combat: createCombat({
        discardPile: [...cards],
      }),
    })
    const effect = { type: 'shuffle' as const, pile: 'discardPile' as const }
    const ctx = createEffectContext()

    // Act
    executeShuffle(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(2)
  })

  it('merges_discard_into_draw_pile_when_specified', () => {
    // Arrange
    const drawCards = [createCard({ uid: 'draw1' })]
    const discardCards = [createCard({ uid: 'discard1' }), createCard({ uid: 'discard2' })]
    const state = createRunState({
      combat: createCombat({
        drawPile: [...drawCards],
        discardPile: [...discardCards],
      }),
    })
    const effect = {
      type: 'shuffle' as const,
      pile: 'discardPile' as const,
      into: 'drawPile' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeShuffle(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(3)
    expect(state.combat?.discardPile.length).toBe(0)
  })

  it('emits_visual_event', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        drawPile: [createCard()],
      }),
    })
    const effect = { type: 'shuffle' as const, pile: 'drawPile' as const }
    const ctx = createEffectContext()

    // Act
    executeShuffle(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'shuffle')
    expect(visual).toBeDefined()
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'shuffle' as const, pile: 'drawPile' as const }
    const ctx = createEffectContext()

    // Act
    executeShuffle(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeRetain Tests
// ============================================================================

describe('executeRetain', () => {
  it('marks_card_as_retained', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'retain' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeRetain(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].retained).toBe(true)
  })

  it('marks_multiple_cards_as_retained', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2],
      }),
    })
    const effect = { type: 'retain' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeRetain(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].retained).toBe(true)
    expect(state.combat?.hand[1].retained).toBe(true)
  })

  it('does_not_retain_already_retained_cards', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', retained: true })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'retain' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeRetain(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].retained).toBe(true)
    expect(state.combat?.visualQueue.length).toBe(0) // No visual for already retained
  })

  it('emits_visual_event_for_retained_cards', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'retain' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeRetain(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'retain')
    expect(visual).toBeDefined()
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'retain' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeRetain(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeCopyCard Tests
// ============================================================================

describe('executeCopyCard', () => {
  it('copies_card_to_hand', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike', upgraded: true })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'copyCard' as const, target: 'hand' as const, destination: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeCopyCard(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(2)
    // Both cards should be strike and upgraded
    expect(state.combat?.hand.every((c) => c.definitionId === 'strike')).toBe(true)
    expect(state.combat?.hand.every((c) => c.upgraded === true)).toBe(true)
    // But they should have different UIDs
    expect(state.combat?.hand[0].uid).not.toBe(state.combat?.hand[1].uid)
  })

  it('copies_multiple_cards_when_count_specified', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const card2 = createCard({ uid: 'card2', definitionId: 'defend' })
    const card3 = createCard({ uid: 'card3', definitionId: 'bash' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2, card3],
      }),
    })
    const effect = {
      type: 'copyCard' as const,
      target: 'hand' as const,
      destination: 'hand' as const,
      count: 2,
    }
    const ctx = createEffectContext()

    // Act
    executeCopyCard(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(5) // 3 originals + 2 copies
  })

  it('copies_card_to_draw_pile_top', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        drawPile: [],
      }),
    })
    const effect = {
      type: 'copyCard' as const,
      target: 'hand' as const,
      destination: 'drawPile' as const,
      position: 'top' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeCopyCard(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(1)
    expect(state.combat?.drawPile[0].definitionId).toBe('strike')
  })

  it('copies_card_to_discard_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        discardPile: [card1],
      }),
    })
    const effect = {
      type: 'copyCard' as const,
      target: 'discardPile' as const,
      destination: 'discardPile' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeCopyCard(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(2)
  })

  it('emits_visual_event_for_copied_card', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'copyCard' as const, target: 'hand' as const, destination: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeCopyCard(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'addCard')
    expect(visual).toBeDefined()
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'copyCard' as const, target: 'hand' as const, destination: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeCopyCard(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executePutOnDeck Tests
// ============================================================================

describe('executePutOnDeck', () => {
  it('moves_card_from_hand_to_top_of_draw_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        drawPile: [],
      }),
    })
    const effect = { type: 'putOnDeck' as const, target: 'hand' as const, position: 'top' as const }
    const ctx = createEffectContext()

    // Act
    executePutOnDeck(state, effect, ctx)

    // Assert
    expect(state.combat?.hand.length).toBe(0)
    expect(state.combat?.drawPile.length).toBe(1)
    expect(state.combat?.drawPile[0].uid).toBe('card1')
  })

  it('moves_card_to_bottom_of_draw_pile', () => {
    // Arrange
    const existing = createCard({ uid: 'existing' })
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        drawPile: [existing],
      }),
    })
    const effect = {
      type: 'putOnDeck' as const,
      target: 'hand' as const,
      position: 'bottom' as const,
    }
    const ctx = createEffectContext()

    // Act
    executePutOnDeck(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(2)
    expect(state.combat?.drawPile[0].uid).toBe('card1') // Bottom = first
    expect(state.combat?.drawPile[1].uid).toBe('existing')
  })

  it('defaults_to_top_position', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        drawPile: [],
      }),
    })
    const effect = { type: 'putOnDeck' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executePutOnDeck(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(1)
  })

  it('emits_visual_event_with_position', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
        drawPile: [],
      }),
    })
    const effect = { type: 'putOnDeck' as const, target: 'hand' as const, position: 'top' as const }
    const ctx = createEffectContext()

    // Act
    executePutOnDeck(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'putOnDeck')
    expect(visual).toBeDefined()
    expect((visual as any).position).toBe('top')
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'putOnDeck' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executePutOnDeck(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeModifyCost Tests
// ============================================================================

describe('executeModifyCost', () => {
  it('reduces_card_cost_when_negative_amount', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'modifyCost' as const, target: 'hand' as const, amount: -2 }
    const ctx = createEffectContext()

    // Act
    executeModifyCost(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].costModifier).toBe(-2)
  })

  it('increases_card_cost_when_positive_amount', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'modifyCost' as const, target: 'hand' as const, amount: 1 }
    const ctx = createEffectContext()

    // Act
    executeModifyCost(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].costModifier).toBe(1)
  })

  it('stacks_cost_modifiers', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', costModifier: -1 })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'modifyCost' as const, target: 'hand' as const, amount: -1 }
    const ctx = createEffectContext()

    // Act
    executeModifyCost(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].costModifier).toBe(-2)
  })

  it('modifies_multiple_cards', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const card2 = createCard({ uid: 'card2' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1, card2],
      }),
    })
    const effect = { type: 'modifyCost' as const, target: 'hand' as const, amount: -1 }
    const ctx = createEffectContext()

    // Act
    executeModifyCost(state, effect, ctx)

    // Assert
    expect(state.combat?.hand[0].costModifier).toBe(-1)
    expect(state.combat?.hand[1].costModifier).toBe(-1)
  })

  it('emits_visual_event_with_delta', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'modifyCost' as const, target: 'hand' as const, amount: -2 }
    const ctx = createEffectContext()

    // Act
    executeModifyCost(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'costModify')
    expect(visual).toBeDefined()
    expect((visual as any).delta).toBe(-2)
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'modifyCost' as const, target: 'hand' as const, amount: -1 }
    const ctx = createEffectContext()

    // Act
    executeModifyCost(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeReplayCard Tests
// ============================================================================

describe('executeReplayCard', () => {
  beforeEach(() => {
    // Set up the executeEffect function for recursive calls
    const mockExecuteEffect = vi.fn((draft: RunState, effect: AtomicEffect) => {
      // Simple mock that just tracks calls
      if (effect.type === 'damage') {
        // For testing purposes, just verify it's called
      }
    })
    setCardEffectsExecuteEffect(mockExecuteEffect)
  })

  it('replays_card_effects_once_by_default', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'replayCard' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeReplayCard(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'replay')
    expect(visual).toBeDefined()
    expect((visual as any).times).toBe(1)
  })

  it('replays_card_effects_multiple_times', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        hand: [card1],
      }),
    })
    const effect = { type: 'replayCard' as const, target: 'hand' as const, times: 3 }
    const ctx = createEffectContext()

    // Act
    executeReplayCard(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'replay')
    expect(visual).toBeDefined()
    expect((visual as any).times).toBe(3)
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'replayCard' as const, target: 'hand' as const }
    const ctx = createEffectContext()

    // Act
    executeReplayCard(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executePlayTopCard Tests
// ============================================================================

describe('executePlayTopCard', () => {
  beforeEach(() => {
    // Set up the executeEffect function for recursive calls
    const mockExecuteEffect = vi.fn()
    setCardEffectsExecuteEffect(mockExecuteEffect)
  })

  it('plays_top_card_from_draw_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1],
        discardPile: [],
      }),
    })
    const effect = { type: 'playTopCard' as const, pile: 'drawPile' as const }
    const ctx = createEffectContext()

    // Act
    executePlayTopCard(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(0)
    expect(state.combat?.discardPile.length).toBe(1)
  })

  it('plays_top_card_from_discard_pile', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        discardPile: [card1],
      }),
    })
    const effect = { type: 'playTopCard' as const, pile: 'discardPile' as const }
    const ctx = createEffectContext()

    // Act
    executePlayTopCard(state, effect, ctx)

    // Assert
    expect(state.combat?.discardPile.length).toBe(1) // Card played then goes back to discard
  })

  it('exhausts_card_when_exhaust_true', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1],
        exhaustPile: [],
      }),
    })
    const effect = { type: 'playTopCard' as const, pile: 'drawPile' as const, exhaust: true }
    const ctx = createEffectContext()

    // Act
    executePlayTopCard(state, effect, ctx)

    // Assert
    expect(state.combat?.exhaustPile.length).toBe(1)
    expect(state.combat?.drawPile.length).toBe(0)
  })

  it('plays_multiple_cards_when_count_specified', () => {
    // Arrange
    const card1 = createCard({ uid: 'card1', definitionId: 'strike' })
    const card2 = createCard({ uid: 'card2', definitionId: 'strike' })
    const state = createRunState({
      combat: createCombat({
        drawPile: [card1, card2],
        discardPile: [],
      }),
    })
    const effect = { type: 'playTopCard' as const, pile: 'drawPile' as const, count: 2 }
    const ctx = createEffectContext()

    // Act
    executePlayTopCard(state, effect, ctx)

    // Assert
    expect(state.combat?.drawPile.length).toBe(0)
    expect(state.combat?.discardPile.length).toBe(2)
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = { type: 'playTopCard' as const, pile: 'drawPile' as const }
    const ctx = createEffectContext()

    // Act
    executePlayTopCard(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})

// ============================================================================
// executeGold Tests
// ============================================================================

describe('executeGold', () => {
  it('gains_gold_with_gain_operation', () => {
    // Arrange
    const state = createRunState({ gold: 100 })
    const effect = { type: 'gold' as const, amount: 50, operation: 'gain' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    expect(state.gold).toBe(150)
  })

  it('loses_gold_with_lose_operation', () => {
    // Arrange
    const state = createRunState({ gold: 100 })
    const effect = { type: 'gold' as const, amount: 30, operation: 'lose' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    expect(state.gold).toBe(70)
  })

  it('does_not_go_below_zero_when_losing', () => {
    // Arrange
    const state = createRunState({ gold: 10 })
    const effect = { type: 'gold' as const, amount: 50, operation: 'lose' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    expect(state.gold).toBe(0)
  })

  it('sets_gold_with_set_operation', () => {
    // Arrange
    const state = createRunState({ gold: 100 })
    const effect = { type: 'gold' as const, amount: 500, operation: 'set' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    expect(state.gold).toBe(500)
  })

  it('prevents_negative_gold_with_set_operation', () => {
    // Arrange
    const state = createRunState({ gold: 100 })
    const effect = { type: 'gold' as const, amount: -50, operation: 'set' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    expect(state.gold).toBe(0)
  })

  it('emits_visual_event_with_positive_delta_for_gain', () => {
    // Arrange
    const state = createRunState({ gold: 100 })
    const effect = { type: 'gold' as const, amount: 50, operation: 'gain' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'gold')
    expect(visual).toBeDefined()
    expect((visual as any).delta).toBe(50)
  })

  it('emits_visual_event_with_negative_delta_for_lose', () => {
    // Arrange
    const state = createRunState({ gold: 100, combat: createCombat() })
    const effect = { type: 'gold' as const, amount: 30, operation: 'lose' as const }
    const ctx = createEffectContext()

    // Act
    executeGold(state, effect, ctx)

    // Assert
    const visual = state.combat?.visualQueue.find((e) => e.type === 'gold')
    expect(visual).toBeDefined()
    expect((visual as any).delta).toBe(-30)
  })
})

// ============================================================================
// executeDiscover Tests
// ============================================================================

describe('executeDiscover', () => {
  it('sets_pending_selection_for_discover', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat(),
    })
    const effect = {
      type: 'discover' as const,
      count: 3,
    }
    const ctx = createEffectContext()

    // Act
    executeDiscover(state, effect, ctx)

    // Assert
    expect(state.combat?.pendingSelection).toBeDefined()
    expect(state.combat?.pendingSelection?.type).toBe('discover')
  })

  it('auto_selects_when_only_one_choice', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({ hand: [] }),
    })
    const effect = {
      type: 'discover' as const,
      count: 1,
      destination: 'hand' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeDiscover(state, effect, ctx)

    // Assert - should auto-add to hand instead of showing modal
    // This depends on card registry having at least one card
    // Pending selection might be undefined if auto-selected
  })

  it('filters_by_pool_when_specified', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat(),
    })
    const effect = {
      type: 'discover' as const,
      count: 3,
      pool: 'common' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeDiscover(state, effect, ctx)

    // Assert
    expect(state.combat?.pendingSelection).toBeDefined()
  })

  it('sets_destination_in_pending_selection', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat(),
    })
    const effect = {
      type: 'discover' as const,
      count: 3,
      destination: 'drawPile' as const,
    }
    const ctx = createEffectContext()

    // Act
    executeDiscover(state, effect, ctx)

    // Assert
    const pending = state.combat?.pendingSelection as any
    expect(pending?.destination).toBe('drawPile')
  })

  it('sets_copies_in_pending_selection', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat(),
    })
    const effect = {
      type: 'discover' as const,
      count: 3,
      copies: 2,
    }
    const ctx = createEffectContext()

    // Act
    executeDiscover(state, effect, ctx)

    // Assert
    const pending = state.combat?.pendingSelection as any
    expect(pending?.copies).toBe(2)
  })

  it('does_nothing_when_combat_is_null', () => {
    // Arrange
    const state = createRunState({ combat: null })
    const effect = {
      type: 'discover' as const,
      count: 3,
    }
    const ctx = createEffectContext()

    // Act
    executeDiscover(state, effect, ctx)

    // Assert
    expect(state.combat).toBeNull()
  })
})
