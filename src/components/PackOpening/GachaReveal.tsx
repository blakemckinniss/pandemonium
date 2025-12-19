/**
 * GachaReveal - CELESTIAL RIFT Edition
 * Dopamine-optimized pack opening with aggressive visual impact
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import gsap from 'gsap'
import { Card, getCardDefProps } from '../Card/Card'
import {
  getRevealConfig,
  createAnticipationTimeline,
  createPackBurstTimeline,
  createCardRevealTimeline,
  createShakeTimeline,
  createFlashTimeline,
  createGlowPulseTimeline,
  createDistortionTimeline,
  createAnnouncementTimeline,
  createHeroCelebrationTimeline,
  createRealityBreakTimeline,
  sortCardsForReveal,
  isSpecialRarity,
  getHighestRarity,
} from '../../lib/gacha-animations'
import type { CardDefinition } from '../../types'

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const RARITY_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  common: { primary: '#6b7280', secondary: '#9ca3af', bg: 'rgba(107, 114, 128, 0.1)' },
  uncommon: { primary: '#3b82f6', secondary: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
  rare: { primary: '#eab308', secondary: '#fde047', bg: 'rgba(234, 179, 8, 0.15)' },
  'ultra-rare': { primary: '#a855f7', secondary: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
  legendary: { primary: '#f97316', secondary: '#fdba74', bg: 'rgba(249, 115, 22, 0.2)' },
  mythic: { primary: '#ec4899', secondary: '#f472b6', bg: 'rgba(236, 72, 153, 0.2)' },
  ancient: { primary: '#10b981', secondary: '#34d399', bg: 'rgba(16, 185, 129, 0.2)' },
}

type Phase = 'idle' | 'anticipation' | 'burst' | 'revealing' | 'complete'

interface GachaRevealProps {
  cards: CardDefinition[]
  onComplete: () => void
  onSkip?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM - Canvas-based for performance
// ═══════════════════════════════════════════════════════════════════════════════

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  decay: number
  rotation: number
  rotationSpeed: number
  type: 'circle' | 'star' | 'spark' | 'ring'
}

function useParticleSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  const emit = useCallback((
    x: number,
    y: number,
    count: number,
    color: string,
    options?: {
      spread?: number
      speed?: number
      size?: number
      types?: Particle['type'][]
    }
  ) => {
    const spread = options?.spread ?? 360
    const speed = options?.speed ?? 8
    const baseSize = options?.size ?? 4
    const types = options?.types ?? ['circle', 'spark']

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * (spread * Math.PI / 180)
      const velocity = speed * (0.5 + Math.random() * 0.8)

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: baseSize * (0.5 + Math.random()),
        color,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.01,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        type: types[Math.floor(Math.random() * types.length)],
      })
    }
  }, [])

  const burstRays = useCallback((
    x: number,
    y: number,
    rayCount: number,
    color: string
  ) => {
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 * i) / rayCount
      const length = 150 + Math.random() * 100

      // Create ray particles along the line
      for (let j = 0; j < 20; j++) {
        const dist = (j / 20) * length
        particlesRef.current.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          size: 3 - (j / 20) * 2,
          color,
          alpha: 1 - (j / 20) * 0.5,
          decay: 0.03,
          rotation: angle,
          rotationSpeed: 0,
          type: 'spark',
        })
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1 // gravity
        p.vx *= 0.99 // drag
        p.alpha -= p.decay
        p.rotation += p.rotationSpeed

        if (p.alpha <= 0) return false

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        switch (p.type) {
          case 'circle':
            ctx.beginPath()
            ctx.arc(0, 0, p.size, 0, Math.PI * 2)
            ctx.fillStyle = p.color
            ctx.fill()
            break

          case 'star':
            ctx.beginPath()
            for (let i = 0; i < 5; i++) {
              const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2
              const innerAngle = outerAngle + Math.PI / 5
              ctx.lineTo(Math.cos(outerAngle) * p.size, Math.sin(outerAngle) * p.size)
              ctx.lineTo(Math.cos(innerAngle) * p.size * 0.4, Math.sin(innerAngle) * p.size * 0.4)
            }
            ctx.closePath()
            ctx.fillStyle = p.color
            ctx.fill()
            break

          case 'spark':
            ctx.beginPath()
            ctx.moveTo(-p.size * 2, 0)
            ctx.lineTo(p.size * 2, 0)
            ctx.strokeStyle = p.color
            ctx.lineWidth = p.size * 0.5
            ctx.lineCap = 'round'
            ctx.stroke()
            break

          case 'ring':
            ctx.beginPath()
            ctx.arc(0, 0, p.size, 0, Math.PI * 2)
            ctx.strokeStyle = p.color
            ctx.lineWidth = 2
            ctx.stroke()
            break
        }

        ctx.restore()
        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationRef.current)
  }, [canvasRef])

  return { emit, burstRays }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIGHT RAYS COMPONENT - SVG-based radial beams
// ═══════════════════════════════════════════════════════════════════════════════

function LightRays({
  active,
  color,
  rayCount = 12
}: {
  active: boolean
  color: string
  rayCount?: number
}) {
  const raysRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (!active || !raysRef.current) return

    gsap.fromTo(raysRef.current,
      { opacity: 0, scale: 0.5, rotation: 0 },
      {
        opacity: 1,
        scale: 1.5,
        rotation: 15,
        duration: 0.6,
        ease: 'power2.out',
      }
    )

    gsap.to(raysRef.current, {
      opacity: 0,
      scale: 2,
      duration: 1,
      delay: 0.4,
      ease: 'power2.in',
    })
  }, [active])

  if (!active) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 400"
      style={{ transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }}
    >
      <g ref={raysRef} transform="translate(200, 200)">
        {Array.from({ length: rayCount }).map((_, i) => {
          const angle = (360 / rayCount) * i
          return (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="200"
              y2="0"
              stroke={color}
              strokeWidth={3 - (i % 2)}
              strokeLinecap="round"
              opacity={0.8 - (i % 3) * 0.2}
              transform={`rotate(${angle})`}
              style={{
                filter: `drop-shadow(0 0 8px ${color})`,
              }}
            />
          )
        })}
      </g>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEBULA BACKGROUND - Animated cosmic atmosphere
// ═══════════════════════════════════════════════════════════════════════════════

function NebulaBackground({ intensity = 0.5 }: { intensity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(88, 28, 135, ${intensity * 0.3}) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(30, 64, 175, ${intensity * 0.2}) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 1) 100%)
          `,
        }}
      />

      {/* Floating dust particles */}
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIFT PACK VISUAL - The sealed dimensional tear
// ═══════════════════════════════════════════════════════════════════════════════

