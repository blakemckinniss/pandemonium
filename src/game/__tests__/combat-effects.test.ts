import { describe, it, expect, beforeEach } from 'vitest'
import {
  executeDamage,
  executeBlock,
  executeHeal,
  executeLifesteal,
  executeDestroyBlock,
  executeMaxHealth,
  executeSetHealth,
  setExecuteEffect,
  setExecutePowerTriggers,
} from '../effects/combat-effects'
import type {
  RunState,
  CombatState,
  PlayerEntity,
  EnemyEntity,
  EffectContext,
  AtomicEffect,
  Entity,
} from '../../types'

// ============================================================================
// Test Factories
// ============================================================================

function createPlayer(overrides: Partial<PlayerEntity> = {}): PlayerEntity {
  return {
    id: 'player',
    name: 'Test Player',
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

function createRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    gamePhase: 'combat',
    floor: 1,
    hero: {
      id: 'warrior',
      name: 'Warrior',
      health: 80,
      energy: 3,
      starterDeck: [],
      currentHealth: 80,
      maxHealth: 80,
    },
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
// Setup/Teardown
// ============================================================================

beforeEach(() => {
  // Reset effect execution functions to no-ops for isolation
  setExecuteEffect(() => {})
  setExecutePowerTriggers(() => {})
})

// ============================================================================
// executeDamage Tests
// ============================================================================

describe('executeDamage', () => {
  describe('basic_damage', () => {
    it('deals_damage_to_enemy', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(40)
      expect(state.stats.damageDealt).toBe(10)
    })

    it('deals_damage_to_player', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 15, target: 'player' as const }
      const ctx = createEffectContext({ source: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(state.combat!.player.currentHealth).toBe(65)
      expect(state.stats.damageTaken).toBe(15)
    })

    it('deals_damage_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ id: 'enemy_1' }), createEnemy({ id: 'enemy_2' })],
        }),
      })
      const effect = { type: 'damage' as const, amount: 8, target: 'allEnemies' as const }
      const ctx = createEffectContext()

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(42)
      expect(state.combat!.enemies[1].currentHealth).toBe(42)
      expect(state.stats.damageDealt).toBe(16)
    })
  })

  describe('damage_modifiers', () => {
    it('applies_strength_to_outgoing_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 5 } },
          }),
        }),
      })
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 base + 5 strength = 15
      expect(state.combat!.enemies[0].currentHealth).toBe(35)
    })

    it('applies_weak_to_outgoing_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { weak: { id: 'weak', amount: 2 } },
          }),
        }),
      })
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 * 0.75 = 7.5 -> 7
      expect(state.combat!.enemies[0].currentHealth).toBe(43)
    })

    it('applies_vulnerable_to_incoming_damage', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({
              powers: { vulnerable: { id: 'vulnerable', amount: 2 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 * 1.5 = 15
      expect(state.combat!.enemies[0].currentHealth).toBe(35)
    })

    it('applies_strength_then_vulnerable', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { strength: { id: 'strength', amount: 4 } },
          }),
          enemies: [
            createEnemy({
              powers: { vulnerable: { id: 'vulnerable', amount: 1 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - (10 + 4) * 1.5 = 21
      expect(state.combat!.enemies[0].currentHealth).toBe(29)
    })
  })

  describe('elemental_vulnerabilities', () => {
    it('applies_vulnerability_multiplier_to_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ vulnerabilities: ['fire'] })],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'fire' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 * 1.5 = 15
      expect(state.combat!.enemies[0].currentHealth).toBe(35)
    })

    it('applies_resistance_multiplier_to_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ resistances: ['ice'] })],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'ice' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 * 0.5 = 5
      expect(state.combat!.enemies[0].currentHealth).toBe(45)
    })
  })

  describe('elemental_combos', () => {
    it('triggers_explosion_combo_with_oiled_and_fire', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({
              powers: { oiled: { id: 'oiled', amount: 2 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'fire' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 * 2.0 (explosion) = 20, and oiled removed
      expect(state.combat!.enemies[0].currentHealth).toBe(30)
      expect(state.combat!.enemies[0].powers['oiled']).toBeUndefined()
    })

    it('triggers_conducted_combo_chains_to_all_enemies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({ id: 'enemy_1', powers: { wet: { id: 'wet', amount: 1 } } }),
            createEnemy({ id: 'enemy_2' }),
            createEnemy({ id: 'enemy_3' }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'lightning' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - 10 * 1.5 (conducted) = 15 to enemy_1, then 7 chain to others
      expect(state.combat!.enemies[0].currentHealth).toBe(35)
      expect(state.combat!.enemies[1].currentHealth).toBe(43) // 50 - 7
      expect(state.combat!.enemies[2].currentHealth).toBe(43) // 50 - 7
      expect(state.combat!.enemies[0].powers['wet']).toBeUndefined()
    })

    it('triggers_shatter_execute_below_threshold', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({
              currentHealth: 7, // 7/50 = 14%, below 15% threshold
              powers: { frozen: { id: 'frozen', amount: 1 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 5, element: 'physical' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - Initial damage + execute finishes enemy
      expect(state.combat!.enemies.length).toBe(0)
      expect(state.combat!.phase).toBe('victory')
    })

    it('flash_freeze_applies_frozen_status', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({
              powers: { wet: { id: 'wet', amount: 1 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'ice' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - Wet removed, frozen applied
      expect(state.combat!.enemies[0].powers['wet']).toBeUndefined()
      expect(state.combat!.enemies[0].powers['frozen']).toBeDefined()
      expect(state.combat!.enemies[0].powers['frozen'].amount).toBe(2)
    })
  })

  describe('elemental_status_application', () => {
    it('applies_burning_status_from_fire_damage', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 12, element: 'fire' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - Burning stacks equal damage dealt
      expect(state.combat!.enemies[0].powers['burning']).toBeDefined()
      expect(state.combat!.enemies[0].powers['burning'].amount).toBe(12)
    })

    it('applies_frozen_status_from_ice_damage', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 10, element: 'ice' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - Frozen gets 2 stacks
      expect(state.combat!.enemies[0].powers['frozen']).toBeDefined()
      expect(state.combat!.enemies[0].powers['frozen'].amount).toBe(2)
    })

    it('does_not_apply_status_if_combo_triggered', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({
              powers: { oiled: { id: 'oiled', amount: 1 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'fire' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - No burning applied because explosion combo triggered
      expect(state.combat!.enemies[0].powers['burning']).toBeUndefined()
    })
  })

  describe('piercing_damage', () => {
    it('bypasses_block_when_piercing', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 10 })],
        }),
      })
      const effect = { type: 'damage' as const, amount: 8, piercing: true }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - Block not consumed, health reduced
      expect(state.combat!.enemies[0].block).toBe(10)
      expect(state.combat!.enemies[0].currentHealth).toBe(42)
    })

    it('bypasses_barrier_when_piercing', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ barrier: 10 })],
        }),
      })
      const effect = { type: 'damage' as const, amount: 8, piercing: true }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].barrier).toBe(10)
      expect(state.combat!.enemies[0].currentHealth).toBe(42)
    })
  })

  describe('trigger_on_hit', () => {
    it('executes_on_hit_effects_when_damage_dealt', () => {
      // Arrange
      const state = createRunState()
      const hitEffects: AtomicEffect[] = [
        { type: 'draw', amount: 1 },
      ]
      const effect = {
        type: 'damage' as const,
        amount: 10,
        triggerOnHit: hitEffects,
      }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      let hitEffectExecuted = false
      setExecuteEffect((draft, eff, context) => {
        if (eff.type === 'draw') {
          hitEffectExecuted = true
          expect(context.currentTarget).toBe('enemy_1')
        }
      })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(hitEffectExecuted).toBe(true)
    })

    it('does_not_execute_on_hit_if_no_damage_dealt', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 20 })],
        }),
      })
      const hitEffects: AtomicEffect[] = [{ type: 'draw', amount: 1 }]
      const effect = {
        type: 'damage' as const,
        amount: 10,
        triggerOnHit: hitEffects,
      }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      let hitEffectExecuted = false
      setExecuteEffect(() => {
        hitEffectExecuted = true
      })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - No damage dealt because blocked
      expect(hitEffectExecuted).toBe(false)
    })
  })

  describe('power_triggers', () => {
    it('triggers_on_attack_for_attacker', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      let attackTriggered = false
      setExecutePowerTriggers((draft, entity, event) => {
        if (entity.id === 'player' && event === 'onAttack') {
          attackTriggered = true
        }
      })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(attackTriggered).toBe(true)
    })

    it('triggers_on_attacked_and_on_damaged_for_defender', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      let attackedTriggered = false
      let damagedTriggered = false
      setExecutePowerTriggers((draft, entity, event) => {
        if (entity.id === 'enemy_1' && event === 'onAttacked') {
          attackedTriggered = true
        }
        if (entity.id === 'enemy_1' && event === 'onDamaged') {
          damagedTriggered = true
        }
      })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(attackedTriggered).toBe(true)
      expect(damagedTriggered).toBe(true)
    })

    it('triggers_on_kill_when_enemy_dies', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ currentHealth: 5 })],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      let killTriggered = false
      setExecutePowerTriggers((draft, entity, event) => {
        if (entity.id === 'player' && event === 'onKill') {
          killTriggered = true
        }
      })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      expect(killTriggered).toBe(true)
      expect(state.combat!.enemies.length).toBe(0)
    })
  })

  describe('visual_events', () => {
    it('emits_damage_visual_event', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      const damageEvent = state.combat!.visualQueue.find((e) => e.type === 'damage')
      expect(damageEvent).toBeDefined()
      expect(damageEvent).toMatchObject({
        type: 'damage',
        targetId: 'enemy_1',
        amount: 10,
      })
    })

    it('emits_piercing_variant_visual', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 10, piercing: true }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      const damageEvent = state.combat!.visualQueue.find((e) => e.type === 'damage')
      expect(damageEvent).toMatchObject({
        variant: 'piercing',
      })
    })

    it('emits_combo_variant_visual_on_combo', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [
            createEnemy({
              powers: { oiled: { id: 'oiled', amount: 1 } },
            }),
          ],
        }),
      })
      const effect = { type: 'damage' as const, amount: 10, element: 'fire' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert
      const damageEvent = state.combat!.visualQueue.find(
        (e) => e.type === 'damage' && e.targetId === 'enemy_1'
      )
      expect(damageEvent).toMatchObject({
        variant: 'combo',
        comboName: 'Explosion',
      })
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = { type: 'damage' as const, amount: 10 }
      const ctx = createEffectContext()

      // Act - should not throw
      executeDamage(state, effect, ctx)

      // Assert - no crash
      expect(state.combat).toBeNull()
    })

    it('handles_zero_damage', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'damage' as const, amount: 0 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDamage(state, effect, ctx)

      // Assert - No visual emitted for 0 damage
      const damageEvents = state.combat!.visualQueue.filter((e) => e.type === 'damage')
      expect(damageEvents.length).toBe(0)
    })
  })
})

