import { memo, useCallback } from 'react'
import { Card } from '../Card/Card'
import type { PlayerEntity, EnemyEntity } from '../../types'

interface FieldProps {
  player: PlayerEntity
  enemies: EnemyEntity[]
  onTargetClick?: (targetId: string) => void
}

export const Field = memo(function Field({ player, enemies, onTargetClick }: FieldProps) {
  const handlePlayerClick = useCallback(() => {
    onTargetClick?.('player')
  }, [onTargetClick])

  const handleEnemyClick = useCallback((enemyId: string) => {
    onTargetClick?.(enemyId)
  }, [onTargetClick])

  return (
    <div className="Field flex justify-center items-center gap-16 px-8 py-6">
      {/* Player */}
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
