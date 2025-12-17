import gsap from 'gsap'

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
