import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRelic } from '../card-generator/generators'

// Mock the Groq API
vi.mock('../../lib/groq', () => ({
  chatCompletion: vi.fn(),
  GROQ_MODEL: 'test-model',
}))

// Mock logger
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Relic Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates a valid common relic with onCombatStart trigger', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'War Horn',
      description: 'Start combat with 1 Strength.',
      rarity: 'common',
      trigger: 'onCombatStart',
      effects: [{ type: 'applyPower', powerId: 'strength', amount: 1, target: 'self' }],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    const relic = await generateRelic({ rarity: 'common', trigger: 'onCombatStart' })

    expect(relic.name).toBe('War Horn')
    expect(relic.rarity).toBe('common')
    expect(relic.trigger).toBe('onCombatStart')
    expect(relic.effects).toHaveLength(1)
    expect(relic.id).toMatch(/^relic_generated_/)
  })

  it('generates a valid uncommon relic with onTurnStart trigger', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'Meditation Stone',
      description: 'At the start of each turn, gain 3 Block.',
      rarity: 'uncommon',
      trigger: 'onTurnStart',
      effects: [{ type: 'block', amount: 3, target: 'self' }],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    const relic = await generateRelic({ rarity: 'uncommon', trigger: 'onTurnStart' })

    expect(relic.name).toBe('Meditation Stone')
    expect(relic.rarity).toBe('uncommon')
    expect(relic.trigger).toBe('onTurnStart')
  })

  it('generates a valid rare relic with onCardPlayed trigger', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'Quicksilver Gauntlet',
      description: 'Whenever you play an Attack, deal 2 damage to a random enemy.',
      rarity: 'rare',
      trigger: 'onCardPlayed',
      effects: [{ type: 'damage', amount: 2, target: 'randomEnemy' }],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    const relic = await generateRelic({ rarity: 'rare', trigger: 'onCardPlayed' })

    expect(relic.name).toBe('Quicksilver Gauntlet')
    expect(relic.rarity).toBe('rare')
    expect(relic.trigger).toBe('onCardPlayed')
  })

  it('handles JSON wrapped in markdown code blocks', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'Iron Shield',
      description: 'Start combat with 5 Block.',
      rarity: 'common',
      trigger: 'onCombatStart',
      effects: [{ type: 'block', amount: 5, target: 'self' }],
    }
    vi.mocked(chatCompletion).mockResolvedValue('```json\n' + JSON.stringify(mockRelic) + '\n```')

    const relic = await generateRelic()

    expect(relic.name).toBe('Iron Shield')
  })

  it('defaults invalid rarity to common', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'Mystery Orb',
      description: 'Something mysterious.',
      rarity: 'legendary', // Invalid for relics
      trigger: 'onCombatStart',
      effects: [{ type: 'draw', amount: 1 }],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    const relic = await generateRelic()

    expect(relic.rarity).toBe('common') // Defaults to common
  })

  it('defaults invalid trigger to onCombatStart', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'Chaos Gem',
      description: 'Something chaotic.',
      rarity: 'uncommon',
      trigger: 'onShuffle', // Invalid trigger
      effects: [{ type: 'energy', amount: 1, operation: 'gain' }],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    const relic = await generateRelic()

    expect(relic.trigger).toBe('onCombatStart') // Defaults to onCombatStart
  })

  it('throws error when relic has no effects', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      name: 'Empty Relic',
      description: 'Does nothing.',
      rarity: 'common',
      trigger: 'onCombatStart',
      effects: [],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    await expect(generateRelic()).rejects.toThrow('Relic must have at least one effect')
  })

  it('throws error when relic has no name', async () => {
    const { chatCompletion } = await import('../../lib/groq')
    const mockRelic = {
      description: 'Nameless relic.',
      rarity: 'common',
      trigger: 'onCombatStart',
      effects: [{ type: 'block', amount: 5, target: 'self' }],
    }
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify(mockRelic))

    await expect(generateRelic()).rejects.toThrow('Relic must have a name')
  })
})
