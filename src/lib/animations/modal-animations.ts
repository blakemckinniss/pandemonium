import gsap from 'gsap'

// ============================================
// MODAL ANIMATIONS
// ============================================

// Modal backdrop fade in
gsap.registerEffect({
  name: 'modalBackdropIn',
  effect: (targets: gsap.TweenTarget) => {
    return gsap.fromTo(
      targets,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'power2.out' }
    )
  },
  extendTimeline: true,
})

// Modal backdrop fade out
gsap.registerEffect({
  name: 'modalBackdropOut',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    return gsap.to(targets, {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Modal content entrance - scale up with bounce
gsap.registerEffect({
  name: 'modalEnter',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    gsap.set(targets, { scale: 0.85, opacity: 0, y: 20 })

    tl.to(targets, {
      scale: 1.02,
      opacity: 1,
      y: 0,
      duration: 0.25,
      ease: 'back.out(1.5)',
    })
    tl.to(targets, {
      scale: 1,
      duration: 0.1,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Modal content exit - shrink and fade
gsap.registerEffect({
  name: 'modalExit',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    return gsap.to(targets, {
      scale: 0.9,
      opacity: 0,
      y: 10,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: config.onComplete,
    })
  },
  extendTimeline: true,
})

// Card selection modal - cards fan in
gsap.registerEffect({
  name: 'cardSelectionEnter',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const cards = gsap.utils.toArray(targets) as HTMLElement[]

    cards.forEach((card, i) => {
      const angle = (i - (cards.length - 1) / 2) * 3
      const delay = i * 0.05

      gsap.set(card, { scale: 0.5, opacity: 0, rotation: -15, y: 50 })

      tl.to(
        card,
        {
          scale: 1,
          opacity: 1,
          rotation: angle,
          y: 0,
          duration: 0.3,
          ease: 'back.out(1.7)',
        },
        delay
      )
    })

    return tl
  },
  extendTimeline: true,
})

// Card pile modal - cards cascade in
gsap.registerEffect({
  name: 'cardPileEnter',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const cards = gsap.utils.toArray(targets) as HTMLElement[]

    cards.forEach((card, i) => {
      gsap.set(card, { opacity: 0, y: -30, x: -20 })

      tl.to(
        card,
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.2,
          ease: 'power2.out',
        },
        i * 0.03
      )
    })

    return tl
  },
  extendTimeline: true,
})

// Reward reveal - items pop in with sparkle
gsap.registerEffect({
  name: 'rewardReveal',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const items = gsap.utils.toArray(targets) as HTMLElement[]

    items.forEach((item, i) => {
      gsap.set(item, { scale: 0, opacity: 0, rotation: -10 })

      tl.to(
        item,
        {
          scale: 1.1,
          opacity: 1,
          rotation: 0,
          duration: 0.25,
          ease: 'back.out(2)',
        },
        0.15 + i * 0.1
      )
      tl.to(
        item,
        {
          scale: 1,
          duration: 0.1,
          ease: 'power2.out',
        },
        0.4 + i * 0.1
      )
    })

    return tl
  },
  extendTimeline: true,
})

// Confirmation pulse - yes/no buttons glow
gsap.registerEffect({
  name: 'confirmPulse',
  effect: (targets: gsap.TweenTarget, config: { type?: 'confirm' | 'cancel' }) => {
    const color = config.type === 'confirm' ? 'oklch(0.6 0.15 140)' : 'oklch(0.5 0.15 25)'

    return gsap.to(targets, {
      boxShadow: `0 0 20px ${color}, 0 0 40px ${color}50`,
      scale: 1.05,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    })
  },
  extendTimeline: true,
})
