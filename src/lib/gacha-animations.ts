/**
 * Gacha Pack Opening Animations - CELESTIAL RIFT Edition
 * Dopamine-optimized card reveal system with aggressive visual impact
 */

import gsap from 'gsap'

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY CONFIGURATIONS - Escalating drama per tier
// ═══════════════════════════════════════════════════════════════════════════════

export interface RevealConfig {
  duration: number
  scale: number
  ease: string
  shake: boolean
  shakeIntensity: number
  flash: boolean
  flashDuration: number
  particles: number
  glowColor: string
  glowSecondary: string
  pauseBefore: number
  rays: boolean
  rayCount: number
  distortion: boolean
  announcement: string | null
  celebrationTier: 0 | 1 | 2 | 3  // 0=none, 1=glow, 2=burst, 3=reality break
}

const REVEAL_CONFIGS: Record<string, RevealConfig> = {
  common: {
    duration: 0.4,
    scale: 1,
    ease: 'power2.out',
    shake: false,
    shakeIntensity: 0,
    flash: false,
    flashDuration: 0,
    particles: 8,
    glowColor: '#6b7280',
    glowSecondary: '#9ca3af',
    pauseBefore: 0,
    rays: false,
    rayCount: 0,
    distortion: false,
    announcement: null,
    celebrationTier: 0,
  },
  uncommon: {
    duration: 0.5,
    scale: 1.02,
    ease: 'power2.out',
    shake: false,
    shakeIntensity: 0,
    flash: false,
    flashDuration: 0,
    particles: 20,
    glowColor: '#3b82f6',
    glowSecondary: '#60a5fa',
    pauseBefore: 0.1,
    rays: false,
    rayCount: 0,
    distortion: false,
    announcement: null,
    celebrationTier: 0,
  },
  rare: {
    duration: 0.8,
    scale: 1.08,
    ease: 'back.out(1.7)',
    shake: true,
    shakeIntensity: 4,
    flash: true,
    flashDuration: 0.15,
    particles: 60,
    glowColor: '#eab308',
    glowSecondary: '#fde047',
    pauseBefore: 0.4,
    rays: true,
    rayCount: 8,
    distortion: false,
    announcement: 'RARE',
    celebrationTier: 1,
  },
  'ultra-rare': {
    duration: 1.2,
    scale: 1.12,
    ease: 'elastic.out(1, 0.5)',
    shake: true,
    shakeIntensity: 8,
    flash: true,
    flashDuration: 0.25,
    particles: 100,
    glowColor: '#a855f7',
    glowSecondary: '#c084fc',
    pauseBefore: 0.7,
    rays: true,
    rayCount: 12,
    distortion: true,
    announcement: 'ULTRA RARE',
    celebrationTier: 2,
  },
  legendary: {
    duration: 1.8,
    scale: 1.18,
    ease: 'elastic.out(1, 0.3)',
    shake: true,
    shakeIntensity: 12,
    flash: true,
    flashDuration: 0.4,
    particles: 150,
    glowColor: '#f97316',
    glowSecondary: '#fdba74',
    pauseBefore: 1.0,
    rays: true,
    rayCount: 16,
    distortion: true,
    announcement: 'LEGENDARY',
    celebrationTier: 2,
  },
  mythic: {
    duration: 2.2,
    scale: 1.22,
    ease: 'elastic.out(1, 0.25)',
    shake: true,
    shakeIntensity: 16,
    flash: true,
    flashDuration: 0.5,
    particles: 200,
    glowColor: '#ec4899',
    glowSecondary: '#f472b6',
    pauseBefore: 1.3,
    rays: true,
    rayCount: 20,
    distortion: true,
    announcement: '✦ MYTHIC ✦',
    celebrationTier: 3,
  },
  ancient: {
    duration: 2.8,
    scale: 1.28,
    ease: 'elastic.out(1, 0.2)',
    shake: true,
    shakeIntensity: 20,
    flash: true,
    flashDuration: 0.6,
    particles: 300,
    glowColor: '#10b981',
    glowSecondary: '#34d399',
    pauseBefore: 1.6,
    rays: true,
    rayCount: 24,
    distortion: true,
    announcement: '⚜ ANCIENT ⚜',
    celebrationTier: 3,
  },
}

