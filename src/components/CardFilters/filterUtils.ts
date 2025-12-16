import type {
  CardDefinition,
  CardFilters,
  SortOption,
  SortDirection,
  RARITY_ORDER,
} from '../../types'

// Re-import RARITY_ORDER since it's a value not just a type
const RARITY_SORT_ORDER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  'ultra-rare': 4,
  legendary: 5,
  mythic: 6,
  ancient: 7,
}

const THEME_ORDER: Record<string, number> = {
  attack: 1,
  skill: 2,
  power: 3,
  curse: 4,
  status: 5,
  hero: 6,
  enemy: 7,
}

const ELEMENT_ORDER: Record<string, number> = {
  physical: 1,
  fire: 2,
  ice: 3,
  lightning: 4,
  void: 5,
}

/**
 * Filter cards based on filter criteria
 */
export function filterCards(
  cards: CardDefinition[],
  filters: CardFilters,
  ownedCardIds?: Set<string>
): CardDefinition[] {
  return cards.filter((card) => {
    // Theme filter
    if (filters.themes.length > 0 && !filters.themes.includes(card.theme)) {
      return false
    }

    // Rarity filter
    if (filters.rarities.length > 0 && card.rarity && !filters.rarities.includes(card.rarity)) {
      return false
    }

    // Element filter
    if (filters.elements.length > 0) {
      if (!card.element || !filters.elements.includes(card.element)) {
        return false
      }
    }

    // Energy range filter
    const energy = typeof card.energy === 'number' ? card.energy : 0
    if (energy < filters.energyRange[0] || energy > filters.energyRange[1]) {
      return false
    }

    // Owned filter
    if (filters.owned !== null && ownedCardIds) {
      const isOwned = ownedCardIds.has(card.id)
      if (filters.owned && !isOwned) return false
      if (!filters.owned && isOwned) return false
    }

    // Search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      const matchesName = card.name.toLowerCase().includes(query)
      const matchesDesc = card.description?.toLowerCase().includes(query)
      if (!matchesName && !matchesDesc) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort cards based on sort option and direction
 */
export function sortCards(
  cards: CardDefinition[],
  sortBy: SortOption,
  direction: SortDirection
): CardDefinition[] {
  const sorted = [...cards].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break

      case 'rarity': {
        const rarityA = RARITY_SORT_ORDER[a.rarity || 'common'] || 0
        const rarityB = RARITY_SORT_ORDER[b.rarity || 'common'] || 0
        comparison = rarityA - rarityB
        break
      }

      case 'energy': {
        const energyA = typeof a.energy === 'number' ? a.energy : 0
        const energyB = typeof b.energy === 'number' ? b.energy : 0
        comparison = energyA - energyB
        break
      }

      case 'theme': {
        const themeA = THEME_ORDER[a.theme] || 99
        const themeB = THEME_ORDER[b.theme] || 99
        comparison = themeA - themeB
        break
      }

      case 'element': {
        const elemA = ELEMENT_ORDER[a.element || 'physical'] || 99
        const elemB = ELEMENT_ORDER[b.element || 'physical'] || 99
        comparison = elemA - elemB
        break
      }
    }

    return direction === 'asc' ? comparison : -comparison
  })

  return sorted
}
