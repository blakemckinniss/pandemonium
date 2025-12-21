// ============================================
// CARD/HERO/ENEMY GENERATION FUNCTIONS
// ============================================

import { chatCompletion, GROQ_MODEL } from '../../lib/groq'
import { saveGeneratedCard } from '../../stores/db'
import { registerCard, registerCardUnsafe, getCardDefinition, isValidCard } from '../cards'
import type { CardDefinition, CardTheme, RelicDefinition, RelicRarity, RelicTrigger } from '../../types'
import { generateUid } from '../../lib/utils'
import { logger } from '../../lib/logger'
import { loadPrompt } from '../../config/prompts/loader'
// Legacy prompts kept as fallback - will be removed once YAML is stable
import { SYSTEM_PROMPT, HERO_SYSTEM_PROMPT, ENEMY_SYSTEM_PROMPT, RELIC_SYSTEM_PROMPT } from './prompts'
import { parseCardResponse, parseHeroResponse, parseEnemyResponse, parseRelicResponse } from './parsing'
import { validateCard, validateHero, validateEnemy, validateRelic, difficultyToRarity } from './validation'
import { validateGeneratedCard, formatValidationResult } from './validators'
import { pickRandom, rarityToNum, themeToNum } from './helpers'
import { generateCardArt } from './art'
import type { GenerationOptions, HeroGenerationOptions, EnemyGenerationOptions, RelicGenerationOptions } from './types'
import { registerRelic } from '../relics'

// ============================================
// CARD GENERATION
// ============================================

const MAX_GENERATION_RETRIES = 3

export async function generateRandomCard(
  options?: GenerationOptions
): Promise<CardDefinition> {
  // Build user prompt
  const parts: string[] = []

  const rarity = options?.rarity ?? pickRandom(['common', 'uncommon', 'rare'])
  const theme = options?.theme ?? pickRandom(['attack', 'skill', 'power'] as CardTheme[])
  const element = options?.element

  if (element && element !== 'physical') {
    parts.push(`Generate a ${rarity} ${element} ${theme} card.`)
  } else {
    parts.push(`Generate a ${rarity} ${theme} card.`)
  }

  if (options?.effectType) {
    parts.push(`Must include a "${options.effectType}" effect.`)
  }

  if (options?.hint) {
    parts.push(`Theme hint: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  // Retry loop for validation failures
  let lastError: Error | null = null
  let validated: ReturnType<typeof validateCard> | null = null

  // Load prompt from YAML config (falls back to legacy if unavailable)
  let systemPrompt: string
  try {
    systemPrompt = await loadPrompt('card')
  } catch {
    logger.warn('CardGen', 'Failed to load YAML prompt, using legacy')
    systemPrompt = SYSTEM_PROMPT
  }

  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt++) {
    try {
      // Call Groq (slightly higher temperature on retries for variety)
      const response = await chatCompletion(systemPrompt, userPrompt, {
        temperature: 0.8 + (attempt - 1) * 0.05,
        maxTokens: 512,
      })

      // Parse response
      const parsed = parseCardResponse(response)

      // Validate and fix (basic validation with coercion)
      const attemptValidated = validateCard(parsed)

      // Full 3-layer validation (schema + registry + semantic)
      const fullValidation = validateGeneratedCard({
        id: 'pending',
        ...attemptValidated,
      })

      if (!fullValidation.success) {
        const errorDetails = formatValidationResult(fullValidation)
        if (attempt < MAX_GENERATION_RETRIES) {
          logger.warn('CardGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed validation, retrying...\n${errorDetails}`)
          continue // Retry with new generation
        }
        logger.error('CardGen', `Generated card failed validation after ${MAX_GENERATION_RETRIES} attempts:\n${errorDetails}`)
        throw new Error(`Generated card failed validation: ${JSON.stringify(fullValidation.errors)}`)
      }

      // Log warnings if any (but don't fail)
      if (fullValidation.warnings.length > 0) {
        logger.warn('CardGen', `Generated card has warnings: ${fullValidation.warnings.map(w => w.message).join(', ')}`)
      }

      // Success - store validated card and break
      validated = attemptValidated
      if (attempt > 1) {
        logger.info('CardGen', `Card generated successfully on attempt ${attempt}`)
      }
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_GENERATION_RETRIES) {
        logger.warn('CardGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed: ${lastError.message}, retrying...`)
        continue
      }
      throw lastError
    }
  }

  // TypeScript guard - validated should be set if we reach here
  if (!validated) {
    throw lastError ?? new Error('Card generation failed unexpectedly')
  }

  // Generate unique ID
  const cardId = `generated_${generateUid()}`
  const definition: CardDefinition = {
    ...validated,
    id: cardId,
    generatedFrom: {
      template: 'llm',
      seed: Date.now(),
      parameters: { rarity: rarityToNum(rarity), theme: themeToNum(theme) },
    },
  }

  // ALWAYS generate card art - cards MUST have images
  // This throws CardArtRequiredError if art generation fails
  const artResult = await generateCardArt(definition, options?.artHint)
  definition.image = artResult.url

  // Only save and register AFTER art succeeds
  await saveGeneratedCard(definition, GROQ_MODEL, userPrompt)
  registerCardUnsafe(definition)

  return definition
}

