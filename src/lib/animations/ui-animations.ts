import gsap from 'gsap'

// ============================================
// UI ANIMATIONS
// ============================================

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
// TURN TRANSITION EFFECTS
// ============================================

// Player turn start - energizing pulse
gsap.registerEffect({
  name: 'turnStart',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Quick bright pulse
    tl.to(targets, {
      filter: 'brightness(1.4) saturate(1.2)',
      scale: 1.05,
      duration: 0.15,
      ease: 'power2.out',
    })
    tl.to(targets, {
      filter: 'brightness(1) saturate(1)',
      scale: 1,
      duration: 0.25,
      ease: 'power2.inOut',
    })

    return tl
  },
  extendTimeline: true,
})

// Enemy turn warning - ominous red tint
gsap.registerEffect({
  name: 'enemyTurnStart',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    tl.to(targets, {
      filter: 'brightness(0.9) saturate(1.1) hue-rotate(-5deg)',
      duration: 0.2,
      ease: 'power2.out',
    })
    tl.to(targets, {
      filter: 'brightness(1) saturate(1) hue-rotate(0deg)',
      duration: 0.4,
      ease: 'power2.inOut',
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// DAMAGE FEEDBACK EFFECTS
// ============================================

// Screen damage vignette - red edge flash on player damage
gsap.registerEffect({
  name: 'damageVignette',
  effect: (_targets: gsap.TweenTarget, config: { intensity?: number }) => {
    const tl = gsap.timeline()
    const intensity = config.intensity ?? 1

    // Create vignette overlay
    const vignette = document.createElement('div')
    vignette.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9997;
      box-shadow: inset 0 0 ${80 * intensity}px ${40 * intensity}px rgba(255, 30, 30, 0.5);
      opacity: 0;
    `
    document.body.appendChild(vignette)

    tl.to(vignette, {
      opacity: 1,
      duration: 0.08,
      ease: 'power3.out',
    })
    tl.to(vignette, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: () => vignette.remove(),
    })

    return tl
  },
  extendTimeline: true,
})

// Health bar danger pulse
gsap.registerEffect({
  name: 'healthDanger',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline({ repeat: 2 })

    tl.to(targets, {
      filter: 'brightness(1.5) drop-shadow(0 0 8px #ff3333)',
      duration: 0.15,
    })
    tl.to(targets, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      duration: 0.2,
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// POWER EFFECTS
// ============================================

// Buff applied - upward golden trail
gsap.registerEffect({
  name: 'buffApply',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    // Pop and glow
    tl.to(el, {
      filter: 'brightness(1.5) drop-shadow(0 0 15px oklch(0.7 0.15 90))',
      scale: 1.15,
      y: -5,
      duration: 0.15,
      ease: 'back.out(2)',
    })
    tl.to(el, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      y: 0,
      duration: 0.25,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Debuff applied - sinking red effect
gsap.registerEffect({
  name: 'debuffApply',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    // Shrink and darken
    tl.to(el, {
      filter: 'brightness(0.7) saturate(1.3) drop-shadow(0 0 12px oklch(0.5 0.2 25))',
      scale: 0.95,
      y: 3,
      duration: 0.12,
      ease: 'power2.in',
    })
    tl.to(el, {
      filter: 'brightness(1) saturate(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Power stack change pulse
gsap.registerEffect({
  name: 'stackChange',
  effect: (targets: gsap.TweenTarget, config: { increase?: boolean }) => {
    const tl = gsap.timeline()
    const color = config.increase ? 'oklch(0.7 0.15 90)' : 'oklch(0.5 0.15 25)'
    const scale = config.increase ? 1.3 : 0.85

    tl.to(targets, {
      filter: `brightness(1.4) drop-shadow(0 0 8px ${color})`,
      scale,
      duration: 0.1,
      ease: 'power2.out',
    })
    tl.to(targets, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.15,
      ease: 'power2.inOut',
    })

    return tl
  },
  extendTimeline: true,
})

// Power expiry flash
gsap.registerEffect({
  name: 'powerExpire',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    tl.to(targets, {
      filter: 'brightness(2) saturate(0)',
      scale: 1.2,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// CARD FLOURISH EFFECTS
// ============================================

// Card draw flourish - cards fan in from deck
gsap.registerEffect({
  name: 'drawFlourish',
  effect: (targets: gsap.TweenTarget, config: { index?: number }) => {
    const tl = gsap.timeline()
    const delay = (config.index ?? 0) * 0.08

    gsap.set(targets, { x: -100, y: 50, rotation: -15, opacity: 0, scale: 0.8 })

    tl.to(targets, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
      duration: 0.35,
      delay,
      ease: 'back.out(1.4)',
    })

    return tl
  },
  extendTimeline: true,
})

// Discard swoosh - cards fly to discard pile
gsap.registerEffect({
  name: 'discardSwoosh',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    tl.to(targets, {
      x: 150,
      y: 100,
      rotation: 25,
      opacity: 0,
      scale: 0.7,
      duration: 0.3,
      ease: 'power2.in',
    })

    return tl
  },
  extendTimeline: true,
})

// Exhaust burn - card burns away
gsap.registerEffect({
  name: 'exhaustBurn',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Catch fire
    tl.to(targets, {
      filter: 'brightness(1.5) saturate(1.5) hue-rotate(-20deg)',
      scale: 1.1,
      duration: 0.15,
    })
    // Burn up
    tl.to(targets, {
      filter: 'brightness(2) saturate(0) blur(4px)',
      scale: 0.5,
      y: -30,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
    })

    return tl
  },
  extendTimeline: true,
})
