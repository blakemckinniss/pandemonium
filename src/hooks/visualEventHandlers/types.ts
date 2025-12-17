import type { CombatState, CombatNumber, Element as GameElement } from '../../types'
import type { PendingCardAnimation } from '../../components/Hand/CardAnimationOverlay'
import type { CardPosition } from '../../components/Hand/Hand'
import type { GsapEffects } from './utils'

export interface HandlerContext {
  combat: CombatState | null
  queryContainer: (selector: string) => Element | null
  queryHand: (selector: string) => NodeListOf<Element> | null
  containerRef: React.RefObject<HTMLDivElement | null>
  cardPositionsRef: React.MutableRefObject<Map<string, CardPosition>>
  lastTurnRef: React.MutableRefObject<number>
  effects: GsapEffects
  setCombatNumbers: React.Dispatch<React.SetStateAction<CombatNumber[]>>
  setPendingAnimations: React.Dispatch<React.SetStateAction<PendingCardAnimation[]>>
  setTriggeredRelicId: React.Dispatch<React.SetStateAction<string | null>>
  spawnCombatNumber: (
    targetId: string,
    value: number,
    type: 'damage' | 'heal' | 'block' | 'combo',
    options?: {
      element?: GameElement
      variant?: 'poison' | 'piercing' | 'combo' | 'chain' | 'execute'
      comboName?: string
    }
  ) => void
}
