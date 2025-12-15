import { describe, it, expect } from 'vitest'
import {
  canUseActivatedAbility,
  canUseUltimateAbility,
  handleUseActivatedAbility,
  handleUseUltimateAbility,
} from '../handlers/hero'
import { chargeHeroUltimate, handleStartTurn, handleEndTurn } from '../handlers/turns'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
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
    heroCardId: 'hero_ironclad',
    activatedUsedThisTurn: false,
    ultimateCharges: 0,
    ultimateReady: false,
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
// canUseActivatedAbility Tests
// ============================================================================

describe('canUseActivatedAbility', () => {
  it('returns_false_when_no_combat', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act
    const result = canUseActivatedAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_false_when_no_heroCardId', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ heroCardId: undefined }),
      }),
    })

    // Act
    const result = canUseActivatedAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_false_when_already_used_this_turn', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ activatedUsedThisTurn: true }),
      }),
    })

    // Act
    const result = canUseActivatedAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_false_when_insufficient_energy', () => {
    // Arrange - hero_ironclad activated costs 1 energy
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ energy: 0 }),
      }),
    })

    // Act
    const result = canUseActivatedAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_true_when_can_use_ability', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          activatedUsedThisTurn: false,
          energy: 3,
        }),
      }),
    })

    // Act
    const result = canUseActivatedAbility(state)

    // Assert
    expect(result).toBe(true)
  })
})

// ============================================================================
// canUseUltimateAbility Tests
// ============================================================================

describe('canUseUltimateAbility', () => {
  it('returns_false_when_no_combat', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act
    const result = canUseUltimateAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_false_when_no_heroCardId', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ heroCardId: undefined }),
      }),
    })

    // Act
    const result = canUseUltimateAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_false_when_ultimate_not_ready', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({ ultimateReady: false }),
      }),
    })

    // Act
    const result = canUseUltimateAbility(state)

    // Assert
    expect(result).toBe(false)
  })

  it('returns_true_when_ultimate_ready', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
        }),
      }),
    })

    // Act
    const result = canUseUltimateAbility(state)

    // Assert
    expect(result).toBe(true)
  })
})

// ============================================================================
// handleUseActivatedAbility Tests
// ============================================================================

describe('handleUseActivatedAbility', () => {
  it('does_nothing_when_no_combat', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat).toBeNull()
  })

  it('does_nothing_when_already_used', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          activatedUsedThisTurn: true,
          energy: 3,
        }),
      }),
    })
    const originalEnergy = state.combat!.player.energy

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.player.energy).toBe(originalEnergy)
  })

  it('does_nothing_when_insufficient_energy', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          energy: 0,
          activatedUsedThisTurn: false,
        }),
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.player.activatedUsedThisTurn).toBe(false)
  })

  it('spends_energy_when_used', () => {
    // Arrange - hero_ironclad activated costs 1 energy
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          energy: 3,
          activatedUsedThisTurn: false,
        }),
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.player.energy).toBe(2)
  })

  it('marks_ability_as_used', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          energy: 3,
          activatedUsedThisTurn: false,
        }),
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.player.activatedUsedThisTurn).toBe(true)
  })

  it('emits_visual_event', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          energy: 3,
          activatedUsedThisTurn: false,
        }),
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    const visualEvent = state.combat!.visualQueue.find(
      (v) => v.type === 'heroActivated'
    )
    expect(visualEvent).toBeDefined()
  })
})

// ============================================================================
// handleUseUltimateAbility Tests
// ============================================================================

