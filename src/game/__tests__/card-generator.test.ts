import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRandomCard, type GenerationOptions } from '../card-generator'

// Mock the groq module to avoid real API calls (partial mock preserves GROQ_MODEL)
vi.mock('../../lib/groq', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/groq')>()
  return {
    ...actual,
    chatCompletion: vi.fn(),
  }
})

// Import the mocked function for test control
import { chatCompletion } from '../../lib/groq'
const mockChatCompletion = vi.mocked(chatCompletion)

// ============================================================================
// Mock Response Factories
// ============================================================================

function createMockAttackCard() {
  return JSON.stringify({
    name: 'Flame Strike',
    description: 'Deal 8 damage.',
    energy: 1,
    theme: 'attack',
    rarity: 'common',
    target: 'enemy',
    effects: [{ type: 'damage', amount: 8 }],
  })
}

function createMockSkillCard() {
  return JSON.stringify({
    name: 'Iron Defense',
    description: 'Gain 5 block.',
    energy: 1,
    theme: 'skill',
    rarity: 'uncommon',
    target: 'self',
    effects: [{ type: 'block', amount: 5 }],
  })
}

function createMockPowerCard() {
  return JSON.stringify({
    name: 'Battle Fury',
    description: 'Gain 2 Strength.',
    energy: 2,
    theme: 'power',
    rarity: 'rare',
    target: 'self',
    effects: [{ type: 'applyPower', powerId: 'strength', amount: 2 }],
  })
}

function createMockPoisonCard() {
  return JSON.stringify({
    name: 'Venom Spray',
    description: 'Apply 3 Poison.',
    energy: 1,
    theme: 'skill',
    rarity: 'common',
    target: 'enemy',
    effects: [{ type: 'applyPower', powerId: 'poison', amount: 3 }],
  })
}

// ============================================================================
// Tests
// ============================================================================

describe('card-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateRandomCard', () => {
    it('generates_valid_attack_card_when_attack_theme_requested', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockAttackCard())
      const options: GenerationOptions = {
        theme: 'attack',
        rarity: 'common',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      expect(card).toBeDefined()
      expect(card.id).toMatch(/^generated_/)
      expect(card.name).toBe('Flame Strike')
      expect(card.theme).toBe('attack')
      expect(card.effects).toHaveLength(1)
      expect(card.energy).toBe(1)
    })

    it('generates_valid_skill_card_when_skill_theme_requested', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockSkillCard())
      const options: GenerationOptions = {
        theme: 'skill',
        rarity: 'uncommon',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      expect(card.theme).toBe('skill')
      expect(card.rarity).toBe('uncommon')
      expect(card.effects).toBeDefined()
    })

    it('generates_valid_power_card_when_power_theme_requested', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockPowerCard())
      const options: GenerationOptions = {
        theme: 'power',
        rarity: 'rare',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      expect(card.theme).toBe('power')
      expect(card.rarity).toBe('rare')
    })

    it('generates_card_with_effect_when_effect_type_hinted', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockPoisonCard())
      const options: GenerationOptions = {
        effectType: 'applyPower',
        hint: 'poison themed',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      expect(card.effects).toBeDefined()
      expect(card.effects.length).toBeGreaterThan(0)
    })

    it('generates_card_with_valid_target', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockAttackCard())

      // Act
      const card = await generateRandomCard()

      // Assert
      const validTargets = ['self', 'player', 'enemy', 'randomEnemy', 'allEnemies', 'weakestEnemy']
      expect(validTargets).toContain(card.target)
    })

    it('tracks_generation_metadata_with_llm_template', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockAttackCard())

      // Act
      const card = await generateRandomCard()

      // Assert
      expect(card.generatedFrom).toBeDefined()
      expect(card.generatedFrom?.template).toBe('llm')
      expect(card.generatedFrom?.seed).toBeGreaterThan(0)
    })
  })

  describe('effect validation', () => {
    it('parses_damage_effect_with_numeric_amount', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockAttackCard())
      const options: GenerationOptions = {
        theme: 'attack',
        effectType: 'damage',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      const damageEffect = card.effects.find((e) => e.type === 'damage')
      expect(damageEffect).toBeDefined()
      if (damageEffect && 'amount' in damageEffect) {
        expect(typeof damageEffect.amount).toBe('number')
        expect(damageEffect.amount).toBe(8)
      }
    })

    it('parses_block_effect_with_numeric_amount', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockSkillCard())
      const options: GenerationOptions = {
        theme: 'skill',
        effectType: 'block',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      const blockEffect = card.effects.find((e) => e.type === 'block')
      expect(blockEffect).toBeDefined()
      if (blockEffect && 'amount' in blockEffect) {
        expect(typeof blockEffect.amount).toBe('number')
        expect(blockEffect.amount).toBe(5)
      }
    })
  })

  describe('API integration', () => {
    it('calls_chatCompletion_with_correct_options', async () => {
      // Arrange
      mockChatCompletion.mockResolvedValue(createMockAttackCard())

      // Act
      await generateRandomCard({ theme: 'attack', rarity: 'common' })

      // Assert
      expect(mockChatCompletion).toHaveBeenCalledTimes(1)
      expect(mockChatCompletion).toHaveBeenCalledWith(
        expect.any(String), // system prompt
        expect.stringContaining('common'), // user prompt contains rarity
        expect.objectContaining({ temperature: 0.8 })
      )
    })
  })
})
