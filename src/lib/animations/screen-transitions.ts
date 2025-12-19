import gsap from 'gsap'

// ============================================
// SCREEN TRANSITION EFFECTS
// ============================================

// Screen fade out - dims and scales slightly
gsap.registerEffect({
  name: 'screenFadeOut',
  effect: (targets: gsap.TweenTarget, config: { duration?: number; onComplete?: () => void }) => {
    return gsap.to(targets, {
      opacity: 0,
      scale: 0.98,
      filter: 'blur(4px)',
      duration: config.duration ?? 0.25,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Screen fade in - brightens and scales up
gsap.registerEffect({
  name: 'screenFadeIn',
  effect: (targets: gsap.TweenTarget, config: { duration?: number; onComplete?: () => void }) => {
    gsap.set(targets, { opacity: 0, scale: 1.02, filter: 'blur(4px)' })
    return gsap.to(targets, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: config.duration ?? 0.3,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Screen wipe - horizontal sweep with color overlay
gsap.registerEffect({
  name: 'screenWipe',
  effect: (_targets: gsap.TweenTarget, config: {
    direction?: 'left' | 'right'
    color?: string
    duration?: number
    onMidpoint?: () => void
    onComplete?: () => void
  }) => {
    const tl = gsap.timeline()
    const direction = config.direction ?? 'right'
    const color = config.color ?? 'oklch(0.15 0.02 250)'

    // Create wipe overlay
    const wipe = document.createElement('div')
    wipe.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${color};
      z-index: 9990;
      transform: translateX(${direction === 'right' ? '-100%' : '100%'});
      pointer-events: none;
    `
    document.body.appendChild(wipe)

    // Sweep in
    tl.to(wipe, {
      x: '0%',
      duration: (config.duration ?? 0.5) / 2,
      ease: 'power2.inOut',
      onComplete: config.onMidpoint,
    })
    // Sweep out
    tl.to(wipe, {
      x: direction === 'right' ? '100%' : '-100%',
      duration: (config.duration ?? 0.5) / 2,
      ease: 'power2.inOut',
      onComplete: () => {
        wipe.remove()
        config.onComplete?.()
      },
    })

    return tl
  },
  extendTimeline: true,
})

// Screen flash - bright flash for dramatic moments (victory/defeat)
gsap.registerEffect({
  name: 'screenFlash',
  effect: (_targets: gsap.TweenTarget, config: {
    color?: string
    intensity?: number
    duration?: number
    onComplete?: () => void
  }) => {
    const tl = gsap.timeline()
    const color = config.color ?? 'white'
    const intensity = config.intensity ?? 0.8

    const flash = document.createElement('div')
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${color};
      z-index: 9991;
      opacity: 0;
      pointer-events: none;
    `
    document.body.appendChild(flash)

    tl.to(flash, {
      opacity: intensity,
      duration: 0.08,
      ease: 'power3.out',
    })
    tl.to(flash, {
      opacity: 0,
      duration: config.duration ?? 0.4,
      ease: 'power2.out',
      onComplete: () => {
        flash.remove()
        config.onComplete?.()
      },
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// PHASE-SPECIFIC TRANSITIONS
// ============================================

// Combat entrance - dramatic zoom
gsap.registerEffect({
  name: 'combatEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, scale: 1.05 })

    tl.to(targets, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Reward entrance - rise from below with bounce
gsap.registerEffect({
  name: 'rewardEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, y: 30 })

    tl.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: 'back.out(1.2)',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Campfire entrance - warm fade with brightness
gsap.registerEffect({
  name: 'campfireEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, filter: 'brightness(0.3) saturate(0.5)' })

    tl.to(targets, {
      opacity: 1,
      filter: 'brightness(1) saturate(1)',
      duration: 0.5,
      ease: 'power1.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Treasure entrance - golden shimmer
gsap.registerEffect({
  name: 'treasureEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, scale: 0.95, filter: 'brightness(1.5) saturate(1.3)' })

    tl.to(targets, {
      opacity: 1,
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

// Victory entrance - bright flash to normal
gsap.registerEffect({
  name: 'victoryEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, scale: 0.9, filter: 'brightness(2)' })

    tl.to(targets, {
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
      duration: 0.6,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Room select entrance - cards spread in
gsap.registerEffect({
  name: 'roomSelectEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, y: -20 })

    tl.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})

// Defeat entrance - dark fade with shake
gsap.registerEffect({
  name: 'defeatEnter',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()

    gsap.set(targets, { opacity: 0, filter: 'brightness(0.3) saturate(0.5)' })

    tl.to(targets, {
      opacity: 1,
      filter: 'brightness(0.9) saturate(0.9)',
      duration: 0.8,
      ease: 'power1.out',
      onComplete: config.onComplete,
    })

    return tl
  },
  extendTimeline: true,
})
