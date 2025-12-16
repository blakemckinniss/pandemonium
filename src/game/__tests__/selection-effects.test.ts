import { describe, it, expect } from 'vitest'
import {
  executeScry,
  executeTutor,
  executeUpgrade,
  executeTransform,
  handleResolveScry,
  handleResolveTutor,
  handleResolveDiscover,
  handleResolveBanish,
  matchesFilter,
} from '../selection-effects'
import type {
  RunState,
  CardInstance,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  EffectContext,
} from '../../types'
import { generateUid } from '../../lib/utils'

// ============================================================================
// Test Factories
// ============================================================================

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

function createCard(id: string, upgraded = false): CardInstance {
  return {
    uid: generateUid(),
    definitionId: id,
    upgraded,
  }
}

function createCombatState(overrides: Partial<CombatState> = {}): CombatState {
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
    hero: {
      id: 'warrior',
      name: 'Ironclad',
      health: 80,
      energy: 3,
      starterDeck: ['strike', 'defend', 'bash'],
      currentHealth: 80,
      maxHealth: 80,
    },
    deck: [],
    relics: [],
    gold: 0,
    combat: createCombatState(),
    dungeonDeck: [],
    roomChoices: [],
    stats: { enemiesKilled: 0, cardsPlayed: 0, damageDealt: 0, damageTaken: 0 },
    ...overrides,
  }
}

function createEffectContext(overrides: Partial<EffectContext> = {}): EffectContext {
  return {
    source: 'player',
    cardUid: 'card_strike_001',
    cardTarget: 'enemy_1',
    ...overrides,
  }
}

// ============================================================================
// matchesFilter Tests
// ============================================================================

