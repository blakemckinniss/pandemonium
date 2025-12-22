// ============================================
// CARD CACHE - Pre-generated cards for instant rewards
// ============================================
// Keeps a pool of AI-generated cards ready so players never wait
// Prefetches during combat so rewards are instant

import { generateRandomCard } from './card-generator'
import { getHealthStatus } from '../lib/image-gen'
import { getAllowedRarities } from './rewards'
import type { CardDefinition, CardRarity } from '../types'

const CACHE_TARGET_SIZE = 9  // Keep 9 cards ready (3 rewards worth)
const REFILL_THRESHOLD = 3   // Start refilling when below 3
const PREFETCH_INTERVAL_MS = 5000  // Check prefetch every 5 seconds during combat

// Valid themes for card rewards (exclude hero, enemy, curse, status)
const REWARD_THEMES = ['attack', 'skill', 'power'] as const
type RewardTheme = typeof REWARD_THEMES[number]

/** Pick random valid reward theme */
function pickRandomTheme(): RewardTheme {
  return REWARD_THEMES[Math.floor(Math.random() * REWARD_THEMES.length)]
}

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
 * Get cards from cache, filtered by floor-appropriate rarity.
 * Falls back to generation if cache doesn't have enough matching cards.
 */
export async function getCachedCards(count: number, floor: number = 1): Promise<CardDefinition[]> {
  const result: CardDefinition[] = []
  const allowedRarities = getAllowedRarities(floor)

  // Take from cache, filtering by allowed rarity for this floor
  const remainingCache: CardDefinition[] = []
  for (const card of cache.cards) {
    if (result.length >= count) {
      remainingCache.push(card)
      continue
    }

    const cardRarity = (card.rarity ?? 'common') as CardRarity
    if (allowedRarities.includes(cardRarity)) {
      result.push(card)
    } else {
      // Keep cards that don't match current floor for later
      remainingCache.push(card)
    }
  }
  cache.cards = remainingCache

  // If cache couldn't fulfill, generate remaining with proper constraints
  if (result.length < count) {
    const needed = count - result.length
    // Pick floor-appropriate rarity for generation
    const targetRarity = pickFloorRarity(floor)

    const generated = await Promise.all(
      Array.from({ length: needed }, () =>
        generateRandomCard({
          theme: pickRandomTheme(),
          rarity: targetRarity,
        }).catch(() => null)
      )
    )
    result.push(...generated.filter((c): c is CardDefinition => c !== null))
  }

  // Trigger background refill
  void refillCache()
  notifyListeners()

  return result
}

/** Pick appropriate rarity based on floor (weighted toward common) */
function pickFloorRarity(floor: number): 'common' | 'uncommon' | 'rare' {
  const allowed = getAllowedRarities(floor)
  const roll = Math.random()

  // Weight: 60% common, 30% uncommon, 10% rare (if allowed)
  if (allowed.includes('rare') && roll > 0.9) return 'rare'
  if (allowed.includes('uncommon') && roll > 0.6) return 'uncommon'
  return 'common'
}

/**
 * Get current cache size (for UI display)
 */
export function getCacheSize(): number {
  return cache.cards.length
}

/**
 * Generate a single card and add to cache.
 * Only generates valid reward themes (attack/skill/power).
 * Returns true if successful.
 */
async function generateOneCard(): Promise<boolean> {
  try {
    const card = await generateRandomCard({
      theme: pickRandomTheme(),
      // Mix of rarities for cache - will be filtered by floor when pulled
    })
    cache.cards = [...cache.cards, card]
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
