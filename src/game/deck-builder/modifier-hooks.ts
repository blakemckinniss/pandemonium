// ============================================
// MODIFIER DECK HOOKS
// ============================================
// Collects and applies deck hooks from run modifiers.
// Phase 5 will add full modifier integration.

import type { DeckHookDefinition, ModifierInstance } from '../../types'

/**
 * Get deck hooks from active modifiers.
 * Modifiers can define deck modifications via a deckHook property.
 * Note: This is a Phase 5 feature - currently returns empty array.
 */
export function getModifierDeckHooks(_modifiers: ModifierInstance[]): DeckHookDefinition[] {
  // Phase 5: Look up ModifierDefinition for each instance and check for deckHook
  // For now, modifiers don't provide deck hooks yet
  return []
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