describe('matchesFilter', () => {
  describe('theme_filter', () => {
    it('matches_single_theme', () => {
      // Arrange
      const card = createCard('strike') // attack theme

      // Act
      const result = matchesFilter(card, { theme: 'attack' })

      // Assert
      expect(result).toBe(true)
    })

    it('rejects_wrong_theme', () => {
      // Arrange
      const card = createCard('strike') // attack theme

      // Act
      const result = matchesFilter(card, { theme: 'skill' })

      // Assert
      expect(result).toBe(false)
    })

    it('matches_theme_array', () => {
      // Arrange
      const card = createCard('defend') // skill theme

      // Act
      const result = matchesFilter(card, { theme: ['attack', 'skill'] })

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('cost_filter', () => {
    it('matches_cost_min', () => {
      // Arrange
      const card = createCard('strike') // cost 1

      // Act
      const result = matchesFilter(card, { costMin: 1 })

      // Assert
      expect(result).toBe(true)
    })

    it('rejects_below_cost_min', () => {
      // Arrange
      const card = createCard('strike') // cost 1

      // Act
      const result = matchesFilter(card, { costMin: 2 })

      // Assert
      expect(result).toBe(false)
    })

    it('matches_cost_max', () => {
      // Arrange
      const card = createCard('strike') // cost 1

      // Act
      const result = matchesFilter(card, { costMax: 2 })

      // Assert
      expect(result).toBe(true)
    })

    it('rejects_above_cost_max', () => {
      // Arrange
      const card = createCard('strike') // cost 1

      // Act
      const result = matchesFilter(card, { costMax: 0 })

      // Assert
      expect(result).toBe(false)
    })

    it('matches_cost_range', () => {
      // Arrange
      const card = createCard('strike') // cost 1

      // Act
      const result = matchesFilter(card, { costMin: 0, costMax: 2 })

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('no_filter', () => {
    it('matches_when_filter_undefined', () => {
      // Arrange
      const card = createCard('strike')

      // Act
      const result = matchesFilter(card, undefined)

      // Assert
      expect(result).toBe(true)
    })

    it('matches_when_filter_empty', () => {
      // Arrange
      const card = createCard('strike')

      // Act
      const result = matchesFilter(card, {})

      // Assert
      expect(result).toBe(true)
    })
  })
})

// ============================================================================
// executeScry Tests
// ============================================================================

describe('executeScry', () => {
  it('sets_pending_selection_with_cards_from_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const cards = [createCard('strike'), createCard('defend'), createCard('bash')]
    draft.combat!.drawPile = [...cards]
    const ctx = createEffectContext()

    // Act
    executeScry(draft, { type: 'scry', amount: 2 }, ctx)

    // Assert
    expect(draft.combat!.pendingSelection).toBeDefined()
    expect(draft.combat!.pendingSelection?.type).toBe('scry')
    if (draft.combat!.pendingSelection?.type === 'scry') {
      expect(draft.combat!.pendingSelection.cards).toHaveLength(2)
      expect(draft.combat!.drawPile).toHaveLength(1) // 1 card left
    }
  })

  it('removes_cards_from_top_of_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    const card3 = createCard('bash')
    draft.combat!.drawPile = [card1, card2, card3] // card3 is top (end of array)
    const ctx = createEffectContext()

    // Act
    executeScry(draft, { type: 'scry', amount: 2 }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'scry') {
      const scryedCards = draft.combat!.pendingSelection.cards
      expect(scryedCards[0].uid).toBe(card3.uid) // top card first
      expect(scryedCards[1].uid).toBe(card2.uid)
      expect(draft.combat!.drawPile[0].uid).toBe(card1.uid) // bottom card remains
    }
  })

  it('handles_scrying_more_than_available', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [createCard('strike')]
    const ctx = createEffectContext()

    // Act
    executeScry(draft, { type: 'scry', amount: 5 }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'scry') {
      expect(draft.combat!.pendingSelection.cards).toHaveLength(1)
      expect(draft.combat!.drawPile).toHaveLength(0)
    }
  })

  it('does_nothing_when_draw_pile_empty', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = []
    const ctx = createEffectContext()

    // Act
    executeScry(draft, { type: 'scry', amount: 3 }, ctx)

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_amount_zero', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [createCard('strike'), createCard('defend')]
    const ctx = createEffectContext()

    // Act
    executeScry(draft, { type: 'scry', amount: 0 }, ctx)

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_no_combat', () => {
    // Arrange
    const draft = createRunState()
    draft.combat = null
    const ctx = createEffectContext()

    // Act
    executeScry(draft, { type: 'scry', amount: 3 }, ctx)

    // Assert - should not throw (combat is null when not in combat)
    expect(draft.combat).toBeNull()
  })
})

// ============================================================================
// executeTutor Tests
// ============================================================================

describe('executeTutor', () => {
  it('sets_pending_selection_with_matching_cards_from_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [
      createCard('strike'), // attack
      createCard('defend'), // skill
      createCard('bash'),   // attack
    ]
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      filter: { theme: 'attack' },
      destination: 'hand',
    }, ctx)

    // Assert
    expect(draft.combat!.pendingSelection).toBeDefined()
    if (draft.combat!.pendingSelection?.type === 'tutor') {
      expect(draft.combat!.pendingSelection.cards).toHaveLength(2)
      expect(draft.combat!.pendingSelection.from).toBe('drawPile')
      expect(draft.combat!.pendingSelection.destination).toBe('hand')
    }
  })

  it('sets_pending_selection_from_discard_pile', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.discardPile = [
      createCard('strike'),
      createCard('defend'),
    ]
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'discardPile',
      destination: 'hand',
    }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'tutor') {
      expect(draft.combat!.pendingSelection.cards).toHaveLength(2)
      expect(draft.combat!.pendingSelection.from).toBe('discardPile')
    }
  })

  it('stores_source_indices_for_removal', () => {
    // Arrange
    const draft = createRunState()
    const card0 = createCard('strike') // attack
    const card1 = createCard('defend') // skill
    const card2 = createCard('bash')   // attack
    draft.combat!.drawPile = [card0, card1, card2]
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      filter: { theme: 'attack' },
      destination: 'hand',
    }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'tutor') {
      expect(draft.combat!.pendingSelection.sourceIndices).toEqual([0, 2])
    }
  })

  it('respects_max_select_amount', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [
      createCard('strike'),
      createCard('defend'),
      createCard('bash'),
    ]
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      amount: 2,
      destination: 'hand',
    }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'tutor') {
      expect(draft.combat!.pendingSelection.maxSelect).toBe(2)
    }
  })

  it('defaults_to_max_select_1', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [createCard('strike')]
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      destination: 'hand',
    }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'tutor') {
      expect(draft.combat!.pendingSelection.maxSelect).toBe(1)
    }
  })

  it('includes_tutor_options_in_pending', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [createCard('strike')]
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      destination: 'drawPile',
      position: 'top',
      shuffle: true,
    }, ctx)

    // Assert
    if (draft.combat!.pendingSelection?.type === 'tutor') {
      expect(draft.combat!.pendingSelection.position).toBe('top')
      expect(draft.combat!.pendingSelection.shuffle).toBe(true)
    }
  })

  it('does_nothing_when_no_matching_cards', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = [createCard('strike')] // attack
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      filter: { theme: 'power' },
      destination: 'hand',
    }, ctx)

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_no_combat', () => {
    // Arrange
    const draft = createRunState()
    draft.combat = null
    const ctx = createEffectContext()

    // Act
    executeTutor(draft, {
      type: 'tutor',
      from: 'drawPile',
      destination: 'hand',
    }, ctx)

    // Assert (combat is null when not in combat)
    expect(draft.combat).toBeNull()
  })
})

