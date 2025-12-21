// ============================================
// DECK BUILDER TESTS
// ============================================
// Tests for deck builder pipeline, hooks, and modifier integration.

import { describe, it, expect, beforeAll } from 'vitest'
import { buildDeck, createDeckBuilderContext } from '../deck-builder'
import { getModifierDeckHooks, getDungeonDeckHooks } from '../deck-builder/modifier-hooks'
import { getModifierDefinition } from '../modifiers'
import type { ModifierInstance } from '../../types'

// Ensure modifiers are registered
beforeAll(async () => {
  // Import modifiers to trigger registration
  await import('../modifiers')
})

describe('deck-builder', () => {
  describe('buildDeck', () => {
    it('builds a deck with base evergreen cards', () => {
      const context = createDeckBuilderContext('hero_sakura')
      const result = buildDeck(context)

      expect(result.cardIds).toBeDefined()
      expect(result.cardIds.length).toBeGreaterThan(0)
      expect(result.appliedHooks).toBeDefined()
    })

    it('applies hero hooks when hero has deckHooks', () => {
      const context = createDeckBuilderContext('hero_sakura')
      const result = buildDeck(context)

      // Sakura has a bonus hook that adds 'eg_flex'
      expect(result.appliedHooks).toContain('hero_sakura_bonus')
      expect(result.bonusCards).toContain('eg_flex')
    })

    it('includes carry slot cards in final deck', () => {
      const context = createDeckBuilderContext('hero_sakura', {
        carrySlots: [
          {
            slotIndex: 0,
            cardId: 'eg_guard',
            protected: false,
            source: 'dungeonClear',
            acquiredAt: Date.now(),
          },
        ],
      })
      const result = buildDeck(context)

      expect(result.cardIds).toContain('eg_guard')
    })
  })

  describe('getModifierDeckHooks', () => {
    it('returns empty array for modifiers without deckHooks', () => {
      const modifiers: ModifierInstance[] = [
        { uid: 'test-1', definitionId: 'copper_tithe', appliedAt: Date.now() },
      ]

      const hooks = getModifierDeckHooks(modifiers)
      expect(hooks).toEqual([])
    })

    it('returns hooks for modifiers with deckHooks', () => {
      const modifiers: ModifierInstance[] = [
        { uid: 'test-1', definitionId: 'battle_ready', appliedAt: Date.now() },
      ]

      const hooks = getModifierDeckHooks(modifiers)
      expect(hooks.length).toBe(1)
      expect(hooks[0].id).toBe('battle_ready_hook')
      expect(hooks[0].phase).toBe('bonus')
      expect(hooks[0].source).toBe('modifier')
      expect(hooks[0].sourceId).toBe('battle_ready')
    })

    it('returns multiple hooks for multiple modifiers with deckHooks', () => {
      const modifiers: ModifierInstance[] = [
        { uid: 'test-1', definitionId: 'battle_ready', appliedAt: Date.now() },
        { uid: 'test-2', definitionId: 'lightweight_training', appliedAt: Date.now() },
      ]

      const hooks = getModifierDeckHooks(modifiers)
      expect(hooks.length).toBe(2)
      expect(hooks.map((h) => h.id)).toContain('battle_ready_hook')
      expect(hooks.map((h) => h.id)).toContain('lightweight_training_hook')
    })

    it('skips modifiers that do not exist in registry', () => {
      const modifiers: ModifierInstance[] = [
        { uid: 'test-1', definitionId: 'nonexistent_modifier', appliedAt: Date.now() },
      ]

      const hooks = getModifierDeckHooks(modifiers)
      expect(hooks).toEqual([])
    })
  })

  describe('modifier deckHook definitions', () => {
    it('elemental_focus_fire has filter phase hook', () => {
      const def = getModifierDefinition('elemental_focus_fire')
      expect(def).toBeDefined()
      expect(def?.deckHook).toBeDefined()
      expect(def?.deckHook?.phase).toBe('filter')
    })

    it('lightweight_training has filter phase hook', () => {
      const def = getModifierDefinition('lightweight_training')
      expect(def).toBeDefined()
      expect(def?.deckHook).toBeDefined()
      expect(def?.deckHook?.phase).toBe('filter')
    })

    it('battle_ready has bonus phase hook', () => {
      const def = getModifierDefinition('battle_ready')
      expect(def).toBeDefined()
      expect(def?.deckHook).toBeDefined()
      expect(def?.deckHook?.phase).toBe('bonus')
    })

    it('battle_ready hook adds bonus cards', () => {
      const def = getModifierDefinition('battle_ready')
      const result = def?.deckHook?.apply([], {} as any)

      expect(result?.bonuses).toContain('eg_strike')
      expect(result?.bonuses).toContain('eg_pierce')
    })
  })

  describe('deck building with modifier hooks', () => {
    it('applies modifier hooks during deck building', () => {
      const context = createDeckBuilderContext('hero_sakura', {
        modifiers: [{ uid: 'test-1', definitionId: 'battle_ready', appliedAt: Date.now() }],
      })
      const result = buildDeck(context)

      // battle_ready adds eg_strike and eg_pierce as bonus cards
      expect(result.appliedHooks).toContain('battle_ready_hook')
      expect(result.bonusCards).toContain('eg_strike')
      expect(result.bonusCards).toContain('eg_pierce')
    })
  })

  describe('getDungeonDeckHooks', () => {
    it('returns empty array for undefined dungeonId', () => {
      const hooks = getDungeonDeckHooks(undefined)
      expect(hooks).toEqual([])
    })

    it('returns empty array for unknown dungeonId', () => {
      const hooks = getDungeonDeckHooks('unknown_dungeon')
      expect(hooks).toEqual([])
    })

    it('returns hooks for inferno dungeon', () => {
      const hooks = getDungeonDeckHooks('inferno')
      expect(hooks.length).toBe(1)
      expect(hooks[0].id).toBe('dungeon_inferno_fire_bonus')
      expect(hooks[0].phase).toBe('bonus')
      expect(hooks[0].source).toBe('dungeon')
      expect(hooks[0].sourceId).toBe('inferno')
    })

    it('returns hooks for frost dungeon', () => {
      const hooks = getDungeonDeckHooks('frost')
      expect(hooks.length).toBe(1)
      expect(hooks[0].id).toBe('dungeon_frost_defense_focus')
      expect(hooks[0].phase).toBe('filter')
    })

    it('returns hooks for void_realm dungeon', () => {
      const hooks = getDungeonDeckHooks('void_realm')
      expect(hooks.length).toBe(1)
      expect(hooks[0].id).toBe('dungeon_void_bonus')
      expect(hooks[0].phase).toBe('bonus')
    })

    it('inferno hook adds bonus cards', () => {
      const hooks = getDungeonDeckHooks('inferno')
      const result = hooks[0].apply([], {} as any)
      expect(result.bonuses).toContain('eg_strike')
    })

    it('void_realm hook adds bonus cards', () => {
      const hooks = getDungeonDeckHooks('void_realm')
      const result = hooks[0].apply([], {} as any)
      expect(result.bonuses).toContain('eg_guard')
    })
  })

  describe('deck building with dungeon hooks', () => {
    it('applies dungeon hooks during deck building', () => {
      const context = createDeckBuilderContext('hero_sakura', {
        dungeonId: 'inferno',
      })
      const result = buildDeck(context)

      // inferno dungeon adds eg_strike as bonus
      expect(result.appliedHooks).toContain('dungeon_inferno_fire_bonus')
      expect(result.bonusCards).toContain('eg_strike')
    })

    it('applies void_realm dungeon bonus', () => {
      const context = createDeckBuilderContext('hero_sakura', {
        dungeonId: 'void_realm',
      })
      const result = buildDeck(context)

      expect(result.appliedHooks).toContain('dungeon_void_bonus')
      expect(result.bonusCards).toContain('eg_guard')
    })

    it('combines dungeon and modifier hooks', () => {
      const context = createDeckBuilderContext('hero_sakura', {
        dungeonId: 'inferno',
        modifiers: [{ uid: 'test-1', definitionId: 'battle_ready', appliedAt: Date.now() }],
      })
      const result = buildDeck(context)

      // Both hooks should be applied
      expect(result.appliedHooks).toContain('dungeon_inferno_fire_bonus')
      expect(result.appliedHooks).toContain('battle_ready_hook')
      // Bonus cards from both sources
      expect(result.bonusCards).toContain('eg_strike') // from inferno and battle_ready
      expect(result.bonusCards).toContain('eg_pierce') // from battle_ready
    })
  })
})
