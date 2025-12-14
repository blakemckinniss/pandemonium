export type ParticleType = 'spark' | 'heal' | 'block' | 'energy' | 'poison' | 'upgrade' | 'transform' | 'retain'

// Helper to dispatch particle events
export function emitParticle(
  element: Element,
  type: ParticleType
) {
  const rect = element.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  // Try global function first (more reliable)
  const win = window as unknown as { spawnParticles?: (x: number, y: number, type: ParticleType) => void }
  if (win.spawnParticles) {
    win.spawnParticles(x, y, type)
    return
  }

  // Fallback to custom event
  const event = new CustomEvent('particle-effect', {
    bubbles: true,
    detail: { x, y, type },
  })
  element.dispatchEvent(event)
}