// ============================================================================
// executeUpgrade Tests
// ============================================================================

describe('executeUpgrade', () => {
  it('upgrades_card_in_hand', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike', false)
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeUpgrade(draft, { type: 'upgrade', target: 'hand' }, ctx)

    // Assert
    expect(draft.combat!.hand[0].upgraded).toBe(true)
  })

  it('upgrades_card_in_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('defend', false)
    draft.combat!.drawPile = [card]
    const ctx = createEffectContext()

    // Act
    executeUpgrade(draft, { type: 'upgrade', target: 'drawPile' }, ctx)

    // Assert
    expect(draft.combat!.drawPile[0].upgraded).toBe(true)
  })

  it('upgrades_card_in_discard_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('bash', false)
    draft.combat!.discardPile = [card]
    const ctx = createEffectContext()

    // Act
    executeUpgrade(draft, { type: 'upgrade', target: 'discardPile' }, ctx)

    // Assert
    expect(draft.combat!.discardPile[0].upgraded).toBe(true)
  })

  it('does_not_upgrade_already_upgraded_card', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike', true)
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeUpgrade(draft, { type: 'upgrade', target: 'hand' }, ctx)

    // Assert
    expect(draft.combat!.hand[0].upgraded).toBe(true)
    expect(draft.combat!.visualQueue).toHaveLength(0) // No visual emitted for already upgraded
  })

  it('emits_visual_event_for_upgraded_cards', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike', false)
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeUpgrade(draft, { type: 'upgrade', target: 'hand' }, ctx)

    // Assert
    expect(draft.combat!.visualQueue).toHaveLength(1)
    expect(draft.combat!.visualQueue[0].type).toBe('upgrade')
    if (draft.combat!.visualQueue[0].type === 'upgrade') {
      expect(draft.combat!.visualQueue[0].cardUids).toContain(card.uid)
    }
  })

  it('does_nothing_when_no_combat', () => {
    // Arrange
    const draft = createRunState()
    draft.combat = null
    const ctx = createEffectContext()

    // Act
    executeUpgrade(draft, { type: 'upgrade', target: 'hand' }, ctx)

    // Assert (combat is null when not in combat)
    expect(draft.combat).toBeNull()
  })
})

// ============================================================================
// executeTransform Tests
// ============================================================================

