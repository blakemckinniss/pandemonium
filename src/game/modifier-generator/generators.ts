// ============================================
// MODIFIER GENERATION FUNCTIONS
// ============================================

import { chatCompletion } from '../../lib/groq'
import type {
  ModifierDefinition,
  ModifierCategory,
  ModifierRarity,
} from '../../types'
import { generateUid } from '../../lib/utils'
import { logger } from '../../lib/logger'
import { MODIFIER_SYSTEM_PROMPT } from './prompts'
import {
  validateGeneratedModifier,
  formatValidationResult,
  coerceModifierCategory,
  coerceModifierRarity,
  coerceDurability,
  coerceModifierEffects,
} from './validation'
import { registerModifier } from '../modifiers'

// ============================================
// TYPES
// ============================================

export interface ModifierGenerationOptions {
  category?: ModifierCategory
  rarity?: ModifierRarity
  hint?: string
  dangerTheme?: string  // e.g., "elite-focused", "resource-drain", "combat-difficulty"
  rewardTheme?: string  // e.g., "gold-focused", "card-quality", "starting-power"
}

export interface ModifierSetConfig {
  count: number
  rarityDistribution?: {
    common?: number
    uncommon?: number
    rare?: number
    legendary?: number
  }
  categoryVariety?: boolean
  hints?: string[]
}

// ============================================
// HELPERS
// ============================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function parseModifierResponse(response: string): Record<string, unknown> {
  // Clean up response (remove markdown code blocks if present)
  let cleaned = response.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch (err) {
    logger.error('ModifierGen', 'Failed to parse JSON response:', cleaned)
    throw new Error(`Invalid JSON response: ${err instanceof Error ? err.message : String(err)}`)
  }
}

function validateAndCoerceModifier(
  parsed: Record<string, unknown>
): Omit<ModifierDefinition, 'id'> {
  // Required fields
  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error('Modifier must have a name')
  }

  if (!parsed.description || typeof parsed.description !== 'string') {
    throw new Error('Modifier must have a description')
  }

  // Coerce values with validation
  const category = coerceModifierCategory(parsed.category)
  const rarity = coerceModifierRarity(parsed.rarity)
  const durability = coerceDurability(parsed.durability)

  // Combine danger and reward effects into single effects array
  const dangerEffects = coerceModifierEffects(parsed.dangerEffects)
  const rewardEffects = coerceModifierEffects(parsed.rewardEffects)
  const effects = [...dangerEffects, ...rewardEffects]

  // Also accept direct effects array
  if (effects.length === 0 && parsed.effects) {
    effects.push(...coerceModifierEffects(parsed.effects))
  }

  if (effects.length === 0) {
    throw new Error('Modifier must have at least one effect')
  }

  const dangerValue = typeof parsed.dangerValue === 'number' ? parsed.dangerValue : 10
  const rewardValue = typeof parsed.rewardValue === 'number' ? parsed.rewardValue : 10

  return {
    name: parsed.name,
    description: parsed.description,
    category,
    rarity,
    dangerValue,
    rewardValue,
    durability,
    effects,
  }
}

// ============================================
// SINGLE MODIFIER GENERATION
// ============================================

const MAX_GENERATION_RETRIES = 3

export async function generateModifier(
  options?: ModifierGenerationOptions
): Promise<ModifierDefinition> {
  // Build user prompt
  const parts: string[] = []

  const rarity = options?.rarity ?? pickRandom(['common', 'uncommon', 'rare'] as ModifierRarity[])
  const category = options?.category ?? pickRandom(['catalyst', 'omen', 'edict', 'seal'] as ModifierCategory[])

  parts.push(`Generate a ${rarity} ${category} modifier.`)

  if (options?.dangerTheme) {
    parts.push(`Danger theme: ${options.dangerTheme}.`)
  }

  if (options?.rewardTheme) {
    parts.push(`Reward theme: ${options.rewardTheme}.`)
  }

  if (options?.hint) {
    parts.push(`Theme hint: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  // Retry loop for validation failures
  let lastError: Error | null = null
  let validated: Omit<ModifierDefinition, 'id'> | null = null

  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt++) {
    try {
      // Call Groq (slightly higher temperature on retries for variety)
      const response = await chatCompletion(MODIFIER_SYSTEM_PROMPT, userPrompt, {
        temperature: 0.85 + (attempt - 1) * 0.05,
        maxTokens: 768,
      })

      // Parse response
      const parsed = parseModifierResponse(response)

      // Basic validation and coercion
      const attemptValidated = validateAndCoerceModifier(parsed)

      // Full 3-layer validation
      const fullValidation = validateGeneratedModifier({
        id: 'pending',
        ...attemptValidated,
      })

      if (!fullValidation.success) {
        const errorDetails = formatValidationResult(fullValidation)
        if (attempt < MAX_GENERATION_RETRIES) {
          logger.warn('ModifierGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed validation, retrying...\n${errorDetails}`)
          continue
        }
        logger.error('ModifierGen', `Generated modifier failed validation after ${MAX_GENERATION_RETRIES} attempts:\n${errorDetails}`)
        throw new Error(`Generated modifier failed validation: ${JSON.stringify(fullValidation.errors)}`)
      }

      // Log warnings if any
      if (fullValidation.warnings.length > 0) {
        logger.warn('ModifierGen', `Generated modifier has warnings: ${fullValidation.warnings.map(w => w.message).join(', ')}`)
      }

      // Success
      validated = attemptValidated
      if (attempt > 1) {
        logger.info('ModifierGen', `Modifier generated successfully on attempt ${attempt}`)
      }
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_GENERATION_RETRIES) {
        logger.warn('ModifierGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed: ${lastError.message}, retrying...`)
        continue
      }
      throw lastError
    }
  }

  // TypeScript guard
  if (!validated) {
    throw lastError ?? new Error('Modifier generation failed unexpectedly')
  }

  // Generate unique ID
  const modifierId = `modifier_generated_${generateUid()}`
  const definition: ModifierDefinition = {
    ...validated,
    id: modifierId,
  }

  // Register in modifier registry
  registerModifier(definition)

  logger.info('ModifierGen', `Generated modifier: ${definition.name} (${definition.rarity} ${definition.category}, DV:${definition.dangerValue} RV:${definition.rewardValue})`)

  return definition
}