// ============================================================================
// executeBlock Tests
// ============================================================================

describe('executeBlock', () => {
  describe('basic_block', () => {
    it('adds_block_to_player', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 10 }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.player.block).toBe(10)
    })

    it('adds_block_to_enemy', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 8, target: 'enemy' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].block).toBe(8)
    })

    it('stacks_block_additively', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ block: 5 }),
        }),
      })
      const effect = { type: 'block' as const, amount: 7 }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.player.block).toBe(12)
    })
  })

  describe('barrier_block', () => {
    it('adds_persistent_barrier', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 10, persistent: true }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.player.barrier).toBe(10)
      expect(state.combat!.player.block).toBe(0)
    })

    it('stacks_barrier_additively', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ barrier: 3 }),
        }),
      })
      const effect = { type: 'block' as const, amount: 5, persistent: true }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.player.barrier).toBe(8)
    })
  })

  describe('block_modifiers', () => {
    it('applies_dexterity_to_block', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({
            powers: { dexterity: { id: 'dexterity', amount: 3 } },
          }),
        }),
      })
      const effect = { type: 'block' as const, amount: 5 }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert - 5 base + 3 dexterity = 8
      expect(state.combat!.player.block).toBe(8)
    })
  })

  describe('power_triggers', () => {
    it('triggers_on_block_event', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 5 }
      const ctx = createEffectContext()

      let blockTriggered = false
      setExecutePowerTriggers((draft, entity, event) => {
        if (entity.id === 'player' && event === 'onBlock') {
          blockTriggered = true
        }
      })

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      expect(blockTriggered).toBe(true)
    })
  })

  describe('visual_events', () => {
    it('emits_block_visual_event', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 8 }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      const blockEvent = state.combat!.visualQueue.find((e) => e.type === 'block')
      expect(blockEvent).toBeDefined()
      expect(blockEvent).toMatchObject({
        type: 'block',
        targetId: 'player',
        amount: 8,
      })
    })

    it('emits_barrier_variant_visual', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 10, persistent: true }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      const blockEvent = state.combat!.visualQueue.find((e) => e.type === 'block')
      expect(blockEvent).toMatchObject({
        variant: 'barrier',
      })
    })

    it('does_not_emit_visual_for_zero_block', () => {
      // Arrange
      const state = createRunState()
      const effect = { type: 'block' as const, amount: 0 }
      const ctx = createEffectContext()

      // Act
      executeBlock(state, effect, ctx)

      // Assert
      const blockEvents = state.combat!.visualQueue.filter((e) => e.type === 'block')
      expect(blockEvents.length).toBe(0)
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = { type: 'block' as const, amount: 10 }
      const ctx = createEffectContext()

      // Act - should not throw
      executeBlock(state, effect, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })
  })
})