describe('executeTransform', () => {
  it('transforms_card_to_specific_card', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toCardId: 'defend',
    }, ctx)

    // Assert
    expect(draft.combat!.hand[0].definitionId).toBe('defend')
  })

  it('preserves_card_uid_when_transforming', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    const originalUid = card.uid
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toCardId: 'bash',
    }, ctx)

    // Assert
    expect(draft.combat!.hand[0].uid).toBe(originalUid)
  })

  it('sets_upgraded_flag_when_specified', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike', false)
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toCardId: 'defend',
      upgraded: true,
    }, ctx)

    // Assert
    expect(draft.combat!.hand[0].upgraded).toBe(true)
  })

  it('clears_upgraded_flag_when_false', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike', true)
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toCardId: 'defend',
      upgraded: false,
    }, ctx)

    // Assert
    expect(draft.combat!.hand[0].upgraded).toBe(false)
  })

  it('transforms_card_in_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.drawPile = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'drawPile',
      toCardId: 'defend',
    }, ctx)

    // Assert
    expect(draft.combat!.drawPile[0].definitionId).toBe('defend')
  })

  it('transforms_card_in_discard_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('bash')
    draft.combat!.discardPile = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'discardPile',
      toCardId: 'strike',
    }, ctx)

    // Assert
    expect(draft.combat!.discardPile[0].definitionId).toBe('strike')
  })

  it('emits_visual_event_for_transformation', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toCardId: 'defend',
    }, ctx)

    // Assert
    expect(draft.combat!.visualQueue).toHaveLength(1)
    expect(draft.combat!.visualQueue[0].type).toBe('transform')
    if (draft.combat!.visualQueue[0].type === 'transform') {
      expect(draft.combat!.visualQueue[0].cardUid).toBe(card.uid)
      expect(draft.combat!.visualQueue[0].fromCardId).toBe('strike')
      expect(draft.combat!.visualQueue[0].toCardId).toBe('defend')
    }
  })

  it('handles_random_transformation_from_pool', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.hand = [card]
    const ctx = createEffectContext()

    // Act - transform to random attack card
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toRandom: {
        filter: { theme: 'attack' },
        pool: 'common',
      },
    }, ctx)

    // Assert - visual queue records the transformation (result may be any common attack, including strike)
    expect(draft.combat!.visualQueue).toHaveLength(1)
    expect(draft.combat!.visualQueue[0].type).toBe('transform')
    if (draft.combat!.visualQueue[0].type === 'transform') {
      expect(draft.combat!.visualQueue[0].cardUid).toBe(card.uid)
      expect(draft.combat!.visualQueue[0].fromCardId).toBe('strike')
      // toCardId will be a random common attack - just verify it's set
      expect(draft.combat!.visualQueue[0].toCardId).toBeDefined()
    }
  })

  it('does_nothing_when_no_combat', () => {
    // Arrange
    const draft = createRunState()
    draft.combat = null
    const ctx = createEffectContext()

    // Act
    executeTransform(draft, {
      type: 'transform',
      target: 'hand',
      toCardId: 'defend',
    }, ctx)

    // Assert (combat is null when not in combat)
    expect(draft.combat).toBeNull()
  })
})

// ============================================================================
// handleResolveScry Tests
// ============================================================================