function RiftPack({
  onClick,
  disabled,
  highestRarity,
}: {
  onClick: () => void
  disabled: boolean
  highestRarity: string
}) {
  const packRef = useRef<HTMLDivElement>(null)
  const colors = RARITY_COLORS[highestRarity] || RARITY_COLORS.rare

  useEffect(() => {
    if (!packRef.current || disabled) return

    // CSS-based glow pulse only - no transform animations for click stability
    // Transform animations cause Playwright "element is not stable" errors
    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.to(packRef.current, {
      filter: 'brightness(1.08) drop-shadow(0 0 20px rgba(234, 179, 8, 0.4))',
      duration: 2,
      ease: 'sine.inOut',
    })

    return () => { tl.kill() }
  }, [disabled])

  return (
    <div
      ref={packRef}
      onClick={disabled ? undefined : onClick}
      className={`
        relative w-56 h-72 cursor-pointer transform-gpu select-none
        ${disabled ? 'pointer-events-none' : 'hover:scale-105'}
        transition-transform duration-200
      `}
      style={{ perspective: '1000px' }}
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-4 rounded-2xl opacity-60 blur-xl"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Main pack body */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(15, 15, 25, 0.95) 0%,
              rgba(30, 20, 50, 0.95) 50%,
              rgba(15, 15, 25, 0.95) 100%
            )
          `,
          border: `2px solid ${colors.primary}`,
          boxShadow: `
            0 0 30px ${colors.primary}40,
            inset 0 0 60px ${colors.primary}10,
            0 10px 40px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        {/* Rift crack effect */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg,
                transparent 40%,
                ${colors.primary}20 50%,
                transparent 60%
              )
            `,
          }}
        />

        {/* Energy tendrils */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 120">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d="M50 20 Q30 60 50 100 Q70 60 50 20"
            fill="none"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.5"
            filter="url(#glow)"
            className="animate-pulse"
          />
          <path
            d="M30 40 Q50 70 70 40"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="0.5"
            opacity="0.3"
            filter="url(#glow)"
          />
        </svg>

        {/* Central icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Icon
              icon="mdi:cards-playing-diamond"
              className="text-7xl mb-3"
              style={{
                color: colors.primary,
                filter: `drop-shadow(0 0 20px ${colors.primary})`,
              }}
            />
            <div
              className="text-lg font-bold tracking-widest uppercase"
              style={{ color: colors.secondary }}
            >
              Card Pack
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <div
            key={corner}
            className={`absolute w-8 h-8 ${corner.includes('top') ? 'top-2' : 'bottom-2'} ${corner.includes('left') ? 'left-2' : 'right-2'}`}
          >
            <div
              className="w-full h-full"
              style={{
                borderTop: corner.includes('top') ? `2px solid ${colors.primary}40` : 'none',
                borderBottom: corner.includes('bottom') ? `2px solid ${colors.primary}40` : 'none',
                borderLeft: corner.includes('left') ? `2px solid ${colors.primary}40` : 'none',
                borderRight: corner.includes('right') ? `2px solid ${colors.primary}40` : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Floating particles around pack - subtle glow only, no position animation for click stability */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          style={{
            background: colors.primary,
            left: `${25 + (i % 4) * 15}%`,
            top: `${20 + Math.floor(i / 4) * 60}%`,
            opacity: 0.5,
            boxShadow: `0 0 8px ${colors.primary}`,
            animation: `packGlow 3s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes packGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function GachaReveal({ cards, onComplete, onSkip }: GachaRevealProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealedIndex, setRevealedIndex] = useState(-1)
  const [sortedCards, setSortedCards] = useState<CardDefinition[]>([])
  const [currentRarityColor, setCurrentRarityColor] = useState('#fbbf24')
  const [showRays, setShowRays] = useState(false)
  const [rayCount, setRayCount] = useState(12)

  const containerRef = useRef<HTMLDivElement>(null)
  const packRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const announcementRef = useRef<HTMLDivElement>(null)
  const vignetteRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  const { emit, burstRays } = useParticleSystem(canvasRef)

  // Compute highest rarity for pack preview
  const highestRarity = cards.length > 0
    ? getHighestRarity(cards.map(c => c.rarity || 'common'))
    : 'rare'

  // Sort cards on mount
  useEffect(() => {
    setSortedCards(sortCardsForReveal(cards))
  }, [cards])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Main ceremony orchestration
  const startCeremony = useCallback(() => {
    if (phase !== 'idle' || sortedCards.length === 0) return

    setPhase('anticipation')

    const masterTimeline = gsap.timeline({
      onComplete: () => {
        setPhase('complete')
        // Small delay before callback
        setTimeout(onComplete, 500)
      },
    })
    timelineRef.current = masterTimeline

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: ANTICIPATION
    // ═══════════════════════════════════════════════════════════════════════════

    if (packRef.current) {
      masterTimeline.add(createAnticipationTimeline(packRef.current, () => {
        // Crack particles
        const rect = packRef.current?.getBoundingClientRect()
        if (rect) {
          emit(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, '#fbbf24', {
            speed: 3,
            size: 2,
            types: ['spark'],
          })
        }
      }))
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: BURST
    // ═══════════════════════════════════════════════════════════════════════════

    masterTimeline.add(() => setPhase('burst'))

    if (packRef.current && flashRef.current) {
      const rect = packRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      masterTimeline.add(
        createPackBurstTimeline(packRef.current, {
          onFlash: () => {
            if (flashRef.current) {
              createFlashTimeline(flashRef.current, '#ffffff', 0.95, 0.5).play()
            }
          },
          onParticleBurst: () => {
            // Main burst
            emit(centerX, centerY, 80, '#fbbf24', {
              speed: 15,
              size: 5,
              types: ['circle', 'star', 'spark'],
            })
            // Secondary burst
            emit(centerX, centerY, 40, '#ffffff', {
              speed: 10,
              size: 3,
              types: ['circle'],
            })
            // Light rays
            burstRays(centerX, centerY, 16, '#fbbf24')
          },
        })
      )
    }

    // Shake on burst
    if (containerRef.current) {
      masterTimeline.add(createShakeTimeline(containerRef.current, 15, 0.4), '<0.1')
    }

    // Brief pause after burst
    masterTimeline.add(() => {}, '+=0.3')

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: CARD REVEALS
    // ═══════════════════════════════════════════════════════════════════════════

    masterTimeline.add(() => setPhase('revealing'))

    sortedCards.forEach((card, index) => {
      const cardEl = cardRefs.current[index]
      if (!cardEl) return

      const rarity = card.rarity || 'common'
      const config = getRevealConfig(rarity)
      const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common
      const isHero = card.theme === 'hero'

      // Pre-reveal: set current rarity color for UI
      masterTimeline.add(() => {
        setCurrentRarityColor(colors.primary)
      })

      // Main reveal animation
      masterTimeline.add(
        createCardRevealTimeline(cardEl, rarity, {
          onRevealStart: () => {
            setRevealedIndex(index)

            // Particle burst on reveal
            const rect = cardEl.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            emit(centerX, centerY, config.particles / 2, colors.primary, {
              speed: 8,
              size: 4,
              types: ['circle', 'spark'],
            })
          },
        })
      )

      // Shake for rare+
      if (config.shake && containerRef.current) {
        masterTimeline.add(
          createShakeTimeline(containerRef.current, config.shakeIntensity, 0.3),
          '<0.1'
        )
      }

      // Flash for rare+
      if (config.flash && flashRef.current) {
        masterTimeline.add(
          createFlashTimeline(flashRef.current, colors.primary, 0.7, config.flashDuration),
          '<'
        )
      }

      // Light rays for rare+
      if (config.rays) {
        masterTimeline.add(() => {
          setShowRays(true)
          setRayCount(config.rayCount)
          setTimeout(() => setShowRays(false), 1200)
        }, '<0.1')
      }

      // Distortion for ultra-rare+
      if (config.distortion && containerRef.current) {
        masterTimeline.add(
          createDistortionTimeline(containerRef.current, config.celebrationTier),
          '<0.2'
        )
      }

      // Glow pulse for rare+
      if (isSpecialRarity(rarity)) {
        masterTimeline.add(
          createGlowPulseTimeline(cardEl, colors.primary, colors.secondary, config.celebrationTier),
          '<0.2'
        )
      }

      // Announcement text for rare+
      if (config.announcement && announcementRef.current) {
        masterTimeline.add(
          createAnnouncementTimeline(announcementRef.current, config.announcement, colors.primary),
          '<0.3'
        )
      }

      // Reality break for mythic/ancient
      if (config.celebrationTier === 3 && containerRef.current && flashRef.current) {
        masterTimeline.add(
          createRealityBreakTimeline(cardEl, containerRef.current, flashRef.current, colors.primary, {
            onPeak: () => {
              const rect = cardEl.getBoundingClientRect()
              emit(rect.left + rect.width / 2, rect.top + rect.height / 2, 150, colors.primary, {
                speed: 20,
                size: 6,
                types: ['star', 'spark', 'ring'],
              })
            },
          }),
          '<0.5'
        )
      }

      // Hero celebration
      if (isHero && containerRef.current) {
        masterTimeline.add(
          createHeroCelebrationTimeline(cardEl, containerRef.current, {
            onClimaxPeak: () => {
              const rect = cardEl.getBoundingClientRect()
              emit(rect.left + rect.width / 2, rect.top + rect.height / 2, 100, '#fbbf24', {
                speed: 15,
                size: 5,
                types: ['star'],
              })
              burstRays(rect.left + rect.width / 2, rect.top + rect.height / 2, 20, '#fbbf24')
            },
          })
        )
      }

      // Gap between cards
      masterTimeline.add(() => {}, `+=${0.4}`)
    })

    // Final hold
    masterTimeline.add(() => {}, '+=0.5')

  }, [phase, sortedCards, onComplete, emit, burstRays])

  // Skip handler
  const handleSkip = () => {
    if (timelineRef.current) {
      timelineRef.current.progress(1)
    }
    setPhase('complete')
    onSkip?.()
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Animated nebula background */}
      <NebulaBackground intensity={phase === 'revealing' ? 0.8 : 0.5} />

      {/* Vignette overlay */}
      <div
        ref={vignetteRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Screen flash overlay */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none opacity-0 z-30"
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-20"
      />

      {/* Light rays overlay */}
      <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
        <LightRays active={showRays} color={currentRarityColor} rayCount={rayCount} />
      </div>

      {/* Announcement text */}
      <div
        ref={announcementRef}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 text-5xl font-black tracking-widest z-40 pointer-events-none whitespace-nowrap"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      />

      {/* Pack (idle/anticipation phases) */}
      {(phase === 'idle' || phase === 'anticipation') && (
        <div ref={packRef} className="transform-gpu">
          <RiftPack
            onClick={startCeremony}
            disabled={phase === 'anticipation'}
            highestRarity={highestRarity}
          />
        </div>
      )}

      {/* Cards grid (revealing/complete phases) */}
      {(phase === 'revealing' || phase === 'complete' || phase === 'burst') && (
        <div className="flex flex-wrap justify-center items-start gap-6 max-w-6xl px-8 py-6">
          {sortedCards.map((card, index) => {
            const rarity = card.rarity || 'common'
            const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common
            const isRevealed = index <= revealedIndex

            return (
              <div
                key={`${card.id}-${index}`}
                ref={(el) => { cardRefs.current[index] = el }}
                className="w-36 flex-shrink-0 transform-gpu"
                style={{
                  opacity: 0,
                  transform: 'rotateY(180deg) scale(0.5)',
                }}
              >
                {/* Card content */}
                <div className="relative flex flex-col">
                  {/* Card back (unrevealed) */}
                  {!isRevealed && (
                    <div
                      className="w-full aspect-[2/3] rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
                        border: '2px solid #4338ca',
                        boxShadow: '0 0 20px rgba(67, 56, 202, 0.3)',
                      }}
                    >
                      <Icon icon="mdi:help-circle-outline" className="text-4xl text-indigo-400/40" />
                    </div>
                  )}

                  {/* Card front (revealed) */}
                  {isRevealed && (
                    <div className="flex flex-col">
                      <Card {...getCardDefProps(card)} variant="hand" />

                      {/* Rarity label */}
                      <div className="text-center mt-2 h-8 flex items-center justify-center">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                          style={{
                            color: colors.primary,
                            background: colors.bg,
                            textShadow: `0 0 10px ${colors.primary}`,
                          }}
                        >
                          {rarity}
                        </span>
                      </div>

                      {/* Hero badge */}
                      {card.theme === 'hero' && (
                        <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm mt-1 font-bold">
                          <Icon icon="mdi:star" className="text-base" />
                          <span>HERO</span>
                          <Icon icon="mdi:star" className="text-base" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Phase indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center z-10">
        {phase === 'idle' && (
          <p className="text-purple-400/80 animate-pulse text-lg font-medium tracking-wide">
            Click the pack to open
          </p>
        )}
        {phase === 'anticipation' && (
          <p className="text-yellow-400 animate-pulse text-xl font-bold tracking-wider">
            CHANNELING ENERGY...
          </p>
        )}
        {phase === 'revealing' && (
          <p className="text-warm-300 text-lg">
            <span className="font-bold" style={{ color: currentRarityColor }}>
              {Math.min(revealedIndex + 1, sortedCards.length)}
            </span>
            <span className="text-warm-500"> / {sortedCards.length}</span>
          </p>
        )}
        {phase === 'complete' && (
          <p className="text-energy font-bold text-xl tracking-wide">
            ✨ PACK COMPLETE ✨
          </p>
        )}
      </div>

      {/* Skip button */}
      {phase !== 'idle' && phase !== 'complete' && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 px-5 py-2.5 bg-warm-900/80 text-warm-400 rounded-lg
                     hover:text-white hover:bg-warm-800 transition-all duration-200
                     border border-warm-700/50 hover:border-warm-600
                     flex items-center gap-2 font-medium z-50"
        >
          <Icon icon="mdi:skip-next" className="text-xl" />
          Skip
        </button>
      )}

      {/* Continue button (complete phase) */}
      {phase === 'complete' && (
        <button
          onClick={onComplete}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3
                     bg-gradient-to-r from-energy/90 to-yellow-500/90
                     text-warm-900 rounded-lg font-bold text-lg
                     hover:from-energy hover:to-yellow-500
                     transition-all duration-200 transform hover:scale-105
                     shadow-lg shadow-energy/30
                     flex items-center gap-2 z-50"
        >
          <span>Continue</span>
          <Icon icon="mdi:arrow-right" className="text-xl" />
        </button>
      )}
    </div>
  )
}

export default GachaReveal
