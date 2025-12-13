import { Draggable, gsap } from './animations'

const DRAG_CLASS = 'is-dragging'
const OVER_CLASS = 'is-dragOver'

export type PlayCardCallback = (
  cardUid: string,
  targetId: string | null,
  cardEl: HTMLElement
) => void

export interface DragDropConfig {
  container: Element
  onPlayCard: PlayCardCallback
  getCardTarget: (cardEl: HTMLElement) => string | null // 'enemy' | 'player' | 'allEnemies' | 'self'
  canPlay: (cardEl: HTMLElement) => boolean
}

let draggableInstances: Draggable[] = []

export function enableDragDrop(config: DragDropConfig): void {
  const { container, onPlayCard, getCardTarget, canPlay } = config

  // Clean up existing instances
  disableDragDrop()

  const cards = container.querySelectorAll<HTMLElement>('.Hand .Card')
  const targets = container.querySelectorAll<HTMLElement>('.Target')

  cards.forEach((card) => {
    const instance = Draggable.create(card, {
      type: 'x,y',
      zIndexBoost: true,

      onDragStart(this: Draggable) {
        const cardEl = this.target as HTMLElement

        // Don't drag if can't play
        if (!canPlay(cardEl)) {
          this.endDrag(new PointerEvent('pointerup'))
          return
        }

        gsap.killTweensOf(cardEl)
        cardEl.classList.add(DRAG_CLASS)

        // Store start position
        ;(this as any).startX = this.x
        ;(this as any).startY = this.y
      },

      onDrag(this: Draggable) {
        const cardEl = this.target as HTMLElement
        const cardTarget = getCardTarget(cardEl)

        // Highlight valid targets
        targets.forEach((targetEl) => {
          const targetType = targetEl.dataset.targetType
          const isOver = this.hitTest(targetEl, '40%')
          const isValidTarget = isValidDropTarget(cardTarget, targetType)

          targetEl.classList.toggle(OVER_CLASS, isOver && isValidTarget)
        })
      },

      onRelease(this: Draggable) {
        const cardEl = this.target as HTMLElement
        cardEl.classList.remove(DRAG_CLASS)

        const cardTarget = getCardTarget(cardEl)
        const cardUid = cardEl.dataset.cardId

        // Clear all highlights
        targets.forEach((t) => t.classList.remove(OVER_CLASS))

        if (!cardUid) {
          snapBack(cardEl)
          return
        }

        // Find drop target
        let droppedTarget: HTMLElement | null = null
        let droppedTargetId: string | null = null

        for (const targetEl of targets) {
          const targetType = targetEl.dataset.targetType
          const isOver = this.hitTest(targetEl, '40%')
          const isValidTarget = isValidDropTarget(cardTarget, targetType)

          if (isOver && isValidTarget) {
            droppedTarget = targetEl
            droppedTargetId = targetEl.dataset.target || targetType || null
            break
          }
        }

        // Self-target cards don't need a drop target
        if (cardTarget === 'self' || cardTarget === 'none') {
          // Play card with animation
          playCardAnimation(cardEl, null, () => {
            onPlayCard(cardUid, null, cardEl)
          })
          return
        }

        // All-enemies cards can target any enemy
        if (cardTarget === 'allEnemies' && droppedTarget) {
          playCardAnimation(cardEl, droppedTarget, () => {
            onPlayCard(cardUid, 'allEnemies', cardEl)
          })
          return
        }

        // Single target cards
        if (droppedTarget && droppedTargetId) {
          playCardAnimation(cardEl, droppedTarget, () => {
            onPlayCard(cardUid, droppedTargetId!, cardEl)
          })
        } else {
          // No valid target - snap back
          snapBack(cardEl)
        }
      },
    })

    draggableInstances.push(...instance)
  })
}

export function disableDragDrop(): void {
  draggableInstances.forEach((d) => d.kill())
  draggableInstances = []
}

function isValidDropTarget(
  cardTarget: string | null,
  targetType: string | undefined
): boolean {
  if (!cardTarget || !targetType) return false

  // Self-target cards don't need drop targets
  if (cardTarget === 'self' || cardTarget === 'none') return false

  // All enemies can target any enemy
  if (cardTarget === 'allEnemies' && targetType === 'enemy') return true

  // Direct match
  return cardTarget === targetType
}

function playCardAnimation(
  cardEl: HTMLElement,
  _targetEl: HTMLElement | null,
  onComplete: () => void
): void {
  // Animation starts from current position (where card was dropped)
  // and flies to discard pile area
  gsap.effects.playCard(cardEl, { onComplete })
}

function snapBack(cardEl: HTMLElement): void {
  gsap.effects.snapBack(cardEl)
}

// Re-export for convenience
export { Draggable, gsap }
