import { gsap } from '../../lib/dragdrop'

// Type wrapper for GSAP custom effects (plugin lacks proper types)
export type GsapEffect = (target: Element | Element[] | NodeListOf<Element> | null, config?: object) => void
export type GsapEffects = Record<string, GsapEffect>

export const effects = gsap.effects as GsapEffects
