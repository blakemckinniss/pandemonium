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
 * Get deck hooks from dungeon effects.
 * Certain dungeons can modify starter deck composition.
 */
export function getDungeonDeckHooks(dungeonId: string | undefined): DeckHookDefinition[] {
  if (!dungeonId) return []

  // Future: Look up dungeon-specific deck modifications
  // For now, return empty array
  return []
}
