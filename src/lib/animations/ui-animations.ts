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