export function getRevealConfig(rarity: string): RevealConfig {
  return REVEAL_CONFIGS[rarity] || REVEAL_CONFIGS.common
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACK ANIMATIONS - The sealed rift
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Idle pack pulsation - beckoning the player
 */
export function createPackIdleTimeline(packEl: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline({ repeat: -1, yoyo: true })

  tl.to(packEl, {
    scale: 1.02,
    filter: 'brightness(1.1) drop-shadow(0 0 30px rgba(168, 85, 247, 0.4))',
    duration: 1.5,
    ease: 'sine.inOut',
  })

  return tl
}

/**
 * Anticipation build - dramatic tension before the burst
 */
export function createAnticipationTimeline(
  packEl: HTMLElement,
  onRiftCrack?: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Initial power surge
  tl.to(packEl, {
    scale: 1.08,
    filter: 'brightness(1.3) drop-shadow(0 0 40px rgba(168, 85, 247, 0.6))',
    duration: 0.3,
    ease: 'power2.out',
  })

  // Pulsing intensification
  tl.to(packEl, {
    scale: 1.12,
    duration: 0.2,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 3,
  })

  // Rift cracking moment
  if (onRiftCrack) {
    tl.add(onRiftCrack)
  }

  // Violent shake before burst
  tl.to(packEl, {
    x: -5,
    duration: 0.03,
    ease: 'none',
  })
  for (let i = 0; i < 8; i++) {
    tl.to(packEl, {
      x: i % 2 === 0 ? 8 : -8,
      rotation: i % 2 === 0 ? 2 : -2,
      duration: 0.03,
      ease: 'none',
    })
  }
  tl.to(packEl, { x: 0, rotation: 0, duration: 0.03 })

  // Final power surge
  tl.to(packEl, {
    scale: 1.25,
    filter: 'brightness(2) drop-shadow(0 0 80px rgba(251, 191, 36, 0.9))',
    duration: 0.15,
    ease: 'power4.out',
  })

  return tl
}

/**
 * Pack burst - the dimensional rift tears open
 */
export function createPackBurstTimeline(
  packEl: HTMLElement,
  callbacks?: {
    onFlash?: () => void
    onParticleBurst?: () => void
    onComplete?: () => void
  }
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Flash callback
  if (callbacks?.onFlash) {
    tl.add(callbacks.onFlash)
  }

  // Explosive scale
  tl.to(packEl, {
    scale: 1.8,
    filter: 'brightness(4)',
    duration: 0.1,
    ease: 'power4.out',
  })

  // Particle burst callback
  if (callbacks?.onParticleBurst) {
    tl.add(callbacks.onParticleBurst, '<0.05')
  }

  // Rift tears apart
  tl.to(packEl, {
    scale: 3,
    opacity: 0,
    filter: 'brightness(6) blur(20px)',
    duration: 0.35,
    ease: 'power4.out',
  })

  if (callbacks?.onComplete) {
    tl.add(callbacks.onComplete)
  }

  return tl
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD REVEAL ANIMATIONS - The money shot
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Card silhouette tease - brief shadow before reveal
 */
export function createSilhouetteTimeline(cardEl: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(cardEl, {
    opacity: 1,
    filter: 'brightness(0) blur(8px)',
    scale: 0.8,
  })

  tl.to(cardEl, {
    filter: 'brightness(0) blur(4px)',
    scale: 0.9,
    duration: 0.3,
    ease: 'power2.out',
  })

  return tl
}

/**
 * Main card reveal animation
 */
export function createCardRevealTimeline(
  cardEl: HTMLElement,
  rarity: string,
  callbacks?: {
    onRevealStart?: () => void
    onRevealComplete?: () => void
  }
): gsap.core.Timeline {
  const config = getRevealConfig(rarity)
  const tl = gsap.timeline()

  // Initial hidden state
  gsap.set(cardEl, {
    rotateY: 180,
    scale: 0.5,
    opacity: 0,
    transformPerspective: 1200,
    transformOrigin: 'center center',
  })

  // Dramatic pause for rare+
  if (config.pauseBefore > 0) {
    tl.to({}, { duration: config.pauseBefore })
  }

  // Reveal start callback
  if (callbacks?.onRevealStart) {
    tl.add(callbacks.onRevealStart)
  }

  // Card flip reveal
  tl.to(cardEl, {
    rotateY: 0,
    scale: config.scale,
    opacity: 1,
    duration: config.duration * 0.6,
    ease: 'power3.out',
  })

  // Overshoot bounce for special cards
  if (config.scale > 1.05) {
    tl.to(cardEl, {
      scale: config.scale * 1.08,
      duration: config.duration * 0.2,
      ease: 'power2.out',
    })
    tl.to(cardEl, {
      scale: 1,
      duration: config.duration * 0.2,
      ease: 'back.out(2)',
    })
  } else {
    tl.to(cardEl, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })
  }

  // Reveal complete callback
  if (callbacks?.onRevealComplete) {
    tl.add(callbacks.onRevealComplete)
  }

  return tl
}

/**
 * Pre-reveal rarity hint - subtle glow before full reveal
 */
export function createRarityHintTimeline(
  cardEl: HTMLElement,
  rarity: string
): gsap.core.Timeline {
  const config = getRevealConfig(rarity)
  const tl = gsap.timeline()

  // Only hint for rare+
  if (config.celebrationTier === 0) return tl

  // Build anticipation with escalating glow
  const intensity = config.celebrationTier * 15

  tl.to(cardEl, {
    boxShadow: `0 0 ${intensity}px ${config.glowColor}`,
    duration: 0.2,
    ease: 'power2.out',
  })

  if (config.celebrationTier >= 2) {
    tl.to(cardEl, {
      boxShadow: `0 0 ${intensity * 2}px ${config.glowColor}, 0 0 ${intensity * 3}px ${config.glowSecondary}`,
      duration: 0.15,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    })
  }

  return tl
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPACT EFFECTS - Screen reactions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Screen shake - intensity scales with rarity
 */
export function createShakeTimeline(
  containerEl: HTMLElement,
  intensity: number = 5,
  duration: number = 0.4
): gsap.core.Timeline {
  const tl = gsap.timeline()
  const steps = Math.floor(duration / 0.04)

  for (let i = 0; i < steps; i++) {
    const decay = 1 - (i / steps) * 0.7  // Decay over time
    const offsetX = (Math.random() - 0.5) * intensity * 2 * decay
    const offsetY = (Math.random() - 0.5) * intensity * decay
    const rotation = (Math.random() - 0.5) * (intensity / 5) * decay

    tl.to(containerEl, {
      x: offsetX,
      y: offsetY,
      rotation: rotation,
      duration: 0.04,
      ease: 'none',
    })
  }

  tl.to(containerEl, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 0.1,
    ease: 'power2.out',
  })

  return tl
}

/**
 * Screen flash - blinding light on impact
 */
export function createFlashTimeline(
  flashEl: HTMLElement,
  color: string = '#ffffff',
  intensity: number = 0.9,
  duration: number = 0.4
): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(flashEl, { backgroundColor: color, opacity: 0 })

  // Sharp flash in
  tl.to(flashEl, {
    opacity: intensity,
    duration: 0.05,
    ease: 'power4.out',
  })

  // Slower fade out
  tl.to(flashEl, {
    opacity: 0,
    duration: duration,
    ease: 'power2.out',
  })

  return tl
}

