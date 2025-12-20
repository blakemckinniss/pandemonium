// ============================================
// PACK GENERATION
// ============================================

import type { CardDefinition } from '../../types'
import { generateRandomCard, generateHero } from './generators'
import type { PackConfig, ElementType } from './types'
import { DEFAULT_PACK_CONFIG } from './types'

/**
 * Generate a pack of random cards.
 * Uses weighted rarity and element distribution.
 * Each card has a small chance (~2%) to be a hero instead.
 */
export async function generatePack(
  config: Partial<PackConfig> = {}
): Promise<CardDefinition[]> {
  const cfg = { ...DEFAULT_PACK_CONFIG, ...config }
  const heroChance = cfg.heroChance ?? 2
  const maxSameElement = cfg.maxSameElement ?? 2

  // Track element counts to enforce variety
  const elementCounts: Record<ElementType, number> = {
    physical: 0, fire: 0, ice: 0, lightning: 0, void: 0,
  }

  // Weighted rarity selection
  const rarityTotal = cfg.rarityWeights.common + cfg.rarityWeights.uncommon + cfg.rarityWeights.rare

  function pickRarity(): 'common' | 'uncommon' | 'rare' {
    const roll = Math.random() * rarityTotal
    if (roll < cfg.rarityWeights.common) return 'common'
    if (roll < cfg.rarityWeights.common + cfg.rarityWeights.uncommon) return 'uncommon'
    return 'rare'
  }

  // Weighted element selection with saturation check
  const elemWeights = cfg.elementWeights ?? DEFAULT_PACK_CONFIG.elementWeights!

  function pickElement(): ElementType {
    // Filter out saturated elements
    const available = (Object.keys(elemWeights) as ElementType[]).filter(
      (el) => elementCounts[el] < maxSameElement
    )

    // If all saturated (shouldn't happen with default settings), allow any
    if (available.length === 0) {
      const all = Object.keys(elemWeights) as ElementType[]
      return all[Math.floor(Math.random() * all.length)]
    }

    // Calculate weights for available elements only
    const availableWeights = available.map((el) => elemWeights[el])
    const totalWeight = availableWeights.reduce((a, b) => a + b, 0)

    const roll = Math.random() * totalWeight
    let cumulative = 0
    for (let i = 0; i < available.length; i++) {
      cumulative += availableWeights[i]
      if (roll < cumulative) return available[i]
    }
    return available[available.length - 1]
  }

  // Generate cards
  const cards: CardDefinition[] = []
  let hasRare = false

  for (let i = 0; i < cfg.size; i++) {
    // Check for hero pull (~2% per card)
    const isHeroPull = Math.random() * 100 < heroChance

    if (isHeroPull) {
      // Generate a hero instead of a regular card
      const element = pickElement()
      const hero = await generateHero({
        element,
        hint: cfg.theme,
      })
      cards.push(hero)
      elementCounts[element]++
      hasRare = true // Heroes count as rare for guaranteed rare purposes
      continue
    }

    let rarity = pickRarity()

    // Guarantee at least one rare in last slot if enabled
    if (cfg.guaranteedRare && i === cfg.size - 1 && !hasRare) {
      rarity = 'rare'
    }

    if (rarity === 'rare') hasRare = true

    const element = pickElement()
    const card = await generateRandomCard({
      rarity,
      element,
      hint: cfg.theme,
    })
    cards.push(card)
    elementCounts[element]++
  }

  return cards
}

/**
 * Generate multiple packs at once.
 */
export async function generatePacks(
  count: number,
  config: Partial<PackConfig> = {}
): Promise<CardDefinition[][]> {
  const packs: CardDefinition[][] = []
  for (let i = 0; i < count; i++) {
    const pack = await generatePack(config)
    packs.push(pack)
  }
  return packs
}
