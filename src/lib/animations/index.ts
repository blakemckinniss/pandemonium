import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { Flip } from 'gsap/Flip'

// Register plugins once
gsap.registerPlugin(Draggable, Flip)

// Import all animation modules to register effects
import './card-animations'
import './entity-animations'
import './ui-animations'
import './gothic-effects'
import './combat-feedback'
import './screen-transitions'
import './modal-animations'

// Export utilities
export { killAllTweens, getElementCenter } from './utils'

// Export gsap and plugins
export { gsap, Draggable, Flip }