/**
 * Chromatic aberration pulse - reality distortion
 */
export function createDistortionTimeline(
  containerEl: HTMLElement,
  intensity: number = 1
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // RGB split effect simulation via filter
  tl.to(containerEl, {
    filter: `blur(${intensity}px) saturate(1.5) hue-rotate(${intensity * 5}deg)`,
    duration: 0.08,
    ease: 'none',
  })
  tl.to(containerEl, {
    filter: `blur(${intensity * 0.5}px) saturate(1.3) hue-rotate(-${intensity * 3}deg)`,
    duration: 0.06,
    ease: 'none',
  })
  tl.to(containerEl, {
    filter: 'none',
    duration: 0.15,
    ease: 'power2.out',
  })

  return tl
}

/**
 * Glow pulse - radiating energy
 */
export function createGlowPulseTimeline(
  cardEl: HTMLElement,
  color: string,
  colorSecondary?: string,
  tier: number = 1
): gsap.core.Timeline {
  const tl = gsap.timeline({ repeat: tier })
  const secondary = colorSecondary || color

  const baseGlow = tier * 20
  const maxGlow = tier * 50

  tl.to(cardEl, {
    boxShadow: `
      0 0 ${maxGlow}px ${color},
      0 0 ${maxGlow * 1.5}px ${secondary},
      inset 0 0 ${baseGlow}px ${color}
    `,
    duration: 0.25,
    ease: 'power2.out',
  })
  tl.to(cardEl, {
    boxShadow: `
      0 0 ${baseGlow}px ${color},
      0 0 ${baseGlow * 1.5}px ${secondary}
    `,
    duration: 0.25,
    ease: 'power2.in',
  })

  return tl
}

