import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCachedCards,
  getCacheSize,
  clearCache,
  primeCache,
  isCacheReady,
} from '../card-cache'
import type { CardDefinition } from '../../types'

// Mock the card-generator module
vi.mock('../card-generator', () => ({
  generateRandomCard: vi.fn(),
}))

// Mock the image-gen module
vi.mock('../../lib/image-gen', () => ({
  getHealthStatus: vi.fn().mockResolvedValue({ status: 'ok', queue_depth: 0, busy: false }),
}))

// Import mocked functions for test control
import { generateRandomCard } from '../card-generator'
import { getHealthStatus } from '../../lib/image-gen'
const mockGenerateRandomCard = vi.mocked(generateRandomCard)
const mockGetHealthStatus = vi.mocked(getHealthStatus)

// ============================================================================
// Mock Card Factories
// ============================================================================

function createMockCard(overrides: Partial<CardDefinition> = {}): CardDefinition {
  return {
    id: `test_card_${Math.random().toString(36).slice(2)}`,
    name: 'Test Card',
    description: 'A test card.',
    energy: 1,
    theme: 'attack',
    rarity: 'common',
    target: 'enemy',
    effects: [{ type: 'damage', amount: 5 }],
    ...overrides,
  }
}

function createCommonAttack(): CardDefinition {
  return createMockCard({ theme: 'attack', rarity: 'common', name: 'Common Attack' })
}

// ============================================================================
// Tests
// ============================================================================

