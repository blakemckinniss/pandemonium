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
