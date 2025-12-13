import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/animations'
import type { CombatNumber } from '../../types'

interface CombatNumbersProps {
  numbers: CombatNumber[]
  onComplete: (id: string) => void
}

export function CombatNumbers({ numbers, onComplete }: CombatNumbersProps) {
  return (
    <div className="CombatNumbers pointer-events-none fixed inset-0 z-50">
      {numbers.map((num) => (
        <FloatingNumber key={num.id} number={num} onComplete={() => onComplete(num.id)} />
      ))}
    </div>
  )
}

interface FloatingNumberProps {
  number: CombatNumber
  onComplete: () => void
}

function FloatingNumber({ number, onComplete }: FloatingNumberProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    gsap.effects.floatNumber(ref.current, { onComplete })
  }, [onComplete])

  const colorClass = {
    damage: 'CombatNumber--damage',
    heal: 'CombatNumber--heal',
    block: 'CombatNumber--block',
  }[number.type]

  const prefix = {
    damage: '-',
    heal: '+',
    block: '+',
  }[number.type]

  const icon = {
    damage: '',
    heal: '',
    block: '🛡️',
  }[number.type]

  return (
    <div
      ref={ref}
      className={`CombatNumber ${colorClass}`}
      style={{ left: number.x, top: number.y }}
    >
      {icon}
      {prefix}
      {number.value}
    </div>
  )
}

export default CombatNumbers
