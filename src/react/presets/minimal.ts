import { adaptive } from '../../core/motion'
import { caret } from '../../core/shapes'
import { filled } from './shared'
import type { CursorPreset } from './types'

/** A single dot whose smoothing relaxes as it slows down. */
export const minimal: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: {
    dot: {
      motion: adaptive({ halfLife: 0.06, responsiveness: 0.008 }),
      size: 12,
      stretch: 0.35,
      pressScale: 0.7,
      style: filled,
      states: { link: { size: 40 }, button: { size: 40 }, label: { size: 40 }, text: caret() },
    },
  },
}
