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

// Screen shake for heavy damage - intensity-based camera shake
gsap.registerEffect({
  name: 'screenShake',
  effect: (targets: gsap.TweenTarget, config: { intensity?: number }) => {
    const intensity = config.intensity ?? 1
    const tl = gsap.timeline()

    // Calculate shake parameters based on intensity
    const xAmount = 8 * intensity
    const yAmount = 4 * intensity
    const rotAmount = 0.5 * intensity
    const duration = 0.03 + 0.01 * intensity
    const repeats = Math.min(6, 3 + Math.floor(intensity))

    // Chaotic multi-axis shake
    tl.to(targets, {
      x: `+=${xAmount}`,
      y: `-=${yAmount}`,
      rotation: rotAmount,
      duration,
      ease: 'power2.out',
    })

    for (let i = 0; i < repeats; i++) {
      const decay = 1 - i / (repeats + 1)
      tl.to(targets, {
        x: `${i % 2 === 0 ? '-' : '+'}=${xAmount * decay}`,
        y: `${i % 2 === 0 ? '+' : '-'}=${yAmount * decay}`,
        rotation: (i % 2 === 0 ? -1 : 1) * rotAmount * decay,
        duration: duration * (1 + decay * 0.5),
        ease: 'power2.inOut',
      })
    }

    // Return to origin
    tl.to(targets, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.1,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Low HP danger warning - pulsing red glow
gsap.registerEffect({
  name: 'healthDanger',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()

    // Rapid pulsing red glow to indicate danger
    tl.to(targets, {
      boxShadow: '0 0 30px 10px rgba(255, 50, 50, 0.8), inset 0 0 20px rgba(255, 0, 0, 0.3)',
      filter: 'brightness(1.2) saturate(1.3)',
      duration: 0.15,
      ease: 'power2.out',
    })
    tl.to(targets, {
      boxShadow: '0 0 15px 5px rgba(255, 50, 50, 0.4), inset 0 0 10px rgba(255, 0, 0, 0.1)',
      filter: 'brightness(1.1) saturate(1.15)',
      duration: 0.15,
      ease: 'power2.in',
    })
    tl.to(targets, {
      boxShadow: '0 0 25px 8px rgba(255, 50, 50, 0.6), inset 0 0 15px rgba(255, 0, 0, 0.2)',
      filter: 'brightness(1.15) saturate(1.2)',
      duration: 0.12,
      ease: 'power2.out',
    })
    tl.to(targets, {
      boxShadow: 'none',
      filter: 'brightness(1) saturate(1)',
      duration: 0.3,
      ease: 'power2.out',
    })

    return tl
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

// Element color palettes for themed effects
const ELEMENT_COLORS: Record<string, { hue: number; sat: number; glow: string }> = {
  fire: { hue: 15, sat: 90, glow: '#ff6348' },
  ice: { hue: 200, sat: 85, glow: '#00d4ff' },
  lightning: { hue: 50, sat: 95, glow: '#ffd700' },
  void: { hue: 280, sat: 70, glow: '#a55eea' },
  physical: { hue: 0, sat: 0, glow: '#e8e8e8' },
}

// Enemy death - dramatic shatter/disintegrate effect with element theming
gsap.registerEffect({
  name: 'enemyDeath',
  effect: (targets: gsap.TweenTarget, config: { element?: string }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    // Get element-specific colors (default to red/orange for physical)
    const elemColors = ELEMENT_COLORS[config.element ?? 'physical'] ?? ELEMENT_COLORS.physical
    const baseHue = elemColors.hue || Math.random() * 40
    const baseSat = elemColors.sat

    // Phase 1: Flash white and freeze
    tl.to(el, {
      filter: 'brightness(3) saturate(0)',
      scale: 1.1,
      duration: 0.1,
      ease: 'power4.out',
    })

    // Phase 2: Glitch effect - rapid color/position shifts
    tl.to(el, {
      filter: `brightness(1.5) saturate(2) hue-rotate(${90 + baseHue}deg)`,
      x: '+=5',
      duration: 0.05,
    })
    tl.to(el, {
      filter: `brightness(2) saturate(0.5) hue-rotate(${-90 + baseHue}deg)`,
      x: '-=10',
      duration: 0.05,
    })
    tl.to(el, {
      filter: `brightness(1.8) saturate(1.5) hue-rotate(${180 + baseHue}deg)`,
      x: '+=5',
      duration: 0.05,
    })

    // Phase 3: Create and animate shatter fragments
    const rect = el.getBoundingClientRect()
    const fragmentCount = 12
    const fragments: HTMLDivElement[] = []

    // Create fragment container at same position
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

    // Create fragments as element-colored shards
    for (let i = 0; i < fragmentCount; i++) {
      const fragment = document.createElement('div')
      const size = 15 + Math.random() * 25
      const startX = Math.random() * rect.width
      const startY = Math.random() * rect.height

      // Element-themed shard colors with variation
      const hue = baseHue + (Math.random() * 40 - 20)
      const sat = baseSat + (Math.random() * 20 - 10)
      const lightness = 40 + Math.random() * 30

      fragment.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(
          ${Math.random() * 360}deg,
          hsl(${hue}, ${sat}%, ${lightness}%),
          hsl(${hue + 20}, ${Math.min(100, sat + 10)}%, ${lightness + 20}%)
        );
        clip-path: polygon(
          ${Math.random() * 30}% ${Math.random() * 30}%,
          ${70 + Math.random() * 30}% ${Math.random() * 40}%,
          ${60 + Math.random() * 40}% ${60 + Math.random() * 40}%,
          ${Math.random() * 40}% ${70 + Math.random() * 30}%
        );
        box-shadow: 0 0 10px ${elemColors.glow};
        opacity: 1;
      `
      container.appendChild(fragment)
      fragments.push(fragment)
    }

    // Phase 4: Explode fragments outward
    tl.add(() => {
      fragments.forEach((fragment, i) => {
        const angle = (i / fragmentCount) * Math.PI * 2 + Math.random() * 0.5
        const distance = 100 + Math.random() * 150
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance - 50 // Bias upward

        gsap.to(fragment, {
          x: dx,
          y: dy,
          rotation: Math.random() * 720 - 360,
          scale: 0,
          opacity: 0,
          duration: 0.6 + Math.random() * 0.3,
          ease: 'power2.out',
        })
      })
    }, '-=0.1')

    // Phase 5: Original element dissolves
    tl.to(
      el,
      {
        filter: 'brightness(0.5) blur(8px) saturate(0)',
        scale: 0.3,
        opacity: 0,
        duration: 0.4,
        ease: 'power3.in',
      },
      '-=0.5'
    )

    // Cleanup fragments after animation
    tl.add(() => {
      setTimeout(() => container.remove(), 100)
    })

    return tl
  },
  extendTimeline: true,
})

// Card play flash - impact effect on target
gsap.registerEffect({
  name: 'cardPlayFlash',
  effect: (targets: gsap.TweenTarget, config: { theme?: string }) => {
    const tl = gsap.timeline()
    const themeColors: Record<string, string> = {
      attack: '#ff4757',
      skill: '#2ed573',
      power: '#ffa502',
    }
    const color = themeColors[config.theme ?? 'attack'] ?? '#ffffff'

    // Quick impact flash
    tl.to(targets, {
      filter: `brightness(1.8) drop-shadow(0 0 20px ${color})`,
      scale: 1.08,
      duration: 0.1,
      ease: 'power3.out',
    })
    tl.to(targets, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Combo surge - escalating visual intensity
gsap.registerEffect({
  name: 'comboSurge',
  effect: (targets: gsap.TweenTarget, config: { intensity?: number }) => {
    const tl = gsap.timeline()
    const intensity = config.intensity ?? 1

    // Scale and glow based on combo intensity
    const glowSize = 15 + intensity * 8
    const scaleAmount = 1 + intensity * 0.05

    tl.to(targets, {
      filter: `brightness(${1 + intensity * 0.2}) drop-shadow(0 0 ${glowSize}px oklch(0.7 0.2 70))`,
      scale: scaleAmount,
      duration: 0.15,
      ease: 'power3.out',
    })
    tl.to(targets, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Victory explosion - dramatic win celebration
gsap.registerEffect({
  name: 'victoryExplosion',
  effect: (targets: gsap.TweenTarget) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Create radial burst of golden particles
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

    // Create victory particles
    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      const size = 8 + Math.random() * 16
      const hue = 40 + Math.random() * 30 // Golden range

      particle.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, hsl(${hue}, 90%, 60%), hsl(${hue}, 100%, 40%));
        border-radius: 50%;
        box-shadow: 0 0 ${size}px hsl(${hue}, 90%, 50%);
      `
      container.appendChild(particle)

      // Animate outward
      const angle = (i / particleCount) * Math.PI * 2
      const distance = 200 + Math.random() * 300
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance

      gsap.to(particle, {
        x: dx,
        y: dy,
        scale: 0,
        opacity: 0,
        duration: 0.8 + Math.random() * 0.4,
        ease: 'power2.out',
        delay: Math.random() * 0.2,
      })
    }

    // Cleanup
    tl.add(() => {
      setTimeout(() => container.remove(), 1500)
    })

    return tl
  },
  extendTimeline: true,
})
