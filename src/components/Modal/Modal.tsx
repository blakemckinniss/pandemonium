import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { gsap } from '../../lib/animations'

// Type for registered GSAP effects
type GsapEffect = (target: gsap.TweenTarget, config?: object) => gsap.core.Tween | gsap.core.Timeline
type GsapEffects = Record<string, GsapEffect>

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    const content = contentRef.current
    if (!dialog || !content) return

    if (isOpen && !isVisible) {
      // Opening animation - setState calls intentionally sync with modal open state
      dialog.showModal()
      setIsVisible(true) // eslint-disable-line react-hooks/set-state-in-effect
      setIsAnimating(true)

      const effects = gsap.effects as GsapEffects
      effects.modalBackdropIn(dialog)
      effects.modalEnter(content, {
        onComplete: () => setIsAnimating(false),
      })
    } else if (!isOpen && isVisible) {
      // Closing animation
      setIsAnimating(true)

      const tl = gsap.timeline({
        onComplete: () => {
          dialog.close()
          setIsVisible(false)
          setIsAnimating(false)
        },
      })

      const effects = gsap.effects as GsapEffects
      tl.add(effects.modalExit(content), 0)
      tl.add(effects.modalBackdropOut(dialog), 0)
    }
  }, [isOpen, isVisible])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  if (!isOpen && !isVisible) return null

  return (
    <dialog
      ref={dialogRef}
      onClick={isAnimating ? undefined : handleBackdropClick}
      className="Modal-backdrop"
    >
      <div ref={contentRef} className={`Modal ${sizeClasses[size]}`}>
        {/* Header */}
        <div className="Modal-header">
          <h2 className="Modal-title">{title}</h2>
          <button onClick={onClose} className="Modal-close" aria-label="Close">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="Modal-content">
          {children}
        </div>
      </div>
    </dialog>
  )
}

export default Modal
