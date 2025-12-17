import { Draggable, gsap } from './animations'

const DRAG_CLASS = 'is-dragging'
const OVER_CLASS = 'is-dragOver'
const DRAG_Z_INDEX = 99999 // Ensure dragged card is always on top

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

      // Block drag before it starts for unplayable cards
      onPress(this: Draggable) {
        if (!canPlay(this.target as HTMLElement)) {
          this.endDrag(new PointerEvent('pointerup'))
        }
      },

      onDragStart(this: Draggable) {
        const cardEl = this.target as HTMLElement

        // Double-check - shouldn't reach here if onPress blocked it
        if (!canPlay(cardEl)) {
          this.endDrag(new PointerEvent('pointerup'))
          return
        }

        gsap.killTweensOf(cardEl)
        cardEl.classList.add(DRAG_CLASS)

        // The HandCard wrapper has transform which creates a stacking context
        // We need to boost z-index on the wrapper, not just the card
        const handCardWrapper = cardEl.closest('.HandCard') as HTMLElement | null

        // Store original styles and boost to top
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        ;(this as any).originalZIndex = cardEl.style.zIndex
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        ;(this as any).handCardWrapper = handCardWrapper
        if (handCardWrapper) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          ;(this as any).originalWrapperZIndex = handCardWrapper.style.zIndex
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          ;(this as any).originalWrapperTransform = handCardWrapper.style.transform
          handCardWrapper.style.zIndex = String(DRAG_Z_INDEX)
          handCardWrapper.style.transform = 'none' // Remove transform to escape stacking context
        }
        cardEl.style.zIndex = String(DRAG_Z_INDEX)

        // Store start position (Draggable tracks these internally)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        ;(this as any).startX = this.x
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
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

        // Restore original z-index
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        const originalZ = (this as any).originalZIndex as string | undefined
        cardEl.style.zIndex = originalZ || ''

        // Restore wrapper styles
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        const handCardWrapper = (this as any).handCardWrapper as HTMLElement | null
        if (handCardWrapper) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          const originalWrapperZ = (this as any).originalWrapperZIndex as string | undefined
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          const originalWrapperTransform = (this as any).originalWrapperTransform as string | undefined
          handCardWrapper.style.zIndex = originalWrapperZ || ''
          handCardWrapper.style.transform = originalWrapperTransform || ''
        }

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

        // Collect all valid targets for this card
        const validTargets: HTMLElement[] = []
        for (const targetEl of targets) {
          const targetType = targetEl.dataset.targetType
          if (isValidDropTarget(cardTarget, targetType)) {
            validTargets.push(targetEl)
          }
          // Check if dropped directly on target
          const isOver = this.hitTest(targetEl, '40%')
          if (isOver && isValidDropTarget(cardTarget, targetType)) {
            droppedTarget = targetEl
            droppedTargetId = targetEl.dataset.target || targetType || null
          }
        }

        // Auto-select if only one valid target exists (no precision needed)
        if (!droppedTarget && validTargets.length === 1) {
          droppedTarget = validTargets[0]
          droppedTargetId =
            droppedTarget.dataset.target ||
            droppedTarget.dataset.targetType ||
            null
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
          const targetId = droppedTargetId
          playCardAnimation(cardEl, droppedTarget, () => {
            onPlayCard(cardUid, targetId, cardEl)
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

// Type wrapper for GSAP custom effects
type GsapEffect = (target: Element, config?: object) => void
const effects = gsap.effects as Record<string, GsapEffect>

function playCardAnimation(
  cardEl: HTMLElement,
  _targetEl: HTMLElement | null,
  onComplete: () => void
): void {
  // Animation starts from current position (where card was dropped)
  // and flies to discard pile area
  effects.playCard(cardEl, { onComplete })
}

function snapBack(cardEl: HTMLElement): void {
  effects.snapBack(cardEl)
}

// Re-export for convenience
export { Draggable, gsap }
