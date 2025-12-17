import { useEffect, useRef } from 'react'
import type { RoomCard } from '../../types'
import { getRoomDefinition } from '../../content/rooms'
import { getRoomDifficultyColor } from '../../game/dungeon-deck'
import { gsap } from '../../lib/animations'

interface RoomSelectProps {
  choices: RoomCard[]
  floor: number
  onSelectRoom: (roomUid: string) => void
}

export function RoomSelect({ choices, floor, onSelectRoom }: RoomSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Animate room cards appearing
  useEffect(() => {
    if (!containerRef.current) return

    const cards = containerRef.current.querySelectorAll('.RoomCard')
    gsap.fromTo(
      cards,
      { y: -100, opacity: 0, scale: 0.8 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.15,
        ease: 'back.out(1.5)',
      }
    )
  }, [choices])

  return (
    <div className="RoomSelect h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      <h1 className="text-3xl font-bold mb-2">Floor {floor}</h1>
      <p className="text-gray-400 mb-8">Choose your path</p>

      <div ref={containerRef} className="flex gap-6">
        {choices.map((roomCard) => {
          const def = getRoomDefinition(roomCard.definitionId)
          if (!def) return null

          const difficultyColor = getRoomDifficultyColor(def.type)

          return (
            <button
              key={roomCard.uid}
              className="RoomCard group"
              onClick={() => onSelectRoom(roomCard.uid)}
            >
              <div className="w-48 h-64 rounded-xl bg-surface border-2 border-border hover:border-energy transition-all duration-200 flex flex-col overflow-hidden group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-energy/20 relative">
                {/* Background Image */}
                {def.image ? (
                  <div className="absolute inset-0">
                    <img
                      src={def.image}
                      alt={def.name}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-6xl">
                    {def.icon}
                  </div>
                )}

                {/* Info - positioned at bottom */}
                <div className={`p-4 ${def.image ? 'absolute bottom-0 left-0 right-0' : 'bg-surface-alt'}`}>
                  <h3 className="font-bold text-lg">{def.name}</h3>
                  <p className={`text-sm ${difficultyColor} capitalize`}>
                    {def.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{def.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-gray-600 text-sm mt-8">
        {choices.length} room{choices.length !== 1 ? 's' : ''} remaining in dungeon
      </p>
    </div>
  )
}

export default RoomSelect
