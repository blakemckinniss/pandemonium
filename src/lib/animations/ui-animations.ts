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

// ============================================
// NEW EFFECT ANIMATIONS
// ============================================

// Mill effect - cards tumbling into discard
gsap.registerEffect({
  name: 'millCards',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Cards tumble and fade
    tl.to(targets, {
      x: 100,
      y: 50,
      rotation: 45,
      opacity: 0,
      scale: 0.6,
      filter: 'brightness(0.5) blur(2px)',
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.in',
    })

    return tl
  },
  extendTimeline: true,
})

// Card modifier applied - glow pulse based on type
gsap.registerEffect({
  name: 'cardModifier',
  effect: (targets: gsap.TweenTarget, config: { modifier?: string }) => {
    const tl = gsap.timeline()

    const modifierColors: Record<string, { glow: string; filter: string }> = {
      innate: { glow: '#4ecdc4', filter: 'brightness(1.3) saturate(1.2)' },
      ethereal: { glow: '#9b59b6', filter: 'brightness(1.2) saturate(0.8) hue-rotate(30deg)' },
      unplayable: { glow: '#7f8c8d', filter: 'brightness(0.7) saturate(0.5) grayscale(0.5)' },
    }
    const style = modifierColors[config.modifier ?? 'innate'] ?? modifierColors.innate

    // Pulse with modifier color
    tl.to(targets, {
      filter: style.filter,
      boxShadow: `0 0 20px ${style.glow}, 0 0 40px ${style.glow}50`,
      scale: 1.05,
      duration: 0.2,
      ease: 'power2.out',
    })
    tl.to(targets, {
      filter: config.modifier === 'unplayable' ? style.filter : 'brightness(1) saturate(1)',
      boxShadow: config.modifier === 'unplayable' ? `0 0 8px ${style.glow}` : 'none',
      scale: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    })

    return tl
  },
  extendTimeline: true,
})

// Intent weakened - enemy intent shrinks and dims
gsap.registerEffect({
  name: 'intentWeakened',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Shake and shrink
    tl.to(targets, {
      x: -5,
      duration: 0.05,
    })
    tl.to(targets, {
      x: 5,
      duration: 0.05,
    })
    tl.to(targets, {
      x: 0,
      scale: 0.85,
      filter: 'brightness(0.7) saturate(0.6)',
      duration: 0.2,
      ease: 'power2.out',
    })
    tl.to(targets, {
      scale: 1,
      filter: 'brightness(1) saturate(1)',
      duration: 0.3,
      ease: 'power2.inOut',
    })

    return tl
  },
  extendTimeline: true,
})

// Delayed effect placed - time bomb countdown indicator
gsap.registerEffect({
  name: 'delayedEffectPlaced',
  effect: (targets: gsap.TweenTarget, config: { turnsRemaining?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()

    // Create countdown indicator
    const indicator = document.createElement('div')
    indicator.textContent = `⏳${config.turnsRemaining ?? '?'}`
    indicator.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top - 30}px;
      transform: translateX(-50%);
      font-size: 18px;
      font-weight: bold;
      color: #f39c12;
      text-shadow: 0 0 10px #f39c12, 0 0 20px #e74c3c;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
    `
    document.body.appendChild(indicator)

    // Pop in and float
    tl.to(indicator, {
      opacity: 1,
      y: -10,
      duration: 0.3,
      ease: 'back.out(2)',
    })
    tl.to(indicator, {
      opacity: 0,
      y: -30,
      duration: 0.5,
      delay: 0.5,
      ease: 'power2.in',
      onComplete: () => indicator.remove(),
    })

    // Target pulses with warning
    tl.to(el, {
      boxShadow: '0 0 25px #f39c12, 0 0 50px #e74c3c50',
      duration: 0.2,
    }, 0)
    tl.to(el, {
      boxShadow: 'none',
      duration: 0.4,
    })

    return tl
  },
  extendTimeline: true,
})

// Delayed effect triggered - time bomb explodes
gsap.registerEffect({
  name: 'delayedEffectTrigger',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Create explosion container
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(container)

    // Create explosion rings
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div')
      ring.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 20px;
        height: 20px;
        border: 3px solid #f39c12;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 15px #e74c3c;
        opacity: 0;
      `
      container.appendChild(ring)

      gsap.to(ring, {
        width: 150 + i * 40,
        height: 150 + i * 40,
        opacity: 0.8,
        duration: 0.2,
        delay: i * 0.1,
        ease: 'power2.out',
      })
      gsap.to(ring, {
        opacity: 0,
        duration: 0.3,
        delay: 0.2 + i * 0.1,
        ease: 'power2.in',
      })
    }

    // Flash
    tl.to(el, {
      filter: 'brightness(2) saturate(1.5)',
      scale: 1.1,
      duration: 0.1,
    })
    tl.to(el, {
      filter: 'brightness(1) saturate(1)',
      scale: 1,
      duration: 0.3,
    })

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 600)
    }, 0.5)

    return tl
  },
  extendTimeline: true,
})

// Power silenced - chains/lock effect
gsap.registerEffect({
  name: 'powerSilenced',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Darken and add chain visual
    tl.to(targets, {
      filter: 'brightness(0.5) saturate(0.3) grayscale(0.7)',
      scale: 0.9,
      duration: 0.2,
      ease: 'power2.in',
    })

    // Shake like struggling against chains
    tl.to(targets, { x: -2, duration: 0.05 })
    tl.to(targets, { x: 2, duration: 0.05 })
    tl.to(targets, { x: -1, duration: 0.05 })
    tl.to(targets, { x: 0, duration: 0.05 })

    return tl
  },
  extendTimeline: true,
})

// Chain lightning bounce - for chain effect
gsap.registerEffect({
  name: 'chainBounce',
  effect: (targets: gsap.TweenTarget, config: { fromX?: number; fromY?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const toX = rect.left + rect.width / 2
    const toY = rect.top + rect.height / 2
    const fromX = config.fromX ?? toX - 100
    const fromY = config.fromY ?? toY

    // Create lightning bolt
    const bolt = document.createElement('div')
    bolt.style.cssText = `
      position: fixed;
      left: ${fromX}px;
      top: ${fromY}px;
      width: ${Math.hypot(toX - fromX, toY - fromY)}px;
      height: 4px;
      background: linear-gradient(90deg, #ffd700 0%, #fff 50%, #ffd700 100%);
      transform-origin: left center;
      transform: rotate(${Math.atan2(toY - fromY, toX - fromX)}rad);
      box-shadow: 0 0 10px #ffd700, 0 0 20px #ff6600;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
    `
    document.body.appendChild(bolt)

    tl.to(bolt, {
      opacity: 1,
      duration: 0.05,
    })
    tl.to(bolt, {
      opacity: 0,
      duration: 0.15,
      ease: 'power2.out',
      onComplete: () => bolt.remove(),
    })

    // Target flash
    tl.to(el, {
      filter: 'brightness(1.8) drop-shadow(0 0 15px #ffd700)',
      duration: 0.08,
    }, 0.05)
    tl.to(el, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      duration: 0.2,
    })

    return tl
  },
  extendTimeline: true,
})