// ============================================================================
// executeHeal Tests
// ============================================================================

describe('executeHeal', () => {
  describe('basic_heal', () => {
    it('heals_player', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'heal' as const, amount: 15 }
      const ctx = createEffectContext()

      // Act
      executeHeal(state, effect, ctx)

      // Assert
      expect(state.combat!.player.currentHealth).toBe(65)
    })

    it('heals_enemy', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ currentHealth: 30 })],
        }),
      })
      const effect = { type: 'heal' as const, amount: 10, target: 'enemy' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeHeal(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(40)
    })

    it('caps_heal_at_max_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 75, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'heal' as const, amount: 20 }
      const ctx = createEffectContext()

      // Act
      executeHeal(state, effect, ctx)

      // Assert - Only heals 5 to reach max
      expect(state.combat!.player.currentHealth).toBe(80)
    })
  })

  describe('overheal', () => {
    it('allows_overheal_when_specified', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 75, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'heal' as const, amount: 20, canOverheal: true }
      const ctx = createEffectContext()

      // Act
      executeHeal(state, effect, ctx)

      // Assert
      expect(state.combat!.player.currentHealth).toBe(95)
    })
  })

  describe('visual_events', () => {
    it('emits_heal_visual_event', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'heal' as const, amount: 15 }
      const ctx = createEffectContext()

      // Act
      executeHeal(state, effect, ctx)

      // Assert
      const healEvent = state.combat!.visualQueue.find((e) => e.type === 'heal')
      expect(healEvent).toBeDefined()
      expect(healEvent).toMatchObject({
        type: 'heal',
        targetId: 'player',
        amount: 15,
      })
    })

    it('emits_actual_heal_amount_not_requested', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 75, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'heal' as const, amount: 20 }
      const ctx = createEffectContext()

      // Act
      executeHeal(state, effect, ctx)

      // Assert - Visual shows 5, not 20
      const healEvent = state.combat!.visualQueue.find((e) => e.type === 'heal')
      expect(healEvent).toMatchObject({
        amount: 5,
      })
    })

    it('does_not_emit_visual_for_zero_heal', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'heal' as const, amount: 10 }
      const ctx = createEffectContext()

      // Act
      executeHeal(state, effect, ctx)

      // Assert
      const healEvents = state.combat!.visualQueue.filter((e) => e.type === 'heal')
      expect(healEvents.length).toBe(0)
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = { type: 'heal' as const, amount: 10 }
      const ctx = createEffectContext()

      // Act - should not throw
      executeHeal(state, effect, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })
  })
})