// ============================================
// HERO GENERATION
// ============================================

/**
 * Generate a random hero card via AI.
 * Heroes are ~2% of pack pulls (1 in 50 cards).
 */
export async function generateHero(
  options?: HeroGenerationOptions
): Promise<CardDefinition> {
  // Build user prompt
  const parts: string[] = ['Generate a unique hero character.']

  if (options?.archetype) {
    parts.push(`Archetype: ${options.archetype}.`)
  }

  if (options?.element && options.element !== 'physical') {
    parts.push(`Element affinity: ${options.element}.`)
  }

  if (options?.hint) {
    parts.push(`Theme hint: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  // Retry loop for validation failures
  let lastError: Error | null = null
  let validated: ReturnType<typeof validateHero> | null = null

  // Load prompt from YAML config (falls back to legacy if unavailable)
  let systemPrompt: string
  try {
    systemPrompt = await loadPrompt('hero')
  } catch {
    logger.warn('HeroGen', 'Failed to load YAML prompt, using legacy')
    systemPrompt = HERO_SYSTEM_PROMPT
  }

  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt++) {
    try {
      // Call Groq with hero system prompt (slightly higher temperature on retries)
      const response = await chatCompletion(systemPrompt, userPrompt, {
        temperature: 0.9 + (attempt - 1) * 0.03,
        maxTokens: 768,
      })

      // Parse and validate
      const parsed = parseHeroResponse(response)
      validated = validateHero(parsed)

      // Success - break out of retry loop
      if (attempt > 1) {
        logger.info('HeroGen', `Hero generated successfully on attempt ${attempt}`)
      }
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_GENERATION_RETRIES) {
        logger.warn('HeroGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed: ${lastError.message}, retrying...`)
        continue
      }
      throw lastError
    }
  }

  // TypeScript guard - validated should be set if we reach here
  if (!validated) {
    throw lastError ?? new Error('Hero generation failed unexpectedly')
  }

  // Generate unique ID
  const heroId = `hero_generated_${generateUid()}`
  const definition: CardDefinition = {
    id: heroId,
    name: validated.name,
    description: validated.description,
    energy: 0, // Heroes don't cost energy to "play"
    theme: 'hero',
    target: 'none',
    rarity: 'rare', // All heroes are rare
    element: validated.element,
    archetype: validated.archetype,
    heroStats: validated.heroStats,
    passive: validated.passive,
    activated: validated.activated,
    ultimate: validated.ultimate,
    effects: [], // Heroes don't have normal card effects
    generatedFrom: {
      template: 'llm_hero',
      seed: Date.now(),
      parameters: { archetype: validated.archetype },
    },
  }

  // ALWAYS generate hero art - heroes MUST have images
  const artResult = await generateCardArt(definition, `Hero character portrait: ${validated.archetype}`)
  definition.image = artResult.url

  // Only save and register AFTER art succeeds
  await saveGeneratedCard(definition, GROQ_MODEL, userPrompt)
  registerCard(definition)

  return definition
}

