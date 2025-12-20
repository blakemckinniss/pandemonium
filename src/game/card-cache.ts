// ============================================
// CARD CACHE - Pre-generated cards for instant rewards
// ============================================
// Keeps a pool of AI-generated cards ready so players never wait
// Prefetches during combat so rewards are instant

import { generateRandomCard } from './card-generator'
import { getHealthStatus } from '../lib/image-gen'
import type { CardDefinition } from '../types'

const CACHE_TARGET_SIZE = 9  // Keep 9 cards ready (3 rewards worth)
const REFILL_THRESHOLD = 3   // Start refilling when below 3
const PREFETCH_INTERVAL_MS = 5000  // Check prefetch every 5 seconds during combat

interface CardCache {
  cards: CardDefinition[]
  isRefilling: boolean
  lastRefillTime: number
  prefetchTimer: ReturnType<typeof setInterval> | null
  inCombat: boolean
}

const cache: CardCache = {
  cards: [],
  isRefilling: false,
  lastRefillTime: 0,
  prefetchTimer: null,
  inCombat: false,
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
 * Generate a single card and add to cache.
 * Returns true if successful.
 */
async function generateOneCard(): Promise<boolean> {
  try {
    const card = await generateRandomCard()
    cache.cards.push(card)
    notifyListeners()
    return true
  } catch (err) {
    console.error('[CardCache] Generation failed:', err)
    return false
  }
}

/**
 * Background refill - generates cards one at a time to avoid overwhelming ComfyUI.
 * The server queues requests, but we're smarter about not flooding it.
 */
export async function refillCache(): Promise<void> {
  if (cache.isRefilling) return
  if (cache.cards.length >= CACHE_TARGET_SIZE) return

  // Check if service is healthy before starting
  const health = await getHealthStatus()
  if (!health || health.status !== 'ok') {
    console.log('[CardCache] Service unavailable, skipping refill')
    return
  }

  cache.isRefilling = true
  const needed = CACHE_TARGET_SIZE - cache.cards.length

  console.log(`[CardCache] Refilling ${needed} cards (one at a time)...`)

  // Generate one at a time - server queues, but we're polite
  for (let i = 0; i < needed; i++) {
    // Check if we should stop (cache might be cleared)
    if (cache.cards.length >= CACHE_TARGET_SIZE) break

    await generateOneCard()

    // Small delay between generations to let server breathe
    if (i < needed - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
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
  stopCombatPrefetch()
  notifyListeners()
}

/**
 * Start prefetching during combat.
 * Called when combat starts - generates cards in background while player plays.
 */
export function startCombatPrefetch(): void {
  if (cache.prefetchTimer) return  // Already running
  cache.inCombat = true

  console.log('[CardCache] Starting combat prefetch')

  // Immediately trigger a refill check
  void refillCache()

  // Then check periodically during combat
  cache.prefetchTimer = setInterval(() => {
    if (cache.cards.length < CACHE_TARGET_SIZE && !cache.isRefilling) {
      void refillCache()
    }
  }, PREFETCH_INTERVAL_MS)
}

/**
 * Stop prefetching (combat ended).
 */
export function stopCombatPrefetch(): void {
  if (cache.prefetchTimer) {
    clearInterval(cache.prefetchTimer)
    cache.prefetchTimer = null
  }
  cache.inCombat = false
  console.log('[CardCache] Stopped combat prefetch')
}

/**
 * Check if currently in combat prefetch mode.
 */
export function isInCombatPrefetch(): boolean {
  return cache.inCombat
}