describe('handleResolveScry', () => {
  it('puts_kept_cards_on_top_of_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    const card3 = createCard('bash')
    draft.combat!.drawPile = [card3] // bottom card
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [card1, card2],
    }

    // Act
    handleResolveScry(draft, [card1.uid, card2.uid], [])

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(3)
    expect(draft.combat!.drawPile[1].uid).toBe(card1.uid)
    expect(draft.combat!.drawPile[2].uid).toBe(card2.uid)
  })

  it('puts_discarded_cards_on_bottom_of_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    draft.combat!.drawPile = []
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [card1, card2],
    }

    // Act
    handleResolveScry(draft, [], [card1.uid, card2.uid])

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(2)
    // Discarded cards are added to bottom via unshift, so last discarded is at index 0
    expect(draft.combat!.drawPile[0].uid).toBe(card2.uid)
    expect(draft.combat!.drawPile[1].uid).toBe(card1.uid)
  })

  it('handles_mixed_keep_and_discard', () => {
    // Arrange
    const draft = createRunState()
    const keep1 = createCard('strike')
    const keep2 = createCard('bash')
    const discard1 = createCard('defend')
    draft.combat!.drawPile = []
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [keep1, discard1, keep2],
    }

    // Act
    handleResolveScry(draft, [keep1.uid, keep2.uid], [discard1.uid])

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(3)
    // Bottom: discard1
    expect(draft.combat!.drawPile[0].uid).toBe(discard1.uid)
    // Top: keep1, keep2
    expect(draft.combat!.drawPile[1].uid).toBe(keep1.uid)
    expect(draft.combat!.drawPile[2].uid).toBe(keep2.uid)
  })

  it('clears_pending_selection', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [card],
    }

    // Act
    handleResolveScry(draft, [card.uid], [])

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_no_pending_selection', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.drawPile = []

    // Act
    handleResolveScry(draft, ['uid1'], ['uid2'])

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(0)
  })

  it('does_nothing_when_pending_type_not_scry', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [createCard('strike')],
      sourceIndices: [0],
      from: 'drawPile',
      maxSelect: 1,
      destination: 'hand',
    }

    // Act
    handleResolveScry(draft, ['uid1'], ['uid2'])

    // Assert
    expect(draft.combat!.pendingSelection).toBeDefined() // Not cleared
  })
})

// ============================================================================
// handleResolveTutor Tests
// ============================================================================

describe('handleResolveTutor', () => {
  const mockShuffle = <T>(arr: T[]): T[] => arr // Identity function for testing

  it('moves_selected_cards_to_hand', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    draft.combat!.drawPile = [card1, card2]
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [card1, card2],
      sourceIndices: [0, 1],
      from: 'drawPile',
      maxSelect: 2,
      destination: 'hand',
    }

    // Act
    handleResolveTutor(draft, [card1.uid, card2.uid], mockShuffle)

    // Assert
    expect(draft.combat!.hand).toHaveLength(2)
    expect(draft.combat!.hand).toContainEqual(card1)
    expect(draft.combat!.hand).toContainEqual(card2)
    expect(draft.combat!.drawPile).toHaveLength(0)
  })

  it('moves_cards_to_top_of_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    const remaining = createCard('bash')
    draft.combat!.discardPile = [card1, remaining, card2]
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [card1, card2],
      sourceIndices: [0, 2],
      from: 'discardPile',
      maxSelect: 1,
      destination: 'drawPile',
      position: 'top',
    }

    // Act
    handleResolveTutor(draft, [card1.uid], mockShuffle)

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(1)
    expect(draft.combat!.drawPile[0].uid).toBe(card1.uid)
    expect(draft.combat!.discardPile).toHaveLength(2)
  })

  it('moves_cards_to_bottom_of_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const existing = createCard('existing')
    const tutored = createCard('tutored')
    draft.combat!.drawPile = [existing]
    draft.combat!.discardPile = [tutored]
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [tutored],
      sourceIndices: [0],
      from: 'discardPile',
      maxSelect: 1,
      destination: 'drawPile',
      position: 'bottom',
    }

    // Act
    handleResolveTutor(draft, [tutored.uid], mockShuffle)

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(2)
    expect(draft.combat!.drawPile[0].uid).toBe(tutored.uid) // Bottom
    expect(draft.combat!.drawPile[1].uid).toBe(existing.uid) // Top
  })

  it('shuffles_draw_pile_when_requested', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.drawPile = [createCard('defend'), createCard('bash')]
    draft.combat!.discardPile = [card]
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [card],
      sourceIndices: [0],
      from: 'discardPile',
      maxSelect: 1,
      destination: 'drawPile',
      position: 'top',
      shuffle: true,
    }

    let shuffleCalled = false
    const trackingShuffle = <T>(arr: T[]): T[] => {
      shuffleCalled = true
      return arr
    }

    // Act
    handleResolveTutor(draft, [card.uid], trackingShuffle)

    // Assert
    expect(shuffleCalled).toBe(true)
  })

  it('removes_cards_from_source_pile', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    const card3 = createCard('bash')
    draft.combat!.drawPile = [card1, card2, card3]
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [card1, card3],
      sourceIndices: [0, 2],
      from: 'drawPile',
      maxSelect: 2,
      destination: 'hand',
    }

    // Act
    handleResolveTutor(draft, [card1.uid], mockShuffle)

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(2)
    expect(draft.combat!.drawPile).toContainEqual(card2)
    expect(draft.combat!.drawPile).toContainEqual(card3)
  })

  it('clears_pending_selection', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.drawPile = [card]
    draft.combat!.pendingSelection = {
      type: 'tutor',
      cards: [card],
      sourceIndices: [0],
      from: 'drawPile',
      maxSelect: 1,
      destination: 'hand',
    }

    // Act
    handleResolveTutor(draft, [card.uid], mockShuffle)

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_no_pending_selection', () => {
    // Arrange
    const draft = createRunState()

    // Act
    handleResolveTutor(draft, ['uid'], mockShuffle)

    // Assert
    expect(draft.combat!.hand).toHaveLength(0)
  })

  it('does_nothing_when_pending_type_not_tutor', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [createCard('strike')],
    }

    // Act
    handleResolveTutor(draft, ['uid'], mockShuffle)

    // Assert
    expect(draft.combat!.pendingSelection).toBeDefined()
  })
})