// ============================================================================
// executeLifesteal Tests
// ============================================================================

describe('executeLifesteal', () => {
  describe('basic_lifesteal', () => {
    it('deals_damage_and_heals_player', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 60, maxHealth: 80 }),
        }),
      })
      const effect = {
        type: 'lifesteal' as const,
        amount: 10,
        target: 'enemy' as const,
      }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeLifesteal(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(40)
      expect(state.combat!.player.currentHealth).toBe(70)
    })

    it('uses_custom_heal_ratio', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 60, maxHealth: 80 }),
        }),
      })
      const effect = {
        type: 'lifesteal' as const,
        amount: 10,
        target: 'enemy' as const,
        ratio: 0.5,
      }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeLifesteal(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(40)
      expect(state.combat!.player.currentHealth).toBe(65) // 60 + (10 * 0.5)
    })

    it('heals_custom_target', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 60 }),
          enemies: [
            createEnemy({ id: 'enemy_1', currentHealth: 40 }),
          ],
        }),
      })
      const effect = {
        type: 'lifesteal' as const,
        amount: 8,
        target: 'player' as const,
        healTarget: 'source' as const,
      }
      const ctx = createEffectContext({ source: 'enemy_1' })

      // Act
      executeLifesteal(state, effect, ctx)

      // Assert - player damaged, enemy_1 (source) healed
      expect(state.combat!.player.currentHealth).toBe(52)
      expect(state.combat!.enemies[0].currentHealth).toBe(48)
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = {
        type: 'lifesteal' as const,
        amount: 10,
        target: 'enemy' as const,
      }
      const ctx = createEffectContext()

      // Act - should not throw
      executeLifesteal(state, effect, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })
  })
})

