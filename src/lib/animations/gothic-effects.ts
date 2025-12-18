import gsap from 'gsap'

// ============================================
// GOTHIC THEME ANIMATIONS
// Dark fantasy visual effects for card combat
// ============================================

// Gothic color palette
const GOTHIC_COLORS = {
  blood: '#8b0000',
  crimson: '#dc143c',
  void: '#1a0a2e',
  shadow: '#2d1b4e',
  bone: '#e8dcc4',
  gold: '#c9a227',
  sicklyGreen: '#4a7c59',
  etherealBlue: '#4a6fa5',
  hellfire: '#ff4500',
}

// ============================================
// CARD IMPACT EFFECTS
// ============================================

// Gothic card impact - dark tendrils burst from impact point
gsap.registerEffect({
  name: 'gothicCardImpact',
  effect: (targets: gsap.TweenTarget, config: { theme?: string; intensity?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const intensity = config.intensity ?? 1

    // Theme-based colors
    const themeColors: Record<string, { primary: string; secondary: string; glow: string }> = {
      attack: { primary: GOTHIC_COLORS.crimson, secondary: GOTHIC_COLORS.blood, glow: '#ff2222' },
      skill: { primary: GOTHIC_COLORS.etherealBlue, secondary: GOTHIC_COLORS.shadow, glow: '#6688ff' },
      power: { primary: GOTHIC_COLORS.gold, secondary: GOTHIC_COLORS.void, glow: '#ffaa00' },
    }
    const colors = themeColors[config.theme ?? 'attack'] ?? themeColors.attack

    // Create impact container
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

    // Create dark tendrils/shards
    const tendrilCount = Math.floor(8 + intensity * 4)
    for (let i = 0; i < tendrilCount; i++) {
      const tendril = document.createElement('div')
      const length = 40 + Math.random() * 60 * intensity
      const width = 3 + Math.random() * 5
      const angle = (i / tendrilCount) * 360 + Math.random() * 20

      tendril.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${length}px;
        height: ${width}px;
        background: linear-gradient(90deg, ${colors.primary}, ${colors.secondary} 60%, transparent);
        transform-origin: left center;
        transform: rotate(${angle}deg);
        border-radius: 0 50% 50% 0;
        box-shadow: 0 0 10px ${colors.glow};
        opacity: 0;
      `
      container.appendChild(tendril)

      // Animate tendril outward
      gsap.fromTo(tendril,
        { scaleX: 0, opacity: 0.9 },
        {
          scaleX: 1 + Math.random() * 0.5,
          opacity: 0,
          duration: 0.3 + Math.random() * 0.2,
          ease: 'power2.out',
        }
      )
    }

    // Central flash
    const flash = document.createElement('div')
    flash.style.cssText = `
      position: absolute;
      left: ${centerX - 30}px;
      top: ${centerY - 30}px;
      width: 60px;
      height: 60px;
      background: radial-gradient(circle, ${colors.glow} 0%, transparent 70%);
      border-radius: 50%;
      opacity: 0;
    `
    container.appendChild(flash)

    tl.to(flash, {
      opacity: 1,
      scale: 2 * intensity,
      duration: 0.1,
      ease: 'power3.out',
    })
    tl.to(flash, {
      opacity: 0,
      scale: 3 * intensity,
      duration: 0.25,
      ease: 'power2.out',
    })

    // Entity hit reaction
    tl.to(el, {
      filter: `brightness(1.8) drop-shadow(0 0 20px ${colors.glow})`,
      scale: 1.05,
      duration: 0.08,
    }, 0)
    tl.to(el, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 100)
    })

    return tl
  },
  extendTimeline: true,
})

// Dark slash effect - diagonal slash marks for attack damage
gsap.registerEffect({
  name: 'darkSlash',
  effect: (targets: gsap.TweenTarget, config: { count?: number; element?: string }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const count = config.count ?? 1

    // Element-based slash colors
    const elementColors: Record<string, string> = {
      fire: '#ff4500',
      ice: '#00bfff',
      lightning: '#ffd700',
      void: '#9932cc',
      physical: '#ff3333',
    }
    const slashColor = elementColors[config.element ?? 'physical'] ?? '#ff3333'

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9999;
      overflow: visible;
    `
    document.body.appendChild(container)

    // Create slash marks
    for (let i = 0; i < Math.min(count, 5); i++) {
      const slash = document.createElement('div')
      const angle = -45 + (i * 30) + Math.random() * 20
      const offsetX = (Math.random() - 0.5) * rect.width * 0.4
      const offsetY = (Math.random() - 0.5) * rect.height * 0.4

      slash.style.cssText = `
        position: absolute;
        left: ${rect.width / 2 + offsetX}px;
        top: ${rect.height / 2 + offsetY}px;
        width: ${rect.width * 1.2}px;
        height: 4px;
        background: linear-gradient(90deg, transparent 0%, ${slashColor} 20%, white 50%, ${slashColor} 80%, transparent 100%);
        transform: rotate(${angle}deg) scaleX(0);
        transform-origin: center;
        box-shadow: 0 0 15px ${slashColor}, 0 0 30px ${slashColor}40;
        border-radius: 2px;
      `
      container.appendChild(slash)

      // Animate slash
      gsap.to(slash, {
        scaleX: 1,
        duration: 0.08,
        delay: i * 0.05,
        ease: 'power4.out',
        onComplete: () => {
          gsap.to(slash, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.out',
          })
        },
      })
    }

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 500)
    }, 0.5)

    return tl
  },
  extendTimeline: true,
})

