import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { Card } from '../Card/Card'
import { gsap } from '../../lib/dragdrop'
import type { PlayerEntity, EnemyEntity } from '../../types'
import { getCardDefinition } from '../../game/cards'

interface FieldProps {
  player: PlayerEntity
  enemies: EnemyEntity[]
  onTargetClick?: (targetId: string) => void
  onUseActivated?: () => void
  onUseUltimate?: () => void
}

export const Field = memo(function Field({ player, enemies, onTargetClick, onUseActivated, onUseUltimate }: FieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Combat entry animation - dramatic entrance for all entities
  useEffect(() => {
    if (hasAnimated || !fieldRef.current) return

    const effects = gsap.effects as Record<string, (el: Element | NodeListOf<Element>, opts?: object) => void>
    const entities = fieldRef.current.querySelectorAll('[data-target-type]')

    if (entities.length > 0 && effects.combatEntry) {
      effects.combatEntry(entities)
      setHasAnimated(true)
    }
  }, [hasAnimated])

  const handlePlayerClick = useCallback(() => {
    onTargetClick?.('player')
  }, [onTargetClick])

  const handleEnemyClick = useCallback((enemyId: string) => {
    onTargetClick?.(enemyId)
  }, [onTargetClick])

  // Get hero card for ability info
  const heroCard = player.heroCardId ? getCardDefinition(player.heroCardId) : null
  const hasHeroAbilities = heroCard?.activated || heroCard?.ultimate

  // Check if abilities can be used
  const canUseActivated = heroCard?.activated &&
    !player.activatedUsedThisTurn &&
    player.energy >= heroCard.activated.energyCost
  const canUseUltimate = heroCard?.ultimate && player.ultimateReady

  return (
    <div ref={fieldRef} className="Field flex justify-center items-center gap-12 px-4 py-6 overflow-visible">
      {/* Player with Hero Abilities */}
      <div className="flex flex-col items-center gap-3">
        <Card
          variant="player"
          name={player.name}
          currentHealth={player.currentHealth}
          maxHealth={player.maxHealth}
          block={player.block}
          powers={player.powers}
          energy={player.energy}
          maxEnergy={player.maxEnergy}
          image={player.image}
          className="Target"
          data-target-type="player"
          onClick={handlePlayerClick}
        />

        {/* Hero Ability Buttons */}
        {hasHeroAbilities && (
          <div className="flex gap-2">
            {/* Activated Ability */}
            {heroCard?.activated && (
              <button
                onClick={onUseActivated}
                disabled={!canUseActivated}
                className={`HeroAbilityBtn HeroAbilityBtn--activated ${canUseActivated ? 'is-ready' : ''}`}
                title={heroCard.activated.description}
                data-hero-ability="activated"
              >
                <span className="HeroAbilityBtn__icon">⚡</span>
                {heroCard.activated.energyCost}E
              </button>
            )}

            {/* Ultimate Ability */}
            {heroCard?.ultimate && (
              <button
                onClick={onUseUltimate}
                disabled={!canUseUltimate}
                className={`HeroAbilityBtn HeroAbilityBtn--ultimate ${canUseUltimate ? 'is-ready' : ''}`}
                title={heroCard.ultimate.description}
                data-hero-ability="ultimate"
              >
                <span className="HeroAbilityBtn__icon">💥</span>
                <span className="HeroAbilityBtn__charges">
                  {player.ultimateCharges ?? 0}/{heroCard.ultimate.chargesRequired}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enemies */}
      <div className="flex gap-6">
        {enemies.map((enemy) => (
          <EnemyCard
            key={enemy.id}
            enemy={enemy}
            onTargetClick={handleEnemyClick}
          />
        ))}
      </div>
    </div>
  )
})

// Memoized enemy card to prevent re-renders
const EnemyCard = memo(function EnemyCard({
  enemy,
  onTargetClick,
}: {
  enemy: EnemyEntity
  onTargetClick: (id: string) => void
}) {
  const handleClick = useCallback(() => {
    onTargetClick(enemy.id)
  }, [onTargetClick, enemy.id])

  return (
    <Card
      variant="enemy"
      name={enemy.name}
      currentHealth={enemy.currentHealth}
      maxHealth={enemy.maxHealth}
      block={enemy.block}
      powers={enemy.powers}
      intent={enemy.intent}
      image={enemy.image}
      className="Target"
      data-target-type="enemy"
      data-target={enemy.id}
      onClick={handleClick}
    />
  )
})

export default Field
