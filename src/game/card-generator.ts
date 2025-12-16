import { chatCompletion, GROQ_MODEL } from '../lib/groq'
import { saveGeneratedCard } from '../stores/db'
import { registerCard, getCardDefinition } from './cards'
import type { CardDefinition, CardTheme, AtomicEffect } from '../types'
import { generateUid } from '../lib/utils'
import {
  generateFromCardDef,
  checkServiceHealth,
  getImageUrl,
  type GenerateResponse,
} from '../lib/image-gen'

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are a card designer for Pandemonium, a Slay the Spire-style roguelike deckbuilder.

Generate creative, balanced cards as valid JSON. Each card must have:
- Unique thematic name (creative, evocative)
- Clear description matching effects exactly
- Balanced energy cost (guidelines below)
- One or more atomic effects

CARD SCHEMA (respond with ONLY this JSON, no markdown):
{
  "name": "string",
  "description": "string (describe effects clearly)",
  "energy": number (0-3),
  "theme": "attack" | "skill" | "power",
  "target": "enemy" | "self" | "allEnemies" | "randomEnemy",
  "rarity": "common" | "uncommon" | "rare",
  "element": "physical" | "fire" | "ice" | "lightning" | "void" (optional, default "physical"),
  "effects": [AtomicEffect array]
}

