/**
 * Gacha Pack Opening Animations
 * Full anime-style card reveal system using GSAP
 */

import gsap from 'gsap'
import type { CardRarity } from '../types'

// Rarity-specific reveal configurations
const REVEAL_CONFIGS: Record<string, {
  duration: number
  scale: number
  ease: string
  shake: boolean
  flash: boolean
  particles: number
  glowColor: string
  pauseBefore: number
}> = {
  common: {
    duration: 0.5,
    scale: 1,
    ease: 'power2.out',
    shake: false,
    flash: false,
    particles: 10,
    glowColor: '#9ca3af',
    pauseBefore: 0,
  },
  uncommon: {
    duration: 0.7,
    scale: 1.02,
    ease: 'power2.out',
    shake: false,
    flash: false,
    particles: 25,
    glowColor: '#3b82f6',
    pauseBefore: 0.1,
  },
  rare: {
    duration: 1.0,
    scale: 1.05,
    ease: 'back.out(1.7)',
    shake: false,
    flash: true,
    particles: 50,
    glowColor: '#eab308',
    pauseBefore: 0.3,
  },
  'ultra-rare': {
    duration: 1.5,
    scale: 1.1,
    ease: 'elastic.out(1, 0.5)',
    shake: true,
    flash: true,
    particles: 80,
    glowColor: '#a855f7',
    pauseBefore: 0.5,
  },
  legendary: {
    duration: 2.0,
    scale: 1.15,
    ease: 'elastic.out(1, 0.3)',
    shake: true,
    flash: true,
    particles: 120,
    glowColor: '#f97316',
    pauseBefore: 0.8,
  },
  mythic: {
    duration: 2.5,
    scale: 1.2,
    ease: 'elastic.out(1, 0.3)',
    shake: true,
    flash: true,
    particles: 150,
    glowColor: '#ec4899',
    pauseBefore: 1.0,
  },
  ancient: {
    duration: 3.0,
    scale: 1.25,
    ease: 'elastic.out(1, 0.2)',
    shake: true,
    flash: true,
    particles: 200,
    glowColor: '#10b981',
    pauseBefore: 1.2,
  },
}

export function getRevealConfig(rarity: CardRarity | string) {
  return REVEAL_CONFIGS[rarity] || REVEAL_CONFIGS.common
}

/**
 * Create anticipation animation for pack
 */
export function createAnticipationTimeline(packEl: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Gentle floating pulse
  tl.to(packEl, {
    scale: 1.05,
    duration: 0.6,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 2,
  })

  // Intensify glow
  tl.to(packEl, {
    filter: 'brightness(1.3) drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
    duration: 0.3,
  }, '-=0.3')

  return tl
}

/**
 * Create pack burst animation
 */
export function createPackBurstTimeline(
  packEl: HTMLElement,
  onBurst?: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Quick scale up
  tl.to(packEl, {
    scale: 1.3,
    filter: 'brightness(2)',
    duration: 0.15,
    ease: 'power4.out',
  })

  // Callback at burst moment
  if (onBurst) {
    tl.add(onBurst)
  }

  // Fade out with rotation
  tl.to(packEl, {
    scale: 2,
    opacity: 0,
    rotateY: 180,
    duration: 0.4,
    ease: 'power4.out',
  })

  return tl
}

/**
 * Create card reveal animation
 */