// ============================================
// HEALING & LIFE EFFECTS
// ============================================

// Soul drain - ghostly wisps flow toward target (healing/lifesteal)
gsap.registerEffect({
  name: 'soulDrain',
  effect: (targets: gsap.TweenTarget, config: { sourceX?: number; sourceY?: number; color?: string }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const targetRect = el.getBoundingClientRect()
    const targetX = targetRect.left + targetRect.width / 2
    const targetY = targetRect.top + targetRect.height / 2

    // Source position (or offset position)
    const sourceX = config.sourceX ?? targetX + 200
    const sourceY = config.sourceY ?? targetY

    const wispColor = config.color ?? GOTHIC_COLORS.sicklyGreen

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
    `
    document.body.appendChild(container)

    // Create soul wisps
    const wispCount = 6
    for (let i = 0; i < wispCount; i++) {
      const wisp = document.createElement('div')
      const size = 8 + Math.random() * 12
      const offsetX = (Math.random() - 0.5) * 60
      const offsetY = (Math.random() - 0.5) * 60

      wisp.style.cssText = `
        position: absolute;
        left: ${sourceX + offsetX}px;
        top: ${sourceY + offsetY}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, ${wispColor} 0%, ${wispColor}80 40%, transparent 70%);
        border-radius: 50%;
        box-shadow: 0 0 ${size}px ${wispColor};
        opacity: 0;
      `
      container.appendChild(wisp)

      // Animate wisp to target
      const delay = i * 0.08
      gsap.to(wisp, {
        opacity: 0.9,
        duration: 0.15,
        delay,
      })
      gsap.to(wisp, {
        x: targetX - sourceX - offsetX + (Math.random() - 0.5) * 20,
        y: targetY - sourceY - offsetY + (Math.random() - 0.5) * 20,
        scale: 0.3,
        opacity: 0,
        duration: 0.5 + Math.random() * 0.2,
        delay: delay + 0.1,
        ease: 'power2.in',
      })
    }

    // Target glow on receive
    tl.to(el, {
      filter: `brightness(1.3) drop-shadow(0 0 20px ${wispColor})`,
      duration: 0.3,
      delay: 0.4,
    })
    tl.to(el, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      duration: 0.3,
    })

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 100)
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// SCREEN EFFECTS
// ============================================

// Doom pulse - ominous screen-wide pulse for big damage
gsap.registerEffect({
  name: 'doomPulse',
  effect: (_targets: gsap.TweenTarget, config: { intensity?: number; color?: string }) => {
    const tl = gsap.timeline()
    const intensity = config.intensity ?? 1
    const color = config.color ?? GOTHIC_COLORS.crimson

    // Create screen overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9996;
      background: radial-gradient(ellipse at center, transparent 0%, ${color}30 50%, ${color}60 100%);
      opacity: 0;
    `
    document.body.appendChild(overlay)

    // Pulse animation
    tl.to(overlay, {
      opacity: intensity * 0.8,
      duration: 0.1,
      ease: 'power3.out',
    })
    tl.to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => overlay.remove(),
    })

    // Screen shake via CSS transform on body
    const shakeIntensity = 5 * intensity
    tl.to(document.body, {
      x: shakeIntensity,
      duration: 0.03,
    }, 0)
    tl.to(document.body, {
      x: -shakeIntensity,
      duration: 0.03,
    })
    tl.to(document.body, {
      x: shakeIntensity * 0.5,
      duration: 0.03,
    })
    tl.to(document.body, {
      x: 0,
      duration: 0.05,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// CARD AURA EFFECTS
// ============================================

// Spectral shimmer - persistent aura for rare/epic cards
gsap.registerEffect({
  name: 'spectralShimmer',
  effect: (targets: gsap.TweenTarget, config: { rarity?: string }) => {
    const rarityColors: Record<string, { color: string; intensity: number }> = {
      common: { color: '#888888', intensity: 0.3 },
      uncommon: { color: '#22aa44', intensity: 0.5 },
      rare: { color: '#3366ff', intensity: 0.7 },
      epic: { color: '#9933ff', intensity: 0.9 },
      legendary: { color: '#ffaa00', intensity: 1.0 },
    }
    const { color, intensity } = rarityColors[config.rarity ?? 'common'] ?? rarityColors.common

    // Continuous shimmer effect
    return gsap.to(targets, {
      boxShadow: `0 0 ${15 * intensity}px ${color}, 0 0 ${30 * intensity}px ${color}40`,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  },
  extendTimeline: true,
})

// ============================================
// DEATH & DESTRUCTION EFFECTS
// ============================================

// Abyssal rift - void tear effect for exhaust/banish
gsap.registerEffect({
  name: 'abyssalRift',
  effect: (targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Create rift container
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: ${centerX - 60}px;
      top: ${centerY - 60}px;
      width: 120px;
      height: 120px;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(container)

    // Create void rift (expanding dark oval)
    const rift = document.createElement('div')
    rift.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      background: radial-gradient(ellipse, ${GOTHIC_COLORS.void} 0%, ${GOTHIC_COLORS.shadow} 40%, transparent 70%);
      border: 2px solid ${GOTHIC_COLORS.shadow};
      border-radius: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      box-shadow: 0 0 30px ${GOTHIC_COLORS.void}, inset 0 0 20px black;
    `
    container.appendChild(rift)

    // Open rift
    tl.to(rift, {
      width: 100,
      height: 40,
      duration: 0.2,
      ease: 'power2.out',
    })

    // Card gets sucked in
    tl.to(el, {
      scale: 0.3,
      rotation: 180,
      opacity: 0,
      filter: 'blur(4px) brightness(0.3)',
      duration: 0.4,
      ease: 'power3.in',
    }, 0.1)

    // Close rift
    tl.to(rift, {
      width: 0,
      height: 0,
      duration: 0.2,
      ease: 'power2.in',
    })

    // Cleanup
    tl.add(() => {
      container.remove()
      config.onComplete?.()
    })

    return tl
  },
  extendTimeline: true,
})

// Bone shatter - skeleton/undead death effect
gsap.registerEffect({
  name: 'boneShatter',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(container)

    // Create bone fragments
    const boneCount = 15
    for (let i = 0; i < boneCount; i++) {
      const bone = document.createElement('div')
      const size = 8 + Math.random() * 20
      const startX = Math.random() * rect.width
      const startY = Math.random() * rect.height

      bone.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size * 0.3}px;
        background: linear-gradient(90deg, ${GOTHIC_COLORS.bone}, #fff, ${GOTHIC_COLORS.bone});
        border-radius: 30%;
        transform: rotate(${Math.random() * 360}deg);
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
      `
      container.appendChild(bone)

      // Animate bone outward and down (gravity)
      const angle = Math.random() * Math.PI * 2
      const distance = 50 + Math.random() * 100
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance + 80 // Gravity bias

      gsap.to(bone, {
        x: dx,
        y: dy,
        rotation: Math.random() * 720,
        opacity: 0,
        duration: 0.6 + Math.random() * 0.3,
        ease: 'power2.out',
      })
    }

    // Original element fades
    tl.to(el, {
      opacity: 0,
      filter: 'brightness(2) saturate(0)',
      duration: 0.15,
    })

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 1000)
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// COMBO & CHAIN EFFECTS
// ============================================

// Eldritch burst - cosmic horror effect for void/chaos damage
gsap.registerEffect({
  name: 'eldritchBurst',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

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

    // Create eldritch tentacle-like rays
    const rayCount = 12
    for (let i = 0; i < rayCount; i++) {
      const ray = document.createElement('div')
      const angle = (i / rayCount) * 360
      const length = 80 + Math.random() * 60
      const hue = 260 + Math.random() * 40 // Purple-magenta range

      ray.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${length}px;
        height: 6px;
        background: linear-gradient(90deg, hsl(${hue}, 80%, 50%), hsl(${hue}, 60%, 30%) 60%, transparent);
        transform-origin: left center;
        transform: rotate(${angle}deg) scaleX(0);
        border-radius: 0 50% 50% 0;
        box-shadow: 0 0 15px hsl(${hue}, 80%, 40%);
        filter: blur(1px);
      `
      container.appendChild(ray)

      // Wavy extension
      gsap.to(ray, {
        scaleX: 1,
        duration: 0.2,
        delay: i * 0.015,
        ease: 'power2.out',
      })
      gsap.to(ray, {
        opacity: 0,
        scaleX: 1.3,
        duration: 0.3,
        delay: 0.2 + i * 0.015,
        ease: 'power2.in',
      })
    }

    // Central void eye flash
    const eye = document.createElement('div')
    eye.style.cssText = `
      position: absolute;
      left: ${centerX - 20}px;
      top: ${centerY - 20}px;
      width: 40px;
      height: 40px;
      background: radial-gradient(circle, ${GOTHIC_COLORS.void} 0%, transparent 70%);
      border: 2px solid #9932cc;
      border-radius: 50%;
      box-shadow: 0 0 30px #9932cc;
    `
    container.appendChild(eye)

    tl.fromTo(eye,
      { scale: 0, opacity: 0 },
      { scale: 2, opacity: 1, duration: 0.15, ease: 'power2.out' }
    )
    tl.to(eye, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    })

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 100)
    })

    return tl
  },
  extendTimeline: true,
})

// ============================================
// TURN & PHASE TRANSITIONS
// ============================================

// Ominous turn transition - dark sweep across screen
gsap.registerEffect({
  name: 'ominousTurnStart',
  effect: (_targets: gsap.TweenTarget, config: { isEnemy?: boolean }) => {
    const tl = gsap.timeline()
    const color = config.isEnemy ? GOTHIC_COLORS.crimson : GOTHIC_COLORS.etherealBlue

    // Create sweep overlay
    const sweep = document.createElement('div')
    sweep.style.cssText = `
      position: fixed;
      left: -100%;
      top: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, ${color}40 50%, transparent 100%);
      pointer-events: none;
      z-index: 9995;
    `
    document.body.appendChild(sweep)

    tl.to(sweep, {
      left: '100%',
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => sweep.remove(),
    })

    return tl
  },
  extendTimeline: true,
})

// Combat start dramatic entry
gsap.registerEffect({
  name: 'combatEntry',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Elements start invisible and scale from 0
    gsap.set(targets, { scale: 0, opacity: 0, filter: 'blur(10px)' })

    tl.to(targets, {
      scale: 1.1,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.4,
      ease: 'back.out(1.5)',
      stagger: 0.1,
    })
    tl.to(targets, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Blood splatter - visceral damage feedback
gsap.registerEffect({
  name: 'bloodSplatter',
  effect: (targets: gsap.TweenTarget, config: { intensity?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const intensity = config.intensity ?? 1

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9998;
      overflow: visible;
    `
    document.body.appendChild(container)

    // Create blood droplets
    const dropletCount = Math.floor(5 + intensity * 5)
    for (let i = 0; i < dropletCount; i++) {
      const droplet = document.createElement('div')
      const size = 4 + Math.random() * 8 * intensity
      const startX = rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.5
      const startY = rect.height / 2 + (Math.random() - 0.5) * rect.height * 0.5

      droplet.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, ${GOTHIC_COLORS.crimson} 0%, ${GOTHIC_COLORS.blood} 70%);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        box-shadow: 0 0 ${size / 2}px ${GOTHIC_COLORS.blood};
      `
      container.appendChild(droplet)

      // Animate outward with gravity
      const angle = Math.random() * Math.PI * 2
      const distance = 30 + Math.random() * 50 * intensity
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance + 40 // Gravity

      gsap.to(droplet, {
        x: dx,
        y: dy,
        scale: 0.3,
        opacity: 0,
        duration: 0.4 + Math.random() * 0.2,
        ease: 'power2.out',
      })
    }

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 700)
    }, 0.6)

    return tl
  },
  extendTimeline: true,
})

// Shadow coil - dark tendril wrap effect for debuffs
gsap.registerEffect({
  name: 'shadowCoil',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
    `
    document.body.appendChild(container)

    // Create coiling shadow tendrils
    const tendrilCount = 4
    for (let i = 0; i < tendrilCount; i++) {
      const tendril = document.createElement('div')
      const startAngle = (i / tendrilCount) * 360
      const radius = Math.max(rect.width, rect.height) * 0.8

      tendril.style.cssText = `
        position: absolute;
        left: ${centerX + Math.cos(startAngle * Math.PI / 180) * radius}px;
        top: ${centerY + Math.sin(startAngle * Math.PI / 180) * radius}px;
        width: 60px;
        height: 8px;
        background: linear-gradient(90deg, transparent, ${GOTHIC_COLORS.shadow}, ${GOTHIC_COLORS.void});
        border-radius: 4px;
        transform-origin: right center;
        transform: rotate(${startAngle + 180}deg);
        opacity: 0;
        box-shadow: 0 0 10px ${GOTHIC_COLORS.void};
      `
      container.appendChild(tendril)

      // Animate coiling inward
      gsap.to(tendril, {
        opacity: 0.8,
        duration: 0.1,
        delay: i * 0.05,
      })
      gsap.to(tendril, {
        left: centerX,
        top: centerY,
        rotation: startAngle + 180 + 360,
        width: 10,
        opacity: 0,
        duration: 0.5,
        delay: i * 0.05 + 0.1,
        ease: 'power2.in',
      })
    }

    // Target darkens briefly
    tl.to(el, {
      filter: 'brightness(0.6) saturate(0.5)',
      duration: 0.3,
      delay: 0.2,
    })
    tl.to(el, {
      filter: 'brightness(1) saturate(1)',
      duration: 0.3,
    })

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 100)
    })

    return tl
  },
  extendTimeline: true,
})