AVAILABLE EFFECTS:
Combat:
- { "type": "damage", "amount": N } - Deal N physical damage to target
- { "type": "damage", "amount": N, "element": "fire" } - Deal N fire damage (applies Burning)
- { "type": "damage", "amount": N, "element": "ice" } - Deal N ice damage (applies Frozen)
- { "type": "damage", "amount": N, "element": "lightning" } - Deal N lightning damage (applies Charged)
- { "type": "damage", "amount": N, "element": "void" } - Deal N void damage (applies Oiled)
- { "type": "damage", "amount": N, "target": "allEnemies" } - Hit all enemies
- { "type": "damage", "amount": N, "piercing": true } - Deal N damage ignoring block/barrier
- { "type": "block", "amount": N } - Gain N block (decays at turn start)
- { "type": "block", "amount": N, "persistent": true } - Gain N barrier (doesn't decay, absorbed after block)
- { "type": "heal", "amount": N } - Restore N HP

Resource:
- { "type": "energy", "amount": N, "operation": "gain" } - Gain N energy
- { "type": "draw", "amount": N } - Draw N cards

Powers (duration-based effects):
- { "type": "applyPower", "powerId": "vulnerable", "amount": N } - Target takes 50% more damage
- { "type": "applyPower", "powerId": "weak", "amount": N } - Target deals 25% less damage
- { "type": "applyPower", "powerId": "frail", "amount": N } - Target gains 25% less block
- { "type": "applyPower", "powerId": "poison", "amount": N } - Deal N damage at turn start, reduce by 1

Elemental Status Powers:
- { "type": "applyPower", "powerId": "burning", "amount": N } - Fire DoT: N damage/turn, enables Fire combos
- { "type": "applyPower", "powerId": "wet", "amount": N } - Water status: enables Lightning/Ice combos
- { "type": "applyPower", "powerId": "frozen", "amount": N } - Ice status: slowed, enables Physical shatter
- { "type": "applyPower", "powerId": "charged", "amount": N } - Lightning status: enables chain lightning
- { "type": "applyPower", "powerId": "oiled", "amount": N } - Void status: enables Fire explosion
- { "type": "applyPower", "powerId": "strength", "amount": N, "target": "self" } - Deal N more damage
- { "type": "applyPower", "powerId": "dexterity", "amount": N, "target": "self" } - Gain N more block
- { "type": "applyPower", "powerId": "thorns", "amount": N, "target": "self" } - Deal N damage when hit
- { "type": "applyPower", "powerId": "regen", "amount": N, "target": "self" } - Heal N at turn end
- { "type": "applyPower", "powerId": "blockRetaliation", "amount": N, "target": "self" } - When you gain Block, deal N damage to random enemy
- { "type": "applyPower", "powerId": "lifelink", "amount": N, "target": "self" } - When you attack, heal N HP
- { "type": "applyPower", "powerId": "energizeOnKill", "amount": N, "target": "self" } - When you kill an enemy, gain N Energy
- { "type": "applyPower", "powerId": "drawOnKill", "amount": N, "target": "self" } - When you kill an enemy, draw N cards
- { "type": "applyPower", "powerId": "energizeNextTurn", "amount": N, "target": "self" } - At turn start, gain N Energy
- { "type": "applyPower", "powerId": "drawPerTurn", "amount": N, "target": "self" } - At turn start, draw N cards
- { "type": "applyPower", "powerId": "eternalFlames", "amount": N, "target": "self" } - At turn start, deal N damage to ALL enemies
- { "type": "applyPower", "powerId": "noxiousFumes", "amount": N, "target": "self" } - At turn start, apply N Poison to ALL enemies
- { "type": "applyPower", "powerId": "temporalAnchor", "amount": N, "target": "self" } - At turn start, gain N Energy and draw 1 card
- { "type": "applyPower", "powerId": "echoShield", "amount": N, "target": "self" } - Next card played grants N Block (consumed)

Card manipulation:
- { "type": "discard", "target": "randomHand", "amount": N } - Discard N random cards
- { "type": "exhaust", "target": "thisCard" } - Remove this card from combat
- { "type": "retain", "target": "thisCard" } - This card stays in hand at end of turn
- { "type": "retain", "target": "hand" } - All cards in hand stay at end of turn
- { "type": "scry", "amount": N } - Look at top N cards, choose which go to bottom
- { "type": "tutor", "from": "drawPile", "destination": "hand" } - Search draw pile, add card to hand
- { "type": "tutor", "from": "drawPile", "filter": { "theme": "attack" }, "destination": "hand" } - Search for an Attack card
- { "type": "tutor", "from": "discardPile", "destination": "hand", "shuffle": true } - Retrieve from discard, shuffle deck
- { "type": "upgrade", "target": "randomHand" } - Upgrade a random card in hand
- { "type": "upgrade", "target": "hand" } - Upgrade all cards in hand
- { "type": "transform", "target": "randomHand", "toRandom": { "pool": "all" } } - Transform a random card to another card
- { "type": "transform", "target": "randomHand", "toRandom": { "pool": "rare" } } - Transform to a random rare card
- { "type": "transform", "target": "randomHand", "toCardId": "strike" } - Transform to a specific card

Meta effects:
- { "type": "repeat", "times": N, "effects": [...] } - Repeat effects N times
- { "type": "conditional", "condition": {...}, "then": [...], "else": [...] }

BALANCE GUIDELINES:
- 0 energy: Very weak effect OR has downside (discard, exhaust, etc.)
- 1 energy: ~6 damage OR ~5 block OR 1 draw OR minor power (1-2 stacks)
- 2 energy: ~10 damage OR ~8 block + secondary effect OR 2 draw
- 3 energy: ~14 damage OR powerful combo OR strong power application

RARITY GUIDELINES:
- common: Simple, straightforward effects (1-2 effects)
- uncommon: Interesting combinations or conditions (2-3 effects)
- rare: Powerful or unique mechanics (complex combinations)

THEME GUIDELINES:
- attack: Primary effect is damage, red border
- skill: Block, draw, or utility, blue border
- power: Persistent effects that last the combat, purple border

ELEMENTAL SYSTEM:
Elements (fire/ice/lightning/void) add strategic depth through combos:
- Fire attacks apply Burning, combo with Oiled for Explosion (2x damage)
- Ice attacks apply Frozen, combo with Physical for Shatter (1.5x, execute at 15% HP)
- Lightning attacks apply Charged, combo with Wet for Conducted (1.5x, chains to all)
- Void attacks apply Oiled, combo with Burning for Explosion (2x damage)
- Wet can be applied to enable Lightning/Ice combos

Design elemental cards to synergize: apply a status with one card, trigger combo with another.
Use "element" field on the card for thematic elemental cards.

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

// ============================================
// HERO SYSTEM PROMPT
// ============================================

const HERO_SYSTEM_PROMPT = `You are a hero designer for Pandemonium, a Slay the Spire-style roguelike deckbuilder.

Generate unique hero characters as valid JSON. Heroes are like MTG Planeswalkers - they represent the player and have:
- Passive ability (triggers at combat start)
- Activated ability (usable once per turn, costs energy)
- Ultimate ability (charges over turns, powerful effect)

HERO SCHEMA (respond with ONLY this JSON, no markdown):
{
  "name": "string (unique character name)",
  "description": "string (1-2 sentence character lore/identity)",
  "archetype": "string (e.g., Warrior, Mage, Necromancer, Trickster, Elementalist, etc.)",
  "element": "physical" | "fire" | "ice" | "lightning" | "void",
  "heroStats": {
    "health": number (60-100, default 80),
    "energy": number (2-4, default 3),
    "drawPerTurn": number (4-6, default 5)
  },
  "passive": [AtomicEffect array - triggers at combat start],
  "activated": {
    "description": "string (what the ability does)",
    "effects": [AtomicEffect array],
    "energyCost": number (1-3)
  },
  "ultimate": {
    "description": "string (what the ultimate does)",
    "effects": [AtomicEffect array],
    "chargesRequired": number (3-6),
    "chargeOn": "turnStart" | "turnEnd" | "cardPlayed" | "damage"
  }
}

AVAILABLE EFFECTS (same as cards):
Combat: damage, block, heal
Resource: energy (gain), draw
Powers: applyPower (strength, dexterity, vulnerable, weak, poison, burning, etc.)
Card manipulation: discard, exhaust, scry, tutor, upgrade, transform

BALANCE GUIDELINES:
- Passive: Mild effect, 1-2 stacks of a power OR minor stat boost
- Activated: Worth ~1-2 energy card, usable strategically once per turn
- Ultimate: Powerful payoff worth building toward (3-6 turns to charge)

ARCHETYPE EXAMPLES:
- Warrior: Physical focus, strength/block synergy
- Mage: Elemental damage, card draw, spell synergy
- Necromancer: Poison, lifesteal, exhaust synergy
- Trickster: Card manipulation, weak/vulnerable, burst damage
- Elementalist: Multi-element combos, status application
- Berserker: High damage, low defense, rage mechanics
- Paladin: Block, healing, thorns, protective powers
- Assassin: Piercing damage, poison, execute effects
- Summoner: Add cards to deck, token-like effects
- Chronomancer: Extra turns, card replay, temporal effects

Create unique heroes with cohesive themes. The archetype should inform all three abilities.

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

// ============================================
// ENEMY SYSTEM PROMPT
// ============================================

const ENEMY_SYSTEM_PROMPT = `You are an enemy designer for Pandemonium, a Slay the Spire-style roguelike deckbuilder.

Generate unique enemy characters as valid JSON. Enemies are like Hero cards but fight against the player:
- Health range (randomized at spawn)
- Base damage and energy pool
- Regular ability (used on their turn, costs energy)
- Ultimate ability (triggers at low health or special conditions)

ENEMY SCHEMA (respond with ONLY this JSON, no markdown):
{
  "name": "string (unique enemy name)",
  "description": "string (1-2 sentence enemy lore/behavior)",
  "enemyStats": {
    "healthRange": [min, max] (e.g., [20, 30]),
    "baseDamage": number (default attack damage, 4-15),
    "energy": number (2-4, energy pool per turn)
  },
  "element": "physical" | "fire" | "ice" | "lightning" | "void" (optional),
  "vulnerabilities": ["element", ...] (optional, takes 1.5x damage),
  "resistances": ["element", ...] (optional, takes 0.5x damage),
  "enemyAbility": {
    "id": "string (snake_case identifier)",
    "name": "string (ability name)",
    "description": "string (what the ability does)",
    "effects": [AtomicEffect array],
    "energyCost": number (1-3),
    "cooldown": number (0-3, turns between uses, optional)
  },
  "enemyUltimate": {
    "id": "string (snake_case identifier)",
    "name": "string (ultimate name)",
    "description": "string (what the ultimate does)",
    "effects": [AtomicEffect array],
    "trigger": "lowHealth" | "enraged" | "turnCount",
    "triggerValue": number (HP% threshold or turn count)
  }
}

AVAILABLE EFFECTS (enemies target the player):
Combat:
- { "type": "damage", "amount": N } - Deal N damage to player
- { "type": "damage", "amount": N, "element": "fire" } - Deal N fire damage (applies Burning)
- { "type": "damage", "amount": N, "target": "self" } - Deal N damage to self
- { "type": "block", "amount": N, "target": "self" } - Enemy gains N block

Powers (applied to player as debuffs):
- { "type": "applyPower", "powerId": "vulnerable", "amount": N, "target": "player" }
- { "type": "applyPower", "powerId": "weak", "amount": N, "target": "player" }
- { "type": "applyPower", "powerId": "frail", "amount": N, "target": "player" }
- { "type": "applyPower", "powerId": "poison", "amount": N, "target": "player" }
- { "type": "applyPower", "powerId": "burning", "amount": N, "target": "player" }

Powers (self-buffs for enemy):
- { "type": "applyPower", "powerId": "strength", "amount": N, "target": "self" }
- { "type": "applyPower", "powerId": "thorns", "amount": N, "target": "self" }
- { "type": "applyPower", "powerId": "regen", "amount": N, "target": "self" }

Card disruption:
- { "type": "discard", "target": "randomHand", "amount": N } - Force player to discard N cards

Healing:
- { "type": "heal", "amount": N, "target": "self" } - Enemy heals N HP

BALANCE GUIDELINES by difficulty tier:
Tier 1 (early game): 15-30 HP, 4-6 base damage, simple abilities
Tier 2 (mid game): 30-50 HP, 6-10 base damage, debuff abilities
Tier 3 (late game/elite): 50-80 HP, 10-15 base damage, complex abilities + ultimate

ENEMY ARCHETYPES:
- Slime: Low HP, weak attack, applies status effects
- Cultist: Medium HP, buffs self over time
- Brute: High HP, heavy damage, low ability use
- Mage: Low HP, elemental attacks, applies burning/frozen
- Assassin: Medium HP, high damage, applies vulnerable
- Guardian: High HP, lots of block, thorns
- Summoner: Medium HP, spawns minions or applies effects
- Berserker: Gets stronger as HP drops (enrage ultimate)

ULTIMATE TRIGGERS:
- lowHealth: Fires when HP drops below triggerValue% (e.g., 30 = 30% HP)
- enraged: Fires after taking N damage total (triggerValue = damage threshold)
- turnCount: Fires after N turns (triggerValue = turn number)

Create enemies that are challenging but fair. Provide clear counterplay opportunities.

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

// ============================================
// GENERATION OPTIONS
// ============================================

export interface EnemyGenerationOptions {
  difficulty?: 1 | 2 | 3 // Tier 1 (easy), 2 (medium), 3 (hard)
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  archetype?: string // Slime, Cultist, Brute, etc.
  hint?: string // Creative direction hint
  generateArt?: boolean // Generate enemy art via image service
}

export interface GenerationOptions {
  theme?: CardTheme
  rarity?: 'common' | 'uncommon' | 'rare'
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  effectType?: string // Force specific effect type
  hint?: string // Creative direction hint
  generateArt?: boolean // Generate card art via image service
  artHint?: string // Custom hint for art generation
}

export interface HeroGenerationOptions {
  archetype?: string // Specific archetype hint (Warrior, Mage, etc.)
  element?: 'physical' | 'fire' | 'ice' | 'lightning' | 'void'
  hint?: string // Creative direction hint
  generateArt?: boolean // Generate hero art via image service
}

// ============================================
// GENERATION FUNCTION
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

  // Register in card registry for immediate use
  registerCard(definition)

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
// HERO GENERATION FUNCTION
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
// ENEMY GENERATION FUNCTION
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

function parseEnemyResponse(response: string): Record<string, unknown> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>
    }
    throw new Error(`Failed to parse enemy response: ${response}`)
  }
}

