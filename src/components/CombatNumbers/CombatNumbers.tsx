import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/animations'
import type { CombatNumber, Element } from '../../types'

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

// Element-based colors for damage numbers
const ELEMENT_COLORS: Record<Element, string> = {
  physical: 'text-warm-200',
  fire: 'text-orange-400',
  ice: 'text-cyan-400',
  lightning: 'text-yellow-300',
  void: 'text-purple-400',
}

// Variant-based styles (combos, special effects)
const VARIANT_STYLES: Record<string, string> = {
  combo: 'CombatNumber--combo',
  chain: 'CombatNumber--chain',
  execute: 'CombatNumber--execute',
  piercing: 'CombatNumber--piercing',
  poison: 'CombatNumber--poison',
  multi: 'CombatNumber--multi',
}

function FloatingNumber({ number, onComplete }: FloatingNumberProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    ;(gsap.effects as Record<string, (el: Element, opts: object) => void>).floatNumber(ref.current as unknown as Element, { onComplete })
  }, [onComplete])

  // Determine color class based on type and element
  let colorClass: string
  if (number.type === 'damage') {
    if (number.variant && VARIANT_STYLES[number.variant]) {
      colorClass = VARIANT_STYLES[number.variant]
    } else if (number.element) {
      colorClass = ELEMENT_COLORS[number.element]
    } else {
      colorClass = 'CombatNumber--damage'
    }
  } else if (number.type === 'maxHealth') {
    colorClass = number.value > 0 ? 'CombatNumber--maxHealth-gain' : 'CombatNumber--maxHealth-lose'
  } else if (number.type === 'combo') {
    colorClass = 'CombatNumber--combo-counter'
  } else if (number.type === 'preview') {
    colorClass = number.variant === 'multi' ? 'CombatNumber--preview-multi' : 'CombatNumber--preview'
  } else {
    colorClass = {
      heal: 'CombatNumber--heal',
      block: 'CombatNumber--block',
      gold: 'CombatNumber--gold',
    }[number.type] ?? ''
  }

  const prefix = number.value > 0 ? '+' : ''

  const icon = {
    damage: '',
    heal: '',
    block: '🛡️',
    maxHealth: '❤️',
    combo: '🔥',
    gold: '🪙',
    preview: '⚠️',
  }[number.type]

  // For combo type, show "COMBO x{count}"
  const displayValue = number.type === 'combo'
    ? `x${number.value}`
    : `${prefix}${number.value}`

  // Show combo name for elemental combos, or custom label
  const displayLabel = number.comboName ? (
    <span className="CombatNumber__combo-label">{number.comboName}!</span>
  ) : number.label ? (
    <span className="CombatNumber__label">{number.label}</span>
  ) : null

  return (
    <div
      ref={ref}
      className={`CombatNumber ${colorClass}`}
      style={{ left: number.x, top: number.y }}
    >
      {number.type === 'combo' && <span className="CombatNumber__combo-prefix">COMBO </span>}
      {displayLabel}
      {icon}
      {displayValue}
    </div>
  )
}

export default CombatNumbers
