// ============================================
// CARD GENERATOR - MAIN EXPORTS
// ============================================

// Export all generation functions
export {
  generateRandomCard,
  generateHero,
  generateEnemyCard,
  generateBaseEnemySet,
  loadGeneratedCardsIntoRegistry,
} from './generators'

// Export pack generation
export {
  generatePack,
  generatePacks,
} from './packs'

// Export types
export type {
  GenerationOptions,
  HeroGenerationOptions,
  EnemyGenerationOptions,
  PackConfig,
  ElementType,
} from './types'

export { DEFAULT_PACK_CONFIG } from './types'

// Export prompts (for testing/debugging)
export { SYSTEM_PROMPT, HERO_SYSTEM_PROMPT, ENEMY_SYSTEM_PROMPT } from './prompts'

// Export validation helpers (for testing)
export {
  validateCard,
  validateHero,
  validateEnemy,
  validateEffect,
  validateTheme,
  validateTarget,
  validateRarity,
  validateElement,
} from './validation'

// Export parsing helpers (for testing)
export {
  parseCardResponse,
  parseHeroResponse,
  parseEnemyResponse,
} from './parsing'