describe('handleUseUltimateAbility', () => {
  it('does_nothing_when_no_combat', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act
    handleUseUltimateAbility(state)

    // Assert
    expect(state.combat).toBeNull()
  })

  it('does_nothing_when_ultimate_not_ready', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          ultimateReady: false,
          ultimateCharges: 3,
        }),
      }),
    })

    // Act
    handleUseUltimateAbility(state)

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(3) // Unchanged
  })

  it('resets_charges_when_used', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
          ultimateCharges: 5,
        }),
      }),
    })

    // Act
    handleUseUltimateAbility(state)

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(0)
  })

  it('sets_ultimate_not_ready', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
          ultimateCharges: 5,
        }),
      }),
    })

    // Act
    handleUseUltimateAbility(state)

    // Assert
    expect(state.combat!.player.ultimateReady).toBe(false)
  })

  it('emits_visual_event', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
          ultimateCharges: 5,
        }),
      }),
    })

    // Act
    handleUseUltimateAbility(state)

    // Assert
    const visualEvent = state.combat!.visualQueue.find(
      (v) => v.type === 'heroUltimate'
    )
    expect(visualEvent).toBeDefined()
  })
})

// ============================================================================
// Effect Execution Tests - Ironclad
// ============================================================================

describe('Ironclad ability effects', () => {
  describe('activated ability', () => {
    it('grants_5_block_to_player', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            energy: 3,
            block: 0,
            activatedUsedThisTurn: false,
          }),
        }),
      })

      // Act
      handleUseActivatedAbility(state)

      // Assert
      expect(state.combat!.player.block).toBe(5)
    })

    it('stacks_block_with_existing', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            energy: 3,
            block: 10,
            activatedUsedThisTurn: false,
          }),
        }),
      })

      // Act
      handleUseActivatedAbility(state)

      // Assert
      expect(state.combat!.player.block).toBe(15)
    })
  })

  describe('ultimate ability', () => {
    it('deals_20_damage_to_single_enemy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            ultimateReady: true,
          }),
          enemies: [createEnemy({ currentHealth: 50 })],
        }),
      })

      // Act
      handleUseUltimateAbility(state)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(30)
    })

    it('deals_20_damage_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            ultimateReady: true,
          }),
          enemies: [
            createEnemy({ id: 'enemy_1', currentHealth: 50 }),
            createEnemy({ id: 'enemy_2', currentHealth: 40 }),
            createEnemy({ id: 'enemy_3', currentHealth: 60 }),
          ],
        }),
      })

      // Act
      handleUseUltimateAbility(state)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(30)
      expect(state.combat!.enemies[1].currentHealth).toBe(20)
      expect(state.combat!.enemies[2].currentHealth).toBe(40)
    })

    it('damage_reduced_by_enemy_block', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            ultimateReady: true,
          }),
          enemies: [createEnemy({ currentHealth: 50, block: 10 })],
        }),
      })

      // Act
      handleUseUltimateAbility(state)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(40) // 50 - (20-10)
      expect(state.combat!.enemies[0].block).toBe(0)
    })
  })
})

// ============================================================================
// Effect Execution Tests - Pyromancer
// ============================================================================

