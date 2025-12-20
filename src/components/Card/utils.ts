import type { CardDefinition } from '../../types'

/**
 * Convert energy value to display format.
 * Handles number, 'X', and EffectValue types.
 */
export function getEnergyCost(energy: CardDefinition['energy']): number | 'X' {
  if (typeof energy === 'number') return energy
  if (typeof energy === 'string' && energy === 'X') return 'X'
  if (typeof energy === 'object' && energy !== null && 'value' in energy) return energy.value
  return 0
}

/**
 * Extract visual props from a CardDefinition for the Card component.
 * Use this to ensure consistent prop mapping across all card displays.
 *
 * @example
 * const defProps = getCardDefProps(cardDef)
 * <Card {...defProps} variant="hand" playable />
 */
export function getCardDefProps(def: CardDefinition) {
  return {
    cardId: def.id,
    name: def.name,
    description: def.description,
    theme: def.theme,
    energy: getEnergyCost(def.energy),
    element: def.element,
    rarity: def.rarity,
    image: def.image,
    ethereal: def.ethereal,
  }
}
