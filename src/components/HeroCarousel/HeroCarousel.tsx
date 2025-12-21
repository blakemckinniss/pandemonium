import { useRef, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import type { CardDefinition } from '../../types'
import { Card } from '../Card/Card'
import { getCardDefProps } from '../Card/utils'

interface HeroCarouselProps {
  heroes: CardDefinition[]
  selectedHeroId: string
  onSelectHero: (id: string) => void
}

const VISIBLE_COUNT = 3
const GAP = 16 // gap-4 = 1rem = 16px
const GLOW_SPACE = 24 // Padding to allow glow effects to escape (12px glow radius + buffer)

export function HeroCarousel({
  heroes,
  selectedHeroId,
  onSelectHero,
}: HeroCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardWidth, setCardWidth] = useState(200)

  // Calculate card width based on container (accounting for glow padding)
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        // Subtract glow padding from available width
        const availableWidth = containerWidth - (GLOW_SPACE * 2)
        const totalGaps = GAP * (VISIBLE_COUNT - 1)
        const width = (availableWidth - totalGaps) / VISIBLE_COUNT
        setCardWidth(width)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Center on selected hero initially
  useEffect(() => {
    const selectedIdx = heroes.findIndex(h => h.id === selectedHeroId)
    if (selectedIdx > 0) {
      // Try to center the selected hero (put it in middle of 3)
      const targetIndex = Math.max(0, Math.min(selectedIdx - 1, heroes.length - VISIBLE_COUNT))
      setCurrentIndex(targetIndex)
    }
  }, []) // Only on mount

  const maxIndex = Math.max(0, heroes.length - VISIBLE_COUNT)

  const scroll = (direction: 'left' | 'right') => {
    setCurrentIndex(prev => {
      if (direction === 'left') {
        return Math.max(0, prev - 1)
      } else {
        return Math.min(maxIndex, prev + 1)
      }
    })
  }

  const translateX = -(currentIndex * (cardWidth + GAP))

  return (
    <div className="mb-8 w-full max-w-3xl mx-auto">
      <p className="section-header">Select Hero</p>
      <div className="relative flex items-center overflow-visible">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          disabled={currentIndex === 0}
          className="absolute -left-5 z-10 w-10 h-10 flex items-center justify-center
                     bg-warm-900/90 hover:bg-warm-800 rounded-full border border-warm-700
                     text-warm-300 hover:text-warm-100 transition-all duration-200
                     shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous hero"
        >
          <Icon icon="mdi:chevron-left" width={24} />
        </button>

        {/* Hero Container - outer wrapper clips, inner has glow space */}
        <div
          ref={containerRef}
          className="w-full overflow-hidden"
          style={{ padding: `${GLOW_SPACE}px 0` }}
        >
          {/* Sliding track */}
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              gap: `${GAP}px`,
              transform: `translateX(${translateX}px)`,
              paddingLeft: `${GLOW_SPACE}px`,
              paddingRight: `${GLOW_SPACE}px`,
            }}
          >
            {heroes.map((hero) => (
              <div
                key={hero.id}
                onClick={() => onSelectHero(hero.id)}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer transition-all duration-200 hover:opacity-100"
                style={{
                  width: `${cardWidth}px`,
                  ...(selectedHeroId === hero.id ? {
                    filter: 'drop-shadow(0 0 12px rgba(255, 200, 100, 0.6))',
                    transform: 'scale(1.02)',
                  } : {
                    opacity: 0.7,
                  }),
                }}
              >
                <Card
                  variant="hand"
                  {...getCardDefProps(hero)}
                />
                {/* Hero stats below card */}
                {hero.heroStats && (
                  <div className="mt-2 flex justify-center items-center gap-2 text-sm text-warm-400">
                    <span className="text-heal">{hero.heroStats.health} HP</span>
                    <span>·</span>
                    <span className="text-energy">{hero.heroStats.energy} Energy</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          disabled={currentIndex >= maxIndex}
          className="absolute -right-5 z-10 w-10 h-10 flex items-center justify-center
                     bg-warm-900/90 hover:bg-warm-800 rounded-full border border-warm-700
                     text-warm-300 hover:text-warm-100 transition-all duration-200
                     shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next hero"
        >
          <Icon icon="mdi:chevron-right" width={24} />
        </button>
      </div>

      {/* Hero indicator dots */}
      <div className="flex justify-center gap-2 mt-3">
        {heroes.map((hero) => (
          <button
            key={hero.id}
            onClick={() => onSelectHero(hero.id)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              selectedHeroId === hero.id
                ? 'bg-gold-400 scale-125'
                : 'bg-warm-600 hover:bg-warm-500'
            }`}
            aria-label={`Select ${hero.name}`}
          />
        ))}
      </div>
    </div>
  )
}