// ============================================================================
// executeDestroyBlock Tests
// ============================================================================

describe('executeDestroyBlock', () => {
  describe('basic_destroy', () => {
    it('removes_all_block_when_no_amount_specified', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 15 })],
        }),
      })
      const effect = { type: 'destroyBlock' as const, target: 'enemy' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDestroyBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].block).toBe(0)
    })

    it('removes_partial_block_when_amount_specified', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 15 })],
        }),
      })
      const effect = { type: 'destroyBlock' as const, target: 'enemy' as const, amount: 8 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDestroyBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].block).toBe(7)
    })

    it('cannot_reduce_block_below_zero', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 5 })],
        }),
      })
      const effect = { type: 'destroyBlock' as const, target: 'enemy' as const, amount: 10 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDestroyBlock(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].block).toBe(0)
    })
  })

  describe('visual_events', () => {
    it('emits_negative_block_visual_event', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 10 })],
        }),
      })
      const effect = { type: 'destroyBlock' as const, target: 'enemy' as const, amount: 6 }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDestroyBlock(state, effect, ctx)

      // Assert
      const blockEvent = state.combat!.visualQueue.find((e) => e.type === 'block')
      expect(blockEvent).toBeDefined()
      expect(blockEvent).toMatchObject({
        type: 'block',
        targetId: 'enemy_1',
        amount: -6,
      })
    })

    it('does_not_emit_visual_if_no_block_removed', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ block: 0 })],
        }),
      })
      const effect = { type: 'destroyBlock' as const, target: 'enemy' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeDestroyBlock(state, effect, ctx)

      // Assert
      const blockEvents = state.combat!.visualQueue.filter((e) => e.type === 'block')
      expect(blockEvents.length).toBe(0)
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = { type: 'destroyBlock' as const, target: 'enemy' as const }
      const ctx = createEffectContext()

      // Act - should not throw
      executeDestroyBlock(state, effect, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })
  })
})

// ============================================================================
// executeMaxHealth Tests
// ============================================================================

