import { spring } from '../../core/motion'
import { dot, filled } from './shared'
import type { CursorPreset, LayerConfig } from './types'

const echoOf = (stiffness: number, opacity: number): LayerConfig => ({
  motion: spring({ stiffness, damping: 2 * Math.sqrt(stiffness), matchVelocity: 0.5 }),
  size: 8,
  opacity,
  style: filled,
  states: { button: { opacity: 0 }, label: { opacity: 0 }, text: { opacity: 0 } },
})

/** A dot followed by two softer echoes that settle into it. */
export const echo: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: {
    far: echoOf(160, 0.25),
    near: echoOf(420, 0.5),
    dot: { ...dot, size: 8 },
  },
}