// ============================================
// MODIFIER SET GENERATION
// ============================================

const DEFAULT_MODIFIER_SET_CONFIG: ModifierSetConfig = {
  count: 5,
  rarityDistribution: { common: 40, uncommon: 35, rare: 20, legendary: 5 },
  categoryVariety: true,
}

export async function generateModifierSet(
  config?: Partial<ModifierSetConfig>
): Promise<ModifierDefinition[]> {
  const { count, rarityDistribution, categoryVariety, hints } = {
    ...DEFAULT_MODIFIER_SET_CONFIG,
    ...config,
  }

  const modifiers: ModifierDefinition[] = []
  const usedCategories = new Set<string>()

  // All categories for variety
  const allCategories: ModifierCategory[] = ['catalyst', 'omen', 'edict', 'seal']

  // Build weighted rarity pool
  const rarityPool: ModifierRarity[] = []
  const dist = rarityDistribution ?? DEFAULT_MODIFIER_SET_CONFIG.rarityDistribution!
  for (let i = 0; i < (dist.common ?? 0); i++) rarityPool.push('common')
  for (let i = 0; i < (dist.uncommon ?? 0); i++) rarityPool.push('uncommon')
  for (let i = 0; i < (dist.rare ?? 0); i++) rarityPool.push('rare')
  for (let i = 0; i < (dist.legendary ?? 0); i++) rarityPool.push('legendary')

  for (let i = 0; i < count; i++) {
    // Pick rarity from weighted pool
    const rarity = pickRandom(rarityPool)

    // Pick category (with variety if enabled)
    let category: ModifierCategory | undefined
    if (categoryVariety) {
      const availableCategories = allCategories.filter(c => !usedCategories.has(c))
      if (availableCategories.length > 0) {
        category = pickRandom(availableCategories)
        usedCategories.add(category)
      } else {
        // All categories used, reset and pick any
        usedCategories.clear()
        category = pickRandom(allCategories)
        usedCategories.add(category)
      }
    }

    // Get hint if provided
    const hint = hints?.[i % hints.length]

    try {
      const modifier = await generateModifier({ rarity, category, hint })
      modifiers.push(modifier)
      logger.debug('ModifierSetGen', `Generated ${i + 1}/${count}: ${modifier.name}`)
    } catch (error) {
      logger.error('ModifierSetGen', `Failed to generate modifier ${i + 1}/${count}:`, error)
      // Continue with other modifiers
    }
  }

  logger.info('ModifierSetGen', `Generated ${modifiers.length}/${count} modifiers`)
  return modifiers
}

// ============================================
// THEMED SET GENERATION
// ============================================

export interface ThemedModifierSetConfig {
  theme: 'starter' | 'elemental' | 'elite-hunter' | 'gold-rush' | 'glass-cannon'
  count?: number
}

const THEMED_HINTS: Record<string, { danger: string; reward: string; hints: string[] }> = {
  starter: {
    danger: 'simple combat difficulty',
    reward: 'gold and basic resources',
    hints: [
      'Simple trade-off for beginners',
      'Straightforward risk/reward',
      'Easy to understand effects',
    ],
  },
  elemental: {
    danger: 'element restrictions or vulnerabilities',
    reward: 'elemental damage bonuses',
    hints: [
      'Fire-themed restrictions and power',
      'Ice-themed slowing and control',
      'Lightning-themed speed and burst',
      'Void-themed mystery and power',
    ],
  },
  'elite-hunter': {
    danger: 'more elite encounters',
    reward: 'better rewards from elites',
    hints: [
      'Hunt the strong for glory',
      'Elite gauntlet challenge',
      'Prove your worth against the best',
    ],
  },
  'gold-rush': {
    danger: 'reduced healing and defense',
    reward: 'massive gold bonuses',
    hints: [
      'Greed is good, caution is not',
      'Fortune favors the bold (and fragile)',
      'All that glitters costs blood',
    ],
  },
  'glass-cannon': {
    danger: 'reduced max HP and defense',
    reward: 'starting power and damage',
    hints: [
      'Strike hard, die fast',
      'Offense is the only defense',
      'No room for mistakes',
    ],
  },
}

export async function generateThemedModifierSet(
  config: ThemedModifierSetConfig
): Promise<ModifierDefinition[]> {
  const { theme, count = 4 } = config
  const themeConfig = THEMED_HINTS[theme]

  if (!themeConfig) {
    throw new Error(`Unknown theme: ${theme}`)
  }

  const modifiers: ModifierDefinition[] = []

  for (let i = 0; i < count; i++) {
    const rarity: ModifierRarity = i === 0 ? 'common' : i < count - 1 ? 'uncommon' : 'rare'
    const hint = themeConfig.hints[i % themeConfig.hints.length]

    try {
      const modifier = await generateModifier({
        rarity,
        dangerTheme: themeConfig.danger,
        rewardTheme: themeConfig.reward,
        hint,
      })
      modifiers.push(modifier)
    } catch (error) {
      logger.error('ThemedModifierGen', `Failed to generate ${theme} modifier ${i + 1}:`, error)
    }
  }

  return modifiers
}
