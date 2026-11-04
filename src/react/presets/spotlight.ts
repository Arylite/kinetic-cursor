import { adaptive } from '../../core/motion'
import { caret } from '../../core/shapes'
import { dot } from './shared'
import type { CursorPreset } from './types'

/** A soft glow that drifts after the pointer. Designed for dark backgrounds. */
export const spotlight: CursorPreset = {
  color: '#fff',
  layers: {
    glow: {
      label: true,
      motion: adaptive({ halfLife: 0.12, responsiveness: 0.004 }),
      size: 280,
      pressScale: 0.92,
      style: {
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle, rgb(255 255 255 / 0.14), transparent 65%)',
      },
      states: { link: { size: 200 }, button: { size: 200 }, label: { size: 180 } },
    },
    dot: {
      ...dot,
      states: { link: { size: 12 }, button: { size: 12 }, label: { opacity: 0 }, text: caret() },
    },
  },
}
