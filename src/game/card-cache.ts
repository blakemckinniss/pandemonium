// ============================================
// CARD CACHE - Pre-generated cards for instant rewards
// ============================================
// Keeps a pool of AI-generated cards ready so players never wait

import { generateRandomCard } from './card-generator'
import type { CardDefinition } from '../types'

const CACHE_TARGET_SIZE = 9  // Keep 9 cards ready (3 rewards worth)
const REFILL_THRESHOLD = 3   // Start refilling when below 3

interface CardCache {
  cards: CardDefinition[]
  isRefilling: boolean
  lastRefillTime: number
}

const cache: CardCache = {
  cards: [],
  isRefilling: false,
  lastRefillTime: 0,
}

// Listeners for cache updates
type CacheListener = (size: number) => void
const listeners: CacheListener[] = []

export function subscribeToCacheUpdates(listener: CacheListener): () => void {
  listeners.push(listener)
  return () => {
    const idx = listeners.indexOf(listener)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

function notifyListeners() {
  listeners.forEach(l => l(cache.cards.length))
}

/**
 * Get cards from cache, falls back to generation if cache empty
 */
export async function getCachedCards(count: number): Promise<CardDefinition[]> {
  const result: CardDefinition[] = []

  // Take from cache first
  while (result.length < count && cache.cards.length > 0) {
    const card = cache.cards.shift()
    if (card) result.push(card)
  }

  // If cache couldn't fulfill, generate remaining (art is always included)
  if (result.length < count) {
    const needed = count - result.length
    const generated = await Promise.all(
      Array.from({ length: needed }, () =>
        generateRandomCard().catch(() => null)
      )
    )
    result.push(...generated.filter((c): c is CardDefinition => c !== null))
  }

  // Trigger background refill
  void refillCache()
  notifyListeners()

  return result
}

/**
 * Get current cache size (for UI display)
 */
export function getCacheSize(): number {
  return cache.cards.length
}

/**
 * Background refill - called automatically, can also be triggered manually
 */
export async function refillCache(): Promise<void> {
  if (cache.isRefilling) return
  if (cache.cards.length >= CACHE_TARGET_SIZE) return

  cache.isRefilling = true
  const needed = CACHE_TARGET_SIZE - cache.cards.length

  console.log(`[CardCache] Refilling ${needed} cards...`)

  // Generate in batches of 3 to avoid overwhelming the API
  // Art is always generated - cards without images will fail and won't enter cache
  const batchSize = 3
  for (let i = 0; i < needed; i += batchSize) {
    const batch = Math.min(batchSize, needed - i)
    const promises = Array.from({ length: batch }, () =>
      generateRandomCard()
        .then(card => {
          cache.cards.push(card)
          notifyListeners()
          return card
        })
        .catch(err => {
          console.error('[CardCache] Generation failed:', err)
          return null
        })
    )
    await Promise.allSettled(promises)
  }

  cache.isRefilling = false
  cache.lastRefillTime = Date.now()
  console.log(`[CardCache] Refill complete. Cache size: ${cache.cards.length}`)
}

/**
 * Prime the cache - call on game start or when entering dungeon
 */
export function primeCache(): void {
  if (cache.cards.length < REFILL_THRESHOLD) {
    void refillCache()
  }
}

/**
 * Check if cache is ready (has at least one reward's worth of cards)
 */
export function isCacheReady(): boolean {
  return cache.cards.length >= 3
}

/**
 * Clear cache (for testing or when switching dungeons)
 */
export function clearCache(): void {
  cache.cards = []
  cache.isRefilling = false
  notifyListeners()
}
