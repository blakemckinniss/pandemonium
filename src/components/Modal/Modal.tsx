import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from '@iconify/react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

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

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="Modal-backdrop"
    >
      <div className={`Modal ${sizeClasses[size]}`}>
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
