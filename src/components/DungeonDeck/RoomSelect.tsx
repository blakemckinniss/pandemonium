import { useEffect, useRef, useState } from 'react'
import type { RoomCard, RoomType } from '../../types'
import { getRoomDefinition } from '../../content/rooms'
import { gsap } from '../../lib/animations'

interface RoomSelectProps {
  choices: RoomCard[]
  floor: number
  maxFloors?: number
  onSelectRoom: (roomUid: string) => void
}

// Room type visual configuration - each type has distinct magical signature
const ROOM_TYPE_CONFIG: Record<RoomType, {
  glowColor: string
  accentColor: string
  borderGradient: string
  icon: string
  label: string
  atmosphere: 'danger' | 'neutral' | 'safe' | 'reward' | 'mystery'
}> = {
  combat: {
    glowColor: 'var(--color-accent-crimson)',
    accentColor: 'var(--color-accent-blood)',
    borderGradient: 'linear-gradient(135deg, oklch(0.38 0.20 18), oklch(0.52 0.22 22), oklch(0.38 0.20 18))',
    icon: '⚔️',
    label: 'Combat',
    atmosphere: 'danger',
  },
  elite: {
    glowColor: 'var(--color-element-void-glow)',
    accentColor: 'var(--color-element-void)',
    borderGradient: 'linear-gradient(135deg, oklch(0.45 0.22 305), oklch(0.65 0.26 308), oklch(0.45 0.22 305))',
    icon: '👁️',
    label: 'Elite',
    atmosphere: 'danger',
  },
  boss: {
    glowColor: 'oklch(0.55 0.28 350)',
    accentColor: 'oklch(0.40 0.25 355)',
    borderGradient: 'linear-gradient(135deg, oklch(0.35 0.25 355), oklch(0.55 0.28 350), oklch(0.65 0.26 308), oklch(0.35 0.25 355))',
    icon: '💀',
    label: 'Boss',
    atmosphere: 'danger',
  },
  campfire: {
    glowColor: 'var(--color-accent-ember)',
    accentColor: 'var(--color-accent-warm)',
    borderGradient: 'linear-gradient(135deg, oklch(0.55 0.18 45), oklch(0.72 0.15 60), oklch(0.58 0.20 38), oklch(0.55 0.18 45))',
    icon: '🔥',
    label: 'Rest',
    atmosphere: 'safe',
  },
  treasure: {
    glowColor: 'var(--rarity-legendary)',
    accentColor: 'var(--color-gold)',
    borderGradient: 'linear-gradient(135deg, oklch(0.65 0.18 70), oklch(0.78 0.22 65), oklch(0.72 0.16 75), oklch(0.65 0.18 70))',
    icon: '💎',
    label: 'Treasure',
    atmosphere: 'reward',
  },
  shop: {
    glowColor: 'var(--rarity-uncommon)',
    accentColor: 'oklch(0.55 0.06 200)',
    borderGradient: 'linear-gradient(135deg, oklch(0.45 0.06 200), oklch(0.60 0.08 200), oklch(0.45 0.06 200))',
    icon: '🛒',
    label: 'Shop',
    atmosphere: 'neutral',
  },
  event: {
    glowColor: 'var(--color-element-ice-glow)',
    accentColor: 'var(--color-element-ice)',
    borderGradient: 'linear-gradient(135deg, oklch(0.65 0.12 215), oklch(0.85 0.16 218), oklch(0.65 0.12 215))',
    icon: '❓',
    label: 'Event',
    atmosphere: 'mystery',
  },
}