describe('executeMaxHealth', () => {
  describe('gain_max_health', () => {
    it('increases_max_and_current_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, maxHealth: 80 }),
        }),
      })
      const effect = {
        type: 'maxHealth' as const,
        amount: 10,
        operation: 'gain' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.maxHealth).toBe(90)
      expect(state.combat!.player.currentHealth).toBe(90)
    })
  })

  describe('lose_max_health', () => {
    it('decreases_max_health_and_caps_current', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, maxHealth: 80 }),
        }),
      })
      const effect = {
        type: 'maxHealth' as const,
        amount: 15,
        operation: 'lose' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.maxHealth).toBe(65)
      expect(state.combat!.player.currentHealth).toBe(65)
    })

    it('caps_max_health_at_minimum_1', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 5, maxHealth: 5 }),
        }),
      })
      const effect = {
        type: 'maxHealth' as const,
        amount: 10,
        operation: 'lose' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.maxHealth).toBe(1)
      expect(state.combat!.player.currentHealth).toBe(1)
    })
  })

  describe('set_max_health', () => {
    it('sets_max_health_to_specific_value', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, maxHealth: 80 }),
        }),
      })
      const effect = {
        type: 'maxHealth' as const,
        amount: 100,
        operation: 'set' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.maxHealth).toBe(100)
      expect(state.combat!.player.currentHealth).toBe(80) // Current unchanged if below new max
    })

    it('caps_current_health_when_set_below_current', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 80, maxHealth: 80 }),
        }),
      })
      const effect = {
        type: 'maxHealth' as const,
        amount: 50,
        operation: 'set' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.maxHealth).toBe(50)
      expect(state.combat!.player.currentHealth).toBe(50)
    })
  })

  describe('visual_events', () => {
    it('emits_maxHealth_visual_with_positive_delta', () => {
      // Arrange
      const state = createRunState()
      const effect = {
        type: 'maxHealth' as const,
        amount: 10,
        operation: 'gain' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      const maxHealthEvent = state.combat!.visualQueue.find((e) => e.type === 'maxHealth')
      expect(maxHealthEvent).toBeDefined()
      expect(maxHealthEvent).toMatchObject({
        type: 'maxHealth',
        targetId: 'player',
        delta: 10,
      })
    })

    it('emits_maxHealth_visual_with_negative_delta', () => {
      // Arrange
      const state = createRunState()
      const effect = {
        type: 'maxHealth' as const,
        amount: 10,
        operation: 'lose' as const,
      }
      const ctx = createEffectContext()

      // Act
      executeMaxHealth(state, effect, ctx)

      // Assert
      const maxHealthEvent = state.combat!.visualQueue.find((e) => e.type === 'maxHealth')
      expect(maxHealthEvent).toMatchObject({
        delta: -10,
      })
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = {
        type: 'maxHealth' as const,
        amount: 10,
        operation: 'gain' as const,
      }
      const ctx = createEffectContext()

      // Act - should not throw
      executeMaxHealth(state, effect, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })
  })
})

// ============================================================================
// executeSetHealth Tests
// ============================================================================

describe('executeSetHealth', () => {
  describe('basic_set_health', () => {
    it('sets_health_to_specific_value', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 30 }
      const ctx = createEffectContext()

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.currentHealth).toBe(30)
    })

    it('caps_at_max_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 100 }
      const ctx = createEffectContext()

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.currentHealth).toBe(80)
    })

    it('enforces_minimum_1_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 0 }
      const ctx = createEffectContext()

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.player.currentHealth).toBe(1)
    })
  })

  describe('visual_events', () => {
    it('emits_heal_visual_when_health_increases', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 30, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 50 }
      const ctx = createEffectContext()

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      const healEvent = state.combat!.visualQueue.find((e) => e.type === 'heal')
      expect(healEvent).toBeDefined()
      expect(healEvent).toMatchObject({
        type: 'heal',
        targetId: 'player',
        amount: 20,
      })
    })

    it('emits_damage_visual_when_health_decreases', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 30 }
      const ctx = createEffectContext()

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      const damageEvent = state.combat!.visualQueue.find((e) => e.type === 'damage')
      expect(damageEvent).toBeDefined()
      expect(damageEvent).toMatchObject({
        type: 'damage',
        targetId: 'player',
        amount: 20,
      })
    })

    it('emits_no_visual_when_health_unchanged', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          player: createPlayer({ currentHealth: 50, maxHealth: 80 }),
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 50 }
      const ctx = createEffectContext()

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.visualQueue.length).toBe(0)
    })
  })

  describe('edge_cases', () => {
    it('handles_no_combat_state', () => {
      // Arrange
      const state = createRunState({ combat: null })
      const effect = { type: 'setHealth' as const, amount: 50 }
      const ctx = createEffectContext()

      // Act - should not throw
      executeSetHealth(state, effect, ctx)

      // Assert
      expect(state.combat).toBeNull()
    })

    it('handles_setting_enemy_health', () => {
      // Arrange
      const state = createRunState({
        combat: createCombat({
          enemies: [createEnemy({ currentHealth: 50, maxHealth: 50 })],
        }),
      })
      const effect = { type: 'setHealth' as const, amount: 10, target: 'enemy' as const }
      const ctx = createEffectContext({ cardTarget: 'enemy_1' })

      // Act
      executeSetHealth(state, effect, ctx)

      // Assert
      expect(state.combat!.enemies[0].currentHealth).toBe(10)
    })
  })
})