interface ValidatedEnemy {
  name: string
  description: string
  element: CardDefinition['element']
  enemyStats: NonNullable<CardDefinition['enemyStats']>
  enemyAbility: NonNullable<CardDefinition['enemyAbility']>
  enemyUltimate?: CardDefinition['enemyUltimate']
}

function validateEnemy(data: Record<string, unknown>): ValidatedEnemy {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Enemy must have a name')
  }

  // Validate enemyStats
  const rawStats = data.enemyStats as Record<string, unknown> | undefined
  if (!rawStats) {
    throw new Error('Enemy must have enemyStats')
  }

  const healthRange = Array.isArray(rawStats.healthRange)
    ? [clamp(Number(rawStats.healthRange[0]) || 20, 10, 200), clamp(Number(rawStats.healthRange[1]) || 30, 15, 250)]
    : [20, 30]

  const enemyStats: NonNullable<CardDefinition['enemyStats']> = {
    healthRange: healthRange as [number, number],
    baseDamage: clamp(Number(rawStats.baseDamage) || 6, 2, 30),
    energy: clamp(Number(rawStats.energy) || 2, 1, 5),
    element: validateElement(rawStats.element ?? data.element),
    vulnerabilities: validateElementArray(data.vulnerabilities),
    resistances: validateElementArray(data.resistances),
  }

  // Validate enemyAbility
  const rawAbility = data.enemyAbility as Record<string, unknown> | undefined
  if (!rawAbility || !rawAbility.effects || !Array.isArray(rawAbility.effects)) {
    throw new Error('Enemy must have an enemyAbility with effects')
  }

  const enemyAbility: NonNullable<CardDefinition['enemyAbility']> = {
    id: String(rawAbility.id || 'ability'),
    name: String(rawAbility.name || 'Attack'),
    description: String(rawAbility.description || 'A special attack'),
    effects: (rawAbility.effects as AtomicEffect[]).map(validateEffect),
    energyCost: clamp(Number(rawAbility.energyCost) || 1, 1, 4),
    cooldown: rawAbility.cooldown ? clamp(Number(rawAbility.cooldown), 0, 5) : undefined,
  }

  // Validate enemyUltimate (optional for Tier 1 enemies)
  let enemyUltimate: CardDefinition['enemyUltimate'] | undefined
  const rawUltimate = data.enemyUltimate as Record<string, unknown> | undefined
  if (rawUltimate && rawUltimate.effects && Array.isArray(rawUltimate.effects)) {
    const validTriggers = ['lowHealth', 'enraged', 'turnCount'] as const
    const trigger = validTriggers.includes(rawUltimate.trigger as typeof validTriggers[number])
      ? rawUltimate.trigger as typeof validTriggers[number]
      : 'lowHealth'

    enemyUltimate = {
      id: String(rawUltimate.id || 'ultimate'),
      name: String(rawUltimate.name || 'Desperation'),
      description: String(rawUltimate.description || 'A desperate attack'),
      effects: (rawUltimate.effects as AtomicEffect[]).map(validateEffect),
      trigger,
      triggerValue: clamp(Number(rawUltimate.triggerValue) || 30, 10, 100),
    }
  }

  return {
    name: data.name,
    description: String(data.description || `A dangerous ${data.name}.`),
    element: validateElement(data.element),
    enemyStats,
    enemyAbility,
    enemyUltimate,
  }
}

