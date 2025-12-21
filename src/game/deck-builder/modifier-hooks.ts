// ============================================
// MODIFIER DECK HOOKS
// ============================================
// Collects and applies deck hooks from run modifiers.
// Phase 5 will add full modifier integration.

import type { DeckHookDefinition, ModifierInstance } from '../../types'
import { getModifierDefinition } from '../modifiers'

/**
 * Get deck hooks from active modifiers.
 * Modifiers can define deck modifications via a deckHook property.
 */
export function getModifierDeckHooks(modifiers: ModifierInstance[]): DeckHookDefinition[] {
  const hooks: DeckHookDefinition[] = []

  for (const instance of modifiers) {
    const definition = getModifierDefinition(instance.definitionId)
    if (definition?.deckHook) {
      hooks.push({
        ...definition.deckHook,
        source: 'modifier' as const,
        sourceId: definition.id,
      })
    }
  }

  return hooks
}

/**
 * Get deck hooks from relics.
 * Relics can also modify deck building.
 */
export function getRelicDeckHooks(relics: { id: string; deckHook?: DeckHookDefinition }[]): DeckHookDefinition[] {
  return relics
    .filter((relic) => relic.deckHook)
    .map((relic) => ({
      ...relic.deckHook!,
      source: 'relic' as const,
      sourceId: relic.id,
    }))
}

/**
 * Dungeon-specific deck hooks registry.
 * Each dungeon can define hooks that modify starter deck composition.
 */
const dungeonHooksRegistry: Record<string, DeckHookDefinition[]> = {
  // Inferno dungeon: bonus fire cards
  inferno: [
    {
      id: 'dungeon_inferno_fire_bonus',
      phase: 'bonus',
      priority: 40,
      source: 'dungeon',
      sourceId: 'inferno',
      description: 'Inferno dungeon adds fire-affinity cards',
      apply: (cards, _context) => ({
        cards,
        bonuses: ['eg_strike'], // Add a basic attack
      }),
    },
  ],
  // Frost dungeon: filter to defensive cards
  frost: [
    {
      id: 'dungeon_frost_defense_focus',
      phase: 'filter',
      priority: 20,
      source: 'dungeon',
      sourceId: 'frost',
      description: 'Frost dungeon emphasizes defensive cards',
      apply: (cards, _context) => {
        // No filtering, just pass through - dungeons are less restrictive
        return { cards }
      },
    },
  ],
  // Void dungeon: extra card in deck
  void_realm: [
    {
      id: 'dungeon_void_bonus',
      phase: 'bonus',
      priority: 40,
      source: 'dungeon',
      sourceId: 'void_realm',
      description: 'Void realm grants an extra card',
      apply: (cards, _context) => ({
        cards,
        bonuses: ['eg_guard'],
      }),
    },
  ],
  // Shadow dungeon: bonus utility card
  shadow: [
    {
      id: 'dungeon_shadow_stealth',
      phase: 'bonus',
      priority: 40,
      source: 'dungeon',
      sourceId: 'shadow',
      description: 'Shadow dungeon grants stealth-oriented cards',
      apply: (cards, _context) => ({
        cards,
        bonuses: ['eg_tactical_retreat'],
      }),
    },
  ],
  // Celestial dungeon: bonus draw power
  celestial: [
    {
      id: 'dungeon_celestial_insight',
      phase: 'bonus',
      priority: 40,
      source: 'dungeon',
      sourceId: 'celestial',
      description: 'Celestial dungeon grants card draw',
      apply: (cards, _context) => ({
        cards,
        bonuses: ['eg_concentrate'],
      }),
    },
  ],
  // Abyss dungeon: high risk/reward
  abyss: [
    {
      id: 'dungeon_abyss_power',
      phase: 'bonus',
      priority: 40,
      source: 'dungeon',
      sourceId: 'abyss',
      description: 'Abyss dungeon grants powerful but risky cards',
      apply: (cards, _context) => ({
        cards,
        bonuses: ['eg_pierce', 'eg_twin_slash'],
      }),
    },
  ],
}

/**
 * Get deck hooks from dungeon effects.
 * Certain dungeons can modify starter deck composition.
 */
export function getDungeonDeckHooks(dungeonId: string | undefined): DeckHookDefinition[] {
  if (!dungeonId) return []

  return dungeonHooksRegistry[dungeonId] ?? []
}
