import { Card } from '../Card/Card'
import type { PlayerEntity, EnemyEntity } from '../../types'

interface FieldProps {
  player: PlayerEntity
  enemies: EnemyEntity[]
  onTargetClick?: (targetId: string) => void
}

export function Field({ player, enemies, onTargetClick }: FieldProps) {
  return (
    <div className="Field flex justify-between items-center px-16 py-8">
      {/* Player side */}
      <div className="flex flex-col items-center gap-2">
        <Card
          variant="player"
          name={player.name}
          currentHealth={player.currentHealth}
          maxHealth={player.maxHealth}
          block={player.block}
          image={player.image}
          className="Target"
          data-target-type="player"
          onClick={() => onTargetClick?.('player')}
        />
        <div className="EnergyOrb">
          {player.energy}/{player.maxEnergy}
        </div>
      </div>

      {/* VS divider */}
      <div className="text-4xl font-bold text-gray-600">VS</div>

      {/* Enemy side */}
      <div className="flex gap-4">
        {enemies.map((enemy) => (
          <Card
            key={enemy.id}
            variant="enemy"
            name={enemy.name}
            currentHealth={enemy.currentHealth}
            maxHealth={enemy.maxHealth}
            block={enemy.block}
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