function validateElementArray(arr: unknown): NonNullable<CardDefinition['element']>[] | undefined {
  if (!Array.isArray(arr)) return undefined
  const valid = ['physical', 'fire', 'ice', 'lightning', 'void'] as const
  const result = arr.filter((e): e is typeof valid[number] => typeof e === 'string' && valid.includes(e as typeof valid[number]))
  return result.length > 0 ? result : undefined
}

function difficultyToRarity(difficulty: number): CardDefinition['rarity'] {
  if (difficulty >= 3) return 'rare'
  if (difficulty >= 2) return 'uncommon'
  return 'common'
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
      console.log(`[generateBaseEnemySet] Generated: ${enemy.name}`)
    } catch (error) {
      console.error(`[generateBaseEnemySet] Failed to generate enemy:`, error)
      // Continue with other enemies
    }
  }

  return enemies
}

function parseHeroResponse(response: string): Partial<CardDefinition> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Partial<CardDefinition>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Partial<CardDefinition>
    }
    throw new Error(`Failed to parse hero response: ${response}`)
  }
}

interface ValidatedHero {
  name: string
  description: string
  archetype: string
  element: CardDefinition['element']
  heroStats: NonNullable<CardDefinition['heroStats']>
  passive: NonNullable<CardDefinition['passive']>
  activated: NonNullable<CardDefinition['activated']>
  ultimate: NonNullable<CardDefinition['ultimate']>
}

