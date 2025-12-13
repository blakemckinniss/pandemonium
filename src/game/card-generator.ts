import { chatCompletion, GROQ_MODEL } from '../lib/groq'
import { saveGeneratedCard } from '../stores/db'
import { registerCard, getCardDefinition } from './cards'
import type { CardDefinition, CardTheme, AtomicEffect } from '../types'
import { generateUid } from '../lib/utils'

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
  "effects": [AtomicEffect array]
}

AVAILABLE EFFECTS:
Combat:
- { "type": "damage", "amount": N } - Deal N damage to target
- { "type": "damage", "amount": N, "target": "allEnemies" } - Hit all enemies
- { "type": "block", "amount": N } - Gain N block
- { "type": "heal", "amount": N } - Restore N HP

Resource:
- { "type": "energy", "amount": N, "operation": "gain" } - Gain N energy
- { "type": "draw", "amount": N } - Draw N cards

Powers (duration-based effects):
- { "type": "applyPower", "powerId": "vulnerable", "amount": N } - Target takes 50% more damage
- { "type": "applyPower", "powerId": "weak", "amount": N } - Target deals 25% less damage
- { "type": "applyPower", "powerId": "frail", "amount": N } - Target gains 25% less block
- { "type": "applyPower", "powerId": "poison", "amount": N } - Deal N damage at turn start, reduce by 1
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

Respond with ONLY the JSON object. No explanation, no markdown code blocks.`

// ============================================
// GENERATION OPTIONS
// ============================================

export interface GenerationOptions {
  theme?: CardTheme
  rarity?: 'common' | 'uncommon' | 'rare'
  effectType?: string // Force specific effect type
  hint?: string // Creative direction hint
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

  parts.push(`Generate a ${rarity} ${theme} card.`)

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

  return definition
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
    return JSON.parse(cleaned)
  } catch (e) {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
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
  const valid: CardTheme[] = ['attack', 'skill', 'power', 'curse', 'status']
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
  const valid = ['starter', 'common', 'uncommon', 'rare']
  if (typeof rarity === 'string' && valid.includes(rarity)) {
    return rarity as CardDefinition['rarity']
  }
  return 'common'
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
