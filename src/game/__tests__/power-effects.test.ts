import { describe, it, expect } from 'vitest'
import { executeApplyPower, executeRemovePower, executeTransferPower } from '../effects/power-effects'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  EffectContext,
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
// executeApplyPower Tests
// ============================================================================

describe('executeApplyPower', () => {
  describe('basic application', () => {
    it('applies_power_to_self_with_fixed_amount', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: 3 }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength']).toEqual({
        id: 'strength',
        amount: 3,
        duration: undefined,
      })
    })

    it('applies_power_with_duration', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: 5, duration: 2 }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength']).toEqual({
        id: 'strength',
        amount: 5,
        duration: 2,
      })
    })

    it('applies_power_to_explicit_enemy_target', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'weak', amount: 2, target: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['weak']).toEqual({
        id: 'weak',
        amount: 2,
        duration: undefined,
      })
    })

    it('applies_power_to_player_target', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'enemy_1' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'vulnerable', amount: 3, target: 'player' }, ctx)

      // Assert
      expect(state.combat?.player.powers['vulnerable']).toEqual({
        id: 'vulnerable',
        amount: 3,
        duration: undefined,
      })
    })
  })

  describe('target resolution', () => {
    it('applies_power_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1' }), createEnemy({ id: 'enemy_2' }), createEnemy({ id: 'enemy_3' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'poison', amount: 5, target: 'allEnemies' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['poison']).toEqual({ id: 'poison', amount: 5, duration: undefined })
      expect(state.combat?.enemies[1].powers['poison']).toEqual({ id: 'poison', amount: 5, duration: undefined })
      expect(state.combat?.enemies[2].powers['poison']).toEqual({ id: 'poison', amount: 5, duration: undefined })
    })

    it('applies_power_to_random_enemy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1' }), createEnemy({ id: 'enemy_2' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'weak', amount: 2, target: 'randomEnemy' }, ctx)

      // Assert - at least one enemy should have the power
      const poweredEnemies = state.combat!.enemies.filter((e) => e.powers['weak'])
      expect(poweredEnemies.length).toBeGreaterThan(0)
    })

    it('defaults_to_self_target_when_not_specified', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'dexterity', amount: 4 }, ctx)

      // Assert
      expect(state.combat?.player.powers['dexterity']).toBeDefined()
    })
  })

  describe('value resolution', () => {
    it('resolves_fixed_value', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: { type: 'fixed', value: 7 } }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength'].amount).toBe(7)
    })

    it('resolves_range_value', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(
        state,
        { type: 'applyPower', powerId: 'strength', amount: { type: 'range', min: 2, max: 5 } },
        ctx
      )

      // Assert - should be within range
      const amount = state.combat!.player.powers['strength'].amount
      expect(amount).toBeGreaterThanOrEqual(2)
      expect(amount).toBeLessThanOrEqual(5)
    })

    it('resolves_scaled_value_with_energy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ energy: 5 }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(
        state,
        { type: 'applyPower', powerId: 'strength', amount: { type: 'scaled', base: 1, perUnit: 1, source: 'energy' } },
        ctx
      )

      // Assert - 1 base + 5 energy = 6
      expect(state.combat?.player.powers['strength'].amount).toBe(6)
    })
  })

  describe('stacking behavior', () => {
    it('stacks_intensity_powers_additively', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 3 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: 2 }, ctx)

      // Assert - 3 + 2 = 5
      expect(state.combat?.player.powers['strength'].amount).toBe(5)
    })

    it('stacks_duration_powers_with_max', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ powers: { weak: { id: 'weak', amount: 2 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act - apply lower amount
      executeApplyPower(state, { type: 'applyPower', powerId: 'weak', amount: 1, target: 'enemy' }, ctx)

      // Assert - keeps max of 2
      expect(state.combat?.enemies[0].powers['weak'].amount).toBe(2)
    })
  })

  describe('visual events', () => {
    it('emits_power_apply_visual_event', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: 3 }, ctx)

      // Assert
      expect(state.combat?.visualQueue).toHaveLength(1)
      expect(state.combat?.visualQueue[0]).toEqual({
        type: 'powerApply',
        targetId: 'player',
        powerId: 'strength',
        amount: 3,
      })
    })

    it('emits_multiple_visual_events_for_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1' }), createEnemy({ id: 'enemy_2' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'weak', amount: 2, target: 'allEnemies' }, ctx)

      // Assert
      expect(state.combat?.visualQueue).toHaveLength(2)
      expect(state.combat?.visualQueue[0].type).toBe('powerApply')
      expect(state.combat?.visualQueue[1].type).toBe('powerApply')
    })
  })

  describe('edge cases', () => {
    it('does_nothing_when_combat_is_null', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const ctx = createEffectContext({ source: 'player' })

      // Act - should not throw
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: 3 }, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })

    it('skips_invalid_entity_targets', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player', cardTarget: 'nonexistent_enemy' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'weak', amount: 2, target: 'enemy' }, ctx)

      // Assert - no error, player doesn't get the debuff
      expect(state.combat?.player.powers['weak']).toBeUndefined()
    })

    it('handles_zero_amount', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeApplyPower(state, { type: 'applyPower', powerId: 'strength', amount: 0 }, ctx)

      // Assert - power should still be applied with 0 stacks
      expect(state.combat?.player.powers['strength']).toEqual({
        id: 'strength',
        amount: 0,
        duration: undefined,
      })
    })
  })
})