export function RoomSelect({ choices, floor, maxFloors = 10, onSelectRoom }: RoomSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Calculate danger level for atmospheric effects
  const dangerLevel = Math.min(floor / maxFloors, 1)

  // Dramatic card deal animation - cards emerge from shadow
  useEffect(() => {
    if (!cardsRef.current) return

    const cards = cardsRef.current.querySelectorAll('.RoomCard')
    const cardArray = Array.from(cards)

    // Initial state: cards stacked in center, invisible, rotated
    gsap.set(cardArray, {
      opacity: 0,
      scale: 0.6,
      y: 150,
      rotationY: -90,
      rotationX: 15,
      transformOrigin: 'center bottom',
    })

    // Staggered deal animation
    const tl = gsap.timeline()

    // Dramatic entrance
    tl.to(cardArray, {
      opacity: 1,
      scale: 1,
      y: 0,
      rotationY: 0,
      rotationX: 0,
      duration: 0.7,
      stagger: {
        each: 0.15,
        from: 'center',
      },
      ease: 'back.out(1.4)',
    })

    // Idle floating animation REMOVED - caused click stability issues
    // Cards are static after deal animation completes

    return () => {
      tl.kill()
    }
  }, [choices])

  // Handle card hover animations
  const handleCardHover = (uid: string, isEntering: boolean) => {
    if (selectedCard) return // Don't hover during selection

    setHoveredCard(isEntering ? uid : null)

    const card = cardsRef.current?.querySelector(`[data-uid="${uid}"]`)
    if (!card) return

    if (isEntering) {
      gsap.to(card, {
        scale: 1.08,
        y: -20,
        rotationX: 5,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        duration: 0.3,
        ease: 'power2.out',
      })

      // Animate rune glow
      const runeGlow = card.querySelector('.rune-glow')
      if (runeGlow) {
        gsap.to(runeGlow, {
          opacity: 1,
          scale: 1.1,
          duration: 0.4,
          ease: 'power2.out',
        })
      }
    } else {
      gsap.to(card, {
        scale: 1,
        y: 0,
        rotationX: 0,
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        duration: 0.3,
        ease: 'power2.out',
      })

      const runeGlow = card.querySelector('.rune-glow')
      if (runeGlow) {
        gsap.to(runeGlow, {
          opacity: 0.6,
          scale: 1,
          duration: 0.3,
        })
      }
    }
  }

  // Handle card selection with ritual activation
  const handleCardSelect = (uid: string) => {
    if (selectedCard) return

    setSelectedCard(uid)

    const card = cardsRef.current?.querySelector(`[data-uid="${uid}"]`)
    const otherCards = cardsRef.current?.querySelectorAll(`.RoomCard:not([data-uid="${uid}"])`)

    if (card) {
      // Selected card: dramatic activation
      const tl = gsap.timeline({
        onComplete: () => {
          onSelectRoom(uid)
        },
      })

      // Pulse and glow intensifies
      tl.to(card, {
        scale: 1.15,
        boxShadow: '0 0 60px 20px rgba(255, 200, 100, 0.4)',
        duration: 0.3,
        ease: 'power2.out',
      })
        .to(card, {
          scale: 1.1,
          opacity: 0,
          y: -100,
          duration: 0.5,
          ease: 'power2.in',
        })
    }

    // Fade out unchosen cards
    if (otherCards) {
      gsap.to(otherCards, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.in',
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="RoomSelect fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 100%, oklch(0.12 0.04 30 / 0.8), transparent),
          radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.08 0.02 ${20 + dangerLevel * 10}) / 0.6), transparent),
          linear-gradient(180deg,
            oklch(0.05 0.01 28) 0%,
            oklch(0.07 ${0.015 + dangerLevel * 0.01} ${28 + dangerLevel * 5}) 50%,
            oklch(0.04 0.02 25) 100%
          )
        `,
      }}
    >
      {/* Ambient particle overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, oklch(0.5 0.15 ${50 + dangerLevel * 20} / 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, oklch(0.4 0.12 ${280 + dangerLevel * 30} / 0.08) 0%, transparent 35%),
            radial-gradient(circle at 50% 50%, oklch(0.3 0.08 60 / 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Floor Depth Indicator - Left side */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <div className="text-xs font-ui uppercase tracking-[0.3em] text-warm-500 mb-2" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          Descent
        </div>
        <div className="relative h-48 w-1 bg-surface-alt/50 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="absolute bottom-0 w-full rounded-full transition-all duration-700 ease-out"
            style={{
              height: `${dangerLevel * 100}%`,
              background: `linear-gradient(to top,
                oklch(0.52 0.22 22) 0%,
                oklch(0.58 0.20 38) 50%,
                oklch(0.65 0.15 60) 100%
              )`,
              boxShadow: `0 0 12px oklch(0.52 0.22 22 / 0.6)`,
            }}
          />
          {/* Floor markers */}
          {Array.from({ length: maxFloors }, (_, i) => (
            <div
              key={i}
              className="absolute w-3 -left-1 h-0.5 bg-border/50"
              style={{ bottom: `${(i / maxFloors) * 100}%` }}
            />
          ))}
        </div>
        <div
          className="font-display text-2xl font-bold tabular-nums"
          style={{
            color: dangerLevel > 0.7 ? 'var(--color-accent-crimson)' : dangerLevel > 0.4 ? 'var(--color-accent-ember)' : 'var(--color-accent-warm)',
            textShadow: `0 0 20px currentColor`,
          }}
        >
          {floor}
        </div>
      </div>

      {/* Main Content - full height, centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="font-logo text-4xl md:text-5xl tracking-wide mb-3"
            style={{
              background: 'linear-gradient(135deg, var(--color-parchment), var(--color-accent-warm), var(--color-bone))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 40px oklch(0.72 0.15 60 / 0.3)',
            }}
          >
            Choose Your Fate
          </h1>
          <p className="font-prose text-lg text-warm-400 italic">
            {choices.length} path{choices.length !== 1 ? 's' : ''} lie before you...
          </p>
        </div>

        {/* Room Cards */}
        <div
          ref={cardsRef}
          className="flex gap-8 perspective-1000"
          style={{ perspective: '1200px' }}
        >
          {choices.map((roomCard) => {
            const def = getRoomDefinition(roomCard.definitionId)
            if (!def) return null

            const config = ROOM_TYPE_CONFIG[def.type] || ROOM_TYPE_CONFIG.combat
            const isHovered = hoveredCard === roomCard.uid

            return (
              <button
                key={roomCard.uid}
                data-uid={roomCard.uid}
                className="RoomCard group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-energy/50"
                style={{
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => handleCardSelect(roomCard.uid)}
                onMouseEnter={() => handleCardHover(roomCard.uid, true)}
                onMouseLeave={() => handleCardHover(roomCard.uid, false)}
                disabled={!!selectedCard}
              >
                {/* Rune glow layer - behind card */}
                <div
                  className="rune-glow absolute -inset-3 rounded-2xl opacity-60 blur-md transition-opacity"
                  style={{
                    background: config.borderGradient,
                    opacity: isHovered ? 1 : 0.5,
                  }}
                />

                {/* Card Frame */}
                <div
                  className="relative w-56 h-80 rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--color-surface)',
                    boxShadow: `
                      inset 0 1px 0 oklch(1 0 0 / 0.05),
                      0 10px 30px -10px oklch(0 0 0 / 0.5),
                      0 0 0 1px oklch(0.28 0.03 45 / 0.5)
                    `,
                  }}
                >
                  {/* Ornate Border */}
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: config.borderGradient,
                      padding: '3px',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMaskComposite: 'xor',
                    }}
                  />

                  {/* Room Image / Icon */}
                  <div className="relative h-44 overflow-hidden">
                    {def.image ? (
                      <>
                        <img
                          src={def.image}
                          alt={def.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Dramatic overlay gradient */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `
                              linear-gradient(to bottom, transparent 0%, transparent 40%, oklch(0.1 0.02 30) 100%),
                              radial-gradient(ellipse at center top, transparent 30%, oklch(0.1 0.02 30 / 0.4) 100%)
                            `,
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className="h-full flex items-center justify-center"
                        style={{
                          background: `
                            radial-gradient(ellipse at center, ${config.accentColor}20 0%, transparent 70%),
                            var(--color-surface-alt)
                          `,
                        }}
                      >
                        <span className="text-7xl filter drop-shadow-lg">{def.icon || config.icon}</span>
                      </div>
                    )}

                    {/* Room Type Badge */}
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-ui font-semibold uppercase tracking-wider backdrop-blur-sm"
                      style={{
                        background: `${config.accentColor}40`,
                        color: config.glowColor,
                        border: `1px solid ${config.accentColor}60`,
                        boxShadow: `0 0 12px ${config.glowColor}30`,
                      }}
                    >
                      {config.label}
                    </div>

                    {/* Danger/Safety Indicator - corner runes */}
                    {config.atmosphere === 'danger' && (
                      <>
                        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 opacity-60" style={{ borderColor: config.glowColor }} />
                        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 opacity-60" style={{ borderColor: config.glowColor }} />
                      </>
                    )}
                    {config.atmosphere === 'safe' && (
                      <div className="absolute top-2 left-2 text-lg opacity-80">✨</div>
                    )}
                  </div>

                  {/* Room Info */}
                  <div className="relative p-4 h-36 flex flex-col justify-between">
                    {/* Decorative divider */}
                    <div
                      className="absolute top-0 left-4 right-4 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${config.accentColor}60, transparent)`,
                      }}
                    />

                    <div>
                      <h3 className="font-display text-lg font-semibold text-parchment leading-tight mb-1">
                        {def.name}
                      </h3>
                      <p className="font-prose text-sm text-warm-400 italic line-clamp-2">
                        {def.description}
                      </p>
                    </div>

                    {/* Monsters preview for combat rooms */}
                    {def.monsters && def.monsters.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-warm-500 font-ui">Enemies:</span>
                        <span className="text-xs text-warm-400 font-ui">
                          {def.monsters.length}x
                        </span>
                      </div>
                    )}

                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 opacity-80"
                      style={{
                        background: config.borderGradient,
                      }}
                    />
                  </div>
                </div>

                {/* Hover rune circle effect */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: isHovered ? 0.15 : 0,
                    background: `
                      repeating-conic-gradient(
                        from 0deg at 50% 50%,
                        transparent 0deg 5deg,
                        ${config.glowColor}40 5deg 10deg
                      )
                    `,
                    mask: 'radial-gradient(ellipse at center, transparent 60%, black 70%, transparent 100%)',
                    WebkitMask: 'radial-gradient(ellipse at center, transparent 60%, black 70%, transparent 100%)',
                    animation: isHovered ? 'spin 20s linear infinite' : 'none',
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* Bottom hint */}
        <div className="mt-6 text-center">
          <p className="font-ui text-sm text-warm-600 tracking-wide">
            Click a card to descend
          </p>
        </div>
      </div>

      {/* Atmospheric corner vignettes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-black/40 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-black/60 to-transparent" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-black/60 to-transparent" />
      </div>

      {/* CSS for rune rotation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default RoomSelect