describe('Pyromancer ability effects', () => {
  describe('activated ability', () => {
    it('deals_8_damage_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_pyromancer',
            energy: 3,
            activatedUsedThisTurn: false,
          }),
          enemies: [
            createEnemy({ id: 'enemy_1', currentHealth: 50 }),
            createEnemy({ id: 'enemy_2', currentHealth: 40 }),
          ],
        }),
      })

      // Act
      handleUseActivatedAbility(state)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(42)
      expect(state.combat!.enemies[1].currentHealth).toBe(32)
    })

    it('costs_2_energy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_pyromancer',
            energy: 3,
            activatedUsedThisTurn: false,
          }),
        }),
      })

      // Act
      handleUseActivatedAbility(state)

      // Assert
      expect(state.combat!.player.energy).toBe(1)
    })

    it('fails_with_only_1_energy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_pyromancer',
            energy: 1,
            activatedUsedThisTurn: false,
          }),
          enemies: [createEnemy({ currentHealth: 50 })],
        }),
      })

      // Act
      handleUseActivatedAbility(state)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(50) // Unchanged
      expect(state.combat!.player.activatedUsedThisTurn).toBe(false)
    })
  })

  describe('ultimate ability', () => {
    it('deals_25_damage_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_pyromancer',
            ultimateReady: true,
          }),
          enemies: [
            createEnemy({ id: 'enemy_1', currentHealth: 50 }),
            createEnemy({ id: 'enemy_2', currentHealth: 40 }),
          ],
        }),
      })

      // Act
      handleUseUltimateAbility(state)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(25)
      expect(state.combat!.enemies[1].currentHealth).toBe(15)
    })

    it('applies_burning_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_pyromancer',
            ultimateReady: true,
          }),
          enemies: [
            createEnemy({ id: 'enemy_1', powers: {} }),
            createEnemy({ id: 'enemy_2', powers: {} }),
          ],
        }),
      })

      // Act
      handleUseUltimateAbility(state)

      // Assert - 25 fire damage applies 25 burning + 5 explicit = 30
      expect(state.combat!.enemies[0].powers['burning'].amount).toBe(30)
      expect(state.combat!.enemies[1].powers['burning'].amount).toBe(30)
    })

    it('stacks_burning_with_existing', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            heroCardId: 'hero_pyromancer',
            ultimateReady: true,
          }),
          enemies: [createEnemy({ powers: { burning: { id: 'burning', amount: 3 } } })],
        }),
      })

      // Act
      handleUseUltimateAbility(state)

      // Assert - 3 existing + 25 (fire damage) + 5 (explicit) = 33
      expect(state.combat!.enemies[0].powers['burning'].amount).toBe(33)
    })
  })
})

// ============================================================================
// chargeHeroUltimate Tests
// ============================================================================

describe('chargeHeroUltimate', () => {
  it('increments_charges_on_matching_event', () => {
    // Arrange - Ironclad charges on turnStart
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateCharges: 0,
          ultimateReady: false,
        }),
      }),
    })

    // Act
    chargeHeroUltimate(state, 'turnStart')

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(1)
  })

  it('does_not_charge_on_mismatched_event', () => {
    // Arrange - Ironclad charges on turnStart, not cardPlayed
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateCharges: 0,
          ultimateReady: false,
        }),
      }),
    })

    // Act
    chargeHeroUltimate(state, 'cardPlayed')

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(0)
  })

  it('sets_ultimateReady_at_threshold', () => {
    // Arrange - Ironclad needs 4 charges
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateCharges: 3,
          ultimateReady: false,
        }),
      }),
    })

    // Act
    chargeHeroUltimate(state, 'turnStart')

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(4)
    expect(state.combat!.player.ultimateReady).toBe(true)
  })

  it('does_not_charge_when_already_ready', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateCharges: 4,
          ultimateReady: true,
        }),
      }),
    })

    // Act
    chargeHeroUltimate(state, 'turnStart')

    // Assert - stays at 4, doesn't overflow
    expect(state.combat!.player.ultimateCharges).toBe(4)
  })

  it('does_nothing_without_combat', () => {
    // Arrange
    const state = createRunState({ combat: null })

    // Act - should not throw
    chargeHeroUltimate(state, 'turnStart')

    // Assert
    expect(state.combat).toBeNull()
  })

  it('pyromancer_charges_on_cardPlayed', () => {
    // Arrange - Pyromancer charges on cardPlayed
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_pyromancer',
          ultimateCharges: 2,
          ultimateReady: false,
        }),
      }),
    })

    // Act
    chargeHeroUltimate(state, 'cardPlayed')

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(3)
  })

  it('emits_visual_event_when_ultimate_becomes_ready', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateCharges: 3,
          ultimateReady: false,
        }),
      }),
    })

    // Act
    chargeHeroUltimate(state, 'turnStart')

    // Assert
    const readyEvent = state.combat!.visualQueue.find(
      (e) => e.type === 'heroUltimateReady'
    )
    expect(readyEvent).toBeDefined()
  })
})

