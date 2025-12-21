// ============================================
// AFFECTION & OUTFIT SYSTEM
// ============================================
// Hero affection progression and unlockable costumes

/**
 * Affection level thresholds and rewards
 */
export const AFFECTION_LEVELS = {
  stranger: { min: 0, max: 99, label: 'Stranger' },
  acquaintance: { min: 100, max: 299, label: 'Acquaintance' },
  friend: { min: 300, max: 599, label: 'Friend' },
  close: { min: 600, max: 999, label: 'Close Friend' },
  intimate: { min: 1000, max: 1499, label: 'Intimate' },
  devoted: { min: 1500, max: 2499, label: 'Devoted' },
  soulbound: { min: 2500, max: Infinity, label: 'Soulbound' },
} as const

export type AffectionLevel = keyof typeof AFFECTION_LEVELS

/**
 * Per-hero affection state
 */
export interface HeroAffection {
  heroId: string
  points: number
  level: AffectionLevel
  runsCompleted: number
  winsWithHero: number
}

/**
 * Outfit rarity determines unlock cost/requirements
 */
export type OutfitRarity = 'common' | 'rare' | 'legendary' | 'mythic'

/**
 * Outfit definition - each hero has multiple unlockable outfits
 */
export interface OutfitDefinition {
  id: string
  heroId: string
  name: string
  description: string
  rarity: OutfitRarity
  /** Affection level required to unlock */
  requiredLevel: AffectionLevel
  /** Additional gold cost (0 for default outfit) */
  goldCost: number
  /** Image path for gallery display */
  image: string
  /** Pose variations for gallery */
  poses: string[]
}

/**
 * Gallery pose - variations of outfit images
 */
export interface GalleryPose {
  id: string
  outfitId: string
  name: string
  image: string
  /** Whether this pose is unlocked */
  unlocked: boolean
}

/**
 * Complete gallery state for a hero
 */
export interface HeroGalleryState {
  heroId: string
  affection: HeroAffection
  unlockedOutfits: string[]
  equippedOutfit: string
  viewedPoses: string[]
}

/**
 * Get affection level from points
 */
export function getAffectionLevel(points: number): AffectionLevel {
  if (points >= AFFECTION_LEVELS.soulbound.min) return 'soulbound'
  if (points >= AFFECTION_LEVELS.devoted.min) return 'devoted'
  if (points >= AFFECTION_LEVELS.intimate.min) return 'intimate'
  if (points >= AFFECTION_LEVELS.close.min) return 'close'
  if (points >= AFFECTION_LEVELS.friend.min) return 'friend'
  if (points >= AFFECTION_LEVELS.acquaintance.min) return 'acquaintance'
  return 'stranger'
}

/**
 * Get progress to next affection level (0-1)
 */
export function getAffectionProgress(points: number): number {
  const level = getAffectionLevel(points)
  const levelData = AFFECTION_LEVELS[level]
  if (level === 'soulbound') return 1
  const range = levelData.max - levelData.min
  const progress = points - levelData.min
  return Math.min(1, progress / range)
}

/**
 * Calculate affection points earned from a run
 */
export function calculateAffectionGain(result: {
  won: boolean
  floorsCleared: number
  enemiesKilled: number
}): number {
  let points = 0

  // Base points for playing
  points += 10

  // Bonus for floors cleared
  points += result.floorsCleared * 5

  // Bonus for kills
  points += Math.floor(result.enemiesKilled * 2)

  // Win bonus
  if (result.won) {
    points += 50
  }

  return points
}

/**
 * Default affection state for a new hero
 */
export function createDefaultAffection(heroId: string): HeroAffection {
  return {
    heroId,
    points: 0,
    level: 'stranger',
    runsCompleted: 0,
    winsWithHero: 0,
  }
}

// ============================================
// OUTFIT DEFINITIONS
// ============================================

