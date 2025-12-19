import gsap from 'gsap'

// ============================================
// COMBAT FEEDBACK ANIMATIONS
// Enhanced visual feedback for combat events
// ============================================

// ============================================
// TURN TRANSITION EFFECTS
// ============================================

// Player turn banner - dramatic "YOUR TURN" announcement
gsap.registerEffect({
  name: 'playerTurnBanner',
  effect: (_targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline({ onComplete: config.onComplete })

    // Create banner container
    const banner = document.createElement('div')
    banner.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
      text-align: center;
    `

    // Main text
    const text = document.createElement('div')
    text.textContent = 'YOUR TURN'
    text.style.cssText = `
      font-size: 48px;
      font-weight: 900;
      color: #ffd700;
      text-shadow:
        0 0 20px rgba(255, 215, 0, 0.8),
        0 0 40px rgba(255, 180, 0, 0.6),
        0 2px 4px rgba(0, 0, 0, 0.5);
      letter-spacing: 8px;
      opacity: 0;
      transform: scale(0.5);
    `
    banner.appendChild(text)

    // Decorative lines
    const lineLeft = document.createElement('div')
    lineLeft.style.cssText = `
      position: absolute;
      left: -150px;
      top: 50%;
      width: 120px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #ffd700);
      transform: translateY(-50%) scaleX(0);
      transform-origin: right;
    `
    banner.appendChild(lineLeft)

    const lineRight = document.createElement('div')
    lineRight.style.cssText = `
      position: absolute;
      right: -150px;
      top: 50%;
      width: 120px;
      height: 3px;
      background: linear-gradient(270deg, transparent, #ffd700);
      transform: translateY(-50%) scaleX(0);
      transform-origin: left;
    `
    banner.appendChild(lineRight)

    document.body.appendChild(banner)

    // Animation sequence
    tl.to(text, {
      opacity: 1,
      scale: 1.1,
      duration: 0.2,
      ease: 'back.out(2)',
    })
    tl.to([lineLeft, lineRight], {
      scaleX: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, '-=0.1')
    tl.to(text, {
      scale: 1,
      duration: 0.15,
    })
    // Hold
    tl.to({}, { duration: 0.4 })
    // Fade out
    tl.to(banner, {
      opacity: 0,
      y: -30,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => banner.remove(),
    })

    return tl
  },
  extendTimeline: true,
})

// Enemy turn warning - ominous red pulse with text
gsap.registerEffect({
  name: 'enemyTurnBanner',
  effect: (_targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline({ onComplete: config.onComplete })

    // Create warning overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    // Warning text
    const text = document.createElement('div')
    text.textContent = 'ENEMY TURN'
    text.style.cssText = `
      font-size: 42px;
      font-weight: 900;
      color: #ff4444;
      text-shadow:
        0 0 20px rgba(255, 50, 50, 0.8),
        0 0 40px rgba(200, 0, 0, 0.6),
        0 2px 4px rgba(0, 0, 0, 0.5);
      letter-spacing: 6px;
      opacity: 0;
      transform: scale(1.5);
    `
    overlay.appendChild(text)

    // Red vignette
    const vignette = document.createElement('div')
    vignette.style.cssText = `
      position: absolute;
      inset: 0;
      box-shadow: inset 0 0 150px 50px rgba(150, 0, 0, 0.4);
      opacity: 0;
    `
    overlay.insertBefore(vignette, text)

    document.body.appendChild(overlay)

    // Animation - quick ominous flash
    tl.to(vignette, {
      opacity: 1,
      duration: 0.15,
      ease: 'power2.out',
    })
    tl.to(text, {
      opacity: 1,
      scale: 1,
      duration: 0.2,
      ease: 'power3.out',
    }, '-=0.1')
    // Hold
    tl.to({}, { duration: 0.3 })
    // Fade out
    tl.to(overlay, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => overlay.remove(),
    })

    return tl
  },
  extendTimeline: true,
})

// Combat start dramatic entry
gsap.registerEffect({
  name: 'combatStartBanner',
  effect: (_targets: gsap.TweenTarget, config: { onComplete?: () => void }) => {
    const tl = gsap.timeline({ onComplete: config.onComplete })

    // Create full-screen flash
    const flash = document.createElement('div')
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: white;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
    `

    // Banner text
    const banner = document.createElement('div')
    banner.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10000;
      text-align: center;
    `

    const text = document.createElement('div')
    text.textContent = 'BATTLE!'
    text.style.cssText = `
      font-size: 64px;
      font-weight: 900;
      color: #fff;
      text-shadow:
        0 0 30px rgba(255, 100, 50, 0.9),
        0 0 60px rgba(255, 50, 0, 0.7),
        0 4px 8px rgba(0, 0, 0, 0.8);
      letter-spacing: 12px;
      opacity: 0;
      transform: scale(3) rotate(-5deg);
    `
    banner.appendChild(text)

    document.body.appendChild(flash)
    document.body.appendChild(banner)

    // Flash in
    tl.to(flash, {
      opacity: 0.8,
      duration: 0.1,
    })
    tl.to(flash, {
      opacity: 0,
      duration: 0.3,
    })
    // Text slam in
    tl.to(text, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'back.out(1.5)',
    }, 0.05)
    // Hold
    tl.to({}, { duration: 0.5 })
    // Fade out
    tl.to(banner, {
      opacity: 0,
      scale: 1.2,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        flash.remove()
        banner.remove()
      },
    })

    return tl
  },
  extendTimeline: true,
})

// Healing pulse - green glow with rising particles
gsap.registerEffect({
  name: 'healPulse',
  effect: (targets: gsap.TweenTarget, config: { amount?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const intensity = Math.min((config.amount ?? 10) / 15, 1.5)

    // Create healing glow overlay
    const glow = document.createElement('div')
    glow.style.cssText = `
      position: fixed;
      left: ${centerX - 50}px;
      top: ${centerY - 50}px;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(80, 220, 120, 0.6) 0%, rgba(40, 180, 80, 0.3) 40%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      transform: scale(0.5);
    `
    document.body.appendChild(glow)

    // Glow pulse
    tl.to(glow, {
      opacity: 1,
      scale: 1.3 * intensity,
      duration: 0.15,
      ease: 'power2.out',
    })
    tl.to(glow, {
      opacity: 0,
      scale: 1.8 * intensity,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: () => glow.remove(),
    })

    // Create rising heal particles (plus signs / hearts)
    const particleCount = Math.floor(3 + intensity * 3)
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      const xOffset = (Math.random() - 0.5) * rect.width * 0.8
      const symbol = Math.random() > 0.5 ? '+' : '♥'

      particle.textContent = symbol
      particle.style.cssText = `
        position: fixed;
        left: ${centerX + xOffset}px;
        top: ${centerY + rect.height * 0.3}px;
        font-size: ${14 + Math.random() * 8}px;
        font-weight: bold;
        color: #50dc78;
        text-shadow: 0 0 8px #40b850, 0 0 16px #30a040;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
      `
      document.body.appendChild(particle)

      gsap.to(particle, {
        y: -(40 + Math.random() * 40),
        x: (Math.random() - 0.5) * 30,
        opacity: 1,
        duration: 0.2,
        delay: i * 0.08,
        ease: 'power2.out',
      })
      gsap.to(particle, {
        y: -(80 + Math.random() * 30),
        opacity: 0,
        duration: 0.5,
        delay: 0.3 + i * 0.08,
        ease: 'power2.in',
        onComplete: () => particle.remove(),
      })
    }

    // Entity glow effect
    tl.to(el, {
      filter: 'brightness(1.3) drop-shadow(0 0 20px rgba(80, 220, 120, 0.8))',
      duration: 0.15,
    }, 0)
    tl.to(el, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      duration: 0.35,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Energy gain burst - golden radial pulse
gsap.registerEffect({
  name: 'energyGain',
  effect: (targets: gsap.TweenTarget, config: { amount?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const amount = config.amount ?? 1

    // Create energy burst
    const burst = document.createElement('div')
    burst.style.cssText = `
      position: fixed;
      left: ${centerX - 30}px;
      top: ${centerY - 30}px;
      width: 60px;
      height: 60px;
      background: radial-gradient(circle, rgba(255, 200, 50, 0.9) 0%, rgba(255, 160, 30, 0.5) 40%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      transform: scale(0.3);
    `
    document.body.appendChild(burst)

    // Burst animation
    tl.to(burst, {
      opacity: 1,
      scale: 1.5 + amount * 0.3,
      duration: 0.12,
      ease: 'power3.out',
    })
    tl.to(burst, {
      opacity: 0,
      scale: 2 + amount * 0.4,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => burst.remove(),
    })

    // Create energy orb particles spiraling outward
    const orbCount = Math.min(amount + 2, 5)
    for (let i = 0; i < orbCount; i++) {
      const orb = document.createElement('div')
      const angle = (i / orbCount) * 360
      const rad = (angle * Math.PI) / 180

      orb.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #fff 0%, #ffc832 50%, #ff9500 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 6px #ffc832, 0 0 12px #ff9500;
        transform: translate(-50%, -50%);
      `
      document.body.appendChild(orb)

      gsap.to(orb, {
        x: Math.cos(rad) * 35,
        y: Math.sin(rad) * 35,
        opacity: 0,
        scale: 0.5,
        duration: 0.4,
        delay: i * 0.03,
        ease: 'power2.out',
        onComplete: () => orb.remove(),
      })
    }

    // Element pulse
    tl.to(el, {
      filter: 'brightness(1.4) drop-shadow(0 0 15px rgba(255, 200, 50, 0.8))',
      scale: 1.08,
      duration: 0.1,
    }, 0)
    tl.to(el, {
      filter: 'brightness(1) drop-shadow(0 0 0px transparent)',
      scale: 1,
      duration: 0.25,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})

// Energy spend drain - subtle shrink with trailing particles
gsap.registerEffect({
  name: 'energySpend',
  effect: (targets: gsap.TweenTarget, config: { amount?: number }) => {
    const tl = gsap.timeline()
    const el = (targets as HTMLElement[])[0] || (targets as HTMLElement)
    if (!el || !(el instanceof HTMLElement)) return tl

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const amount = config.amount ?? 1

    // Create draining particles flowing toward center
    const particleCount = Math.min(amount + 1, 4)
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      const angle = (i / particleCount) * 360
      const rad = (angle * Math.PI) / 180
      const startDist = 40

      particle.style.cssText = `
        position: fixed;
        left: ${centerX + Math.cos(rad) * startDist}px;
        top: ${centerY + Math.sin(rad) * startDist}px;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #ffc832 0%, #996600 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 4px #cc9900;
        transform: translate(-50%, -50%);
        opacity: 0.8;
      `
      document.body.appendChild(particle)

      gsap.to(particle, {
        x: -Math.cos(rad) * startDist,
        y: -Math.sin(rad) * startDist,
        opacity: 0,
        scale: 0.3,
        duration: 0.3,
        delay: i * 0.04,
        ease: 'power2.in',
        onComplete: () => particle.remove(),
      })
    }

    // Subtle shrink pulse
    tl.to(el, {
      filter: 'brightness(0.85)',
      scale: 0.95,
      duration: 0.1,
    })
    tl.to(el, {
      filter: 'brightness(1)',
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })

    return tl
  },
  extendTimeline: true,
})
