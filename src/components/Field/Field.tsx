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

// Dying enemy with captured position for death animation overlay
interface DyingEnemy {
  enemy: EnemyEntity
  rect: DOMRect
  startTime: number
}

export const Field = memo(function Field({ player, enemies, onTargetClick, onUseActivated, onUseUltimate }: FieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [dyingEnemies, setDyingEnemies] = useState<DyingEnemy[]>([])
  const prevEnemiesRef = useRef<EnemyEntity[]>([])
  const enemyRectsRef = useRef<Map<string, DOMRect>>(new Map())

  // Track enemy positions continuously for death animation
  // NOTE: We UPDATE positions but don't clear old ones - dead enemy rects
  // must persist until the death detection effect reads them
  useEffect(() => {
    if (!fieldRef.current) return
    enemies.forEach(enemy => {
      const el = fieldRef.current?.querySelector(`[data-target="${enemy.id}"]`)
      if (el) {
        enemyRectsRef.current.set(enemy.id, el.getBoundingClientRect())
      }
    })
  }, [enemies])

  // Detect enemy deaths and add to dying overlay
  useEffect(() => {
    const currentIds = new Set(enemies.map(e => e.id))

    // Find enemies that were removed
    const removedEnemies = prevEnemiesRef.current.filter(e => !currentIds.has(e.id))

    if (removedEnemies.length > 0) {
      const now = Date.now()
      const newDying: DyingEnemy[] = removedEnemies
        .map(enemy => {
          const rect = enemyRectsRef.current.get(enemy.id)
          if (rect) {
            // Clean up the rect after capturing - no longer needed
            enemyRectsRef.current.delete(enemy.id)
            return { enemy, rect, startTime: now }
          }
          return null
        })
        .filter((d): d is DyingEnemy => d !== null)

      if (newDying.length > 0) {
        setDyingEnemies(prev => [...prev, ...newDying])
      }
    }

    prevEnemiesRef.current = enemies
  }, [enemies])

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

  // Remove dying enemy after animation completes
  const handleDyingComplete = useCallback((enemyId: string) => {
    setDyingEnemies(prev => prev.filter(d => d.enemy.id !== enemyId))
  }, [])

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
          element={heroCard?.element}
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

      {/* Dying enemy overlays for death animations */}
      {dyingEnemies.map((dying) => (
        <DyingEnemyOverlay
          key={dying.enemy.id}
          dyingEnemy={dying}
          onComplete={handleDyingComplete}
        />
      ))}
    </div>
  )
})

// Death animation duration in ms - matches GSAP effect timing
const DEATH_ANIMATION_DURATION = 800

// Dying enemy overlay - renders at fixed position during death animation
const DyingEnemyOverlay = memo(function DyingEnemyOverlay({
  dyingEnemy,
  onComplete,
}: {
  dyingEnemy: DyingEnemy
  onComplete: (id: string) => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overlayRef.current) return

    const effects = gsap.effects as Record<string, (el: Element, opts?: object) => gsap.core.Timeline>
    const { enemy } = dyingEnemy

    // Run the death animation
    if (enemy.element === 'void' && effects.boneShatter) {
      effects.boneShatter(overlayRef.current)
    } else if (effects.enemyDeath) {
      effects.enemyDeath(overlayRef.current, { element: enemy.element })
    }

    // Remove after animation completes
    const timer = setTimeout(() => {
      onComplete(enemy.id)
    }, DEATH_ANIMATION_DURATION)

    return () => clearTimeout(timer)
  }, [dyingEnemy, onComplete])

  const { enemy, rect } = dyingEnemy

  return (
    <div
      ref={overlayRef}
      className="fixed pointer-events-none z-50"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
      data-dying-enemy={enemy.id}
    >
      <Card
        variant="enemy"
        name={enemy.name}
        currentHealth={0}
        maxHealth={enemy.maxHealth}
        block={0}
        powers={{}}
        intent={undefined}
        image={enemy.image}
        element={enemy.element}
      />
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
      element={enemy.element}
      className="Target"
      data-target-type="enemy"
      data-target={enemy.id}
      onClick={handleClick}
    />
  )
})

export default Field
