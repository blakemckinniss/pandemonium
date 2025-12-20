import { useEffect, useRef } from 'react'
import { Card } from '../Card/Card'
import { getCardDefProps } from '../Card/utils'
import type { CardDefinition } from '../../types'
import { gsap } from '../../lib/dragdrop'

export interface PendingCardAnimation {
  id: string
  cardDef: CardDefinition
  position: { x: number; y: number }
  type: 'discard' | 'exhaust' | 'etherealExhaust' | 'putOnDeck'
}

interface CardAnimationOverlayProps {
  animations: PendingCardAnimation[]
  onComplete: (id: string) => void
}

export function CardAnimationOverlay({ animations, onComplete }: CardAnimationOverlayProps) {
  return (
    <div className="CardAnimationOverlay fixed inset-0 pointer-events-none z-50">
      {animations.map((anim) => (
        <AnimatedCard key={anim.id} animation={anim} onComplete={onComplete} />
      ))}
    </div>
  )
}

interface AnimatedCardProps {
  animation: PendingCardAnimation
  onComplete: (id: string) => void
}

function AnimatedCard({ animation, onComplete }: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { id, cardDef, position, type } = animation

  useEffect(() => {
    if (!cardRef.current) return

    const effectName =
      type === 'etherealExhaust' ? 'etherealExhaust' :
      type === 'exhaust' ? 'exhaustCard' :
      type === 'putOnDeck' ? 'putOnDeck' : 'discardCard'

    ;(gsap.effects as Record<string, (el: Element, opts: object) => void>)[effectName](cardRef.current, {
      onComplete: () => onComplete(id),
    })
  }, [id, type, onComplete])

  return (
    <div
      ref={cardRef}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Card {...getCardDefProps(cardDef)} variant="hand" />
    </div>
  )
}

export default CardAnimationOverlay
