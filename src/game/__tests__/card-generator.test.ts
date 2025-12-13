import { describe, it, expect } from 'vitest'
import { generateRandomCard, type GenerationOptions } from '../card-generator'

// Real API tests - requires VITE_GROQ_API_KEY in environment
// Vitest loads .env automatically via Vite
describe('card-generator (real API)', () => {

  describe('generateRandomCard', () => {
    it('generates valid attack card', async () => {
      // Arrange
      const options: GenerationOptions = {
        theme: 'attack',
        rarity: 'common',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      expect(card).toBeDefined()
      expect(card.id).toMatch(/^generated_/)
      expect(card.name).toBeTruthy()
      expect(card.theme).toBe('attack')
      expect(card.effects.length).toBeGreaterThan(0)
      expect(typeof card.energy).toBe('number')
      expect(card.energy).toBeGreaterThanOrEqual(0)
      expect(card.energy).toBeLessThanOrEqual(5)
    })

    it('generates valid skill card', async () => {
      // Arrange
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

    it('generates valid power card', async () => {
      // Arrange
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

    it('generates card with specific effect type hint', async () => {
      // Arrange
      const options: GenerationOptions = {
        effectType: 'applyPower',
        hint: 'poison themed',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      expect(card.effects).toBeDefined()
      // Should have at least one effect
      expect(card.effects.length).toBeGreaterThan(0)
    })

    it('generates card with valid target', async () => {
      // Act
      const card = await generateRandomCard()

      // Assert
      const validTargets = ['self', 'player', 'enemy', 'randomEnemy', 'allEnemies', 'weakestEnemy']
      expect(validTargets).toContain(card.target)
    })

    it('tracks generation metadata', async () => {
      // Act
      const card = await generateRandomCard()

      // Assert
      expect(card.generatedFrom).toBeDefined()
      expect(card.generatedFrom?.template).toBe('llm')
      expect(card.generatedFrom?.seed).toBeGreaterThan(0)
    })
  })

  describe('effect validation', () => {
    it('generates damage effect with numeric amount', async () => {
      // Arrange
      const options: GenerationOptions = {
        theme: 'attack',
        effectType: 'damage',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      const damageEffect = card.effects.find((e) => e.type === 'damage')
      if (damageEffect && 'amount' in damageEffect) {
        expect(typeof damageEffect.amount).toBe('number')
      }
    })

    it('generates block effect with numeric amount', async () => {
      // Arrange
      const options: GenerationOptions = {
        theme: 'skill',
        effectType: 'block',
      }

      // Act
      const card = await generateRandomCard(options)

      // Assert
      const blockEffect = card.effects.find((e) => e.type === 'block')
      if (blockEffect && 'amount' in blockEffect) {
        expect(typeof blockEffect.amount).toBe('number')
      }
    })
  })
})