/**
 * Vignette pulse - screen edge darkening
 */
export function createVignetteTimeline(
  vignetteEl: HTMLElement,
  intensity: number = 0.6
): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(vignetteEl, {
    background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0) 100%)',
  })

  tl.to(vignetteEl, {
    background: `radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,${intensity}) 100%)`,
    duration: 0.3,
    ease: 'power2.out',
  })

  tl.to(vignetteEl, {
    background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.3) 100%)',
    duration: 0.5,
    ease: 'power2.in',
  })

  return tl
}

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION EFFECTS - Glory moments
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Announcement text animation
 */
export function createAnnouncementTimeline(
  textEl: HTMLElement,
  text: string,
  color: string
): gsap.core.Timeline {
  const tl = gsap.timeline()

  gsap.set(textEl, {
    textContent: text,
    color: color,
    opacity: 0,
    scale: 0.3,
    y: 30,
    textShadow: `0 0 0 ${color}`,
  })

  // Explosive entrance
  tl.to(textEl, {
    opacity: 1,
    scale: 1.3,
    y: 0,
    textShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
    duration: 0.3,
    ease: 'back.out(2)',
  })

  // Settle with glow
  tl.to(textEl, {
    scale: 1,
    textShadow: `0 0 20px ${color}`,
    duration: 0.2,
    ease: 'power2.out',
  })

  // Hold
  tl.to({}, { duration: 0.8 })

  // Fade out
  tl.to(textEl, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    ease: 'power2.in',
  })

  return tl
}

/**
 * Hero card celebration - maximum drama
 */