// ============================================
// ENEMY GENERATION
// ============================================

/**
 * Generate a random enemy card via AI.
 * Enemies have stats, abilities, and ultimates similar to heroes.
 */
export async function generateEnemyCard(
  options?: EnemyGenerationOptions
): Promise<CardDefinition> {
  // Build user prompt
  const parts: string[] = ['Generate a unique enemy creature.']

  if (options?.difficulty) {
    const tierNames = { 1: 'Tier 1 (early game)', 2: 'Tier 2 (mid game)', 3: 'Tier 3 (elite/boss)' }
    parts.push(`Difficulty: ${tierNames[options.difficulty]}.`)
  }

  if (options?.archetype) {
    parts.push(`Archetype: ${options.archetype}.`)
  }

  if (options?.element && options.element !== 'physical') {
    parts.push(`Element affinity: ${options.element}.`)
  }

  if (options?.hint) {
    parts.push(`Theme hint: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  // Retry loop for validation failures
  let lastError: Error | null = null
  let validated: ReturnType<typeof validateEnemy> | null = null

  // Load prompt from YAML config (falls back to legacy if unavailable)
  let systemPrompt: string
  try {
    systemPrompt = await loadPrompt('enemy')
  } catch {
    logger.warn('EnemyGen', 'Failed to load YAML prompt, using legacy')
    systemPrompt = ENEMY_SYSTEM_PROMPT
  }

  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt++) {
    try {
      // Call Groq with enemy system prompt (slightly higher temperature on retries)
      const response = await chatCompletion(systemPrompt, userPrompt, {
        temperature: 0.85 + (attempt - 1) * 0.03,
        maxTokens: 768,
      })

      // Parse and validate
      const parsed = parseEnemyResponse(response)
      validated = validateEnemy(parsed)

      // Success - break out of retry loop
      if (attempt > 1) {
        logger.info('EnemyGen', `Enemy generated successfully on attempt ${attempt}`)
      }
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_GENERATION_RETRIES) {
        logger.warn('EnemyGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed: ${lastError.message}, retrying...`)
        continue
      }
      throw lastError
    }
  }

  // TypeScript guard - validated should be set if we reach here
  if (!validated) {
    throw lastError ?? new Error('Enemy generation failed unexpectedly')
  }

  // Generate unique ID
  const enemyId = `enemy_${validated.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${generateUid().slice(0, 6)}`
  const definition: CardDefinition = {
    id: enemyId,
    name: validated.name,
    description: validated.description,
    energy: 0, // Enemies don't cost energy to "spawn"
    theme: 'enemy',
    target: 'none',
    rarity: difficultyToRarity(options?.difficulty ?? 1),
    element: validated.element,
    enemyStats: validated.enemyStats,
    enemyAbility: validated.enemyAbility,
    enemyUltimate: validated.enemyUltimate,
    effects: [], // Enemies don't have normal card effects
    generatedFrom: {
      template: 'llm_enemy',
      seed: Date.now(),
      parameters: { difficulty: options?.difficulty ?? 1, archetype: options?.archetype ?? 'unknown' },
    },
  }

  // ALWAYS generate enemy art - enemies MUST have images
  const artResult = await generateCardArt(
    definition,
    `Dark fantasy monster portrait: ${validated.name}, menacing creature`
  )
  definition.image = artResult.url

  // Only save and register AFTER art succeeds
  await saveGeneratedCard(definition, GROQ_MODEL, userPrompt)
  registerCard(definition)

  return definition
}

// ============================================
// BASE ENEMY SET GENERATION
// ============================================

/**
 * Generate the 10 base enemies for initial game setup.
 * Balanced across elements and difficulty tiers.
 */
