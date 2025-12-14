import { useEffect, useRef, useCallback } from 'react'
import type { ParticleType } from './emitParticle'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: ParticleType
}

interface ParticleEffectsProps {
  containerRef: React.RefObject<HTMLElement | null>
}

// Particle configuration by type
const PARTICLE_CONFIG = {
  spark: {
    colors: ['#ff6b6b', '#ffa502', '#ff4757'],
    count: 12,
    speed: 8,
    life: 30,
    size: 4,
    gravity: 0.3,
  },
  heal: {
    colors: ['#2ed573', '#7bed9f', '#26de81'],
    count: 15,
    speed: 3,
    life: 45,
    size: 6,
    gravity: -0.1, // Float up
  },
  block: {
    colors: ['#70a1ff', '#5352ed', '#3742fa'],
    count: 10,
    speed: 5,
    life: 25,
    size: 5,
    gravity: 0,
  },
  energy: {
    colors: ['#ffa502', '#ff6348', '#eccc68'],
    count: 8,
    speed: 4,
    life: 35,
    size: 5,
    gravity: -0.05,
  },
  poison: {
    colors: ['#a55eea', '#8854d0', '#6c5ce7'],
    count: 10,
    speed: 2,
    life: 50,
    size: 4,
    gravity: 0.05,
  },
  upgrade: {
    colors: ['#ffd700', '#ffb347', '#fff68f', '#fffacd'],
    count: 20,
    speed: 4,
    life: 50,
    size: 5,
    gravity: -0.15, // Float up like sparkles
  },
  transform: {
    colors: ['#9b59b6', '#8e44ad', '#00d4ff', '#00b4d8'],
    count: 18,
    speed: 6,
    life: 40,
    size: 4,
    gravity: 0, // Swirl outward
  },
  retain: {
    colors: ['#00d4ff', '#00b4d8', '#48dbfb', '#0abde3'],
    count: 14,
    speed: 2.5,
    life: 45,
    size: 4,
    gravity: -0.08, // Gentle float upward
  },
}

export function ParticleEffects({ containerRef }: ParticleEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  // Spawn particles at a position
  const spawnParticles = useCallback((
    x: number,
    y: number,
    type: Particle['type']
  ) => {
    const config = PARTICLE_CONFIG[type]
    const newParticles: Particle[] = []

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5
      const speed = config.speed * (0.5 + Math.random() * 0.5)

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: config.life,
        maxLife: config.life,
        size: config.size * (0.5 + Math.random() * 0.5),
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        type,
      })
    }

    particlesRef.current.push(...newParticles)
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Debounced resize handler to prevent layout thrashing
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    const updateCanvas = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }, 150)
    }
    // Initial size set immediately
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    window.addEventListener('resize', updateCanvas)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current

      // Batch by disabling shadows globally (expensive per-particle)
      ctx.shadowBlur = 0

      // Process particles in reverse for safe removal
      let writeIndex = 0
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const pConfig = PARTICLE_CONFIG[p.type]

        // Update position
        p.x += p.vx
        p.y += p.vy
        p.vy += pConfig.gravity
        p.life--

        // Skip dead particles
        if (p.life <= 0) continue

        // Keep alive particles
        if (writeIndex !== i) {
          particles[writeIndex] = p
        }
        writeIndex++

        // Fade out
        const alpha = p.life / p.maxLife
        const radius = p.size * alpha

        // Draw outer particle (no shadow - GPU heavy)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()

        // Inner bright core
        ctx.globalAlpha = alpha * 0.8
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Trim dead particles (swap-remove pattern)
      particles.length = writeIndex

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', updateCanvas)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [])

  // Listen for custom particle events
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleParticle = (e: CustomEvent<{ x: number; y: number; type: Particle['type'] }>) => {
      spawnParticles(e.detail.x, e.detail.y, e.detail.type)
    }

    container.addEventListener('particle-effect', handleParticle as EventListener)
    return () => {
      container.removeEventListener('particle-effect', handleParticle as EventListener)
    }
  }, [containerRef, spawnParticles])

  // Expose spawn function globally for easy access
  useEffect(() => {
    (window as unknown as { spawnParticles: typeof spawnParticles }).spawnParticles = spawnParticles
    return () => {
      delete (window as unknown as { spawnParticles?: typeof spawnParticles }).spawnParticles
    }
  }, [spawnParticles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1000 }}
      aria-hidden="true"
    />
  )
}

export default ParticleEffects