// ============================================================================
// handleResolveDiscover Tests
// ============================================================================

describe('handleResolveDiscover', () => {
  it('adds_selected_card_to_hand', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
        { id: 'defend', name: 'Defend', description: 'Gain 5 Block.', energy: 1, theme: 'skill', target: 'self', effects: [] },
      ],
      maxSelect: 1,
      destination: 'hand',
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.hand).toHaveLength(1)
    expect(draft.combat!.hand[0].definitionId).toBe('strike')
    expect(draft.combat!.hand[0].upgraded).toBe(false)
  })

  it('adds_selected_card_to_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'bash', name: 'Bash', description: 'Deal 8 damage. Apply 2 Vulnerable.', energy: 2, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'drawPile',
    }

    // Act
    handleResolveDiscover(draft, ['bash'])

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(1)
    expect(draft.combat!.drawPile[0].definitionId).toBe('bash')
  })

  it('adds_selected_card_to_discard_pile', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'discardPile',
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.discardPile).toHaveLength(1)
    expect(draft.combat!.discardPile[0].definitionId).toBe('strike')
  })

  it('adds_multiple_copies_when_specified', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'hand',
      copies: 3,
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.hand).toHaveLength(3)
    expect(draft.combat!.hand.every(c => c.definitionId === 'strike')).toBe(true)
  })

  it('generates_unique_uids_for_each_copy', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'hand',
      copies: 2,
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    const uids = draft.combat!.hand.map(c => c.uid)
    expect(new Set(uids).size).toBe(2) // All unique
  })

  it('emits_visual_event_for_added_cards', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'hand',
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.visualQueue.some(v => v.type === 'addCard')).toBe(true)
  })

  it('ignores_card_not_in_choices', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'hand',
    }

    // Act
    handleResolveDiscover(draft, ['defend']) // Not in choices

    // Assert
    expect(draft.combat!.hand).toHaveLength(0)
  })

  it('clears_pending_selection', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'discover',
      cards: [
        { id: 'strike', name: 'Strike', description: 'Deal 6 damage.', energy: 1, theme: 'attack', target: 'enemy', effects: [] },
      ],
      maxSelect: 1,
      destination: 'hand',
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_no_pending_selection', () => {
    // Arrange
    const draft = createRunState()

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.hand).toHaveLength(0)
  })

  it('does_nothing_when_pending_type_not_discover', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [createCard('strike')],
    }

    // Act
    handleResolveDiscover(draft, ['strike'])

    // Assert
    expect(draft.combat!.pendingSelection).toBeDefined()
  })
})