export function createHeroCelebrationTimeline(
  cardEl: HTMLElement,
  containerEl: HTMLElement,
  callbacks?: {
    onClimaxStart?: () => void
    onClimaxPeak?: () => void
  }
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Pause for dramatic effect
  tl.to({}, { duration: 0.3 })

  // Card rises majestically
  tl.to(cardEl, {
    y: -60,
    scale: 1.35,
    duration: 0.6,
    ease: 'power2.out',
  })

  if (callbacks?.onClimaxStart) {
    tl.add(callbacks.onClimaxStart, '<0.2')
  }

  // Intense glow buildup
  tl.to(cardEl, {
    boxShadow: `
      0 0 60px #fbbf24,
      0 0 100px #fbbf24,
      0 0 140px rgba(251, 191, 36, 0.5),
      0 0 180px rgba(251, 191, 36, 0.3)
    `,
    duration: 0.4,
  }, '<')

  // Screen shake cascade
  tl.add(createShakeTimeline(containerEl, 12, 0.3), '<0.1')

  if (callbacks?.onClimaxPeak) {
    tl.add(callbacks.onClimaxPeak)
  }

  // Secondary shake wave
  tl.add(createShakeTimeline(containerEl, 8, 0.2), '-=0.1')

  // Gentle settle
  tl.to(cardEl, {
    y: 0,
    scale: 1.1,
    boxShadow: '0 0 30px #fbbf24, 0 0 50px rgba(251, 191, 36, 0.4)',
    duration: 0.6,
    ease: 'power2.inOut',
  })

  return tl
}

/**
 * Mythic/Ancient tier celebration - reality breaks
 */
export function createRealityBreakTimeline(
  cardEl: HTMLElement,
  containerEl: HTMLElement,
  flashEl: HTMLElement,
  color: string,
  callbacks?: {
    onRealityTear?: () => void
    onPeak?: () => void
  }
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Time seems to stop
  tl.to({}, { duration: 0.5 })

  // Reality distortion begins
  tl.add(createDistortionTimeline(containerEl, 3))

  if (callbacks?.onRealityTear) {
    tl.add(callbacks.onRealityTear, '<0.1')
  }

  // Card pulses with otherworldly energy
  tl.to(cardEl, {
    scale: 1.5,
    boxShadow: `
      0 0 80px ${color},
      0 0 120px ${color},
      0 0 160px ${color},
      0 0 200px rgba(255, 255, 255, 0.5)
    `,
    duration: 0.4,
    ease: 'power4.out',
  })

  // Reality flash
  tl.add(createFlashTimeline(flashEl, color, 1, 0.6), '<0.2')

  // Multiple shake waves
  tl.add(createShakeTimeline(containerEl, 18, 0.4), '<0.1')

  if (callbacks?.onPeak) {
    tl.add(callbacks.onPeak, '-=0.2')
  }

  // Second distortion wave
  tl.add(createDistortionTimeline(containerEl, 2), '-=0.1')
  tl.add(createShakeTimeline(containerEl, 10, 0.25), '<')

  // Settle into permanent glow
  tl.to(cardEl, {
    scale: 1.15,
    boxShadow: `0 0 40px ${color}, 0 0 80px rgba(255, 255, 255, 0.3)`,
    duration: 0.8,
    ease: 'power2.out',
  })

  return tl
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sort cards by rarity for reveal order (commons first, legendary last)
 */
export function sortCardsForReveal<T extends { rarity?: string }>(cards: T[]): T[] {
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
export function isSpecialRarity(rarity: string): boolean {
  const config = getRevealConfig(rarity)
  return config.celebrationTier > 0
}

/**
 * Get total reveal duration for a set of cards
 */
export function getTotalRevealDuration(rarities: string[]): number {
  return rarities.reduce((total, rarity) => {
    const config = getRevealConfig(rarity)
    return total + config.duration + config.pauseBefore + 0.4
  }, 0)
}

/**
 * Get highest rarity in a set (for pack preview hints)
 */
export function getHighestRarity(rarities: string[]): string {
  const order = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary', 'mythic', 'ancient']
  let highest = 'common'

  for (const rarity of rarities) {
    if (order.indexOf(rarity) > order.indexOf(highest)) {
      highest = rarity
    }
  }

  return highest
}

/**
 * Generate random positions for particle effects
 */
export function generateParticlePositions(
  count: number,
  centerX: number,
  centerY: number,
  spread: number
): Array<{ x: number; y: number; angle: number; distance: number }> {
  const positions: Array<{ x: number; y: number; angle: number; distance: number }> = []

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
    const distance = spread * (0.5 + Math.random() * 0.5)

    positions.push({
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      angle,
      distance,
    })
  }

  return positions
}