export function createCardRevealTimeline(
  cardEl: HTMLElement,
  rarity: CardRarity | string,
  onReveal?: () => void
): gsap.core.Timeline {
  const config = getRevealConfig(rarity)
  const tl = gsap.timeline()

  // Set initial state (card back / hidden)
  gsap.set(cardEl, {
    rotateY: 180,
    scale: 0.6,
    opacity: 0,
  })

  // Pause before reveal for dramatic effect
  if (config.pauseBefore > 0) {
    tl.to({}, { duration: config.pauseBefore })
  }

  // Reveal callback
  if (onReveal) {
    tl.add(onReveal)
  }

  // Main flip animation
  tl.to(cardEl, {
    rotateY: 0,
    scale: config.scale,
    opacity: 1,
    duration: config.duration,
    ease: config.ease,
  })

  // Scale back to normal
  if (config.scale > 1) {
    tl.to(cardEl, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  return tl
}

/**
 * Create screen shake effect
 */
export function createShakeTimeline(containerEl: HTMLElement, intensity: number = 5): gsap.core.Timeline {
  const tl = gsap.timeline()

  tl.to(containerEl, {
    x: `+=${intensity}`,
    duration: 0.05,
    ease: 'none',
  })
    .to(containerEl, {
      x: `-=${intensity * 2}`,
      duration: 0.05,
      ease: 'none',
    })
    .to(containerEl, {
      x: `+=${intensity * 1.5}`,
      duration: 0.05,
      ease: 'none',
    })
    .to(containerEl, {
      x: `-=${intensity}`,
      duration: 0.05,
      ease: 'none',
    })
    .to(containerEl, {
      x: `+=${intensity * 0.5}`,
      duration: 0.05,
      ease: 'none',
    })
    .to(containerEl, {
      x: 0,
      duration: 0.05,
      ease: 'none',
    })

  return tl
}

/**
 * Create screen flash effect
 */
export function createFlashTimeline(flashEl: HTMLElement, color: string = '#ffffff'): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(flashEl, { backgroundColor: color })

  tl.to(flashEl, {
    opacity: 0.8,
    duration: 0.08,
    ease: 'power4.out',
  })
    .to(flashEl, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    })

  return tl
}

/**
 * Create glow pulse effect for card border
 */
export function createGlowPulseTimeline(cardEl: HTMLElement, color: string): gsap.core.Timeline {
  const tl = gsap.timeline({ repeat: 2 })

  tl.to(cardEl, {
    boxShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
    duration: 0.3,
    ease: 'power2.inOut',
  })
    .to(cardEl, {
      boxShadow: `0 0 15px ${color}, 0 0 30px ${color}`,
      duration: 0.3,
      ease: 'power2.inOut',
    })

  return tl
}

/**
 * Create hero-specific celebration animation
 */
export function createHeroCelebrationTimeline(
  cardEl: HTMLElement,
  containerEl: HTMLElement
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Everything pauses
  tl.to({}, { duration: 0.5 })

  // Card rises up dramatically
  tl.to(cardEl, {
    y: -50,
    scale: 1.3,
    duration: 0.8,
    ease: 'power2.out',
  })

  // Multiple shake bursts
  tl.add(createShakeTimeline(containerEl, 8), '<0.2')
  tl.add(createShakeTimeline(containerEl, 6), '<0.3')

  // Intense glow
  tl.to(cardEl, {
    boxShadow: '0 0 50px #fbbf24, 0 0 100px #fbbf24, 0 0 150px #fbbf24',
    duration: 0.5,
  }, '<')

  // Settle down
  tl.to(cardEl, {
    y: 0,
    scale: 1.1,
    boxShadow: '0 0 20px #fbbf24',
    duration: 0.5,
    ease: 'power2.inOut',
  })

  return tl
}

/**
 * Sort cards by rarity for reveal order (commons first, legendary last)
 */
export function sortCardsForReveal<T extends { rarity?: CardRarity | string }>(cards: T[]): T[] {
  const rarityOrder: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    'ultra-rare': 4,
    legendary: 5,
    mythic: 6,
    ancient: 7,
  }

  return [...cards].sort((a, b) => {
    const orderA = rarityOrder[a.rarity || 'common'] || 0
    const orderB = rarityOrder[b.rarity || 'common'] || 0
    return orderA - orderB
  })
}

/**
 * Check if rarity is "special" (rare or above)
 */
export function isSpecialRarity(rarity: CardRarity | string): boolean {
  const specialRarities = ['rare', 'ultra-rare', 'legendary', 'mythic', 'ancient']
  return specialRarities.includes(rarity)
}

/**
 * Get total reveal duration for a set of cards
 */
export function getTotalRevealDuration(rarities: (CardRarity | string)[]): number {
  return rarities.reduce((total, rarity) => {
    const config = getRevealConfig(rarity)
    return total + config.duration + config.pauseBefore + 0.3 // 0.3s gap between cards
  }, 0)
}