// ============================================================================
// Edge Cases - Energy Thresholds
// ============================================================================

describe('exact energy thresholds', () => {
  it('ironclad_succeeds_with_exactly_1_energy', () => {
    // Arrange - Ironclad activated costs 1 energy
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          energy: 1,
          block: 0,
          activatedUsedThisTurn: false,
        }),
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.player.block).toBe(5)
    expect(state.combat!.player.energy).toBe(0)
  })

  it('pyromancer_succeeds_with_exactly_2_energy', () => {
    // Arrange - Pyromancer activated costs 2 energy
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_pyromancer',
          energy: 2,
          activatedUsedThisTurn: false,
        }),
        enemies: [createEnemy({ currentHealth: 50 })],
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.enemies[0].currentHealth).toBe(42) // 50 - 8
    expect(state.combat!.player.energy).toBe(0)
  })
})

// ============================================================================
// Edge Cases - No Enemies
// ============================================================================

describe('abilities with no enemies', () => {
  it('ironclad_activated_works_without_enemies', () => {
    // Arrange - block ability doesn't need enemies
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          energy: 3,
          block: 0,
          activatedUsedThisTurn: false,
        }),
        enemies: [],
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert
    expect(state.combat!.player.block).toBe(5)
    expect(state.combat!.player.activatedUsedThisTurn).toBe(true)
  })

  it('ironclad_ultimate_with_no_enemies_completes', () => {
    // Arrange - AoE damage with empty target list
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
          ultimateCharges: 4,
        }),
        enemies: [],
      }),
    })

    // Act
    handleUseUltimateAbility(state)

    // Assert - should complete without error, resetting state
    expect(state.combat!.player.ultimateReady).toBe(false)
    expect(state.combat!.player.ultimateCharges).toBe(0)
  })

  it('pyromancer_activated_with_no_enemies_completes', () => {
    // Arrange - AoE fire damage with no targets
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_pyromancer',
          energy: 3,
          activatedUsedThisTurn: false,
        }),
        enemies: [],
      }),
    })

    // Act
    handleUseActivatedAbility(state)

    // Assert - should deduct energy and mark used
    expect(state.combat!.player.energy).toBe(1)
    expect(state.combat!.player.activatedUsedThisTurn).toBe(true)
  })
})

// ============================================================================
// Edge Cases - Ultimate Reset
// ============================================================================

describe('ultimate state reset', () => {
  it('resets_charges_to_zero_after_use', () => {
    // Arrange
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
          ultimateCharges: 4,
        }),
        enemies: [createEnemy()],
      }),
    })

    // Act
    handleUseUltimateAbility(state)

    // Assert
    expect(state.combat!.player.ultimateCharges).toBe(0)
    expect(state.combat!.player.ultimateReady).toBe(false)
  })

  it('can_recharge_after_use', () => {
    // Arrange - use ultimate then charge again
    const state = createRunState({
      combat: createCombat({
        player: createPlayer({
          heroCardId: 'hero_ironclad',
          ultimateReady: true,
          ultimateCharges: 4,
        }),
        enemies: [createEnemy()],
      }),
    })

    // Act
    handleUseUltimateAbility(state)
    chargeHeroUltimate(state, 'turnStart')

    // Assert - should start accumulating again
    expect(state.combat!.player.ultimateCharges).toBe(1)
    expect(state.combat!.player.ultimateReady).toBe(false)
  })
})

// ============================================================================
// Integration Tests - Full Turn Cycles
// ============================================================================

