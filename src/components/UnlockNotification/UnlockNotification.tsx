import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/animations'

interface UnlockNotificationProps {
  unlocks: string[]
  onComplete: () => void
}

export function UnlockNotification({ unlocks, onComplete }: UnlockNotificationProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || unlocks.length === 0) return

    const items = containerRef.current.querySelectorAll('.unlock-item')

    // Animate in
    gsap.fromTo(
      items,
      { y: 50, opacity: 0, scale: 0.8 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.2,
        ease: 'back.out(1.5)',
        onComplete: () => {
          // Hold, then fade out
          gsap.to(items, {
            opacity: 0,
            y: -30,
            delay: 2,
            duration: 0.4,
            stagger: 0.1,
            onComplete,
          })
        },
      }
    )
  }, [unlocks, onComplete])

  if (unlocks.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4"
    >
      <div className="text-2xl font-bold text-energy mb-2">New Unlocks!</div>
      {unlocks.map((unlock, i) => (
        <div
          key={i}
          className="unlock-item px-6 py-3 bg-surface border-2 border-energy rounded-lg text-lg font-semibold text-white shadow-lg shadow-energy/20"
        >
          {unlock}
        </div>
      ))}
    </div>
  )
}