function validateHero(hero: Partial<CardDefinition>): ValidatedHero {
  if (!hero.name || typeof hero.name !== 'string') {
    throw new Error('Hero must have a name')
  }

  // Validate heroStats with defaults
  const heroStats = {
    health: clamp(hero.heroStats?.health ?? 80, 60, 100),
    energy: clamp(hero.heroStats?.energy ?? 3, 2, 4),
    drawPerTurn: clamp(hero.heroStats?.drawPerTurn ?? 5, 4, 6),
  }

  // Validate passive (default to 1 strength if missing)
  const passive = hero.passive && Array.isArray(hero.passive) && hero.passive.length > 0
    ? hero.passive.map(validateEffect)
    : [{ type: 'applyPower' as const, powerId: 'strength', amount: 1, target: 'self' as const }]

  // Validate activated ability
  if (!hero.activated || !hero.activated.effects || !Array.isArray(hero.activated.effects)) {
    throw new Error('Hero must have an activated ability with effects')
  }
  const activated = {
    description: hero.activated.description || 'Activated ability',
    effects: hero.activated.effects.map(validateEffect),
    energyCost: clamp(hero.activated.energyCost ?? 1, 1, 3),
  }

  // Validate ultimate ability
  if (!hero.ultimate || !hero.ultimate.effects || !Array.isArray(hero.ultimate.effects)) {
    throw new Error('Hero must have an ultimate ability with effects')
  }
  const validChargeOn = ['turnStart', 'turnEnd', 'cardPlayed', 'damage'] as const
  const ultimate = {
    description: hero.ultimate.description || 'Ultimate ability',
    effects: hero.ultimate.effects.map(validateEffect),
    chargesRequired: clamp(hero.ultimate.chargesRequired ?? 4, 3, 6),
    chargeOn: validChargeOn.includes(hero.ultimate.chargeOn as typeof validChargeOn[number])
      ? hero.ultimate.chargeOn as typeof validChargeOn[number]
      : 'turnStart',
  }

  return {
    name: hero.name,
    description: hero.description || `A mysterious ${hero.archetype || 'hero'}.`,
    archetype: hero.archetype || 'Unknown',
    element: validateElement(hero.element),
    heroStats,
    passive,
    activated,
    ultimate,
  }
}