export async function generateBaseEnemySet(): Promise<CardDefinition[]> {
  const enemySpecs: EnemyGenerationOptions[] = [
    // Tier 1 - Easy enemies (4)
    { difficulty: 1, archetype: 'Slime', element: 'physical', hint: 'Gelatinous creature, weak but annoying' },
    { difficulty: 1, archetype: 'Cultist', element: 'void', hint: 'Robed figure, ritual magic' },
    { difficulty: 1, archetype: 'Mage', element: 'fire', hint: 'Fire imp or small flame creature' },
    { difficulty: 1, archetype: 'Mage', element: 'ice', hint: 'Frost sprite or ice elemental' },

    // Tier 2 - Medium enemies (4)
    { difficulty: 2, archetype: 'Brute', element: 'physical', hint: 'Armored warrior or golem' },
    { difficulty: 2, archetype: 'Assassin', element: 'void', hint: 'Shadow stalker, applies debuffs' },
    { difficulty: 2, archetype: 'Guardian', element: 'physical', hint: 'Shield-bearing defender' },
    { difficulty: 2, archetype: 'Mage', element: 'lightning', hint: 'Storm elemental or thunder mage' },

    // Tier 3 - Elite enemies (2)
    { difficulty: 3, archetype: 'Berserker', element: 'fire', hint: 'Rage demon, gets stronger when hurt' },
    { difficulty: 3, archetype: 'Summoner', element: 'void', hint: 'Dark necromancer, powerful abilities' },
  ]

  const enemies: CardDefinition[] = []

  for (const spec of enemySpecs) {
    try {
      // Art is automatically generated for each enemy (mandatory)
      const enemy = await generateEnemyCard(spec)
      enemies.push(enemy)
      logger.debug('EnemyGen', `Generated: ${enemy.name}`)
    } catch (error) {
      logger.error('EnemyGen', 'Failed to generate enemy:', error)
      // Continue with other enemies - failures are logged but don't block
    }
  }

  return enemies
}

// ============================================
// LOAD GENERATED CARDS ON STARTUP
// ============================================

export async function loadGeneratedCardsIntoRegistry(): Promise<number> {
  const { getAllGeneratedCards, deleteGeneratedCard } = await import('../../stores/db')
  const records = await getAllGeneratedCards()

  let loaded = 0
  let purged = 0
  for (const record of records) {
    // Skip if already registered
    if (getCardDefinition(record.cardId)) continue

    // Self-regulate: purge corrupt cards missing required metadata
    if (!isValidCard(record.definition)) {
      console.warn(`[CardGenerator] Purging corrupt card from DB: ${record.cardId}`)
      await deleteGeneratedCard(record.cardId)
      purged++
      continue
    }

    registerCardUnsafe(record.definition)
    loaded++
  }

  if (purged > 0) {
    console.info(`[CardGenerator] Purged ${purged} corrupt cards from IndexedDB`)
  }

  return loaded
}

// ============================================
// RELIC GENERATION
// ============================================

/**
 * Generate a random relic via AI.
 * Relics are passive items that trigger effects during combat.
 */
