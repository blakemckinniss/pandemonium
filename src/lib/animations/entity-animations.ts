import gsap from 'gsap'

// ============================================
// ENTITY ANIMATIONS
// ============================================

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

// Player hit - dramatic recoil and red flash
gsap.registerEffect({
  name: 'playerHit',
  effect: (targets: gsap.TweenTarget, config: { intensity?: number }) => {
    const intensity = config.intensity ?? 1
    const tl = gsap.timeline()

    // Red flash and recoil backward
    tl.to(targets, {
      filter: `brightness(1.8) saturate(1.5) hue-rotate(-15deg) drop-shadow(0 0 20px #ff2222)`,
      x: `+=${15 * intensity}`,
      scale: 1 - 0.03 * intensity,
      duration: 0.08,
      ease: 'power3.out',
    })

    // Quick shake while red
    tl.to(targets, {
      x: `-=${8 * intensity}`,
      duration: 0.04,
      ease: 'power2.inOut',
    })
    tl.to(targets, {
      x: `+=${6 * intensity}`,
      duration: 0.04,
      ease: 'power2.inOut',
    })
    tl.to(targets, {
      x: `-=${4 * intensity}`,
      duration: 0.04,
      ease: 'power2.inOut',
    })

    // Recover back to normal
    tl.to(targets, {
      filter: 'brightness(1) saturate(1) hue-rotate(0deg) drop-shadow(0 0 0px transparent)',
      x: 0,
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })

    return tl
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
