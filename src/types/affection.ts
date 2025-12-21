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