/**
 * Generate card art if the image service is available.
 * Non-blocking - returns null if service unavailable.
 */
async function generateCardArtIfAvailable(
  card: CardDefinition,
  customHint?: string
): Promise<GenerateResponse | null> {
  try {
    const serviceAvailable = await checkServiceHealth()
    if (!serviceAvailable) {
      console.warn('[card-generator] Image service unavailable, skipping art generation')
      return null
    }

    const result = await generateFromCardDef(card, { customHint })
    // Convert relative URL to full URL
    result.url = getImageUrl(result.filename)
    return result
  } catch (error) {
    console.error('[card-generator] Art generation failed:', error)
    return null
  }
}

// ============================================
// PARSING & VALIDATION
// ============================================

function parseCardResponse(response: string): Partial<CardDefinition> {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned) as Partial<CardDefinition>
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Partial<CardDefinition>
    }
    throw new Error(`Failed to parse card response: ${response}`)
  }
}

function validateCard(card: Partial<CardDefinition>): Omit<CardDefinition, 'id'> {
  // Required fields
  if (!card.name || typeof card.name !== 'string') {
    throw new Error('Card must have a name')
  }

  if (!card.effects || !Array.isArray(card.effects) || card.effects.length === 0) {
    throw new Error('Card must have at least one effect')
  }

  // Defaults and coercion
  // For generated cards, always use simple number energy (LLM should produce numbers)
  const energyValue = typeof card.energy === 'number' ? card.energy : 1

  const validated: Omit<CardDefinition, 'id'> = {
    name: card.name,
    description: card.description || generateDescription(card.effects),
    energy: clamp(energyValue, 0, 5),
    theme: validateTheme(card.theme),
    target: validateTarget(card.target),
    effects: card.effects.map(validateEffect),
    rarity: validateRarity(card.rarity),
    element: validateElement(card.element),
  }

  return validated
}