// ============================================================================
// handleResolveBanish Tests
// ============================================================================

describe('handleResolveBanish', () => {
  it('removes_selected_cards_from_hand', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    const card3 = createCard('bash')
    draft.combat!.hand = [card1, card2, card3]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card1, card2, card3],
      from: 'hand',
      maxSelect: 2,
    }

    // Act
    handleResolveBanish(draft, [card1.uid, card3.uid])

    // Assert
    expect(draft.combat!.hand).toHaveLength(1)
    expect(draft.combat!.hand[0].uid).toBe(card2.uid)
  })

  it('removes_cards_from_draw_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.drawPile = [card, createCard('defend')]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card],
      from: 'drawPile',
      maxSelect: 1,
    }

    // Act
    handleResolveBanish(draft, [card.uid])

    // Assert
    expect(draft.combat!.drawPile).toHaveLength(1)
    expect(draft.combat!.drawPile.some(c => c.uid === card.uid)).toBe(false)
  })

  it('removes_cards_from_discard_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('defend')
    draft.combat!.discardPile = [card]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card],
      from: 'discardPile',
      maxSelect: 1,
    }

    // Act
    handleResolveBanish(draft, [card.uid])

    // Assert
    expect(draft.combat!.discardPile).toHaveLength(0)
  })

  it('removes_cards_from_exhaust_pile', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('bash')
    draft.combat!.exhaustPile = [card]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card],
      from: 'exhaustPile',
      maxSelect: 1,
    }

    // Act
    handleResolveBanish(draft, [card.uid])

    // Assert
    expect(draft.combat!.exhaustPile).toHaveLength(0)
  })

  it('emits_visual_event_for_banished_cards', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.hand = [card]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card],
      from: 'hand',
      maxSelect: 1,
    }

    // Act
    handleResolveBanish(draft, [card.uid])

    // Assert
    expect(draft.combat!.visualQueue.some(v => v.type === 'banish')).toBe(true)
    const banishEvent = draft.combat!.visualQueue.find(v => v.type === 'banish')
    if (banishEvent && banishEvent.type === 'banish') {
      expect(banishEvent.cardUids).toContain(card.uid)
    }
  })

  it('clears_pending_selection', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.hand = [card]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card],
      from: 'hand',
      maxSelect: 1,
    }

    // Act
    handleResolveBanish(draft, [card.uid])

    // Assert
    expect(draft.combat!.pendingSelection).toBeUndefined()
  })

  it('does_nothing_when_no_pending_selection', () => {
    // Arrange
    const draft = createRunState()
    const card = createCard('strike')
    draft.combat!.hand = [card]

    // Act
    handleResolveBanish(draft, [card.uid])

    // Assert
    expect(draft.combat!.hand).toHaveLength(1)
  })

  it('does_nothing_when_pending_type_not_banish', () => {
    // Arrange
    const draft = createRunState()
    draft.combat!.pendingSelection = {
      type: 'scry',
      cards: [createCard('strike')],
    }

    // Act
    handleResolveBanish(draft, ['uid'])

    // Assert
    expect(draft.combat!.pendingSelection).toBeDefined()
  })

  it('handles_banishing_multiple_cards', () => {
    // Arrange
    const draft = createRunState()
    const card1 = createCard('strike')
    const card2 = createCard('defend')
    const card3 = createCard('bash')
    draft.combat!.hand = [card1, card2, card3]
    draft.combat!.pendingSelection = {
      type: 'banish',
      cards: [card1, card2, card3],
      from: 'hand',
      maxSelect: 3,
    }

    // Act
    handleResolveBanish(draft, [card1.uid, card2.uid, card3.uid])

    // Assert
    expect(draft.combat!.hand).toHaveLength(0)
  })
})
