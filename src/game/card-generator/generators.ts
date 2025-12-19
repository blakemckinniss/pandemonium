// ============================================
// CARD/HERO/ENEMY GENERATION FUNCTIONS
// ============================================

import { chatCompletion, GROQ_MODEL } from '../../lib/groq'
import { saveGeneratedCard } from '../../stores/db'
import { registerCard, registerCardUnsafe, getCardDefinition, isValidCard } from '../cards'
import type { CardDefinition, CardTheme } from '../../types'
import { generateUid } from '../../lib/utils'
import { logger } from '../../lib/logger'
import { SYSTEM_PROMPT, HERO_SYSTEM_PROMPT, ENEMY_SYSTEM_PROMPT } from './prompts'
import { parseCardResponse, parseHeroResponse, parseEnemyResponse } from './parsing'
import { validateCard, validateHero, validateEnemy, difficultyToRarity } from './validation'
import { pickRandom, rarityToNum, themeToNum } from './helpers'
import { generateCardArtIfAvailable } from './art'
import type { GenerationOptions, HeroGenerationOptions, EnemyGenerationOptions } from './types'

// ============================================
// CARD GENERATION
// ============================================

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

  // Call Groq
  const response = await chatCompletion(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.8,
    maxTokens: 512,
  })

  // Parse response
  const parsed = parseCardResponse(response)

  // Validate and fix
  const validated = validateCard(parsed)

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

  // Save to IndexedDB
  await saveGeneratedCard(definition, GROQ_MODEL, userPrompt)

  // Register in card registry for immediate use (unsafe - may lack image until art generation)
  registerCardUnsafe(definition)

  // Optionally generate card art
  if (options?.generateArt) {
    const artResult = await generateCardArtIfAvailable(definition, options.artHint)
    if (artResult) {
      definition.image = artResult.url
    }
  }

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

  // Call Groq with hero system prompt
  const response = await chatCompletion(HERO_SYSTEM_PROMPT, userPrompt, {
    temperature: 0.9, // Higher creativity for unique heroes
    maxTokens: 768,
  })

  // Parse and validate
  const parsed = parseHeroResponse(response)
  const validated = validateHero(parsed)

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

  // Save to IndexedDB
  await saveGeneratedCard(definition, GROQ_MODEL, userPrompt)

  // Register in card registry
  registerCard(definition)

  // Optionally generate hero art
  if (options?.generateArt) {
    const artResult = await generateCardArtIfAvailable(definition, `Hero character portrait: ${validated.archetype}`)
    if (artResult) {
      definition.image = artResult.url
    }
  }

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

  // Call Groq with enemy system prompt
  const response = await chatCompletion(ENEMY_SYSTEM_PROMPT, userPrompt, {
    temperature: 0.85,
    maxTokens: 768,
  })

  // Parse and validate
  const parsed = parseEnemyResponse(response)
  const validated = validateEnemy(parsed)

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

  // Save to IndexedDB
  await saveGeneratedCard(definition, GROQ_MODEL, userPrompt)

  // Register in card registry
  registerCard(definition)

  // Optionally generate enemy art
  if (options?.generateArt) {
    const artResult = await generateCardArtIfAvailable(
      definition,
      `Dark fantasy monster portrait: ${validated.name}, menacing creature`
    )
    if (artResult) {
      definition.image = artResult.url
    }
  }

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
      const enemy = await generateEnemyCard({
        ...spec,
        generateArt: false, // Generate art separately in batch for efficiency
      })
      enemies.push(enemy)
      logger.debug('EnemyGen', `Generated: ${enemy.name}`)
    } catch (error) {
      logger.error('EnemyGen', 'Failed to generate enemy:', error)
      // Continue with other enemies
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
