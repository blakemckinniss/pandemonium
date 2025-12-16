import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { Flip } from 'gsap/Flip'

// Register plugins once
gsap.registerPlugin(Draggable, Flip)

// ============================================
// REGISTERED EFFECTS
// ============================================

// Deal cards from draw pile to hand
gsap.registerEffect({
  name: 'dealCards',
  effect: (targets: gsap.TweenTarget, config: { stagger?: number; onComplete?: () => void }) => {
    const elements = gsap.utils.toArray<HTMLElement>(targets)
    gsap.killTweensOf(elements)

    // Remove dealt class and set initial state
    elements.forEach((el) => {
      el.classList.remove('is-dealt')
    })

    gsap.set(elements, {
      rotation: -25,
      x: -window.innerWidth * 0.4,
      y: -100,
      scale: 0.5,
      opacity: 0,
    })

    return gsap.to(elements, {
      duration: 0.5,
      scale: 1,
      x: 0,
      y: 0,
      rotation: (i) => {
        // Get fan rotation from data attribute
        const el = elements[i]
        return parseFloat(el?.dataset.fanRotation || '0')
      },
      opacity: 1,
      stagger: config.stagger ?? 0.1,
      ease: 'back.out(0.5)',
      onComplete: () => {
        // Add dealt class and set CSS custom property for hover
        elements.forEach((el) => {
          const fanRotation = el.dataset.fanRotation || '0'
          el.style.setProperty('--fan-rotation', `${fanRotation}deg`)
          el.classList.add('is-dealt')
          // Clear GSAP inline styles so CSS takes over
          gsap.set(el, { clearProps: 'all' })
        })
        config.onComplete?.()
      },
    })
  },
  defaults: { stagger: 0.1 },
  extendTimeline: true,
})

