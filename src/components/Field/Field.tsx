import { Card } from '../Card/Card'
import type { PlayerEntity, EnemyEntity } from '../../types'

interface FieldProps {
  player: PlayerEntity
  enemies: EnemyEntity[]
  onTargetClick?: (targetId: string) => void
}

export function Field({ player, enemies, onTargetClick }: FieldProps) {
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
        onClick={() => onTargetClick?.('player')}
      />

      {/* Enemies */}
      <div className="flex gap-6">
        {enemies.map((enemy) => (
          <Card
            key={enemy.id}
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
            onClick={() => onTargetClick?.(enemy.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default Field