describe('card-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache()
    mockGetHealthStatus.mockResolvedValue({ status: 'ok', queue_depth: 0, busy: false })
  })

  afterEach(() => {
    clearCache()
  })

  describe('getCachedCards floor filtering', () => {
    it('returns only common cards on floor 1-4 (early game)', async () => {
      // Set up generator to return cards when cache is empty
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        // Generator should be called with appropriate rarity
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'common',
        })
      })

      const cards = await getCachedCards(3, 1)

      // All cards should be common for floor 1
      expect(cards.length).toBe(3)
      cards.forEach((card) => {
        expect(card.rarity).toBe('common')
      })
    })

    it('allows common and uncommon cards on floor 5-9 (mid game)', async () => {
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'common',
        })
      })

      const cards = await getCachedCards(3, 5)

      expect(cards.length).toBe(3)
      // All returned cards should have floor-appropriate rarity
      cards.forEach((card) => {
        expect(['common', 'uncommon']).toContain(card.rarity)
      })
    })

    it('allows rare cards on floor 10+ (late game)', async () => {
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'rare',
        })
      })

      const cards = await getCachedCards(3, 10)

      expect(cards.length).toBe(3)
      // Late game allows common, uncommon, rare, epic
      cards.forEach((card) => {
        expect(['common', 'uncommon', 'rare', 'epic']).toContain(card.rarity)
      })
    })

    it('requests floor-appropriate rarity when generating cards', async () => {
      // When cache is empty and we request for floor 1, generator should
      // receive rarity: 'common' because that's all that's allowed
      const requestedRarities: string[] = []

      mockGenerateRandomCard.mockImplementation(async (opts) => {
        if (opts?.rarity) {
          requestedRarities.push(opts.rarity)
        }
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'common',
        })
      })

      // Request cards for floor 1 (early game = common only)
      await getCachedCards(3, 1)

      // All generation requests for the reward should have common rarity
      // (first 3 calls are for the reward, subsequent calls are background refill)
      const rewardCalls = requestedRarities.slice(0, 3)
      expect(rewardCalls.length).toBe(3)
      rewardCalls.forEach((rarity) => {
        expect(rarity).toBe('common')
      })
    })

    it('passes floor-appropriate rarity to generator', async () => {
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'common',
        })
      })

      await getCachedCards(1, 1)

      // On floor 1, generator should receive 'common' rarity
      expect(mockGenerateRandomCard).toHaveBeenCalledWith(
        expect.objectContaining({
          rarity: 'common',
        })
      )
    })

    it('passes valid reward themes to generator', async () => {
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'common',
        })
      })

      await getCachedCards(3, 1)

      // All calls should use valid reward themes
      const calls = mockGenerateRandomCard.mock.calls
      calls.forEach((call) => {
        const opts = call[0]
        expect(['attack', 'skill', 'power']).toContain(opts?.theme)
      })
    })
  })

  describe('getCacheSize', () => {
    it('returns 0 for empty cache', () => {
      expect(getCacheSize()).toBe(0)
    })
  })

  describe('clearCache', () => {
    it('empties the cache', async () => {
      mockGenerateRandomCard.mockResolvedValue(createCommonAttack())

      // Get some cards (triggers generation)
      await getCachedCards(1, 1)

      // Clear
      clearCache()

      expect(getCacheSize()).toBe(0)
    })
  })

  describe('isCacheReady', () => {
    it('returns false when cache has fewer than 3 cards', () => {
      clearCache()
      expect(isCacheReady()).toBe(false)
    })
  })

  describe('primeCache', () => {
    it('triggers refill when cache is below threshold', () => {
      clearCache()
      // primeCache is sync but triggers async refill
      // Just verify it doesn't throw
      expect(() => primeCache()).not.toThrow()
    })
  })

  describe('generation error handling', () => {
    it('handles generation failures gracefully', async () => {
      mockGenerateRandomCard.mockRejectedValue(new Error('API error'))

      // Should not throw, returns empty or partial results
      const cards = await getCachedCards(3, 1)

      // Should return whatever it could get (possibly empty)
      expect(Array.isArray(cards)).toBe(true)
    })

    it('skips failed generations in batch', async () => {
      let callCount = 0
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        callCount++
        if (callCount === 2) throw new Error('API error')
        return createMockCard({
          theme: opts?.theme ?? 'attack',
          rarity: opts?.rarity ?? 'common',
        })
      })

      const cards = await getCachedCards(3, 1)

      // Should have 2 cards (1 failed)
      expect(cards.length).toBe(2)
    })
  })

  describe('floor rarity distribution', () => {
    it('floor 1 only allows common', async () => {
      mockGenerateRandomCard.mockImplementation(async (opts) => {
        return createMockCard({ rarity: opts?.rarity ?? 'common' })
      })

      const cards = await getCachedCards(10, 1)

      cards.forEach((card) => {
        expect(card.rarity).toBe('common')
      })
    })

    it('floor 5 allows common and uncommon', async () => {
      // The generator is called with pickFloorRarity which has weighted random
      // We verify that only valid rarities are passed for reward generation
      const passedRarities: string[] = []

      mockGenerateRandomCard.mockImplementation(async (opts) => {
        // Only track calls that specify rarity (reward generation, not background refill)
        if (opts?.rarity) {
          passedRarities.push(opts.rarity)
        }
        return createMockCard({ rarity: opts?.rarity ?? 'common' })
      })

      await getCachedCards(10, 5)

      // All passed rarities should be common or uncommon (pickFloorRarity logic)
      // First N calls are for the reward, verify those
      const rewardCalls = passedRarities.slice(0, 10)
      expect(rewardCalls.length).toBe(10)
      rewardCalls.forEach((rarity) => {
        expect(['common', 'uncommon']).toContain(rarity)
      })
    })

    it('floor 15 allows rare cards', async () => {
      const passedRarities: string[] = []

      mockGenerateRandomCard.mockImplementation(async (opts) => {
        // Only track calls that specify rarity (reward generation, not background refill)
        if (opts?.rarity) {
          passedRarities.push(opts.rarity)
        }
        return createMockCard({ rarity: opts?.rarity ?? 'common' })
      })

      await getCachedCards(20, 15)

      // Should include valid rarities for endgame (pickFloorRarity returns common/uncommon/rare)
      // Note: pickFloorRarity uses weighted random, so we just verify valid rarities
      const rewardCalls = passedRarities.slice(0, 20)
      expect(rewardCalls.length).toBe(20)
      rewardCalls.forEach((rarity) => {
        expect(['common', 'uncommon', 'rare']).toContain(rarity)
      })
    })
  })
})