export async function generateRelic(
  options?: RelicGenerationOptions
): Promise<RelicDefinition> {
  // Build user prompt
  const parts: string[] = ['Generate a unique relic.']

  const rarity = options?.rarity ?? pickRandom(['common', 'uncommon', 'rare'] as RelicRarity[])
  parts.push(`Rarity: ${rarity}.`)

  if (options?.trigger) {
    parts.push(`Trigger: ${options.trigger}.`)
  }

  if (options?.hint) {
    parts.push(`Theme hint: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  // Retry loop for validation failures
  let lastError: Error | null = null
  let validated: ReturnType<typeof validateRelic> | null = null

  // Load prompt from YAML config (falls back to legacy if unavailable)
  let systemPrompt: string
  try {
    systemPrompt = await loadPrompt('relic')
  } catch {
    logger.warn('RelicGen', 'Failed to load YAML prompt, using legacy')
    systemPrompt = RELIC_SYSTEM_PROMPT
  }

  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt++) {
    try {
      // Call Groq with relic system prompt
      const response = await chatCompletion(systemPrompt, userPrompt, {
        temperature: 0.85 + (attempt - 1) * 0.03,
        maxTokens: 512,
      })

      // Parse and validate
      const parsed = parseRelicResponse(response)
      validated = validateRelic(parsed)

      // Success - break out of retry loop
      if (attempt > 1) {
        logger.info('RelicGen', `Relic generated successfully on attempt ${attempt}`)
      }
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_GENERATION_RETRIES) {
        logger.warn('RelicGen', `Attempt ${attempt}/${MAX_GENERATION_RETRIES} failed: ${lastError.message}, retrying...`)
        continue
      }
      throw lastError
    }
  }

  // TypeScript guard - validated should be set if we reach here
  if (!validated) {
    throw lastError ?? new Error('Relic generation failed unexpectedly')
  }

  // Generate unique ID
  const relicId = `relic_generated_${generateUid()}`
  const definition: RelicDefinition = {
    id: relicId,
    name: validated.name,
    description: validated.description,
    rarity: validated.rarity,
    trigger: validated.trigger,
    effects: validated.effects,
  }

  // Register in relic registry
  registerRelic(definition)

  logger.info('RelicGen', `Generated relic: ${definition.name} (${definition.rarity}, ${definition.trigger})`)

  return definition
}

// ============================================
// RELIC SET GENERATION
// ============================================

export interface RelicSetConfig {
  count: number
  rarityDistribution?: {
    common?: number    // Weight for common relics
    uncommon?: number  // Weight for uncommon relics
    rare?: number      // Weight for rare relics
    boss?: number      // Weight for boss relics
  }
  triggerVariety?: boolean  // Ensure different triggers (default: true)
  hints?: string[]          // Theme hints to cycle through
}

const DEFAULT_RELIC_SET_CONFIG: RelicSetConfig = {
  count: 6,
  rarityDistribution: { common: 40, uncommon: 35, rare: 20, boss: 5 },
  triggerVariety: true,
}

/**
 * Generate a set of relics with variety constraints.
 * Useful for initializing relic pools or reward drops.
 */
export async function generateRelicSet(
  config?: Partial<RelicSetConfig>
): Promise<RelicDefinition[]> {
  const { count, rarityDistribution, triggerVariety, hints } = {
    ...DEFAULT_RELIC_SET_CONFIG,
    ...config,
  }

  const relics: RelicDefinition[] = []
  const usedTriggers = new Set<string>()

  // Available triggers for variety
  const allTriggers: RelicTrigger[] = [
    'onCombatStart', 'onCombatEnd', 'onTurnStart', 'onTurnEnd',
    'onCardPlayed', 'onAttack', 'onKill', 'onDamaged', 'onHeal', 'onGoldGained', 'passive'
  ]

  // Build weighted rarity pool
  const rarityPool: RelicRarity[] = []
  const dist = rarityDistribution ?? DEFAULT_RELIC_SET_CONFIG.rarityDistribution!
  for (let i = 0; i < (dist.common ?? 0); i++) rarityPool.push('common')
  for (let i = 0; i < (dist.uncommon ?? 0); i++) rarityPool.push('uncommon')
  for (let i = 0; i < (dist.rare ?? 0); i++) rarityPool.push('rare')
  for (let i = 0; i < (dist.boss ?? 0); i++) rarityPool.push('boss')

  for (let i = 0; i < count; i++) {
    // Pick rarity from weighted pool
    const rarity = pickRandom(rarityPool)

    // Pick trigger (with variety if enabled)
    let trigger: RelicTrigger | undefined
    if (triggerVariety) {
      const availableTriggers = allTriggers.filter(t => !usedTriggers.has(t))
      if (availableTriggers.length > 0) {
        trigger = pickRandom(availableTriggers)
        usedTriggers.add(trigger)
      } else {
        // All triggers used, reset and pick any
        usedTriggers.clear()
        trigger = pickRandom(allTriggers)
        usedTriggers.add(trigger)
      }
    }

    // Get hint if provided
    const hint = hints?.[i % hints.length]

    try {
      const relic = await generateRelic({ rarity, trigger, hint })
      relics.push(relic)
      logger.debug('RelicSetGen', `Generated ${i + 1}/${count}: ${relic.name}`)
    } catch (error) {
      logger.error('RelicSetGen', `Failed to generate relic ${i + 1}/${count}:`, error)
      // Continue with other relics
    }
  }

  logger.info('RelicSetGen', `Generated ${relics.length}/${count} relics`)
  return relics
}
