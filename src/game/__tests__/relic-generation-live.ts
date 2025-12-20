/**
 * Live test script for relic generation
 * Run with: npx tsx src/game/__tests__/relic-generation-live.ts
 */

// Shim import.meta.env for Node environment (Vite compatibility)
;(globalThis as any).importMetaEnv = { DEV: true, VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY }

// Patch the logger module before importing anything else
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Direct Groq call to bypass Vite-dependent modules
import Groq from 'groq-sdk'
import { RELIC_SYSTEM_PROMPT } from '../card-generator/prompts'
import { parseRelicResponse } from '../card-generator/parsing'
import { validateRelic } from '../card-generator/validation'
import { registerRelic } from '../relics'
import type { RelicDefinition } from '../../types'

function generateUid(): string {
  return Math.random().toString(36).substring(2, 10)
}

async function generateRelicDirect(options?: {
  rarity?: 'common' | 'uncommon' | 'rare' | 'boss'
  trigger?: string
  hint?: string
}): Promise<RelicDefinition> {
  const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY })

  const parts: string[] = ['Generate a unique relic.']
  const rarity = options?.rarity ?? 'common'
  parts.push(`Rarity: ${rarity}.`)

  if (options?.trigger) {
    parts.push(`Trigger: ${options.trigger}.`)
  }
  if (options?.hint) {
    parts.push(`Theme hint: ${options.hint}`)
  }

  const userPrompt = parts.join(' ')

  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: RELIC_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.85,
    max_tokens: 512,
  })

  const response = completion.choices[0]?.message?.content ?? ''
  const parsed = parseRelicResponse(response)
  const validated = validateRelic(parsed)

  const relicId = `relic_generated_${generateUid()}`
  const definition: RelicDefinition = {
    id: relicId,
    name: validated.name,
    description: validated.description,
    rarity: validated.rarity,
    trigger: validated.trigger,
    effects: validated.effects,
  }

  registerRelic(definition)
  return definition
}

import type { RelicRarity, RelicTrigger } from '../../types'

const generateRelic = generateRelicDirect

const RARITY_COLORS = {
  common: '\x1b[37m',    // white
  uncommon: '\x1b[32m',  // green
  rare: '\x1b[34m',      // blue
  boss: '\x1b[35m',      // magenta
}
const RESET = '\x1b[0m'

async function testRelicGeneration() {
  console.log('\n🔮 Testing Live Relic Generation\n')
  console.log('=' .repeat(60))

  const testCases: { rarity: RelicRarity; trigger?: RelicTrigger; hint?: string }[] = [
    { rarity: 'common', trigger: 'onCombatStart' },
    { rarity: 'common', trigger: 'onTurnStart' },
    { rarity: 'uncommon', trigger: 'onCardPlay', hint: 'attack synergy' },
    { rarity: 'uncommon', trigger: 'onKill' },
    { rarity: 'rare', trigger: 'onDamaged' },
    { rarity: 'rare', trigger: 'passive', hint: 'defensive' },
  ]

  const results: { success: boolean; relic?: any; error?: string }[] = []

  for (const testCase of testCases) {
    const { rarity, trigger, hint } = testCase
    const color = RARITY_COLORS[rarity]

    console.log(`\n${color}[${rarity.toUpperCase()}]${RESET} Generating with trigger: ${trigger || 'random'}${hint ? ` (hint: ${hint})` : ''}`)

    try {
      const relic = await generateRelic({ rarity, trigger, hint })

      console.log(`  ✅ ${relic.name}`)
      console.log(`     "${relic.description}"`)
      console.log(`     Trigger: ${relic.trigger}`)
      console.log(`     Effects: ${JSON.stringify(relic.effects, null, 2).split('\n').map((l, i) => i === 0 ? l : '             ' + l).join('\n')}`)

      results.push({ success: true, relic })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`  ❌ Failed: ${message}`)
      results.push({ success: false, error: message })
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(60))
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  console.log(`\n📊 Results: ${successCount}/${testCases.length} successful`)

  if (failCount > 0) {
    console.log(`\n❌ Failures:`)
    results.forEach((r, i) => {
      if (!r.success) {
        console.log(`   ${i + 1}. ${r.error}`)
      }
    })
  }

  // Balance check
  console.log('\n🎯 Balance Analysis:')
  const successfulRelics = results.filter(r => r.success).map(r => r.relic!)

  for (const relic of successfulRelics) {
    const effectCount = relic.effects.length
    const hasMultipleEffects = effectCount > 1
    console.log(`   ${relic.name}: ${effectCount} effect(s) ${hasMultipleEffects ? '⚠️ (complex)' : '✓'}`)
  }

  console.log('\n✨ Live test complete!\n')

  return { successCount, failCount, results }
}

// Run the test
testRelicGeneration()
  .then(({ successCount, failCount }) => {
    process.exit(failCount > 0 ? 1 : 0)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
