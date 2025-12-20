// ============================================
// CARD GENERATOR - MAIN EXPORTS
// ============================================

// Export all generation functions
export {
  generateRandomCard,
  generateHero,
  generateEnemyCard,
  generateBaseEnemySet,
  generateRelic,
  generateRelicSet,
  loadGeneratedCardsIntoRegistry,
  type RelicSetConfig,
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
  RelicGenerationOptions,
  PackConfig,
  ElementType,
} from './types'

export { DEFAULT_PACK_CONFIG } from './types'

// Export prompts (for testing/debugging)
export { SYSTEM_PROMPT, HERO_SYSTEM_PROMPT, ENEMY_SYSTEM_PROMPT, RELIC_SYSTEM_PROMPT } from './prompts'

// Export validation helpers (for testing)
export {
  validateCard,
  validateHero,
  validateEnemy,
  validateRelic,
  validateEffect,
  validateTheme,
  validateTarget,
  validateRarity,
  validateElement,
} from './validation'

// Export full validation pipeline (Zod + Registry + Semantic)
export {
  validateGeneratedCard,
  validateCardSchemaOnly,
  validateSingleEffect,
  formatValidationResult,
  type FullValidationResult,
  type ValidationWarning,
} from './validators'

// Export Zod schemas for advanced usage
export { AtomicEffectSchema, GeneratedCardSchema } from './schemas'

// Export parsing helpers (for testing)
export {
  parseCardResponse,
  parseHeroResponse,
  parseEnemyResponse,
  parseRelicResponse,
} from './parsing'