function validateEffect(effect: AtomicEffect): AtomicEffect {
  // Basic validation - ensure required fields exist
  if (!effect.type) {
    throw new Error('Effect must have a type')
  }

  // Coerce amounts to numbers
  if ('amount' in effect && typeof effect.amount !== 'number') {
    (effect as { amount: number }).amount = Number(effect.amount) || 1
  }

  return effect
}

function validateTheme(theme: unknown): CardTheme {
  const valid: CardTheme[] = ['attack', 'skill', 'power', 'curse', 'status', 'hero', 'enemy']
  if (typeof theme === 'string' && valid.includes(theme as CardTheme)) {
    return theme as CardTheme
  }
  return 'attack'
}

function validateTarget(target: unknown): CardDefinition['target'] {
  const valid = ['self', 'player', 'enemy', 'randomEnemy', 'allEnemies', 'weakestEnemy']
  if (typeof target === 'string' && valid.includes(target)) {
    return target as CardDefinition['target']
  }
  return 'enemy'
}

function validateRarity(rarity: unknown): CardDefinition['rarity'] {
  const valid = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary', 'mythic', 'ancient']
  if (typeof rarity === 'string' && valid.includes(rarity)) {
    return rarity as CardDefinition['rarity']
  }
  return 'common'
}

function validateElement(element: unknown): CardDefinition['element'] {
  const valid = ['physical', 'fire', 'ice', 'lightning', 'void']
  if (typeof element === 'string' && valid.includes(element)) {
    return element as CardDefinition['element']
  }
  return 'physical'
}

// ============================================
// HELPERS
// ============================================

function generateDescription(effects: AtomicEffect[]): string {
  return effects
    .map((e) => {
      // Helper to get numeric value from EffectValue
      const getAmount = (val: unknown): number | string => {
        if (typeof val === 'number') return val
        if (typeof val === 'object' && val && 'value' in val) return (val as { value: number }).value
        return 'X'
      }

      switch (e.type) {
        case 'damage':
          return `Deal ${getAmount(e.amount)} damage.`
        case 'block':
          return `Gain ${getAmount(e.amount)} Block.`
        case 'heal':
          return `Heal ${getAmount(e.amount)} HP.`
        case 'draw':
          return `Draw ${getAmount(e.amount)} card(s).`
        case 'applyPower':
          return `Apply ${getAmount(e.amount)} ${e.powerId}.`
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join(' ')
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function rarityToNum(rarity: string): number {
  return { common: 1, uncommon: 2, rare: 3 }[rarity] ?? 1
}

function themeToNum(theme: string): number {
  return { attack: 1, skill: 2, power: 3 }[theme] ?? 1
}

// ============================================
// LOAD GENERATED CARDS ON STARTUP
// ============================================

export async function loadGeneratedCardsIntoRegistry(): Promise<number> {
  const { getAllGeneratedCards } = await import('../stores/db')
  const records = await getAllGeneratedCards()

  let loaded = 0
  for (const record of records) {
    // Skip if already registered
    if (getCardDefinition(record.cardId)) continue

    registerCard(record.definition)
    loaded++
  }

  return loaded
}

// ============================================
// PACK GENERATION
// ============================================

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

const DEFAULT_PACK_CONFIG: PackConfig = {
  size: 6,
  rarityWeights: { common: 60, uncommon: 30, rare: 10 },
  elementWeights: { physical: 30, fire: 20, ice: 20, lightning: 15, void: 15 },
  heroChance: 2, // 2% chance per card = ~1 in 50
  guaranteedRare: false,
  maxSameElement: 2, // Max 2 cards of same element per pack
}

type ElementType = 'physical' | 'fire' | 'ice' | 'lightning' | 'void'

/**
 * Generate a pack of random cards.
 * Uses weighted rarity and element distribution.
 * Each card has a small chance (~2%) to be a hero instead.
 */
export async function generatePack(
  config: Partial<PackConfig> = {}
): Promise<CardDefinition[]> {
  const cfg = { ...DEFAULT_PACK_CONFIG, ...config }
  const cards: CardDefinition[] = []
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
        generateArt: true,
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
      generateArt: true,
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