export const HERO_OUTFITS: OutfitDefinition[] = [
  // ============================================
  // SAKURA OUTFITS
  // ============================================
  {
    id: 'sakura_default',
    heroId: 'sakura',
    name: 'Battle Maiden',
    description: 'Standard combat attire with cherry blossom motifs.',
    rarity: 'common',
    requiredLevel: 'stranger',
    goldCost: 0,
    image: '/cards/hero_sakura.webp',
    poses: ['default'],
  },
  {
    id: 'sakura_casual',
    heroId: 'sakura',
    name: 'Off-Duty',
    description: 'Relaxed attire for quiet moments between battles.',
    rarity: 'common',
    requiredLevel: 'friend',
    goldCost: 100,
    image: '/cards/hero_sakura_casual.webp',
    poses: ['default', 'relaxed'],
  },
  {
    id: 'sakura_elegant',
    heroId: 'sakura',
    name: 'Moonlit Blossom',
    description: 'An elegant evening gown adorned with silver petals.',
    rarity: 'rare',
    requiredLevel: 'intimate',
    goldCost: 500,
    image: '/cards/hero_sakura_elegant.webp',
    poses: ['default', 'alluring'],
  },
  {
    id: 'sakura_devoted',
    heroId: 'sakura',
    name: 'Sacred Bond',
    description: 'A ceremonial outfit symbolizing eternal devotion.',
    rarity: 'legendary',
    requiredLevel: 'devoted',
    goldCost: 1000,
    image: '/cards/hero_sakura_devoted.webp',
    poses: ['default', 'intimate', 'embrace'],
  },

  // ============================================
  // LUNA OUTFITS
  // ============================================
  {
    id: 'luna_default',
    heroId: 'luna',
    name: 'Starweaver',
    description: 'Mystical robes woven from moonlight threads.',
    rarity: 'common',
    requiredLevel: 'stranger',
    goldCost: 0,
    image: '/cards/hero_luna.webp',
    poses: ['default'],
  },
  {
    id: 'luna_casual',
    heroId: 'luna',
    name: 'Twilight Rest',
    description: 'Comfortable attire for stargazing evenings.',
    rarity: 'common',
    requiredLevel: 'friend',
    goldCost: 100,
    image: '/cards/hero_luna_casual.webp',
    poses: ['default', 'dreamy'],
  },
  {
    id: 'luna_elegant',
    heroId: 'luna',
    name: 'Celestial Empress',
    description: 'A regal gown that shimmers like the night sky.',
    rarity: 'rare',
    requiredLevel: 'intimate',
    goldCost: 500,
    image: '/cards/hero_luna_elegant.webp',
    poses: ['default', 'commanding'],
  },
  {
    id: 'luna_devoted',
    heroId: 'luna',
    name: 'Eternal Eclipse',
    description: 'An otherworldly manifestation of complete trust.',
    rarity: 'legendary',
    requiredLevel: 'devoted',
    goldCost: 1000,
    image: '/cards/hero_luna_devoted.webp',
    poses: ['default', 'intimate', 'surrender'],
  },

  // ============================================
  // ARIA OUTFITS
  // ============================================
  {
    id: 'aria_default',
    heroId: 'aria',
    name: 'Storm Dancer',
    description: 'Light armor designed for agile combat.',
    rarity: 'common',
    requiredLevel: 'stranger',
    goldCost: 0,
    image: '/cards/hero_aria.webp',
    poses: ['default'],
  },
  {
    id: 'aria_casual',
    heroId: 'aria',
    name: 'Wind\'s Whisper',
    description: 'Flowing garments that dance with the breeze.',
    rarity: 'common',
    requiredLevel: 'friend',
    goldCost: 100,
    image: '/cards/hero_aria_casual.webp',
    poses: ['default', 'playful'],
  },
  {
    id: 'aria_elegant',
    heroId: 'aria',
    name: 'Tempest Queen',
    description: 'Electrifying attire crackling with raw power.',
    rarity: 'rare',
    requiredLevel: 'intimate',
    goldCost: 500,
    image: '/cards/hero_aria_elegant.webp',
    poses: ['default', 'powerful'],
  },
  {
    id: 'aria_devoted',
    heroId: 'aria',
    name: 'Heart of the Storm',
    description: 'The eye of the tempest - calm, absolute, eternal.',
    rarity: 'legendary',
    requiredLevel: 'devoted',
    goldCost: 1000,
    image: '/cards/hero_aria_devoted.webp',
    poses: ['default', 'intimate', 'passion'],
  },
]

/**
 * Get all outfits for a specific hero
 */
export function getHeroOutfits(heroId: string): OutfitDefinition[] {
  return HERO_OUTFITS.filter(o => o.heroId === heroId)
}

/**
 * Get outfit by ID
 */
export function getOutfitById(outfitId: string): OutfitDefinition | undefined {
  return HERO_OUTFITS.find(o => o.id === outfitId)
}

/**
 * Check if an outfit is unlockable at current affection level
 */
export function canUnlockOutfit(
  outfit: OutfitDefinition,
  currentLevel: AffectionLevel
): boolean {
  const levels: AffectionLevel[] = [
    'stranger', 'acquaintance', 'friend', 'close', 'intimate', 'devoted', 'soulbound'
  ]
  const currentIndex = levels.indexOf(currentLevel)
  const requiredIndex = levels.indexOf(outfit.requiredLevel)
  return currentIndex >= requiredIndex
}