describe('integration: multi-turn combat flow', () => {
  describe('Ironclad charge accumulation (turnStart)', () => {
    it('charges_ultimate_over_4_turns', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          turn: 0,
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            ultimateCharges: 0,
            ultimateReady: false,
          }),
          enemies: [createEnemy()],
          drawPile: Array(20).fill({ id: 'strike', definitionId: 'strike' }),
        }),
      })

      // Act - simulate 4 turn starts
      for (let i = 0; i < 4; i++) {
        handleStartTurn(state)
        handleEndTurn(state)
      }

      // Assert
      expect(state.combat!.player.ultimateCharges).toBe(4)
      expect(state.combat!.player.ultimateReady).toBe(true)
    })

    it('full_cycle_charge_use_recharge', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          turn: 0,
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            ultimateCharges: 0,
            ultimateReady: false,
          }),
          enemies: [createEnemy({ currentHealth: 100 })],
          drawPile: Array(30).fill({ id: 'strike', definitionId: 'strike' }),
        }),
      })

      // Act - charge over 4 turns
      for (let i = 0; i < 4; i++) {
        handleStartTurn(state)
        handleEndTurn(state)
      }
      expect(state.combat!.player.ultimateReady).toBe(true)

      // Use ultimate
      handleUseUltimateAbility(state)
      expect(state.combat!.player.ultimateReady).toBe(false)
      expect(state.combat!.player.ultimateCharges).toBe(0)

      // Start recharging
      handleStartTurn(state)
      expect(state.combat!.player.ultimateCharges).toBe(1)
    })
  })

  describe('activated ability turn reset', () => {
    it('resets_activated_ability_each_turn', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          turn: 0,
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            energy: 3,
            block: 0,
            activatedUsedThisTurn: false,
          }),
          enemies: [createEnemy()],
          drawPile: Array(20).fill({ id: 'strike', definitionId: 'strike' }),
        }),
      })

      // Act - Turn 1: use activated
      handleStartTurn(state)
      handleUseActivatedAbility(state)
      expect(state.combat!.player.activatedUsedThisTurn).toBe(true)
      expect(state.combat!.player.block).toBe(5)
      handleEndTurn(state)

      // Turn 2: should be able to use again
      handleStartTurn(state)
      expect(state.combat!.player.activatedUsedThisTurn).toBe(false)
      handleUseActivatedAbility(state)

      // Assert
      expect(state.combat!.player.activatedUsedThisTurn).toBe(true)
      expect(state.combat!.player.block).toBe(5) // Block resets each turn
    })

    it('can_use_activated_multiple_turns_in_a_row', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          turn: 0,
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            energy: 3,
            activatedUsedThisTurn: false,
          }),
          enemies: [createEnemy()],
          drawPile: Array(30).fill({ id: 'strike', definitionId: 'strike' }),
        }),
      })

      let usageCount = 0

      // Act - use activated ability for 3 turns
      for (let i = 0; i < 3; i++) {
        handleStartTurn(state)
        if (canUseActivatedAbility(state)) {
          handleUseActivatedAbility(state)
          usageCount++
        }
        handleEndTurn(state)
      }

      // Assert
      expect(usageCount).toBe(3)
    })
  })

  describe('combined activated and ultimate usage', () => {
    it('can_use_both_abilities_same_turn', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          turn: 0,
          player: createPlayer({
            heroCardId: 'hero_ironclad',
            energy: 3,
            block: 0,
            activatedUsedThisTurn: false,
            ultimateReady: true,
            ultimateCharges: 4,
          }),
          enemies: [createEnemy({ currentHealth: 50 })],
          drawPile: Array(10).fill({ id: 'strike', definitionId: 'strike' }),
        }),
      })

      // Act
      handleStartTurn(state)
      handleUseActivatedAbility(state) // Gain 5 block
      handleUseUltimateAbility(state) // Deal 20 AoE damage

      // Assert
      expect(state.combat!.player.block).toBe(5)
      expect(state.combat!.player.activatedUsedThisTurn).toBe(true)
      expect(state.combat!.player.ultimateReady).toBe(false)
      expect(state.combat!.enemies[0].currentHealth).toBe(30) // 50 - 20
    })
  })
})
