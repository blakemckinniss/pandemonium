// ============================================
// GENERATION OPTIONS TYPES
// ============================================

export interface EnemyGenerationOptions {
  difficulty?: 1 | 2 | 3 // Tier 1 (easy), 2 (medium), 3 (hard)
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  archetype?: string // Slime, Cultist, Brute, etc.
  hint?: string // Creative direction hint
  artHint?: string // Custom hint for art generation
}

export interface GenerationOptions {
  theme?: 'attack' | 'skill' | 'power' | 'curse' | 'status' | 'hero' | 'enemy'
  rarity?: 'common' | 'uncommon' | 'rare'
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  effectType?: string // Force specific effect type
  hint?: string // Creative direction hint
  artHint?: string // Custom hint for art generation
  // Note: Art generation is ALWAYS performed - cards cannot exist without images
}

export interface HeroGenerationOptions {
  archetype?: string // Specific archetype hint (Warrior, Mage, etc.)
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  hint?: string // Creative direction hint
  artHint?: string // Custom hint for art generation
  // Note: Art generation is ALWAYS performed - heroes cannot exist without images
}

export interface RelicGenerationOptions {
  rarity?: 'common' | 'uncommon' | 'rare' | 'boss'
  trigger?: 'onCombatStart' | 'onCombatEnd' | 'onTurnStart' | 'onTurnEnd' | 'onCardPlayed' | 'onAttack' | 'onKill' | 'onDamaged' | 'onHeal' | 'onGoldGained' | 'passive'
  hint?: string // Creative direction hint
}

export interface PackConfig {
  size: number // Cards per pack
  rarityWeights: {
    common: number
    uncommon: number
    rare: number
  }
  elementWeights?: {
    physical: number
    fire: number
    ice: number
    lightning: number
    void: number
  }
  heroChance?: number // Chance per card to be a hero (0-100, default 2%)
  theme?: string // Theme hint for all cards
  guaranteedRare?: boolean // At least one rare per pack
  maxSameElement?: number // Max cards of same element per pack (default: 2)
}

export const DEFAULT_PACK_CONFIG: PackConfig = {
  size: 6,
  rarityWeights: { common: 60, uncommon: 30, rare: 10 },
  elementWeights: { physical: 30, fire: 20, ice: 20, lightning: 15, void: 15 },
  heroChance: 2, // 2% chance per card = ~1 in 50
  guaranteedRare: false,
  maxSameElement: 2, // Max 2 cards of same element per pack
}

export type ElementType = 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