// Play card animation - fly up then to discard
// Starts from current position (where card was dropped after drag)
gsap.registerEffect({
  name: 'playCard',
  effect: (
    targets: gsap.TweenTarget,
    config: { onComplete?: () => void }
  ) => {
    const tl = gsap.timeline()

    // First: scale up and flash at current position (where card was dropped)
    tl.to(targets, {
      duration: 0.15,
      scale: 1.3,
      zIndex: 100,
      ease: 'power2.out',
    })

    // Then: shrink and fly to discard pile (top-left area)
    tl.to(targets, {
      duration: 0.35,
      x: -window.innerWidth * 0.3,
      y: -window.innerHeight * 0.2,
      scale: 0.3,
      rotation: -15,
      opacity: 0,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Discard entire hand at end of turn
gsap.registerEffect({
  name: 'discardHand',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    gsap.killTweensOf(targets)
    return gsap.to(targets, {
      duration: 0.4,
      x: window.innerWidth * 0.4,
      y: window.innerHeight * 0.3,
      rotation: 20,
      stagger: -0.05,
      scale: 0.4,
      opacity: 0,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Floating combat number
gsap.registerEffect({
  name: 'floatNumber',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    return gsap.fromTo(
      targets,
      { y: 0, opacity: 1, scale: 0.5 },
      {
        y: -80,
        opacity: 0,
        scale: 1.8,
        duration: 1.2,
        ease: 'power2.out',
        onComplete: config.onComplete,
      }
    )
  },
  extendTimeline: true,
})

// Card hover lift
gsap.registerEffect({
  name: 'cardHover',
  effect: (targets: gsap.TweenTarget) => {
    return gsap.to(targets, {
      y: -20,
      scale: 1.05,
      duration: 0.15,
      ease: 'power2.out',
    })
  },
})

// Card unhover
gsap.registerEffect({
  name: 'cardUnhover',
  effect: (targets: gsap.TweenTarget) => {
    return gsap.to(targets, {
      y: 0,
      scale: 1,
      duration: 0.15,
      ease: 'power2.out',
    })
  },
})

// Shake effect for damage
gsap.registerEffect({
  name: 'shake',
  effect: (targets: gsap.TweenTarget) => {
    return gsap.to(targets, {
      x: '+=10',
      duration: 0.05,
      repeat: 5,
      yoyo: true,
      ease: 'power2.inOut',
    })
  },
})

// Pulse effect for healing/block
gsap.registerEffect({
  name: 'pulse',
  effect: (targets: gsap.TweenTarget, config: { color?: string }) => {
    const tl = gsap.timeline()
    tl.to(targets, {
      boxShadow: `0 0 20px ${config.color ?? '#22c55e'}`,
      scale: 1.05,
      duration: 0.15,
    })
    tl.to(targets, {
      boxShadow: 'none',
      scale: 1,
      duration: 0.3,
    })
    return tl
  },
})

// Snap card back to original position
gsap.registerEffect({
  name: 'snapBack',
  effect: (targets: gsap.TweenTarget) => {
    return gsap.to(targets, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.3,
      ease: 'back.out(1.5)',
    })
  },
})

// Exhaust card - shrink, fade, burn/remove effect
gsap.registerEffect({
  name: 'exhaustCard',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Flash red briefly
    tl.to(targets, {
      filter: 'brightness(1.5) saturate(0.5)',
      scale: 1.1,
      duration: 0.1,
    })

    // Shrink and fade with slight rotation
    tl.to(targets, {
      scale: 0,
      opacity: 0,
      rotation: 15,
      filter: 'brightness(0.3) saturate(0)',
      duration: 0.4,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Shuffle deck - quick riffle visual
gsap.registerEffect({
  name: 'shuffleDeck',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Quick shake/riffle effect
    tl.to(targets, {
      x: '+=8',
      rotation: 3,
      duration: 0.06,
      ease: 'power2.inOut',
    })
    tl.to(targets, {
      x: '-=16',
      rotation: -3,
      duration: 0.06,
      ease: 'power2.inOut',
    })
    tl.to(targets, {
      x: '+=12',
      rotation: 2,
      duration: 0.06,
      ease: 'power2.inOut',
    })
    tl.to(targets, {
      x: '-=8',
      rotation: -1,
      duration: 0.06,
      ease: 'power2.inOut',
    })
    tl.to(targets, {
      x: '+=4',
      rotation: 0,
      duration: 0.06,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Power icon pop-in animation
gsap.registerEffect({
  name: 'powerIcon',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Start scaled down
    gsap.set(targets, { scale: 0, opacity: 0 })

    // Pop in with bounce
    tl.to(targets, {
      scale: 1.3,
      opacity: 1,
      duration: 0.2,
      ease: 'back.out(2)',
    })

    // Settle to normal size
    tl.to(targets, {
      scale: 1,
      duration: 0.15,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Power icon fade out animation
gsap.registerEffect({
  name: 'powerIconRemove',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    return gsap.to(targets, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Energy orb pulse effect
gsap.registerEffect({
  name: 'energyPulse',
  effect: (targets: gsap.TweenTarget, config: { color?: string; onComplete?: () => void }) => {
    const tl = gsap.timeline()
    const glowColor = config.color ?? 'oklch(0.6 0.12 70)'

    // Pulse outward with glow
    tl.to(targets, {
      scale: 1.25,
      boxShadow: `0 0 30px ${glowColor}`,
      duration: 0.15,
      ease: 'power2.out',
    })

    // Return to normal
    tl.to(targets, {
      scale: 1,
      boxShadow: `0 0 12px oklch(0.5 0.12 70 / 0.5)`,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Discard single card - fly to discard pile
gsap.registerEffect({
  name: 'discardCard',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    return gsap.to(targets, {
      x: window.innerWidth * 0.35,
      y: -window.innerHeight * 0.15,
      rotation: 15,
      scale: 0.4,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Ethereal exhaust - ghostly fade with purple tint
gsap.registerEffect({
  name: 'etherealExhaust',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Flash purple and float up
    tl.to(targets, {
      filter: 'brightness(1.3) saturate(0.6) hue-rotate(260deg)',
      y: '-=30',
      scale: 1.15,
      opacity: 0.9,
      duration: 0.2,
      ease: 'power2.out',
    })

    // Fade out with ghostly dissolve
    tl.to(targets, {
      y: '-=50',
      scale: 0.8,
      opacity: 0,
      filter: 'brightness(0.5) saturate(0) blur(8px)',
      duration: 0.5,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Upgrade card - golden sparkle effect
gsap.registerEffect({
  name: 'upgradeCard',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Golden glow pulse
    tl.to(targets, {
      boxShadow: '0 0 30px oklch(0.8 0.18 85), 0 0 60px oklch(0.7 0.15 85)',
      scale: 1.08,
      filter: 'brightness(1.3) saturate(1.2)',
      duration: 0.25,
      ease: 'power2.out',
    })

    // Settle back with lingering glow
    tl.to(targets, {
      boxShadow: '0 0 15px oklch(0.7 0.12 85)',
      scale: 1,
      filter: 'brightness(1) saturate(1)',
      duration: 0.4,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Retain card - subtle cyan glow indicating it stays
gsap.registerEffect({
  name: 'retainCard',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Cyan pulse
    tl.to(targets, {
      boxShadow: '0 0 20px oklch(0.7 0.15 200)',
      scale: 1.03,
      duration: 0.2,
      ease: 'power2.out',
    })

    // Fade to subtle persistent glow
    tl.to(targets, {
      boxShadow: '0 0 8px oklch(0.6 0.1 200)',
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Transform card - morph/shimmer effect
gsap.registerEffect({
  name: 'transformCard',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    // Shimmer and distort
    tl.to(targets, {
      filter: 'brightness(1.5) hue-rotate(180deg) blur(2px)',
      scale: 0.95,
      rotation: 5,
      duration: 0.2,
      ease: 'power2.in',
    })

    // Flash white at peak
    tl.to(targets, {
      filter: 'brightness(2) hue-rotate(0deg) blur(4px)',
      scale: 1.1,
      rotation: -3,
      duration: 0.1,
    })

    // Resolve to new card
    tl.to(targets, {
      filter: 'brightness(1) hue-rotate(0deg) blur(0px)',
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'back.out(1.5)',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Put on deck - card flies to draw pile
gsap.registerEffect({
  name: 'putOnDeck',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    return gsap.to(targets, {
      x: -window.innerWidth * 0.4,
      y: -window.innerHeight * 0.3,
      rotation: -20,
      scale: 0.3,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Max health change - heart pulse effect
gsap.registerEffect({
  name: 'maxHealthPulse',
  effect: (targets: gsap.TweenTarget, config: { color?: string; onComplete?: () => void }) => {
    const tl = gsap.timeline()
    const glowColor = config.color ?? 'oklch(0.6 0.2 25)'

    tl.to(targets, {
      scale: 1.1,
      boxShadow: `0 0 25px ${glowColor}`,
      duration: 0.15,
      ease: 'power2.out',
    })

    tl.to(targets, {
      scale: 1,
      boxShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// ENEMY FEEDBACK EFFECTS
// ============================================

// Flash enemy on damage impact
gsap.registerEffect({
  name: 'enemyHit',
  effect: (targets: gsap.TweenTarget, config: { color?: string }) => {
    const tl = gsap.timeline()
    tl.to(targets, {
      filter: `brightness(1.6) drop-shadow(0 0 10px ${config.color ?? '#ff4757'})`,
      scale: 1.05,
      duration: 0.1,
    })
    tl.to(targets, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.15,
      ease: 'power2.out',
    })
    return tl
  },
  extendTimeline: true,
})

// Knockback shake on damage
gsap.registerEffect({
  name: 'enemyShake',
  effect: (targets: gsap.TweenTarget) => {
    return gsap.to(targets, {
      x: '+=12',
      duration: 0.04,
      repeat: 4,
      yoyo: true,
      ease: 'power2.inOut',
    })
  },
  extendTimeline: true,
})

// Enemy telegraph - wind-up before attacking
gsap.registerEffect({
  name: 'enemyTelegraph',
  effect: (targets: gsap.TweenTarget, config: { intentType?: string }) => {
    const colors: Record<string, string> = {
      attack: '#ff4757',
      defend: '#3498db',
      buff: '#f39c12',
      debuff: '#9b59b6',
      ability: '#e74c3c',
      ultimate: '#ff6b6b',
    }
    const color = colors[config.intentType ?? 'attack'] ?? '#ff4757'

    const tl = gsap.timeline()
    // Pull back slightly and glow menacingly
    tl.to(targets, {
      x: '+=8',
      scale: 1.08,
      filter: `brightness(1.3) drop-shadow(0 0 15px ${color})`,
      duration: 0.25,
      ease: 'power2.out',
    })
    // Hold the telegraph pose
    tl.to(targets, {
      filter: `brightness(1.4) drop-shadow(0 0 20px ${color})`,
      duration: 0.15,
      ease: 'sine.inOut',
    })
    return tl
  },
  extendTimeline: true,
})

// Enemy attack execute - lunge toward player
gsap.registerEffect({
  name: 'enemyAttackLunge',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    // Lunge forward aggressively
    tl.to(targets, {
      x: '-=40',
      scale: 1.12,
      filter: 'brightness(1.5) drop-shadow(0 0 25px #ff4757)',
      duration: 0.12,
      ease: 'power3.in',
    })
    // Snap back to position
    tl.to(targets, {
      x: 0,
      scale: 1,
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      duration: 0.25,
      ease: 'elastic.out(1, 0.5)',
    })
    return tl
  },
  extendTimeline: true,
})

// Enemy defend animation - hunker down
gsap.registerEffect({
  name: 'enemyDefend',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    tl.to(targets, {
      scale: 0.95,
      filter: 'brightness(1.2) drop-shadow(0 0 15px #3498db)',
      duration: 0.2,
      ease: 'power2.out',
    })
    tl.to(targets, {
      scale: 1,
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      duration: 0.3,
      ease: 'power2.inOut',
    })
    return tl
  },
  extendTimeline: true,
})

// Playable card glow pulse
gsap.registerEffect({
  name: 'cardGlow',
  effect: (targets: gsap.TweenTarget, config: { theme?: string }) => {
    const colors: Record<string, string> = {
      attack: '#ff6b6b',
      skill: '#00d4ff',
      power: '#a55eea',
    }
    const glowColor = colors[config.theme ?? 'attack'] ?? '#ffa502'

    return gsap.to(targets, {
      boxShadow: `0 0 20px ${glowColor}, inset 0 0 8px ${glowColor}40`,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  },
  extendTimeline: true,
})

// One-shot flash when card is played (impact effect)
gsap.registerEffect({
  name: 'cardPlayFlash',
  effect: (targets: gsap.TweenTarget, config: { theme?: string }) => {
    const colors: Record<string, string> = {
      attack: '#ff6b6b',
      skill: '#00d4ff',
      power: '#a55eea',
    }
    const glowColor = colors[config.theme ?? 'attack'] ?? '#ffa502'

    return gsap.timeline()
      .to(targets, {
        boxShadow: `0 0 30px ${glowColor}, inset 0 0 12px ${glowColor}60`,
        scale: 1.05,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(targets, {
        boxShadow: 'none',
        scale: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      })
  },
  extendTimeline: true,
})

// Status power icon pulse
gsap.registerEffect({
  name: 'statusPulse',
  effect: (targets: gsap.TweenTarget, config: { element?: string }) => {
    const elementGlows: Record<string, string> = {
      fire: '#ff6348',
      ice: '#00d4ff',
      lightning: '#ffd700',
      void: '#a55eea',
      physical: '#e8e8e8',
    }
    const glow = elementGlows[config.element ?? 'physical']

    const tl = gsap.timeline({ repeat: 2 })
    tl.to(targets, {
      filter: `drop-shadow(0 0 6px ${glow})`,
      scale: 1.15,
      duration: 0.2,
    })
    tl.to(targets, {
      filter: 'drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.3,
    })
    return tl
  },
  extendTimeline: true,
})

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function killAllTweens(selector: string): void {
  gsap.killTweensOf(selector)
}

export function getElementCenter(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

export { gsap, Draggable, Flip }