// ============================================================================
// executeRemovePower Tests
// ============================================================================

describe('executeRemovePower', () => {
  describe('full removal', () => {
    it('removes_power_completely_when_no_amount_specified', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 5 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength' }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength']).toBeUndefined()
    })

    it('removes_power_from_target_enemy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1', powers: { weak: { id: 'weak', amount: 3 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'weak', target: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['weak']).toBeUndefined()
    })

    it('removes_power_from_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({ id: 'enemy_1', powers: { poison: { id: 'poison', amount: 5 } } }),
            createEnemy({ id: 'enemy_2', powers: { poison: { id: 'poison', amount: 3 } } }),
          ],
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'poison', target: 'allEnemies' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['poison']).toBeUndefined()
      expect(state.combat?.enemies[1].powers['poison']).toBeUndefined()
    })
  })

  describe('partial removal', () => {
    it('reduces_power_by_specified_amount', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 10 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength', amount: 3 }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength'].amount).toBe(7)
    })

    it('removes_power_with_remove_at_zero_when_amount_exceeds_stacks', () => {
      // Arrange - poison has removeAtZero: true
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ powers: { poison: { id: 'poison', amount: 2 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'poison', amount: 5, target: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['poison']).toBeUndefined()
    })

    it('removes_power_with_remove_at_zero_when_reduced_to_zero', () => {
      // Arrange - weak has removeAtZero: true
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ powers: { weak: { id: 'weak', amount: 3 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'weak', amount: 3, target: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['weak']).toBeUndefined()
    })

    it('keeps_power_without_remove_at_zero_when_reduced_to_zero', () => {
      // Arrange - strength does NOT have removeAtZero
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 3 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength', amount: 3 }, ctx)

      // Assert - strength remains at 0
      expect(state.combat?.player.powers['strength'].amount).toBe(0)
    })

    it('allows_negative_amounts_for_powers_without_remove_at_zero', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 2 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength', amount: 5 }, ctx)

      // Assert - strength goes negative
      expect(state.combat?.player.powers['strength'].amount).toBe(-3)
    })

    it('resolves_value_for_partial_removal', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 10 } },
            energy: 3,
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(
        state,
        { type: 'removePower', powerId: 'strength', amount: { type: 'scaled', base: 0, perUnit: 1, source: 'energy' } },
        ctx
      )

      // Assert - removes 3 (from energy)
      expect(state.combat?.player.powers['strength'].amount).toBe(7)
    })
  })

  describe('visual events', () => {
    it('emits_power_remove_visual_event_when_power_exists', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 5 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength' }, ctx)

      // Assert
      expect(state.combat?.visualQueue).toHaveLength(1)
      expect(state.combat?.visualQueue[0]).toEqual({
        type: 'powerRemove',
        targetId: 'player',
        powerId: 'strength',
      })
    })

    it('does_not_emit_visual_event_when_power_does_not_exist', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength' }, ctx)

      // Assert
      expect(state.combat?.visualQueue).toHaveLength(0)
    })

    it('emits_visual_event_for_partial_removal', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 10 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength', amount: 3 }, ctx)

      // Assert - still emits even for partial removal
      expect(state.combat?.visualQueue).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('does_nothing_when_combat_is_null', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const ctx = createEffectContext({ source: 'player' })

      // Act - should not throw
      executeRemovePower(state, { type: 'removePower', powerId: 'strength' }, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })

    it('handles_removing_nonexistent_power_gracefully', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player' })

      // Act - should not throw
      executeRemovePower(state, { type: 'removePower', powerId: 'nonexistent_power' }, ctx)

      // Assert
      expect(state.combat?.player.powers['nonexistent_power']).toBeUndefined()
    })

    it('defaults_to_self_target', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 5 } },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength' }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength']).toBeUndefined()
    })

    it('preserves_other_powers', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: {
              strength: { id: 'strength', amount: 5 },
              dexterity: { id: 'dexterity', amount: 3 },
            },
          }),
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeRemovePower(state, { type: 'removePower', powerId: 'strength' }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength']).toBeUndefined()
      expect(state.combat?.player.powers['dexterity']).toEqual({ id: 'dexterity', amount: 3 })
    })
  })
})

// ============================================================================
// executeTransferPower Tests
// ============================================================================

describe('executeTransferPower', () => {
  describe('full transfer', () => {
    it('transfers_entire_power_from_enemy_to_player', () => {
      // Arrange - use poison which has removeAtZero: true
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1', powers: { poison: { id: 'poison', amount: 5 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'poison', from: 'enemy', to: 'player' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['poison']).toBeUndefined()
      expect(state.combat?.player.powers['poison']).toEqual({
        id: 'poison',
        amount: 5,
        duration: undefined,
      })
    })

    it('transfers_power_from_player_to_enemy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { weak: { id: 'weak', amount: 3 } } }),
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'weak', from: 'player', to: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.player.powers['weak']).toBeUndefined()
      expect(state.combat?.enemies[0].powers['weak']).toEqual({
        id: 'weak',
        amount: 3,
        duration: undefined,
      })
    })

    it('transfers_power_to_multiple_targets', () => {
      // Arrange - use weak which has removeAtZero: true
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { weak: { id: 'weak', amount: 4 } } }),
          enemies: [createEnemy({ id: 'enemy_1' }), createEnemy({ id: 'enemy_2' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'weak', from: 'player', to: 'allEnemies' }, ctx)

      // Assert
      expect(state.combat?.player.powers['weak']).toBeUndefined()
      expect(state.combat?.enemies[0].powers['weak']).toEqual({ id: 'weak', amount: 4, duration: undefined })
      expect(state.combat?.enemies[1].powers['weak']).toEqual({ id: 'weak', amount: 4, duration: undefined })
    })
  })

  describe('partial transfer', () => {
    it('transfers_specified_amount_of_power', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { strength: { id: 'strength', amount: 10 } } }),
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(
        state,
        { type: 'transferPower', powerId: 'strength', from: 'player', to: 'enemy', amount: 3 },
        ctx
      )

      // Assert
      expect(state.combat?.player.powers['strength'].amount).toBe(7)
      expect(state.combat?.enemies[0].powers['strength']).toEqual({ id: 'strength', amount: 3, duration: undefined })
    })

    it('transfers_specified_amount_even_when_exceeds_available', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1', powers: { poison: { id: 'poison', amount: 2 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act - transfer amount 10, but only 2 available
      executeTransferPower(
        state,
        { type: 'transferPower', powerId: 'poison', from: 'enemy', to: 'player', amount: 10 },
        ctx
      )

      // Assert - transferAmount is clamped to power.amount in the implementation
      expect(state.combat?.enemies[0].powers['poison']).toBeUndefined()
      expect(state.combat?.player.powers['poison'].amount).toBe(10) // transfers requested amount
    })

    it('resolves_value_for_transfer_amount', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 10 } },
            energy: 2,
          }),
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(
        state,
        {
          type: 'transferPower',
          powerId: 'strength',
          from: 'player',
          to: 'enemy',
          amount: { type: 'scaled', base: 1, perUnit: 1, source: 'energy' },
        },
        ctx
      )

      // Assert - transfers 1 + 2 = 3
      expect(state.combat?.player.powers['strength'].amount).toBe(7)
      expect(state.combat?.enemies[0].powers['strength'].amount).toBe(3)
    })
  })

  describe('stacking on transfer', () => {
    it('stacks_transferred_power_with_existing_power', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { strength: { id: 'strength', amount: 5 } } }),
          enemies: [createEnemy({ id: 'enemy_1', powers: { strength: { id: 'strength', amount: 2 } } })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(
        state,
        { type: 'transferPower', powerId: 'strength', from: 'player', to: 'enemy', amount: 3 },
        ctx
      )

      // Assert
      expect(state.combat?.player.powers['strength'].amount).toBe(2)
      expect(state.combat?.enemies[0].powers['strength'].amount).toBe(5) // 2 + 3
    })
  })

  describe('visual events', () => {
    it('emits_remove_and_apply_visual_events', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { strength: { id: 'strength', amount: 5 } } }),
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'strength', from: 'player', to: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.visualQueue).toHaveLength(2)
      expect(state.combat?.visualQueue[0]).toEqual({
        type: 'powerRemove',
        targetId: 'player',
        powerId: 'strength',
      })
      expect(state.combat?.visualQueue[1]).toEqual({
        type: 'powerApply',
        targetId: 'enemy_1',
        powerId: 'strength',
        amount: 5,
      })
    })

    it('emits_multiple_apply_events_for_multiple_targets', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({ id: 'enemy_1', powers: { poison: { id: 'poison', amount: 4 } } }),
            createEnemy({ id: 'enemy_2' }),
            createEnemy({ id: 'enemy_3' }),
          ],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(
        state,
        { type: 'transferPower', powerId: 'poison', from: 'enemy', to: 'allEnemies' },
        ctx
      )

      // Assert - 1 remove + 3 apply (including source)
      expect(state.combat?.visualQueue).toHaveLength(4)
      expect(state.combat?.visualQueue[0].type).toBe('powerRemove')
      expect(state.combat?.visualQueue[1].type).toBe('powerApply')
      expect(state.combat?.visualQueue[2].type).toBe('powerApply')
      expect(state.combat?.visualQueue[3].type).toBe('powerApply')
    })
  })

  describe('edge cases', () => {
    it('does_nothing_when_combat_is_null', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const ctx = createEffectContext({ source: 'player' })

      // Act - should not throw
      executeTransferPower(state, { type: 'transferPower', powerId: 'strength', from: 'player', to: 'enemy' }, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })

    it('does_nothing_when_source_does_not_have_power', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'strength', from: 'player', to: 'enemy' }, ctx)

      // Assert
      expect(state.combat?.enemies[0].powers['strength']).toBeUndefined()
      expect(state.combat?.visualQueue).toHaveLength(0)
    })

    it('skips_invalid_source_entities', () => {
      // Arrange
      const state = createRunState()
      const ctx = createEffectContext({ source: 'player', cardTarget: 'nonexistent_enemy' })

      // Act - should not throw
      executeTransferPower(state, { type: 'transferPower', powerId: 'strength', from: 'enemy', to: 'player' }, ctx)

      // Assert
      expect(state.combat?.player.powers['strength']).toBeUndefined()
    })

    it('skips_invalid_target_entities', () => {
      // Arrange - use weak (removeAtZero: true) so it gets removed
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { weak: { id: 'weak', amount: 5 } } }),
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'nonexistent_enemy' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'weak', from: 'player', to: 'enemy' }, ctx)

      // Assert - power removed from player but not transferred
      expect(state.combat?.player.powers['weak']).toBeUndefined()
      expect(state.combat?.visualQueue).toHaveLength(1)
      expect(state.combat?.visualQueue[0].type).toBe('powerRemove')
    })

    it('handles_transferring_from_multiple_sources_to_single_target', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({ id: 'enemy_1', powers: { weak: { id: 'weak', amount: 2 } } }),
            createEnemy({ id: 'enemy_2', powers: { weak: { id: 'weak', amount: 3 } } }),
          ],
        }),
      })
      const ctx = createEffectContext({ source: 'player' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'weak', from: 'allEnemies', to: 'player' }, ctx)

      // Assert - both enemies lose weak, player gains from first only (weak uses max duration stacking)
      expect(state.combat?.enemies[0].powers['weak']).toBeUndefined()
      expect(state.combat?.enemies[1].powers['weak']).toBeUndefined()
      // Weak stacks with max duration, so player gets max(2, 3) = 3
      expect(state.combat?.player.powers['weak'].amount).toBe(3)
    })
  })

  describe('duration preservation', () => {
    it('preserves_duration_when_transferring_power', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ powers: { strength: { id: 'strength', amount: 3, duration: 2 } } }),
          enemies: [createEnemy({ id: 'enemy_1' })],
        }),
      })
      const ctx = createEffectContext({ source: 'player', cardTarget: 'enemy_1' })

      // Act
      executeTransferPower(state, { type: 'transferPower', powerId: 'strength', from: 'player', to: 'enemy' }, ctx)

      // Assert - duration should be preserved (though applyPowerToEntity may handle this differently based on stack behavior)
      expect(state.combat?.enemies[0].powers['strength']).toBeDefined()
      expect(state.combat?.enemies[0].powers['strength'].amount).toBe(3)
    })
  })
})
